# Infrastructure as Code

This directory contains CloudFormation templates for deploying AWS infrastructure.

## Files

### `rds-database.yml`
CloudFormation template that creates:
- **VPC** with 2 public subnets across 2 availability zones
- **RDS PostgreSQL 15.4** instance (db.t3.micro)
- **Security Group** allowing PostgreSQL access (port 5432)
- **Automated backups** (7-day retention)
- **CloudWatch monitoring** and Performance Insights
- **Storage encryption** at rest

**Stack Name:** `lead-intelligence-db`

**Outputs:**
- `DatabaseURL` - Full PostgreSQL connection string
- `DBInstanceEndpoint` - RDS endpoint address
- `DBInstancePort` - Database port (5432)
- `DBName` - Database name (autonomo)
- `SecurityGroupId` - Security group ID
- `VPCId` - VPC ID

### `deploy-stack.sh`
Bash script to deploy or update the CloudFormation stack.

**Usage:**
```bash
# Set required environment variables
export DB_PASSWORD="YourSecurePassword123"
export AWS_REGION="us-east-1"
export STACK_NAME="lead-intelligence-db"

# Run deployment
chmod +x infrastructure/deploy-stack.sh
./infrastructure/deploy-stack.sh
```

**Features:**
- ✅ Idempotent (safe to run multiple times)
- ✅ Checks if stack exists before creating
- ✅ Waits for completion
- ✅ Displays outputs including DATABASE_URL
- ✅ Color-coded status messages

## Automatic Deployment

The GitHub Actions workflows automatically:
1. Check if CloudFormation stack exists
2. Create stack on first deployment (or skip if exists)
3. Retrieve DATABASE_URL from stack outputs
4. Use it for application build and migrations

**No manual database setup required!**

## Manual Deployment

If you prefer to deploy infrastructure separately:

### 1. Via AWS Console

1. Go to CloudFormation → Create stack
2. Upload `rds-database.yml`
3. Fill in parameters:
   - **Stack name:** `lead-intelligence-db`
   - **Environment:** `production`
   - **DBInstanceClass:** `db.t3.micro`
   - **DBMasterPassword:** Your secure password
4. Click through and Create
5. Wait ~10 minutes for creation
6. Copy `DatabaseURL` from Outputs tab

### 2. Via AWS CLI

```bash
aws cloudformation create-stack \
  --stack-name lead-intelligence-db \
  --template-body file://infrastructure/rds-database.yml \
  --parameters \
    ParameterKey=Environment,ParameterValue=production \
    ParameterKey=DBInstanceClass,ParameterValue=db.t3.micro \
    ParameterKey=DBMasterPassword,ParameterValue=YourPassword123 \
  --region us-east-1
```

### 3. Via Deployment Script

```bash
export DB_PASSWORD="YourPassword123"
./infrastructure/deploy-stack.sh
```

## Stack Outputs

After deployment, get the connection string:

```bash
# Get all outputs
aws cloudformation describe-stacks \
  --stack-name lead-intelligence-db \
  --query 'Stacks[0].Outputs' \
  --output table

# Get just the DATABASE_URL
aws cloudformation describe-stacks \
  --stack-name lead-intelligence-db \
  --query 'Stacks[0].Outputs[?OutputKey==`DatabaseURL`].OutputValue' \
  --output text
```

## Updating the Stack

To change parameters (e.g., upgrade instance class):

```bash
aws cloudformation update-stack \
  --stack-name lead-intelligence-db \
  --template-body file://infrastructure/rds-database.yml \
  --parameters \
    ParameterKey=DBInstanceClass,ParameterValue=db.t3.small \
    ParameterKey=DBMasterPassword,UsePreviousValue=true
```

Or just modify the template and re-run `deploy-stack.sh`.

## Deleting the Stack

⚠️ **Warning:** This will delete the database. Create a snapshot first!

```bash
# Create snapshot
aws rds create-db-snapshot \
  --db-instance-identifier lead-intelligence-db-db \
  --db-snapshot-identifier lead-intelligence-backup-$(date +%Y%m%d)

# Delete stack (with automatic snapshot)
aws cloudformation delete-stack \
  --stack-name lead-intelligence-db
```

**Note:** The stack has `DeletionPolicy: Snapshot` so a final snapshot is created automatically.

## Cost Estimation

**RDS PostgreSQL (db.t3.micro):**
- Instance: ~$15/month
- Storage (20GB gp3): ~$2/month
- Backups (20GB × 7 days): ~$2/month
- **Total: ~$19/month**

**Scale up options:**
- `db.t3.small`: ~$30/month
- `db.t3.medium`: ~$60/month

**Free Tier:** First 12 months include 750 hours/month of db.t3.micro

## Security Considerations

**Current Configuration:**
- ✅ Public subnet (accessible from internet)
- ✅ Security group restricts to port 5432 only
- ✅ Storage encrypted at rest
- ✅ SSL/TLS for connections supported

**Production Recommendations:**
1. **Restrict CIDR:** Change `AllowedCIDR` parameter from `0.0.0.0/0` to your specific IP range or VPC CIDR
2. **Private Subnet:** Move RDS to private subnet and access via VPN/Bastion
3. **Secrets Manager:** Store password in AWS Secrets Manager
4. **IAM Authentication:** Enable IAM database authentication
5. **Multi-AZ:** Enable Multi-AZ deployment for high availability

## Monitoring

**CloudWatch Logs** are enabled for:
- PostgreSQL logs
- Error logs
- Slow query logs

**Performance Insights** is enabled with 7-day retention.

View in AWS Console:
- RDS → Databases → lead-intelligence-db-db → Monitoring
- CloudWatch → Log groups → `/aws/rds/instance/lead-intelligence-db-db/postgresql`

## Troubleshooting

### Stack creation fails

**Check:**
- IAM user has all required permissions (CloudFormation, RDS, EC2, VPC)
- No conflicting VPC CIDR blocks
- Service limits not exceeded

**View errors:**
```bash
aws cloudformation describe-stack-events \
  --stack-name lead-intelligence-db \
  --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`]'
```

### Can't connect to database

**Check:**
1. Security group allows your IP: `0.0.0.0/0` or specific CIDR
2. RDS instance has `PubliclyAccessible: true`
3. VPC routing is configured correctly
4. Password is correct

**Test connection:**
```bash
# Get endpoint
ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name lead-intelligence-db \
  --query 'Stacks[0].Outputs[?OutputKey==`DBInstanceEndpoint`].OutputValue' \
  --output text)

# Test with psql
psql -h $ENDPOINT -U postgres -d autonomo
```

### Stack stuck in UPDATE_IN_PROGRESS

**If stack hangs for >30 minutes:**
```bash
# Cancel update
aws cloudformation cancel-update-stack \
  --stack-name lead-intelligence-db
```

---

**Need help?** See [DEPLOYMENT.md](../DEPLOYMENT.md) for full deployment guide.
