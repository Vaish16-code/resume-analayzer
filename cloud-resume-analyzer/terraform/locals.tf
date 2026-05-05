locals {
  project_name      = "cloud-ats-resume-analyzer"
  lambda_source_dir = abspath("${path.module}/../backend/lambdas")
  lambda_zip_path   = "${path.module}/lambda_bundle.zip"

  common_tags = merge(
    {
      Project   = local.project_name
      ManagedBy = "Terraform"
    },
    var.tags,
  )

  lambda_functions = {
    uploadResume = {
      function_name = "cloud-ats-uploadResume"
      handler       = "uploadResume.handler"
      description   = "Generate pre-signed S3 upload URLs"
      route_key     = "POST /upload-url"
    }
    analyzeResume = {
      function_name = "cloud-ats-analyzeResume"
      handler       = "analyzeResume.handler"
      description   = "Analyze resumes and store ATS scores"
      route_key     = "POST /analyze"
    }
    getHistory = {
      function_name = "cloud-ats-getHistory"
      handler       = "getHistory.handler"
      description   = "Fetch saved analyses for a user"
      route_key     = "GET /history"
    }
    downloadReport = {
      function_name = "cloud-ats-downloadReport"
      handler       = "downloadReport.handler"
      description   = "Build a report and return a download URL"
      route_key     = "GET /report"
    }
    sendReport = {
      function_name = "cloud-ats-sendReport"
      handler       = "sendReport.handler"
      description   = "Send analysis report via email using SNS"
      route_key     = "POST /send-report"
    }
  }
}
