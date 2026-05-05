/**
 * LOCAL EXPRESS SERVER — Cloud ATS Resume Analyzer
 * ══════════════════════════════════════════════════════════════
 * Runs the full backend locally WITHOUT AWS.
 * Stores data in memory + local files instead of S3/DynamoDB.
 *
 * Endpoints (mirrors API Gateway routes):
 *   POST /upload-url   → accepts file upload (multipart)
 *   POST /analyze      → ATS keyword analysis + stores result
 *   GET  /history      → returns past analyses for a userId
 *   GET  /report       → generates downloadable .txt report
 *
 * Start: npm run server   (from backend/ folder)
 * ══════════════════════════════════════════════════════════════
 */

const express  = require("express");
const cors     = require("cors");
const multer   = require("multer");
const fs       = require("fs");
const path     = require("path");
const { v4: uuidv4 } = require("uuid");
const {
  buildReportText,
  extractEmail,
  extractTextFromFile,
  generalTips,
  matchKeywords,
  normalise,
} = require("./lambdas/shared");

const app  = express();
const PORT = 4000;

// ── Middleware ─────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Upload folder for local file storage
const UPLOAD_DIR  = path.join(__dirname, "uploads");
const REPORTS_DIR = path.join(__dirname, "reports");
const DB_FILE     = path.join(__dirname, "local_db.json");
if (!fs.existsSync(UPLOAD_DIR))  fs.mkdirSync(UPLOAD_DIR,  { recursive: true });
if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });

// In-memory database (backed to JSON file so it survives restarts)
let localDB = [];
try { localDB = JSON.parse(fs.readFileSync(DB_FILE, "utf-8")); } catch { localDB = []; }

function saveDB() {
  fs.writeFileSync(DB_FILE, JSON.stringify(localDB, null, 2), "utf-8");
}

// Multer: accept any file, save to /uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename:    (req, file, cb) => cb(null, `${uuidv4()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ══════════════════════════════════════════════════════════════
// KEYWORD DATABASE (same as Lambda)
// ══════════════════════════════════════════════════════════════
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

const SUGGESTIONS_MAP = {
  "aws":           "Add cloud projects using AWS services (S3, Lambda, EC2, etc.).",
  "terraform":     "Mention Infrastructure-as-Code experience using Terraform.",
  "git":           "Include version control experience with Git/GitHub.",
  "docker":        "Add containerisation experience using Docker.",
  "kubernetes":    "Mention container orchestration skills with Kubernetes.",
  "react":         "Add frontend projects built with React.js.",
  "node.js":       "Include backend projects built with Node.js and Express.",
  "python":        "Highlight Python projects or scripts in your experience.",
  "java":          "Showcase Java applications or enterprise projects.",
  "spring boot":   "Add a Spring Boot microservice or REST API project.",
  "sql":           "Mention relational database experience (MySQL, PostgreSQL).",
  "postgresql":    "Include PostgreSQL projects in your portfolio.",
  "mongodb":       "Add NoSQL database experience using MongoDB.",
  "rest api":      "Describe REST API design or integration experience.",
  "typescript":    "Refactor a project to TypeScript and mention it.",
  "ci/cd":         "Describe CI/CD pipelines you have set up (GitHub Actions, Jenkins).",
  "linux":         "Mention Linux/Unix command-line skills.",
  "microservices": "Describe microservices architecture experience.",
  "html":          "Ensure your resume explicitly mentions HTML5.",
  "css":           "Mention CSS, Flexbox/Grid skills.",
  "javascript":    "Highlight JavaScript experience with concrete projects.",
  "tailwind":      "Add Tailwind CSS to a frontend project.",
  "pandas":        "Use pandas for a data cleaning/analysis project.",
  "ansible":       "Write Ansible playbooks for configuration management.",
  "kafka":         "Build a simple event-driven system using Apache Kafka.",
  "prometheus":    "Set up monitoring with Prometheus and Grafana.",
};

const generic = (kw) => `Gain hands-on experience with "${kw}" and add it to your resume.`;

// ══════════════════════════════════════════════════════════════
// ROUTES
// ══════════════════════════════════════════════════════════════

// ── POST /upload-url ──────────────────────────────────────────
// In local mode we accept the file directly via multipart upload
// and return the local file path as the "fileKey".
app.post("/upload-url", upload.single("file"), (req, res) => {
  try {
    // If file is already uploaded via multipart
    if (req.file) {
      return res.json({
        uploadUrl: null,
        fileKey:   req.file.filename,
        message:   "File uploaded directly (local mode).",
      });
    }
    // Fallback: return a simulated pre-signed URL object
    const { fileName, fileType, userId = "anonymous" } = req.body;
    if (!fileName || !fileType)
      return res.status(400).json({ error: "fileName and fileType are required." });

    const fileKey = `${userId}/${uuidv4()}-${fileName}`;
    // Return a fake pre-signed URL pointing to our own /local-upload endpoint
    const uploadUrl = `http://localhost:${PORT}/local-upload/${encodeURIComponent(fileKey)}`;
    res.json({ uploadUrl, fileKey });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /local-upload/:key — accepts the actual binary PUT ─────
app.put("/local-upload/:key", express.raw({ type: "*/*", limit: "10mb" }), (req, res) => {
  try {
    const key      = decodeURIComponent(req.params.key);
    const safeName = key.replace(/\//g, "_");
    const filePath = path.join(UPLOAD_DIR, safeName);
    fs.writeFileSync(filePath, req.body);
    res.status(200).send("OK");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /analyze ─────────────────────────────────────────────
app.post("/analyze", (req, res) => {
  try {
    const { fileKey, selectedRole, userId = "anonymous", resumeName = "resume" } = req.body;
    if (!fileKey || !selectedRole)
      return res.status(400).json({ error: "fileKey and selectedRole are required." });

    const roleKeywords = ROLE_KEYWORDS[selectedRole];
    if (!roleKeywords)
      return res.status(400).json({ error: `Unknown role: ${selectedRole}` });

    // Read file text from local uploads folder
    const safeName = fileKey.replace(/\//g, "_");
    const filePath = path.join(UPLOAD_DIR, safeName);
    let rawText    = "";
    if (fs.existsSync(filePath)) {
      rawText = await extractTextFromFile(filePath);
    } else {
      console.warn(`[LOCAL] File not found: ${filePath} — analysing with empty text.`);
    }

    const text               = normalise(rawText);
    const extractedEmail      = extractEmail(rawText);
    const { found, missing } = matchKeywords(text, roleKeywords);
    const score              = Math.round((found.length / roleKeywords.length) * 100);
    const suggestions        = missing.map((kw) => SUGGESTIONS_MAP[kw] || generic(kw));
    const tips               = generalTips(score);
    const analysisId         = uuidv4();
    const createdAt          = new Date().toISOString();

    const record = {
      analysisId, userId, resumeName, selectedRole,
      score, totalKeywords: roleKeywords.length,
      foundKeywords: found, missingKeywords: missing,
      suggestions, tips, roleMatchPercent: score,
      extractedEmail,
      fileKey, createdAt,
    };

    localDB.unshift(record);
    saveDB();

    console.log(`[ANALYZE] ${resumeName} → ${selectedRole} → Score: ${score}%`);
    res.json(record);
  } catch (err) {
    console.error("analyze error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /history ──────────────────────────────────────────────
app.get("/history", (req, res) => {
  const userId   = req.query.userId || "anonymous";
  const analyses = localDB.filter((a) => a.userId === userId);
  res.json({ count: analyses.length, analyses });
});

// ── GET /report ───────────────────────────────────────────────
app.get("/report", (req, res) => {
  try {
    const analysisId = req.query.analysisId;
    if (!analysisId)
      return res.status(400).json({ error: "analysisId is required." });

    const analysis = localDB.find((a) => a.analysisId === analysisId);
    if (!analysis)
      return res.status(404).json({ error: "Analysis not found." });

    const text       = buildReportText(analysis);
    const reportFile = path.join(REPORTS_DIR, `${analysisId}.txt`);
    fs.writeFileSync(reportFile, text, "utf-8");

    // Serve the file as a download
    res.setHeader("Content-Disposition", `attachment; filename="ATS_Report_${analysisId}.txt"`);
    res.setHeader("Content-Type", "text/plain");
    res.send(text);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Health check ──────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", mode: "local", totalRecords: localDB.length });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log("");
  console.log("╔════════════════════════════════════════════════════╗");
  console.log("║  Cloud ATS Resume Analyzer — Local Backend        ║");
  console.log(`║  Running at: http://localhost:${PORT}                ║`);
  console.log("╠════════════════════════════════════════════════════╣");
  console.log("║  POST /upload-url   — get pre-signed upload URL   ║");
  console.log("║  POST /analyze      — run ATS analysis            ║");
  console.log("║  GET  /history      — fetch analysis history      ║");
  console.log("║  GET  /report       — download report             ║");
  console.log("║  GET  /health       — health check                ║");
  console.log("╚════════════════════════════════════════════════════╝");
  console.log("");
});