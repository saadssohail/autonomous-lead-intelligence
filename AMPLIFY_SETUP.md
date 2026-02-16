# AWS Amplify SSR Setup Guide

This guide shows how to connect your GitHub repo to AWS Amplify for automatic SSR deployments.

## Prerequisites

✅ RDS database already created (via CloudFormation)  
✅ GitHub repo pushed to GitHub  
✅ AWS account with Amplify access

## Step 1: Connect GitHub Repository

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click **"New app"** → **"Host web app"**
3. Select **GitHub** as the source
4. Authorize AWS Amplify to access your repositories
5. Select repository: `Autonomous Lead Intelligence`
6. Select branch: `main` (or `staging`)
7. Click **Next**

## Step 2: Configure Build Settings

Amplify should auto-detect `amplify.yml`. Verify the settings:

**App name:** `autonomous-lead-intelligence`  
**Build specification:** Use `amplify.yml` from repo  
**Framework:** Next.js - SSR

Click **Next**

## Step 3: Add Environment Variables

In the **Environment variables** section, add:

| Variable | Value | Where to get it |
|----------|-------|-----------------|
| `DATABASE_URL` | `postgresql://postgres:...@...rds.amazonaws.com:5432/autonomo` | Run workflow or CloudFormation output (URL-encoded) |
| `OPENAI_API_KEY` | Your OpenAI API key | OpenAI dashboard |
| `DEMO_MODE` | `false` | - |

**Get DATABASE_URL:**
```bash
# From CloudFormation (then URL-encode the password)
aws cloudformation describe-stacks \
  --stack-name "lead-intelligence-db" \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`DatabaseURL`].OutputValue' \
  --output text
```

Then URL-encode special characters in password:
```bash
# PowerShell
$password = 'your-password-here'
$encoded = [System.Uri]::EscapeDataString($password)
Write-Host "postgresql://postgres:${encoded}@host:5432/autonomo"
```

## Step 4: Configure Platform

⚠️ **IMPORTANT:** Select **Next.js SSR** platform, NOT static hosting.

In **Advanced settings**:
- **Platform:** Web Compute (Next.js SSR)
- **Node version:** 18
- **Build timeout:** 30 minutes

## Step 5: Save and Deploy

1. Click **Save and deploy**
2. Amplify will:
   - Clone your repo
   - Install dependencies
   - Run Prisma migrations (`prisma db push`)
   - Build Next.js app
   - Deploy to SSR hosting
   - Provide a URL: `https://main.d2blib9wz7akmb.amplifyapp.com`

## Step 6: Verify Deployment

Once deployed:

1. Visit the Amplify URL
2. Test the homepage
3. Try analyzing an account (requires OpenAI API key)
4. Check `/api/briefs` endpoint works

## Auto-Deployment

Now every push to `main` branch will:
1. Trigger GitHub Actions (runs tests, ensures DB exists)
2. Trigger Amplify auto-deployment
3. Build and deploy your app

## Troubleshooting

### Build fails with "invalid port number"

Your `DATABASE_URL` has special characters that need URL-encoding. See Step 3.

### "Module not found" errors

Run locally to verify:
```bash
npm ci --legacy-peer-deps
npx prisma generate
npm run build
```

### Database connection fails

1. Check security group allows Amplify IPs (currently set to `0.0.0.0/0`)
2. Verify DATABASE_URL is correct in environment variables
3. Check RDS instance is publicly accessible

### API routes return 404

Make sure platform is set to **Web Compute (Next.js SSR)**, not static hosting.

## Clean Up Pending Deployments

If you have pending deployments from manual attempts:

```bash
# List jobs
aws amplify list-jobs --app-id d2blib9wz7akmb --branch-name staging

# Stop pending jobs
aws amplify stop-job --app-id d2blib9wz7akmb --branch-name staging --job-id <JOB_ID>
```

---

**You're done!** 🎉

Push to `main` and watch Amplify auto-deploy your SSR app.
