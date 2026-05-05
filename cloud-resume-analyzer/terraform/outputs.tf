output "api_gateway_url" {
  description = "Base URL for the HTTP API used by the frontend VITE_API_URL."
  value       = aws_apigatewayv2_api.http_api.api_endpoint
}

output "resume_bucket_name" {
  description = "Private bucket for resumes and generated reports."
  value       = aws_s3_bucket.resumes.bucket
}

output "frontend_bucket_name" {
  description = "Public bucket that hosts the React build output."
  value       = aws_s3_bucket.frontend.bucket
}

output "frontend_website_url" {
  description = "HTTP website endpoint for the frontend bucket."
  value       = aws_s3_bucket_website_configuration.frontend.website_endpoint
}

output "dynamodb_table_name" {
  description = "DynamoDB table used for resume analysis history."
  value       = aws_dynamodb_table.resume_analysis.name
}

output "lambda_role_arn" {
  description = "IAM role assumed by all Lambda functions."
  value       = aws_iam_role.lambda_execution.arn
}

output "sender_email" {
  description = "Verified SES sender email used for sending reports."
  value       = var.sender_email
}
