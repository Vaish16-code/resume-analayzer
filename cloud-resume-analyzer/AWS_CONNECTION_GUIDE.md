# Cloud ATS Resume Analyzer - AWS Connection Guide

This project runs in demo mode when `frontend/.env` does not define `VITE_API_URL`. In that mode the app stays fully local in the browser.

When you want the AWS-backed flow, Terraform provisions the cloud resources and the frontend points to the API Gateway URL that Terraform outputs.

## What Terraform Creates

The Terraform stack in `terraform/` creates:

1. A private S3 bucket for resume uploads and generated reports.
2. A public S3 bucket for the built React frontend.
3. A DynamoDB table named `resume_analysis` with a `UserIdIndex` GSI.
4. Four Lambda functions:
   - `uploadResume`
   - `analyzeResume`
   - `getHistory`
   - `downloadReport`
5. An HTTP API Gateway with these routes:
   - `POST /upload-url`
   - `POST /analyze`
   - `GET /history`
   - `GET /report`
6. A shared IAM execution role and CloudWatch log groups.

## Prerequisites

Install these tools first:

1. AWS CLI v2
2. Terraform 1.7+
3. Node.js 18+
4. PowerShell on Windows

Configure your AWS credentials before deploying:

```powershell
aws configure
aws sts get-caller-identity
```

If you want Terraform to use a different AWS account, create a named profile instead of changing the default profile:

```powershell
aws configure --profile cloud-ats-dev
aws sts get-caller-identity --profile cloud-ats-dev
```

Then point Terraform at that profile by setting `aws_profile` in `terraform/terraform.tfvars`.

## Repo Layout That Matters

- `backend/lambdas/` contains the AWS Lambda handlers.
- `frontend/` contains the React app.
- `terraform/` contains the AWS infrastructure code.

## Step 1 - Install Lambda Dependencies

Terraform packages the Lambda source from `backend/lambdas/`, so install the runtime dependencies first:

```powershell
cd "c:\Yash Projects\Vaishnavi Project\resume-analayzer\cloud-resume-analyzer\backend\lambdas"
npm install
```

## Step 2 - Configure Terraform Variables

Create `terraform/terraform.tfvars` from the example file and set unique bucket names:

```hcl
aws_profile          = "cloud-ats-dev"
aws_region           = "ap-south-1"
resume_bucket_name   = "cloud-ats-resumes-ap-south-1-2026"
frontend_bucket_name = "cloud-ats-frontend-ap-south-1-2026"
dynamodb_table_name  = "resume_analysis"
lambda_timeout       = 30
lambda_memory_size   = 256
log_retention_days   = 14
```

Bucket names must be globally unique and lowercase. **Use region-specific suffixes** to avoid conflicts after deletion.

## Step 3 - Deploy AWS Infrastructure

Run Terraform from the `terraform/` folder:

```powershell
cd "c:\Yash Projects\Vaishnavi Project\resume-analayzer\cloud-resume-analyzer\terraform"
terraform init
terraform plan
terraform apply
```

If you prefer not to store the profile in `terraform.tfvars`, you can also set it temporarily for one command:

```powershell
terraform plan -var="aws_profile=cloud-ats-dev"
```

When it finishes, note the output named `api_gateway_url`. That is the value you put into the frontend environment file.

## Step 4 - Connect the Frontend to AWS

Create `frontend/.env` with the API Gateway URL from Terraform:

```powershell
cd "c:\Yash Projects\Vaishnavi Project\resume-analayzer\cloud-resume-analyzer\frontend"
@"
VITE_API_URL=https://y53eijmih3.execute-api.ap-south-1.amazonaws.com
"@ | Set-Content .env
```

Or use the actual `api_gateway_url` output from your `terraform apply` if deploying a new stack.

If `VITE_API_URL` is missing, the app stays in demo mode.

## Step 5 - Run the Frontend Locally

```powershell
npm install
npm run dev
```

The demo banner disappears when the app sees a valid AWS API URL.

## Step 6 - Build and Publish the Frontend to S3

After the frontend is built, sync `dist/` to the Terraform-created frontend bucket:

```powershell
npm run build
aws s3 sync dist/ s3://cloud-ats-frontend-ap-south-1-2026 --delete --profile cloud-ats-dev
```

Use the `frontend_website_url` Terraform output to open the live site:
```
https://cloud-ats-frontend-ap-south-1-2026.s3-website.ap-south-1.amazonaws.com
```

## Verify the AWS Flow

Use these checks after deployment:

```powershell
# Verify identity under cloud-ats-dev profile
aws sts get-caller-identity --profile cloud-ats-dev

# List S3 buckets
aws s3 ls --profile cloud-ats-dev | Select-String cloud-ats

# Check DynamoDB table
aws dynamodb describe-table --table-name resume_analysis --profile cloud-ats-dev --region ap-south-1 --query "Table.TableStatus"

# List Lambda functions
aws lambda list-functions --profile cloud-ats-dev --region ap-south-1 --query "Functions[?starts_with(FunctionName,'cloud-ats')].FunctionName"
```

To test the API endpoint directly:

```powershell
Invoke-RestMethod -Method Post `
  -Uri "https://y53eijmih3.execute-api.ap-south-1.amazonaws.com/upload-url"
  -ContentType "application/json" `
  -Body '{"fileName":"test.txt","fileType":"text/plain","userId":"test"}'
```

## How the Cloud Flow Works

1. The frontend asks `POST /upload-url` for a pre-signed S3 upload URL.
2. The browser uploads the resume file directly to S3.
3. The frontend calls `POST /analyze` with the returned `fileKey` and selected role.
4. The Lambda reads the resume from S3, scores it, and stores the result in DynamoDB.
5. `GET /history` reads the saved analyses for the current `userId`.
6. `POST /send-report` sends the analysis report directly to the provided email via AWS SES (no confirmation needed).

## Troubleshooting

| Problem | Likely fix |
|---|---|
| `Failed to fetch` | Set `frontend/.env` with the Terraform `api_gateway_url` output and restart the dev server. |
| `CORS` errors | Re-run `terraform apply` and confirm the HTTP API CORS settings are intact. |
| Upload returns `403` | Check the Lambda IAM policy and the resume bucket name in `terraform.tfvars`. |
| History is empty | Make sure the same browser user is being used and that `userId` matches the saved localStorage value. |
| `Report email not received` | Verify that `sender_email` in `terraform.tfvars` is a verified SES sender address. |
| `Terraform zip build is empty` | Run `npm install` in `backend/lambdas/` again before `terraform apply`. |

## Notes

- The API Gateway URL from Terraform is the value you should use for `VITE_API_URL`.
- The frontend S3 website URL is HTTP-based; if you need HTTPS later, add CloudFront on top.
- CloudWatch logs are available under `/aws/lambda/cloud-ats-*` in the `ap-south-1` region.
- Email delivery uses AWS SES. The sender email must be verified in the SES console. Set it via `sender_email` in `terraform.tfvars`.
- `terraform.tfvars` should not be committed.
