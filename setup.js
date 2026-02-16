#!/usr/bin/env node

/**
 * Setup script for Autonomous Lead Intelligence MVP
 * Automates: dependency installation, database setup, environment configuration
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n🔄 ${description}...`, colors.blue);
  try {
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} completed`, colors.green);
    return true;
  } catch (error) {
    log(`❌ ${description} failed`, colors.red);
    return false;
  }
}

function setupEnvironment() {
  log('\n🔧 Setting up environment...', colors.blue);
  
  const envPath = path.join(__dirname, '.env');
  const envExamplePath = path.join(__dirname, '.env.example');
  
  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
      log('✅ Created .env file from .env.example', colors.green);
    } else {
      const defaultEnv = `# OpenAI API Key (optional - will use mock data if not provided)
OPENAI_API_KEY=

# Database
DATABASE_URL="file:./dev.db"

# App Config
DEMO_MODE=true
`;
      fs.writeFileSync(envPath, defaultEnv);
      log('✅ Created default .env file', colors.green);
    }
  } else {
    log('ℹ️  .env file already exists', colors.yellow);
  }
}

async function main() {
  log('\n🚀 Autonomous Lead Intelligence - Setup Script\n', colors.blue);
  log('This will install dependencies and set up the database.\n');
  
  // Step 1: Install dependencies
  if (!runCommand('npm install', 'Installing dependencies')) {
    log('\n⚠️  Dependency installation failed. Trying with --legacy-peer-deps...', colors.yellow);
    if (!runCommand('npm install --legacy-peer-deps', 'Installing dependencies (legacy mode)')) {
      log('\n❌ Failed to install dependencies. Please run manually: npm install', colors.red);
      process.exit(1);
    }
  }
  
  // Step 2: Setup environment
  setupEnvironment();
  
  // Step 3: Generate Prisma client
  if (!runCommand('npx prisma generate', 'Generating Prisma client')) {
    log('\n❌ Prisma client generation failed', colors.red);
    process.exit(1);
  }
  
  // Step 4: Create database
  if (!runCommand('npx prisma db push', 'Creating database')) {
    log('\n❌ Database creation failed', colors.red);
    process.exit(1);
  }
  
  // Success!
  log('\n' + '='.repeat(60), colors.green);
  log('✅ Setup completed successfully!', colors.green);
  log('='.repeat(60) + '\n', colors.green);
  
  log('📚 Quick Start:\n', colors.blue);
  log('  1. Start the development server:', colors.reset);
  log('     npm run dev\n', colors.yellow);
  log('  2. Open your browser:', colors.reset);
  log('     http://localhost:3000\n', colors.yellow);
  log('  3. Try analyzing one of these companies:', colors.reset);
  log('     - PayFlow', colors.yellow);
  log('     - LendTech Solutions', colors.yellow);
  log('     - WealthHub', colors.yellow);
  log('     - CryptoGate', colors.yellow);
  log('     - BizBank\n', colors.yellow);
  
  log('📖 Documentation:', colors.blue);
  log('  - README.md - Complete documentation', colors.reset);
  log('  - QUICKSTART.md - Step-by-step guide', colors.reset);
  log('  - PROJECT_SUMMARY.md - Architecture deep dive\n', colors.reset);
  
  log('🔑 Optional: Add OpenAI API Key', colors.blue);
  log('  Edit .env and set OPENAI_API_KEY=your-key', colors.reset);
  log('  (App works without it using demo mode)\n', colors.reset);
}

main().catch(error => {
  log(`\n❌ Setup failed: ${error.message}`, colors.red);
  process.exit(1);
});
