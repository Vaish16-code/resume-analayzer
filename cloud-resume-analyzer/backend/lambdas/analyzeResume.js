/**
 * analyzeResume Lambda Function
 * ─────────────────────────────────────────────────────────────
 * 1. Reads resume text from S3.
 * 2. Runs deterministic keyword matching (no AI/ML).
 * 3. Calculates ATS score = found / total * 100.
 * 4. Builds improvement suggestions.
 * 5. Saves full result to DynamoDB.
 *
 * Route : POST /analyze
 * Body  : { fileKey, selectedRole, userId, resumeName }
 */

"use strict";

const { S3Client, GetObjectCommand }        = require("@aws-sdk/client-s3");
const { DynamoDBClient, PutItemCommand }    = require("@aws-sdk/client-dynamodb");
const { v4: uuidv4 }                        = require("uuid");
const {
  extractEmail,
  extractTextFromBuffer,
  generalTips,
  matchKeywords,
  normalise,
  streamToBuffer,
} = require("./shared");

const s3     = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });
const dynamo = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });

// ─────────────────────────────────────────────────────────────
// KEYWORD LISTS — one array per role
// ─────────────────────────────────────────────────────────────
const ROLE_KEYWORDS = {
  "Frontend Developer": [
    "html","css","javascript","react","redux","tailwind","responsive","git",
    "webpack","typescript","vue","angular","sass","rest api","jest","accessibility","figma",
  ],
  "Backend Developer": [
    "node.js","express","python","django","rest api","sql","postgresql","mongodb",
    "redis","docker","git","aws","microservices","jwt","authentication","linux","kafka",
  ],
  "Full Stack Developer": [
    "react","node.js","express","mongodb","sql","rest api","html","css","javascript",
    "typescript","docker","git","aws","redux","postgresql","linux","microservices",
  ],
  "Java Developer": [
    "java","spring","spring boot","sql","rest api","git","aws","microservices",
    "hibernate","maven","gradle","junit","kafka","docker","linux","multithreading","jpa",
  ],
  "Python Developer": [
    "python","django","flask","fastapi","sql","pandas","numpy","rest api","git",
    "docker","aws","postgresql","celery","redis","linux","pytest","sqlalchemy",
  ],
  "Data Analyst": [
    "excel","sql","python","pandas","tableau","power bi","data visualization",
    "statistics","machine learning","numpy","matplotlib","r","google analytics","etl","git",
  ],
  "Cloud Engineer": [
    "aws","terraform","iam","s3","lambda","cloudwatch","vpc","api gateway","docker",
    "kubernetes","linux","ec2","rds","cloudformation","ansible","ci/cd","route 53","load balancer",
  ],
  "DevOps Engineer": [
    "docker","kubernetes","ci/cd","jenkins","git","aws","terraform","ansible","linux",
    "bash","prometheus","grafana","nginx","helm","vault","github actions","monitoring","logging",
  ],
};

// ─────────────────────────────────────────────────────────────
// SUGGESTION MAP — keyword → advice
// ─────────────────────────────────────────────────────────────
const SUGGESTIONS_MAP = {
  "aws":            "Add cloud projects using AWS services (S3, Lambda, EC2, etc.).",
  "terraform":      "Mention Infrastructure-as-Code experience using Terraform.",
  "git":            "Include version control experience with Git/GitHub.",
  "docker":         "Add containerisation experience using Docker.",
  "kubernetes":     "Mention container orchestration skills with Kubernetes.",
  "react":          "Add frontend projects built with React.js.",
  "node.js":        "Include backend projects built with Node.js and Express.",
  "python":         "Highlight Python projects or scripts in your experience.",
  "java":           "Showcase Java applications or enterprise projects.",
  "spring boot":    "Add a Spring Boot microservice or REST API project.",
  "sql":            "Mention relational database experience (MySQL, PostgreSQL).",
  "postgresql":     "Include PostgreSQL projects in your portfolio.",
  "mongodb":        "Add NoSQL database experience using MongoDB.",
  "rest api":       "Describe REST API design or integration experience.",
  "typescript":     "Refactor a project to TypeScript and mention it.",
  "ci/cd":          "Describe CI/CD pipelines you have set up (GitHub Actions, Jenkins).",
  "linux":          "Mention Linux/Unix command-line skills.",
  "microservices":  "Describe microservices architecture experience.",
  "html":           "Ensure your resume explicitly mentions HTML5.",
  "css":            "Mention CSS, Flexbox/Grid skills.",
  "javascript":     "Highlight JavaScript experience with concrete projects.",
  "tailwind":       "Add Tailwind CSS to a frontend project.",
  "pandas":         "Use pandas for a data cleaning/analysis project.",
  "ansible":        "Write Ansible playbooks for configuration management.",
  "kafka":          "Build a simple event-driven system using Apache Kafka.",
  "prometheus":     "Set up monitoring with Prometheus and Grafana.",
  "machine learning": "Complete an ML course or add a small ML project.",
  "power bi":       "Build a Power BI dashboard for your portfolio.",
  "tableau":        "Learn Tableau and add a data visualisation project.",
};

const generic = (kw) =>
  `Gain hands-on experience with "${kw}" and add it to your resume with real examples.`;

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
};

// ─────────────────────────────────────────────────────────────
// HANDLER
// ─────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  if (event.requestContext?.http?.method === "OPTIONS")
    return { statusCode: 200, headers: CORS, body: "" };

  try {
    const body = JSON.parse(event.body || "{}");
    const { fileKey, selectedRole, userId = "anonymous", resumeName = "resume" } = body;

    // Validate
    if (!fileKey || !selectedRole)
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "fileKey and selectedRole are required." }) };

    const roleKeywords = ROLE_KEYWORDS[selectedRole];
    if (!roleKeywords)
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: `Unknown role: ${selectedRole}` }) };

    // Read file from S3
    const s3Res   = await s3.send(new GetObjectCommand({ Bucket: process.env.RESUME_BUCKET, Key: fileKey }));
    const buffer  = await streamToBuffer(s3Res.Body);
    const rawText = await extractTextFromBuffer(buffer, fileKey, s3Res.ContentType);
    const text    = normalise(rawText);
    const extractedEmail = extractEmail(rawText);

    // Keyword matching
    const { found, missing } = matchKeywords(text, roleKeywords);
    const score              = Math.round((found.length / roleKeywords.length) * 100);
    const suggestions        = missing.map((kw) => SUGGESTIONS_MAP[kw] || generic(kw));
    const tips               = generalTips(score);

    // Save to DynamoDB
    const analysisId = uuidv4();
    const createdAt  = new Date().toISOString();
    await dynamo.send(new PutItemCommand({
      TableName: process.env.DYNAMODB_TABLE,
      Item: {
        analysis_id:      { S: analysisId },
        user_id:          { S: userId },
        resume_name:      { S: resumeName },
        selected_role:    { S: selectedRole },
        score:            { N: String(score) },
        found_keywords:   { S: JSON.stringify(found) },
        missing_keywords: { S: JSON.stringify(missing) },
        suggestions:      { S: JSON.stringify(suggestions) },
        tips:             { S: JSON.stringify(tips) },
        extracted_email:  { S: extractedEmail || "" },
        file_key:         { S: fileKey },
        created_at:       { S: createdAt },
      },
    }));

    console.log("analyzeResume summary:", {
      fileKey,
      selectedRole,
      userId,
      score,
      totalKeywords: roleKeywords.length,
      extractedEmail: extractedEmail || null,
    });

    return {
      statusCode: 200,
      headers:    CORS,
      body: JSON.stringify({
        analysisId, userId, resumeName, selectedRole,
        score, totalKeywords: roleKeywords.length,
        foundKeywords: found, missingKeywords: missing,
        suggestions, tips, roleMatchPercent: score, createdAt,
        extractedEmail: extractedEmail || null,
      }),
    };
  } catch (err) {
    console.error("analyzeResume error:", err);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "Internal server error.", detail: err.message }) };
  }
};