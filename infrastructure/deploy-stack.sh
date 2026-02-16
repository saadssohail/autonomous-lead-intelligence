#!/bin/bash
# Deploy or update RDS CloudFormation stack

set -e

STACK_NAME="${STACK_NAME:-lead-intelligence-db}"
REGION="${AWS_REGION:-us-east-1}"
DB_PASSWORD="${DB_PASSWORD:-}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Deploying RDS Database Stack${NC}"
echo "Stack Name: $STACK_NAME"
echo "Region: $REGION"
echo ""

# Check if stack exists
if aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" > /dev/null 2>&1; then
    echo -e "${YELLOW}📦 Stack already exists - updating...${NC}"
    
    # Update existing stack
    aws cloudformation update-stack \
        --stack-name "$STACK_NAME" \
        --template-body file://infrastructure/rds-database.yml \
        --parameters \
            ParameterKey=Environment,ParameterValue=production \
            ParameterKey=DBInstanceClass,ParameterValue=db.t3.micro \
            ParameterKey=DBAllocatedStorage,ParameterValue=20 \
            ParameterKey=DBMasterUsername,ParameterValue=postgres \
            ParameterKey=DBMasterPassword,UsePreviousValue=true \
            ParameterKey=DBName,ParameterValue=autonomo \
            ParameterKey=AllowedCIDR,ParameterValue=0.0.0.0/0 \
        --region "$REGION" || {
            if [[ $? -eq 254 ]]; then
                echo -e "${YELLOW}ℹ️  No updates to perform${NC}"
            else
                echo -e "${RED}❌ Stack update failed${NC}"
                exit 1
            fi
        }
else
    echo -e "${GREEN}✨ Creating new stack...${NC}"
    
    # Validate DB password is provided
    if [ -z "$DB_PASSWORD" ]; then
        echo -e "${RED}❌ Error: DB_PASSWORD environment variable must be set for new stack creation${NC}"
        echo "Example: export DB_PASSWORD=YourSecurePassword123"
        exit 1
    fi
    
    # Create new stack
    aws cloudformation create-stack \
        --stack-name "$STACK_NAME" \
        --template-body file://infrastructure/rds-database.yml \
        --parameters \
            ParameterKey=Environment,ParameterValue=production \
            ParameterKey=DBInstanceClass,ParameterValue=db.t3.micro \
            ParameterKey=DBAllocatedStorage,ParameterValue=20 \
            ParameterKey=DBMasterUsername,ParameterValue=postgres \
            ParameterKey=DBMasterPassword,ParameterValue="$DB_PASSWORD" \
            ParameterKey=DBName,ParameterValue=autonomo \
            ParameterKey=AllowedCIDR,ParameterValue=0.0.0.0/0 \
        --region "$REGION"
fi

echo ""
echo -e "${YELLOW}⏳ Waiting for stack operation to complete (this may take 5-10 minutes)...${NC}"

# Wait for stack to be ready
aws cloudformation wait stack-create-complete \
    --stack-name "$STACK_NAME" \
    --region "$REGION" 2>/dev/null || \
aws cloudformation wait stack-update-complete \
    --stack-name "$STACK_NAME" \
    --region "$REGION" 2>/dev/null || true

# Check final status
STATUS=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].StackStatus' \
    --output text)

if [[ "$STATUS" == *"COMPLETE"* ]]; then
    echo -e "${GREEN}✅ Stack deployment successful!${NC}"
    echo ""
    
    # Get outputs
    echo -e "${GREEN}📊 Stack Outputs:${NC}"
    aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --query 'Stacks[0].Outputs' \
        --output table
    
    # Get DATABASE_URL (raw from CloudFormation - may have unencoded password)
    DATABASE_URL_RAW=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --query 'Stacks[0].Outputs[?OutputKey==`DatabaseURL`].OutputValue' \
        --output text)
    
    # Extract components and URL-encode the password
    # Format: postgresql://user:password@host:port/database
    if [[ "$DATABASE_URL_RAW" =~ postgresql://([^:]+):([^@]+)@(.+) ]]; then
        USERNAME="${BASH_REMATCH[1]}"
        PASSWORD="${BASH_REMATCH[2]}"
        HOST_PORT_DB="${BASH_REMATCH[3]}"
        
        # URL-encode the password (handle special characters)
        PASSWORD_ENCODED=$(printf '%s' "$PASSWORD" | jq -sRr @uri)
        DATABASE_URL="postgresql://${USERNAME}:${PASSWORD_ENCODED}@${HOST_PORT_DB}"
    else
        DATABASE_URL="$DATABASE_URL_RAW"
    fi
    
    echo ""
    echo -e "${GREEN}🔗 DATABASE_URL (URL-encoded):${NC}"
    echo "$DATABASE_URL"
    echo ""
    echo -e "${YELLOW}⚠️  Add this to your GitHub Secrets as DATABASE_URL${NC}"
    echo -e "${YELLOW}⚠️  The password has been URL-encoded to handle special characters${NC}"
    
else
    echo -e "${RED}❌ Stack deployment failed with status: $STATUS${NC}"
    exit 1
fi
