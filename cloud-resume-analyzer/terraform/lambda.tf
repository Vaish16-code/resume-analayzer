data "archive_file" "lambda_bundle" {
  type        = "zip"
  source_dir  = local.lambda_source_dir
  output_path = local.lambda_zip_path
}

resource "aws_lambda_function" "functions" {
  for_each = local.lambda_functions

  function_name    = each.value.function_name
  description      = each.value.description
  role             = aws_iam_role.lambda_execution.arn
  handler          = each.value.handler
  runtime          = "nodejs18.x"
  filename         = data.archive_file.lambda_bundle.output_path
  source_code_hash = data.archive_file.lambda_bundle.output_base64sha256
  timeout          = var.lambda_timeout
  memory_size      = var.lambda_memory_size
  architectures    = ["x86_64"]

  environment {
    variables = {
      RESUME_BUCKET  = aws_s3_bucket.resumes.bucket
      DYNAMODB_TABLE = aws_dynamodb_table.resume_analysis.name
      SENDER_EMAIL   = var.sender_email
    }
  }

  tags = merge(local.common_tags, {
    Name = each.value.function_name
  })
}

resource "aws_cloudwatch_log_group" "lambda" {
  for_each = local.lambda_functions

  name              = "/aws/lambda/${each.value.function_name}"
  retention_in_days = var.log_retention_days
  tags              = local.common_tags
}
