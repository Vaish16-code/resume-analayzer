variable "aws_region" {
  description = "AWS region for all resources."
  type        = string
  default     = "us-east-1"
}

variable "aws_profile" {
  description = "Named AWS CLI profile to use for Terraform. Leave empty to use the default AWS credential chain."
  type        = string
  default     = ""
}

variable "resume_bucket_name" {
  description = "Globally unique S3 bucket name for resumes and generated reports."
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$", var.resume_bucket_name))
    error_message = "resume_bucket_name must be a valid lowercase S3 bucket name."
  }
}

variable "frontend_bucket_name" {
  description = "Globally unique S3 bucket name for the frontend website."
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$", var.frontend_bucket_name))
    error_message = "frontend_bucket_name must be a valid lowercase S3 bucket name."
  }
}

variable "dynamodb_table_name" {
  description = "DynamoDB table name used by the analysis Lambda functions."
  type        = string
  default     = "resume_analysis"
}

variable "lambda_timeout" {
  description = "Lambda timeout in seconds."
  type        = number
  default     = 30
}

variable "lambda_memory_size" {
  description = "Lambda memory size in MB."
  type        = number
  default     = 256
}

variable "log_retention_days" {
  description = "CloudWatch log retention for the Lambda log groups."
  type        = number
  default     = 14
}

variable "tags" {
  description = "Extra tags to apply to AWS resources."
  type        = map(string)
  default     = {}
}
