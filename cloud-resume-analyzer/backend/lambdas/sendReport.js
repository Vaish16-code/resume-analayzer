/**
 * sendReport Lambda Function
 * ─────────────────────────────────────────────────────────────
 * Fetches analysis from DynamoDB, builds report, and publishes
 * it to SNS with the provided email address to send the report.
 *
 * Route : POST /send-report
 * Payload: { analysisId, email }
 */

"use strict";

const { DynamoDBClient, GetItemCommand }        = require("@aws-sdk/client-dynamodb");
const { SNSClient, PublishCommand }             = require("@aws-sdk/client-sns");
const { unmarshall }                            = require("@aws-sdk/util-dynamodb");
const { buildReportText }                       = require("./shared");

const dynamo = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
const sns    = new SNSClient({ region: process.env.AWS_REGION || "us-east-1" });

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
};

exports.handler = async (event) => {
  if (event.requestContext?.http?.method === "OPTIONS")
    return { statusCode: 200, headers: CORS, body: "" };

  try {
    const body = JSON.parse(event.body || "{}");
    const { analysisId, email } = body;

    // Validate inputs
    if (!analysisId || !email)
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "analysisId and email are required." }) };

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Invalid email address." }) };

    // Fetch from DynamoDB
    const res = await dynamo.send(new GetItemCommand({
      TableName: process.env.DYNAMODB_TABLE,
      Key:       { analysis_id: { S: analysisId } },
    }));
    if (!res.Item)
      return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: "Analysis not found." }) };

    const analysis = unmarshall(res.Item);
    const text     = buildReportText(analysis);

    // Publish to SNS for email delivery
    if (!process.env.SNS_TOPIC_ARN)
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "SNS topic not configured." }) };

    await sns.send(new PublishCommand({
      TopicArn: process.env.SNS_TOPIC_ARN,
      Subject: `Cloud ATS report for ${analysis.resume_name}`,
      Message: [
        `📋 ATS Analysis Report`,
        `═══════════════════════════════════════`,
        ``,
        `Recipient: ${email}`,
        `Resume:    ${analysis.resume_name}`,
        `Role:      ${analysis.selected_role}`,
        `ATS Score: ${analysis.score}%`,
        `Generated: ${new Date().toISOString()}`,
        ``,
        text,
      ].join("\n"),
    }));

    console.log("sendReport published SNS notification for:", email);

    return {
      statusCode: 200,
      headers:    CORS,
      body:       JSON.stringify({
        success: true,
        message: `Report sent to ${email}. Please confirm the SNS subscription in your email.`,
        email,
        analysisId,
      }),
    };
  } catch (err) {
    console.error("sendReport error:", err);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "Failed to send report." }) };
  }
};
