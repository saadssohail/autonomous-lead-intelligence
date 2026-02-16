# 🚀 Quick Start Guide

## Installation Steps

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Setup Database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Run the Application:**
   ```bash
   npm run dev
   ```

4. **Open Browser:**
   Visit [http://localhost:3000](http://localhost:3000)

## First Time Demo

### Try These Example Companies (Built-in Seed Data):

1. **PayFlow** - B2B payment processing platform
   - Pain Points: API documentation, onboarding issues, mobile app bugs
   - Recent Funding: $15M Series A

2. **LendTech Solutions** - Digital lending platform
   - Pain Points: Long loan applications, KYC drop-off, poor mobile UX
   - Recent Funding: £25M Series B

3. **WealthHub** - Robo-advisory platform
   - Pain Points: Slow account opening, app crashes, tax reporting confusion
   - Recent Funding: CAD $3M Seed

4. **CryptoGate** - Cryptocurrency exchange
   - Pain Points: KYC nightmare, withdrawal delays, app downtime
   - Recent Funding: $50M Series C

5. **BizBank** - Digital banking for small businesses
   - Pain Points: Slow verification, integration issues, basic reporting
   - Recent Funding: $40M Series B

## How to Analyze a Company

### Option 1: Use Company Name
1. Go to "Analyze Company" page
2. Select "Company Name" as input type
3. Enter: `PayFlow`
4. Click "Run Analysis"
5. Wait 10-30 seconds
6. View comprehensive intelligence brief

### Option 2: Use Domain
1. Select "Domain" as input type
2. Enter: `payflow.example.com`
3. Click "Run Analysis"

## What You'll Get

Each analysis generates:

✅ **Lead Score (0-100)** with breakdown:
- Pain Severity Score (0-40)
- Signal Strength Score (0-40)
- Fit Score (0-20)

✅ **Key Signals Detected:**
- Funding events with amounts
- Hiring signals (open roles)
- Technical indicators
- Product signals

✅ **Customer Pain Themes:**
- Theme name and category
- Severity score (0-10)
- Supporting evidence quotes

✅ **Reasoning Chains:**
- Observation → Inference → Opportunity
- Confidence level (high/medium/low)

✅ **Why Now Statement**
- Timing assessment based on signals

✅ **Why Alfabolt**
- Capability matches with proof points

✅ **Outreach Recommendations:**
- Recommended angle
- Personalized opening message

✅ **Pipeline Execution Logs:**
- Step-by-step timing
- Total execution time

## Viewing All Accounts

1. Click "Prioritized Accounts" from home
2. See all analyzed companies sorted by score
3. Toggle sorting by score or date
4. Click "View Full Brief" for details

## Downloading Briefs

On any results page, click **"Download JSON"** to export the complete intelligence brief.

## Using Without API Keys (Demo Mode)

The app works perfectly in **DEMO_MODE** without OpenAI API keys:
- Uses deterministic mock reasoning
- Processes seed data
- Generates realistic outputs
- Fast execution (1-2 seconds vs 10-15 seconds)

**Current setting:** Check `.env` file - `DEMO_MODE=true` is default

## Adding OpenAI Integration

To use real LLM reasoning:

1. Get OpenAI API key from [platform.openai.com](https://platform.openai.com)
2. Edit `.env` file:
   ```
   OPENAI_API_KEY=sk-your-key-here
   DEMO_MODE=false
   ```
3. Restart the dev server
4. Analysis will now use GPT-4 for reasoning

## Troubleshooting

### Database Not Found
```bash
npx prisma generate
npx prisma db push
```

### Port 3000 Already in Use
```bash
# Kill the process or specify different port
PORT=3001 npm run dev
```

### Dependencies Not Installing
```bash
npm install --legacy-peer-deps
```

### Can't See Results
- Check browser console for errors
- Verify database was created (`prisma/dev.db` file exists)
- Try one of the exact seed company names

## Running Tests

```bash
npm test
```

Tests cover:
- Lead scoring calculation
- Capability matching logic
- Reasoning chain validation
- Seed data structure

## Project Structure at a Glance

```
src/
├── app/              # Next.js pages and API routes
├── lib/              # Core business logic
│   ├── pipeline.ts       # Main analysis pipeline
│   ├── llm-provider.ts   # LLM integration
│   ├── capabilities.ts   # Capability catalog
│   └── seed-data.ts      # Demo companies
└── types/            # TypeScript definitions

prisma/
└── schema.prisma     # Database schema
```

## Next Steps

After getting familiar with the demo:

1. **Customize Capabilities**: Edit `src/lib/capabilities.ts` to match your services
2. **Add More Seed Data**: Extend `src/lib/seed-data.ts` with more companies
3. **Integrate Real APIs**: Add connectors for G2, Crunchbase, LinkedIn
4. **Export Features**: Implement CSV/PDF export for briefs
5. **Batch Analysis**: Add multi-company processing

## Support

- **Documentation**: See main `README.md`
- **Seed Data**: Check `src/lib/seed-data.ts` for examples
- **Pipeline Flow**: Review `src/lib/pipeline.ts`
- **Types**: All TypeScript types in `src/types/index.ts`

---

**Ready to analyze your first company?** Start with one of the 5 seed companies above! 🎯
