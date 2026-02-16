# 🚀 AWS Deployment Guide

This document explains how to deploy the Autonomous Lead Intelligence app to AWS using GitHub Actions.

## Deployment Options

We provide two deployment strategies:

1. **AWS Amplify** (Recommended) - Easiest, managed Next.js hosting
2. **AWS ECS with Docker** - More control, containerized deployment

---

## Option 1: AWS Amplify (Recommended)

### Prerequisites

- AWS Account with appropriate permissions
- GitHub repository with this code
- PostgreSQL database (AWS RDS recommended)

### Step 1: Create AWS Amplify App

**Using AWS Console:**

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Click **"New app"** → **"Host web app"**
3. Choose **"Deploy without Git"** (we'll use GitHub Actions)
4. Note your **App ID** (e.g., `d1a2b3c4d5e6f7`)

**Using AWS CLI:**

```bash
aws amplify create-app \
  --name "Autonomous Lead Intelligence" \
  --repository "https://github.com/YOUR-USERNAME/YOUR-REPO" \
  --region us-east-1
```

### Step 2: Setup PostgreSQL Database

**The database is automatically created during deployment!**

The GitHub Actions workflow uses CloudFormation to deploy an RDS PostgreSQL instance automatically. You don't need to create it manually.

**What you need:**
- Set `DB_MASTER_PASSWORD` secret in GitHub (min 8 characters)
- First deployment creates the RDS instance (~5-10 minutes)
- Subsequent deployments reuse the existing database

**CloudFormation template location:** `infrastructure/rds-database.yml`

**Manual deployment (optional):**

If you prefer to create the database separately:

```bash
# Set password
export DB_PASSWORD="YourSecurePassword123"
export AWS_REGION="us-east-1"
export STACK_NAME="lead-intelligence-db"

# Deploy stack
chmod +x infrastructure/deploy-stack.sh
./infrastructure/deploy-stack.sh
```

**What's created:**
- VPC with 2 public subnets (multi-AZ)
- RDS PostgreSQL 15 (db.t3.micro, latest minor version)
- Security group (allows PostgreSQL port 5432)
- Automated backups (7 days retention)
- CloudWatch monitoring
- Performance Insights enabled

### Step 3: Setup AWS IAM Role with OIDC

**The workflows use GitHub OIDC for authentication** (no long-lived AWS credentials stored in GitHub).

#### Prerequisites
- AWS account with admin or IAM permissions
- Your GitHub repository URL (e.g., `github.com/YOUR-ORG/YOUR-REPO`)

#### Create IAM OIDC Provider (one-time per AWS account)

1. **AWS Console** → **IAM** → **Identity providers** → **Add provider**
2. Provider type: **OpenID Connect**
3. Provider URL: `https://token.actions.githubusercontent.com`
4. Audience: `sts.amazonaws.com  
5. Click **Get thumbprint** → **Add provider**

#### Create IAM Role for GitHub Actions

1. **IAM** → **Roles** → **Create role**
2. Trusted entity type: **Custom trust policy**
3. Paste this trust policy (replace `YOUR-ACCOUNT-ID`, `YOUR-ORG`, `YOUR-REPO`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::YOUR-ACCOUNT-ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR-ORG/YOUR-REPO:*"
        }
      }
    }
  ]
}
```

4. Click **Next**
5. **Attach permissions policies** - Select these AWS managed policies:
   - `AWSCloudFormationFullAccess`
   - `AmazonRDSFullAccess`
   - `AmazonEC2FullAccess`
   - `AdministratorAccess-Amplify`

6. Click **Next**
7. Role name: `LeadIntelligence-GitHubActions-Role`
8. Description: `GitHub Actions OIDC role for Lead Intelligence project`
9. Click **Create role**

10. **Add S3 inline policy:**
    - Click on the newly created role
    - **Permissions** tab → **Add permissions** → **Create inline policy**
    - Switch to JSON tab:
    ```json
    {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": ["s3:PutObject", "s3:GetObject", "s3:ListBucket"],
          "Resource": ["arn:aws:s3:::amplify-*", "arn:aws:s3:::amplify-*/*"]
        }
      ]
    }
    ```
    - Click **Review policy** → Name: `AmplifyS3Access` → **Create policy**

11. **Copy the Role ARN:**
    - In role summary, copy the ARN (e.g., `arn:aws:iam::123456789012:role/LeadIntelligence-GitHubActions-Role`)

### Step 4: Configure GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **Environments** → **dev**

Add these environment secrets:

| Secret Name | Required | Description | Example |
|-------------|----------|-------------|---------|
| `AWS_ROLE_ARN` | ✅ Yes | IAM Role ARN from Step 3 | `arn:aws:iam::123456789012:role/LeadIntelligence-GitHubActions-Role` |
| `DB_MASTER_PASSWORD` | ✅ Yes | RDS PostgreSQL password (min 8 chars) | `SecurePass123!` |
| `AMPLIFY_APP_ID` | ✅ Yes | Amplify app ID from Step 1 | `d1a2b3c4d5e6f7` |
| `OPENAI_API_KEY` | ❌ No | OpenAI API key (optional) | `sk-...` |
| `DEMO_MODE` | ❌ No | Use mock LLM responses | `true` or `false` |

**Note:** `DATABASE_URL` is automatically retrieved from CloudFormation stack outputs during deployment.

### Step 5: Deploy

**Automatic Deployment:**
- Push to `main` branch triggers deployment
- GitHub Actions authenticates via OIDC (assumes IAM role)
- First deployment: ~10-15 minutes (creates RDS database)
- Subsequent deployments: ~5-7 minutes

**Manual Deployment:**
1. Go to **Actions** tab in GitHub
2. Select **"Deploy to AWS Amplify"** workflow
3. Click **"Run workflow"** → **"Run workflow"**

**Deployment Flow:**
1. ✅ Authenticate via OIDC (temporary credentials)
2. ✅ Check/create CloudFormation stack (RDS database)
3. ✅ Retrieve DATABASE_URL from stack outputs
4. ✅ Build Next.js application
5. ✅ Run Prisma database migrations
6. ✅ Deploy to AWS Amplify

### Step 6: Verify Database Creation

After first deployment, verify the RDS instance was created:
}
```

- First deployment creates RDS database (~10-15 minutes total)
- Subsequent deployments are faster (~5-7 minutes)

**Manual Deployment:**
1. Go to **Actions** tab in GitHub
2. Select **"Deploy to AWS Amplify"** workflow
3. Click **"Run workflow"** → **"Run workflow"**

**DeploymentVerify Database Creation

After first deployment, verify the RDS instance:

**Via AWS Console:**
1. Go to CloudFormation → Stacks
2. Find `lead-intelligence-db` stack
3. View Outputs tab → Copy `DatabaseURL`

**Via AWS CLI:**
```bash
aws cloudformation describe-stacks \
  --stack-name lead-intelligence-db \
  --query 'Stacks[0].Outputs'
```

**Visit RDS Console:**
1. Go to RDS → Databases
2. Find `lead-intelligence-db-db`
3. Note the endpoint and connection details

### Step 7: Access Your App

Your app will be available at:
```
https://main.YOUR_AMPLIFY_APP_ID.amplifyapp.com
```

**Note:** Environment variables (`DATABASE_URL`, `OPENAI_API_KEY`, `DEMO_MODE`) are injected during the build process via GitHub Actions. You don't need to configure them in Amplify Console.

---

## Option 2: AWS ECS with Docker

For more control and containerized deployment.

### Step 1: Create ECR Repository

```bash
aws ecr create-repository \
  --repository-name autonomous-lead-intelligence \
  --region us-east-1
```

### Step 2: Create ECS Cluster

```bash
aws ecs create-cluster \
  --cluster-name lead-intelligence-cluster \
  --region us-east-1
```

### Step 3: Create ECS Task Definition

```bash
aws ecs register-task-definition \
  --family lead-intelligence-task \
  --network-mode awsvpc \
  --requires-compatibilities FARGATE \
  --cpu 512 \
  --memory 1024 \
  --execution-role-arn arn:aws:iam::YOUR_ACCOUNT_ID:role/ecsTaskExecutionRole \
  --container-definitions '[{
    "name": "lead-intelligence-app",
    "image": "YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/autonomous-lead-intelligence:latest",
    "portMappings": [{
      "containerPort": 3000,
      "protocol": "tcp"
    }],
    "environment": [
      {"name": "NODE_ENV", "value": "production"},
      {"name": "DEMO_MODE", "value": "true"}
    ],
    "secrets": [
      {"name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:..."},
      {"name": "OPENAI_API_KEY", "valueFrom": "arn:aws:secretsmanager:..."}
    ]
  }]'
```

### Step 4: Create ECS Service

```bash
aws ecs create-service \
  --cluster lead-intelligence-cluster \
  --service-name lead-intelligence-service \
  --task-definition lead-intelligence-task \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}"
```

### Step 5: Configure GitHub Secrets (ECS)

Same as Amplify setup (Steps 3-4 above). The same OIDC role and secrets work for both workflows.

**Additional secret for ECS:**

| Secret Name | Required | Description | Example |
|-------------|----------|-------------|---------|
| `AWS_ACCOUNT_ID` | ✅ Yes (ECS only) | Your 12-digit AWS account ID | `123456789012` |

Add this to your GitHub dev environment along with the existing secrets.

### Step 6: Deploy (Manual Only)

**ECS deployment is manual-trigger only:**

1. Go to **Actions** tab in GitHub
2. Select **"Deploy to AWS ECS (Docker)"** workflow
3. Click **"Run workflow"** → **"Run workflow"**

**Note:** Unlike Amplify, the ECS workflow does NOT run automatically on push to `main`. This prevents duplicate deployments.

---

## Database Migration on Deployment

Both workflows automatically run:

```bash
npx prisma db push --skip-generate
```

This ensures database schema is up-to-date.

**For production, consider:**
- Using Prisma Migrate instead: `npx prisma migrate deploy`
- Separate migration job
- Database snapshot before migrations

---

## Environment Variables

All deployments require:

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string | - |
| `OPENAI_API_KEY` | ❌ No | OpenAI API key | - |
| `DEMO_MODE` | ❌ No | Use mock LLM responses | `true` |
| `NODE_ENV` | Auto-set | Environment | `production` |

---

## Cost Estimation

### AWS Amplify
- **Build minutes:** ~5 min/deployment × $0.01/min = $0.05/deployment
- **Hosting:** ~$0.15/GB stored + $0.15/GB served
- **Estimated monthly:** $15-50 (moderate traffic)

### AWS ECS Fargate
- **Fargate task:** 0.5 vCPU, 1GB RAM = ~$15/month (24/7)
- **ECR storage:** ~$0.10/GB/month
- **Load balancer:** ~$16/month (optional)
- **Estimated monthly:** $30-60

### RDS PostgreSQL
- **db.t3.micro:** ~$15/month
- **db.t3.small:** ~$30/month
- **Aurora Serverless:** $0.06/hour when active (~$10-40/month)

---

## Monitoring and Logs

### View Logs

**Amplify:**
```bash
aws amplify get-job \
  --app-id YOUR_APP_ID \
  --branch-name staging \
  --job-id JOB_ID
```

**ECS:**
```bash
aws logs tail /ecs/lead-intelligence-task --follow
```

### CloudWatch Alarms

Set up alerts for:
- High error rates
- Slow response times
- Database connection failures

---

## Rollback

### Amplify
1. Go to Amplify Console
2. Select app → Deployments
3. Click **"Redeploy"** on previous version

### ECS
```bash
# Deploy previous task definition
aws ecs update-service \
  --cluster lead-intelligence-cluster \
  --service lead-intelligence-service \
  --task-definition lead-intelligence-task:PREVIOUS_REVISION
```

---

## Troubleshooting

### Build Fails in GitHub Actions

**Check:**
- GitHub secrets are configured correctly
- AWS credentials have necessary permissions
- Database URL is accessible from GitHub runners

**View logs:**
- GitHub: Actions tab → Failed workflow → View logs
- AWS: CloudWatch Logs

### Database Connection Issues

**Check:**
- RDS security group allows inbound on port 5432
- VPC configuration allows public access (or configure NAT Gateway)
- Database URL format is correct

**Test connection:**
```bash
psql $DATABASE_URL -c "SELECT 1"
```

### Amplify Deployment Hangs

**Check:**
- Build logs in Amplify Console
- Environment variables are set
- `amplify.yml` is valid

### ECS Task Won't Start

**Check:**
- Task definition has correct environment variables
- Container image exists in ECR
- IAM execution role has permissions
- VPC/subnet configuration is correct

**View task logs:**
```bash
aws ecs describe-tasks \
  --cluster lead-intelligence-cluster \
  --tasks TASK_ARN
```

---

## Security Best Practices

1. **Use AWS Secrets Manager** for sensitive data
2. **Enable VPC** for database and app communication
3. **Configure WAF** for DDoS protection
4. **Enable CloudTrail** for audit logging
5. **Rotate credentials** regularly
6. **Use least-privilege IAM roles**
7. **Enable HTTPS only** (Amplify does this by default)

---

## Next Steps

After deployment:

1. **Set up custom domain** in Amplify Console
2. **Configure CloudFront CDN** for global distribution
3. **Enable auto-scaling** for ECS service
4. **Set up database backups** (RDS automated backups)
5. **Configure monitoring** (CloudWatch dashboards)
6. **Implement CI/CD testing** (add test stage before deploy)

---

## Support

- **AWS Amplify Docs:** https://docs.amplify.aws/
- **AWS ECS Docs:** https://docs.aws.amazon.com/ecs/
- **GitHub Actions Docs:** https://docs.github.com/actions
- **Prisma Deployment:** https://www.prisma.io/docs/guides/deployment

---

**Ready to deploy!** Choose your preferred method and follow the steps above. 🚀
