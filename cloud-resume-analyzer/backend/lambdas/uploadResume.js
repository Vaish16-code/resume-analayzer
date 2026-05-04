/**
 * uploadResume Lambda Function
 * ─────────────────────────────────────────────────────────────
 * Generates a pre-signed S3 URL so the browser can PUT
 * the resume file directly to S3 — avoids API Gateway 10MB limit.
 *
 * Route : POST /upload-url
 * Body  : { fileName, fileType, userId }
 * Return: { uploadUrl, fileKey }
 */

"use strict";

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl }               = require("@aws-sdk/s3-request-presigner");
const { v4: uuidv4 }                 = require("uuid");

const s3 = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });

// Allowed MIME types
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

// CORS headers returned on every response
const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
};

exports.handler = async (event) => {
  // Pre-flight
  if (event.requestContext?.http?.method === "OPTIONS") {
    return { statusCode: 200, headers: CORS, body: "" };
  }

  try {
    const body     = JSON.parse(event.body || "{}");
    const { fileName, fileType, userId = "anonymous" } = body;

    // ── Validate ──────────────────────────────────────────────
    if (!fileName || !fileType) {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({ error: "fileName and fileType are required." }),
      };
    }
    if (!ALLOWED_TYPES.includes(fileType)) {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({ error: "Unsupported file type. Allowed: PDF, DOCX, TXT." }),
      };
    }

    // ── Build unique S3 key ───────────────────────────────────
    const fileKey = `resumes/${userId}/${uuidv4()}-${fileName}`;

    // ── Generate pre-signed PUT URL (valid 5 min) ─────────────
    const command   = new PutObjectCommand({
      Bucket:      process.env.RESUME_BUCKET,
      Key:         fileKey,
      ContentType: fileType,
    });
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    return {
      statusCode: 200,
      headers:    CORS,
      body:       JSON.stringify({ uploadUrl, fileKey }),
    };
  } catch (err) {
    console.error("uploadResume error:", err);
    return {
      statusCode: 500,
      headers:    CORS,
      body:       JSON.stringify({ error: "Internal server error." }),
    };
  }
};