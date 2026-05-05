/**
 * getHistory Lambda Function
 * ─────────────────────────────────────────────────────────────
 * Scans DynamoDB for all analyses belonging to a userId.
 * Returns them sorted newest-first (max 50).
 *
 * Route : GET /history?userId=<id>
 */

"use strict";

const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");
const { unmarshall }                  = require("@aws-sdk/util-dynamodb");

const dynamo = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
};

exports.handler = async (event) => {
  if (event.requestContext?.http?.method === "OPTIONS")
    return { statusCode: 200, headers: CORS, body: "" };

  try {
    const userId = event.queryStringParameters?.userId || "anonymous";

    // Scan with filter (add GSI in prod for better performance)
    const result = await dynamo.send(new ScanCommand({
      TableName:                 process.env.DYNAMODB_TABLE,
      FilterExpression:          "user_id = :uid",
      ExpressionAttributeValues: { ":uid": { S: userId } },
      Limit:                     50,
    }));

    const items = (result.Items || []).map((item) => {
      const plain = unmarshall(item);
      return {
        ...plain,
        score:            Number(plain.score),
        found_keywords:   JSON.parse(plain.found_keywords   || "[]"),
        missing_keywords: JSON.parse(plain.missing_keywords || "[]"),
        suggestions:      JSON.parse(plain.suggestions      || "[]"),
        tips:             JSON.parse(plain.tips              || "[]"),
        // Normalise field names to match frontend expectations
        analysisId:   plain.analysis_id,
        resumeName:   plain.resume_name,
        selectedRole: plain.selected_role,
        createdAt:    plain.created_at,
        extractedEmail: plain.extracted_email || null,
        foundKeywords:   JSON.parse(plain.found_keywords   || "[]"),
        missingKeywords: JSON.parse(plain.missing_keywords || "[]"),
      };
    });

    // Sort newest first
    items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return {
      statusCode: 200,
      headers:    CORS,
      body:       JSON.stringify({ count: items.length, analyses: items }),
    };
  } catch (err) {
    console.error("getHistory error:", err);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "Failed to fetch history." }) };
  }
};