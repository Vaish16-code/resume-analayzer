/**
 * downloadReport Lambda Function
 * ─────────────────────────────────────────────────────────────
 * Fetches a single analysis from DynamoDB, builds a
 * formatted plain-text report, saves it to S3, and returns
 * a pre-signed download URL valid for 10 minutes.
 *
 * Route : GET /report?analysisId=<uuid>
 */

"use strict";

const { DynamoDBClient, GetItemCommand }                = require("@aws-sdk/client-dynamodb");
const { S3Client, PutObjectCommand, GetObjectCommand }  = require("@aws-sdk/client-s3");
const { SNSClient, PublishCommand }                     = require("@aws-sdk/client-sns");
const { getSignedUrl }                                  = require("@aws-sdk/s3-request-presigner");
const { unmarshall }                                    = require("@aws-sdk/util-dynamodb");
const { buildReportText }                               = require("./shared");

const dynamo = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
const s3     = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });
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
    const analysisId = event.queryStringParameters?.analysisId;
    if (!analysisId)
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "analysisId is required." }) };

    // Fetch from DynamoDB
    const res = await dynamo.send(new GetItemCommand({
      TableName: process.env.DYNAMODB_TABLE,
      Key:       { analysis_id: { S: analysisId } },
    }));
    if (!res.Item)
      return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: "Analysis not found." }) };

    const analysis = unmarshall(res.Item);
    const text     = buildReportText(analysis);

    // Save report to S3
    const reportKey = `reports/${analysisId}.txt`;
    await s3.send(new PutObjectCommand({
      Bucket:      process.env.RESUME_BUCKET,
      Key:         reportKey,
      Body:        text,
      ContentType: "text/plain",
    }));

    // Return pre-signed download URL (valid 10 min)
    const downloadUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket:                      process.env.RESUME_BUCKET,
        Key:                         reportKey,
        ResponseContentDisposition:  `attachment; filename="ATS_Report_${analysisId}.txt"`,
      }),
      { expiresIn: 600 }
    );

    if (process.env.SNS_TOPIC_ARN && analysis.extracted_email) {
      await sns.send(new PublishCommand({
        TopicArn: process.env.SNS_TOPIC_ARN,
        Subject: `Cloud ATS report for ${analysis.resume_name}`,
        Message: [
          `Report for: ${analysis.resume_name}`,
          `Role: ${analysis.selected_role}`,
          `ATS Score: ${analysis.score}%`,
          `Extracted Email: ${analysis.extracted_email}`,
          "",
          text,
        ].join("\n"),
      }));
      console.log("downloadReport published SNS notification for:", analysis.extracted_email);
    }

    return {
      statusCode: 200,
      headers:    CORS,
      body:       JSON.stringify({ downloadUrl, reportKey }),
    };
  } catch (err) {
    console.error("downloadReport error:", err);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "Failed to generate report." }) };
  }
};