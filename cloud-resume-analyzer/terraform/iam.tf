data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "lambda_execution" {
  name               = "cloud-ats-lambda-execution-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
  tags               = local.common_tags
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "lambda_data_access" {
  statement {
    effect = "Allow"

    actions = [
      "s3:GetObject",
      "s3:PutObject",
    ]

    resources = [
      aws_s3_bucket.resumes.arn,
      "${aws_s3_bucket.resumes.arn}/*",
    ]
  }

  statement {
    effect = "Allow"

    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:Scan",
      "dynamodb:Query",
    ]

    resources = [
      aws_dynamodb_table.resume_analysis.arn,
      "${aws_dynamodb_table.resume_analysis.arn}/index/UserIdIndex",
    ]
  }
}

data "aws_iam_policy_document" "lambda_ses_send" {
  statement {
    effect = "Allow"

    actions = [
      "ses:SendEmail",
      "ses:SendRawEmail",
    ]

    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "lambda_ses_send" {
  name   = "cloud-ats-lambda-ses-send"
  role   = aws_iam_role.lambda_execution.id
  policy = data.aws_iam_policy_document.lambda_ses_send.json
}
