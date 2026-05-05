resource "aws_dynamodb_table" "resume_analysis" {
  name         = var.dynamodb_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "analysis_id"
  table_class  = "STANDARD"
  tags         = local.common_tags

  attribute {
    name = "analysis_id"
    type = "S"
  }

  attribute {
    name = "user_id"
    type = "S"
  }

  global_secondary_index {
    name            = "UserIdIndex"
    hash_key        = "user_id"
    projection_type = "ALL"
  }
}
