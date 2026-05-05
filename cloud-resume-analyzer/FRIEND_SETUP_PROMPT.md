# Cloud ATS Resume Analyzer - Friend Setup Prompt for AI Agent

**Use this prompt with your AI agent (Copilot, ChatGPT, etc.) to set up this project on your laptop.**

---

## Setup Prompt for AI Agent

You are helping me set up a GitHub project called "Cloud ATS Resume Analyzer" on my laptop. Here's what you need to do:

### Project Context
- **Repository**: https://github.com/Vaish16-code/resume-analayzer.git
- **Project Type**: Node.js + React frontend + AWS Lambda backend with Terraform IaC
- **Dependencies**: Node.js 18+, Terraform 1.7+, AWS CLI v2
- **AWS Setup**: Uses AWS profile `cloud-ats-dev` in region `ap-south-1`

### Your Tasks (Execute in Order)

#### Task 1: Clone the Repository
```powershell
git clone https://github.com/Vaish16-code/resume-analayzer.git
cd resume-analayzer/cloud-resume-analyzer
```

#### Task 2: Verify or Install Node.js
Check that Node.js 18+ is installed:
```powershell
node --version
npm --version
```
If not installed, direct the user to: https://nodejs.org/

#### Task 3: Check Terraform Installation
Verify Terraform 1.7+ is installed:
```powershell
terraform version
```
If not installed, follow these steps:
- Download from: https://www.terraform.io/downloads
- Extract to a folder (e.g., `C:\Tools\terraform`)
- Add the folder to system PATH environment variable
- Restart PowerShell and verify: `terraform version`

#### Task 4: Verify AWS CLI v2
Check that AWS CLI v2 is installed:
```powershell
aws --version
```
If not installed, download from: https://aws.amazon.com/cli/

#### Task 5: Configure AWS Profile `cloud-ats-dev`
Create a named AWS profile for this project using the same AWS credentials:
```powershell
aws configure --profile cloud-ats-dev
```
When prompted, enter:
- **AWS Access Key ID**: [Use the same credentials as the original setup]
- **AWS Secret Access Key**: [Use the same credentials as the original setup]
- **Default region name**: `ap-south-1`
- **Default output format**: Press Enter to skip (leave blank)

Verify the profile is configured:
```powershell
aws sts get-caller-identity --profile cloud-ats-dev
```
It should return your AWS account ID and ARN.

#### Task 6: Install Lambda Dependencies
Lambda functions need npm packages installed before Terraform deploys them:
```powershell
cd backend\lambdas
npm install
cd ..\..
```

#### Task 7: Create terraform/terraform.tfvars File
Create a file at `terraform/terraform.tfvars` with these settings. **IMPORTANT**: The bucket names must be globally unique and lowercase. Use region-specific suffixes with a unique identifier (use different names than the original deployment to avoid S3 conflicts):

```hcl
aws_profile          = "cloud-ats-dev"
aws_region           = "ap-south-1"
resume_bucket_name   = "cloud-ats-resumes-ap-south-1-YOURNAME-2026"
frontend_bucket_name = "cloud-ats-frontend-ap-south-1-YOURNAME-2026"
dynamodb_table_name  = "resume_analysis"
lambda_timeout       = 30
lambda_memory_size   = 256
log_retention_days   = 14
sender_email         = "your-verified-ses-email@example.com"
```

**Replace `YOURNAME` with something unique like your name or a random string.**
**Replace `your-verified-ses-email@example.com` with a verified AWS SES sender email or keep the default for now.**

#### Task 8: Deploy AWS Infrastructure with Terraform
Navigate to the Terraform folder and deploy:
```powershell
cd terraform
terraform init
terraform plan -var="aws_profile=cloud-ats-dev"
```
Review the plan output to see what resources will be created. Then apply:
```powershell
terraform apply -var="aws_profile=cloud-ats-dev" -auto-approve
```

**Wait 2-3 minutes for infrastructure to deploy.** At the end, Terraform will output:
```
Outputs:

api_gateway_url = "https://xxxxxxxxxx.execute-api.ap-south-1.amazonaws.com"
resume_bucket_name = "cloud-ats-resumes-ap-south-1-YOURNAME-2026"
frontend_bucket_name = "cloud-ats-frontend-ap-south-1-YOURNAME-2026"
frontend_website_url = "cloud-ats-frontend-ap-south-1-YOURNAME-2026.s3-website.ap-south-1.amazonaws.com"
sender_email = "your-verified-ses-email@example.com"
```

**Copy the `api_gateway_url` value** — you'll need it in the next step.

#### Task 9: Create frontend/.env File
Navigate to the frontend folder and create `.env` with the API URL from Terraform output:
```powershell
cd ..\frontend
```

Create a file named `.env` with:
```
VITE_API_URL=https://PASTE_YOUR_API_GATEWAY_URL_HERE
```

Replace `PASTE_YOUR_API_GATEWAY_URL_HERE` with the actual `api_gateway_url` from Terraform output (example: `https://y53eijmih3.execute-api.ap-south-1.amazonaws.com`)

#### Task 10: Install Frontend Dependencies
```powershell
npm install
```

#### Task 11: Run the Frontend Development Server
```powershell
npm run dev
```

You'll see output like:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

Open http://localhost:5173/ in your browser. The app is now live!

#### Task 12: Test the Full Flow
1. Open http://localhost:5173/ in your browser
2. Select a job role (e.g., "Frontend Developer")
3. Upload a PDF, DOCX, or TXT resume
4. Click "Analyze Resume"
5. View the ATS score and extracted email
6. Click "Send Report to Email" to test email delivery

---

## Important: AWS SES Email Delivery Setup

Email sending uses AWS SES (Simple Email Service). By default, SES is in **Sandbox mode**, which means:

**To receive emails, you must verify the sender email address first:**

1. Go to AWS Console → SES (Simple Email Service) → **Verified identities**
2. Click **Create identity** → Select **Email address**
3. Enter the email from `sender_email` in `terraform.tfvars`
4. Check your inbox for a verification email from AWS
5. Click the verification link
6. Once verified, emails will be sent successfully

If you get a "MessageRejected" error, the sender email is not verified. Follow the steps above.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `Terraform command not found` | Terraform isn't in PATH. Restart PowerShell after installation. |
| `Error: error validating provider credentials` | AWS credentials not configured. Re-run `aws configure --profile cloud-ats-dev`. |
| `The bucket already exists in another region` | Change `resume_bucket_name` and `frontend_bucket_name` to unique values. |
| `Failed to upload file to S3` | Check that Lambda has S3 permissions (they were just restored). |
| `Email not received` | Verify the sender email in AWS SES console first. |
| `VITE_API_URL not defined` | Make sure `.env` exists in `frontend/` with the correct API URL. |
| `npm install fails` | Try running PowerShell as Administrator. |

---

## Next Steps After Setup

- **View CloudWatch Logs**: AWS Console → CloudWatch → Log Groups → `/aws/lambda/cloud-ats-*` (in `ap-south-1`)
- **Upload Frontend to S3**: Run `npm run build` then sync to S3 bucket via AWS CLI
- **Customize Keywords**: Edit `backend/lambdas/shared.js` to add custom job roles and keywords
- **Add Custom Domain**: Set up CloudFront + Route 53 for HTTPS

---

## File Structure You'll Create/Configure

```
cloud-resume-analyzer/
├── terraform/
│   ├── terraform.tfvars          ← YOU CREATE THIS
│   ├── (other .tf files)
├── frontend/
│   ├── .env                       ← YOU CREATE THIS
│   ├── src/
│   └── package.json
├── backend/
│   ├── lambdas/
│   │   ├── (Lambda function files)
│   │   └── node_modules/          ← npm install creates this
│   └── server.js
└── FRIEND_SETUP_PROMPT.md         ← THIS FILE
```

---

## That's It!

Once you've completed all 12 tasks, your friend's laptop will have a fully functional Cloud ATS Resume Analyzer that:
- ✅ Uploads resumes directly to AWS S3
- ✅ Analyzes resumes with ATS scoring via AWS Lambda
- ✅ Stores analysis history in DynamoDB
- ✅ Sends reports via AWS SES email
- ✅ Provides a beautiful React frontend
- ✅ All infrastructure managed by Terraform

Good luck! 🚀
