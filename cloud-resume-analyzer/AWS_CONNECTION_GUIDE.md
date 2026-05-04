# How to Connect to AWS Services
## Cloud ATS Resume Analyzer — Complete AWS Setup Guide

---

## Why You See "Failed to Fetch"

The app runs in **Demo Mode** when `VITE_API_URL` is not set.
In Demo Mode everything works in the browser — no AWS needed.

To connect to real AWS, follow the steps below.

---

## Step 1 — Create an AWS Account

1. Go to https://aws.amazon.com/free
2. Sign up (credit card required, free tier available)
3. Choose Basic Support (free)

---

## Step 2 — Create an IAM User for CLI Access

> Never use your root account for deployments.

AWS Console → IAM → Users → Create User

| Field       | Value               |
|-------------|---------------------|
| User name   | cloud-ats-deployer  |
| Access type | Programmatic access |

Attach these policies:
- AmazonS3FullAccess
- AmazonDynamoDBFullAccess
- AWSLambda_FullAccess
- AmazonAPIGatewayAdministrator
- IAMFullAccess
- CloudWatchLogsFullAccess

Save the Access Key ID and Secret Access Key (download CSV).

---

## Step 3 — Install AWS CLI v2

### Windows
Download MSI: https://awscli.amazonaws.com/AWSCLIV2.msi
Then verify:
```
aws --version
```

### Linux / Mac
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o awscliv2.zip
unzip awscliv2.zip
sudo ./aws/install
aws --version
```

---

## Step 4 — Configure AWS CLI

```bash
aws configure
```

Enter when prompted:
```
AWS Access Key ID     : AKIA...YOUR...KEY
AWS Secret Access Key : abc123...SECRET
Default region name   : us-east-1
Default output format : json
```

Verify it works:
```bash
aws sts get-caller-identity
```

---

## Step 5 — Install Terraform

### Windows (winget)
```powershell
winget install Hashicorp.Terraform
terraform --version
```

### Linux / Mac
```bash
wget https://releases.hashicorp.com/terraform/1.7.0/terraform_1.7.0_linux_amd64.zip
unzip terraform_1.7.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/
terraform --version
```

---

## Step 6 — Edit terraform.tfvars

Open: terraform/terraform.tfvars

Change bucket names to something globally unique:
```hcl
resume_bucket_name   = "cloud-ats-resumes-YOURNAME-2024"
frontend_bucket_name = "cloud-ats-frontend-YOURNAME-2024"
aws_region           = "us-east-1"
sns_email            = ""
```

---

## Step 7 — Deploy AWS Infrastructure

```bash
# Install Lambda dependencies
cd backend/lambdas
npm install --omit=dev
cd ../..

# Deploy with Terraform
cd terraform
terraform init
terraform plan
terraform apply
```

Note the outputs printed at the end:
```
api_gateway_url    = "https://abc123.execute-api.us-east-1.amazonaws.com"
frontend_bucket    = "cloud-ats-frontend-YOURNAME-2024"
frontend_website   = "cloud-ats-frontend-YOURNAME-2024.s3-website-us-east-1.amazonaws.com"
```

---

## Step 8 — Connect Frontend to AWS

Create frontend/.env from the API URL output:

```bash
cd frontend
echo "VITE_API_URL=https://abc123.execute-api.us-east-1.amazonaws.com" > .env
```

Now start the dev server — Demo Mode banner disappears:
```bash
npm run dev
```

---

## Step 9 — Deploy Frontend to S3

```bash
npm run build
aws s3 sync dist/ s3://cloud-ats-frontend-YOURNAME-2024 --delete
```

Your website is live at:
```
http://cloud-ats-frontend-YOURNAME-2024.s3-website-us-east-1.amazonaws.com
```

---

## Windows One-Shot Deploy Script

```powershell
.\scripts\deploy.ps1
```

---

## Verify Each AWS Service is Connected

```bash
# 1. AWS credentials
aws sts get-caller-identity

# 2. S3 buckets created
aws s3 ls | Select-String cloud-ats

# 3. DynamoDB table
aws dynamodb describe-table --table-name resume_analysis --query "Table.TableStatus"

# 4. Lambda functions
aws lambda list-functions --query "Functions[?starts_with(FunctionName,'cloud-ats')].FunctionName"

# 5. API Gateway endpoint responds
curl -X POST https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/upload-url `
  -H "Content-Type: application/json" `
  -d '{"fileName":"test.txt","fileType":"text/plain","userId":"test"}'

# 6. View Lambda logs
aws logs tail /aws/lambda/cloud-ats-analyzeResume --follow
```

---

## S3 Bucket — Manual CLI Setup (if not using Terraform)

```bash
# Resume storage bucket (private)
aws s3api create-bucket --bucket cloud-ats-resumes-YOURNAME-2024 --region us-east-1
aws s3api put-public-access-block --bucket cloud-ats-resumes-YOURNAME-2024 --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
aws s3api put-bucket-versioning --bucket cloud-ats-resumes-YOURNAME-2024 --versioning-configuration Status=Enabled

# CORS config (needed for pre-signed URL browser uploads)
aws s3api put-bucket-cors --bucket cloud-ats-resumes-YOURNAME-2024 --cors-configuration '{
  "CORSRules": [{
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET","PUT","POST","DELETE","HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }]
}'
```

---

## DynamoDB — Manual CLI Setup (if not using Terraform)

```bash
aws dynamodb create-table \
  --table-name resume_analysis \
  --attribute-definitions AttributeName=analysis_id,AttributeType=S AttributeName=user_id,AttributeType=S \
  --key-schema AttributeName=analysis_id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes '[{
    "IndexName": "UserIdIndex",
    "KeySchema": [{"AttributeName":"user_id","KeyType":"HASH"}],
    "Projection": {"ProjectionType":"ALL"}
  }]'
```

View data:
```bash
aws dynamodb scan --table-name resume_analysis
```

---

## Lambda — Manual Deploy (if not using Terraform)

```bash
# Package
cd backend/lambdas && npm install --omit=dev
Compress-Archive -Path . -DestinationPath ../../lambda.zip -Force

# Create function
aws lambda create-function --function-name cloud-ats-analyzeResume \
  --runtime nodejs18.x --handler analyzeResume.handler \
  --role arn:aws:iam::ACCOUNT_ID:role/cloud-ats-lambda-role \
  --zip-file fileb://lambda.zip \
  --environment Variables="{RESUME_BUCKET=cloud-ats-resumes-YOURNAME-2024,DYNAMODB_TABLE=resume_analysis,AWS_REGION=us-east-1}"

# Update code after changes
aws lambda update-function-code --function-name cloud-ats-analyzeResume --zip-file fileb://lambda.zip
```

---

## CloudWatch Logs

```bash
# View logs in real-time
aws logs tail /aws/lambda/cloud-ats-analyzeResume --follow

# List all project log groups
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/cloud-ats
```

---

## SNS Email Notifications (Optional)

Enable in terraform.tfvars:
```hcl
sns_email = "your@email.com"
```

Then run terraform apply. Check your inbox and confirm the subscription.

Or manually:
```bash
aws sns create-topic --name cloud-ats-notifications
aws sns subscribe --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:cloud-ats-notifications --protocol email --notification-endpoint your@email.com
```

---

## Terraform Commands Reference

```bash
cd terraform

terraform init      # Download AWS provider
terraform plan      # Preview changes
terraform apply     # Deploy to AWS
terraform output    # Show API URL and bucket names
terraform destroy   # Delete ALL resources (careful!)
```

---

## Cost Estimate (Free Tier)

| Service      | Free Tier               | After Free Tier       |
|-------------|-------------------------|-----------------------|
| Lambda      | 1M requests/month       | $0.0000002/req        |
| API Gateway | 1M HTTP calls/month     | $1.00/million         |
| S3          | 5 GB storage            | $0.023/GB             |
| DynamoDB    | 25 GB, on-demand billing| $1.25/million writes  |
| CloudWatch  | 5 GB logs/month         | $0.50/GB after free   |

Estimated monthly cost for portfolio use: $0 to $2

---

## Troubleshooting

| Error                        | Fix                                                   |
|------------------------------|-------------------------------------------------------|
| Failed to fetch              | Set VITE_API_URL in frontend/.env                     |
| Failed to load history       | Set VITE_API_URL or use demo mode (leave .env empty)  |
| CORS error                   | Check S3 CORS config and API Gateway CORS settings    |
| 403 on S3 upload             | IAM role needs s3:PutObject permission                |
| ResourceNotFoundException     | Run terraform apply first                             |
| Bucket name already taken    | Change name in terraform.tfvars                       |
| Lambda timeout               | Increase lambda_timeout in terraform.tfvars           |

---

Generated for: Cloud ATS Resume Analyzer — AWS Lambda + S3 + DynamoDB + Terraform