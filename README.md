# Autonomous Lead Intelligence

AI-powered customer pain intelligence agent for fintech sales teams. Analyzes public signals, detects buying signals via reasoning, and generates structured lead briefs with outreach recommendations.

## 🎯 Overview

This MVP demonstrates an end-to-end intelligence pipeline that:
- Discovers and enriches fintech companies
- Extracts signals (funding, hiring, technical indicators)
- Detects dominant customer pain themes from feedback
- Generates reasoning chains (Observation → Inference → Opportunity)
- Maps pain points to Alfabolt delivery capabilities
- Produces prioritized account briefs with "why now" and outreach messages

**Target**: < 1 minute per company analysis

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- (Optional) OpenAI API key for LLM features

### Installation

**Easy Setup (Recommended)**:
```bash
# One command to set everything up
npm run setup
```

**Manual Setup**:
```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Initialize database
npx prisma generate
npx prisma db push

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Demo Mode

The app works **without any API keys** using built-in seed data and deterministic mock reasoning.

**Try these example companies:**
- PayFlow
- LendTech Solutions
- WealthHub
- CryptoGate
- BizBank

## 📋 Features

### Core Capabilities

✅ **Signal Detection**
- Funding events (Series A/B/C, amounts, investors)
- Hiring signals (open roles, team expansion)
- Technical indicators (API mentions, scalability, security)
- Product launch signals

✅ **Pain Theme Analysis**
- Automated detection from customer feedback
- Severity scoring (0-10)
- Category classification (onboarding, compliance, integrations, etc.)
- Supporting evidence extraction

✅ **Reasoning Engine**
- Explicit Observation → Inference → Opportunity chains
- Confidence scoring (high/medium/low)
- Buying signal detection
- Opportunity assessment

✅ **Capability Mapping**
- Match pain themes to Alfabolt delivery capabilities
- Relevance scoring
- "Why Alfabolt" generation with proof points

✅ **Lead Scoring**
- Weighted scoring: Pain Severity (40%) + Signal Strength (40%) + Fit (20%)
- Explainable rationale with bullet reasons
- Prioritized account ranking

✅ **Outreach Generation**
- Personalized "why now" statements
- Recommended outreach angles
- Professional opening messages

### UI Features

📊 **Three Main Pages**
1. **Home**: Overview and quick navigation
2. **Analyze Company**: Input domain/name → Generate brief
3. **Prioritized Accounts**: Sortable list of all analyzed companies

**UI Highlights:**
- Real-time pipeline progress tracking
- Downloadable JSON briefs
- Score breakdowns with rationale
- Dark mode fintech-themed design
- Loading states and error handling

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Backend**: Next.js API Routes (TypeScript)
- **Database**: SQLite with Prisma ORM
- **LLM**: OpenAI GPT-4 with mock fallback
- **Connectors**: JSDOM for website parsing, Axios for HTTP

### Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts      # POST /api/analyze
│   │   ├── briefs/route.ts       # GET /api/briefs
│   │   └── briefs/[id]/route.ts  # GET /api/briefs/:id
│   ├── analyze/page.tsx          # Analysis UI
│   ├── accounts/page.tsx         # Account list UI
│   └── briefs/[id]/page.tsx      # Brief detail UI
├── lib/
│   ├── pipeline.ts               # Core analysis pipeline
│   ├── llm-provider.ts           # LLM abstraction (OpenAI + Mock)
│   ├── capabilities.ts           # Capability catalog
│   ├── seed-data.ts              # Demo company data
│   └── prisma.ts                 # Database client
├── types/
│   └── index.ts                  # TypeScript types & schemas
prisma/
└── schema.prisma                 # Database schema
```

### Pipeline Flow

```
Input (company name/domain)
  ↓
1. Fetch Website → Extract text content
  ↓
2. Load Feedback → Gather customer reviews/feedback
  ↓
3. Extract Signals → Funding, hiring, technical indicators
  ↓
4. Detect Pain Themes → LLM analysis of feedback
  ↓
5. Generate Reasoning Chains → Observation → Inference → Opportunity
  ↓
6. Map to Capabilities → Match pain themes to delivery capabilities
  ↓
7. Generate Outputs → Why Now, Why Alfabolt, Outreach Message
  ↓
8. Calculate Score → Weighted scoring with rationale
  ↓
Output: Complete Brief + Logs
```

## 📊 Data Model

### Core Entities

**Company**
- name, domain, country, industry
- sourcesUsed (website, feedback, etc.)

**Signal**
- type: funding | hiring | expansion | product_launch | technical
- evidenceText, url, strength (high/medium/low)

**PainTheme**
- theme, category
- supportingEvidence array
- severityScore (0-10)

**Brief**
- Company snapshot
- Signals, Pain themes, Reasoning chains
- Score + rationale
- whyNow, whyAlfabolt, outreachAngle, openingMessage

**Run**
- Pipeline execution logs
- Timestamps and durations

## 🧪 Testing

```bash
# Run tests
npm test

# Tests coverage:
# - Lead scoring calculation
# - Capability matching
# - Reasoning chain schema validation
```

## 🎨 Customization

### Adding Capabilities

Edit `src/lib/capabilities.ts`:

```typescript
{
  id: 'new-capability',
  name: 'Capability Name',
  summary: 'What we do',
  keywords: ['keyword1', 'keyword2'],
  proofPoints: ['Achievement 1', 'Achievement 2'],
  typicalEngagements: ['Engagement type 1']
}
```

### Adding Seed Companies

Edit `src/lib/seed-data.ts` to add more demo companies with:
- Company profile
- Website text
- Careers page text
- 8-15 feedback items
- 1-3 funding events

### LLM Provider

**Using OpenAI:**
```bash
# In .env
OPENAI_API_KEY=sk-...
DEMO_MODE=false
```

**Using Mock (default):**
```bash
DEMO_MODE=true
```

## 🔍 API Reference

### POST /api/analyze

Analyze a company and generate intelligence brief.

**Request:**
```json
{
  "company": {
    "name": "PayFlow",  // OR
    "domain": "payflow.example.com"
  },
  "options": {
    "useLiveData": false  // true = fetch real website
  }
}
```

**Response:**
```json
{
  "success": true,
  "brief": { /* Full Brief object */ },
  "run": { /* Pipeline execution logs */ }
}
```

### GET /api/briefs

List all analyzed companies.

**Query params:**
- `limit` (default: 50)
- `offset` (default: 0)
- `sortBy`: score | createdAt
- `sortOrder`: asc | desc

### GET /api/briefs/:id

Get full brief by ID.

## 📈 Performance

**Target**: < 1 minute per company

**Typical Performance (Demo Mode):**
- Website fetch: ~100ms (using seed data)
- Feedback load: ~50ms
- Signal extraction: ~100ms
- Pain detection: ~200ms (mock) / ~2-4s (LLM)
- Reasoning: ~300ms (mock) / ~3-5s (LLM)
- Total: **~1-2 seconds (mock)** | **~10-15 seconds (LLM)**

**Pipeline logging** provides step-by-step timing for monitoring.

## 📝 Assumptions & Design Decisions

### Scope Decisions

✅ **Included:**
- Fintech vertical focus
- 5 seed companies with rich data
- Mock LLM for demo reliability
- Simple weighted scoring
- SQLite for simplicity

❌ **Not Included (Non-goals):**
- Multi-industry support
- 5+ data source integrations
- Production authentication
- Multi-tenant architecture
- Advanced RAG pipelines
- Real-time data connectors (G2, Trustpilot APIs)

### Key Assumptions

1. **Demo-First**: Optimized for hackathon demo, not production scale
2. **Seed Data**: Realistic but fictional companies and feedback
3. **Fintech Only**: Vertical-specific capability catalog
4. **Deterministic Fallback**: Mock reasoning ensures demo always works
5. **Single User**: No auth, sessions, or multi-user support
6. **JSON Storage**: Pain themes, signals stored as JSON in SQLite

## 🚧 Future Enhancements

**Short-term:**
- [ ] Batch analysis (multiple companies at once)
- [ ] Export to CSV/PDF
- [ ] More detailed pipeline progress UI
- [ ] Additional seed companies
- [ ] More capability categories

**Long-term:**
- [ ] Live data connectors (G2, Crunchbase, LinkedIn)
- [ ] Email integration for outreach
- [ ] CRM integration (Salesforce, HubSpot)
- [ ] Team collaboration features
- [ ] Historical tracking (score changes over time)
- [ ] Automated lead monitoring (weekly refresh)

## 🤝 Contributing

This is a hackathon MVP. For production use, consider:
- Adding authentication
- Implementing rate limiting
- Switching to PostgreSQL for production
- Adding comprehensive test coverage
- Implementing proper error monitoring
- Adding data validation and sanitization

## 📄 License

MIT

## 🙋 Support

For questions or issues:
1. Check the seed data examples in `/src/lib/seed-data.ts`
2. Review pipeline logs in the UI
3. Check console for detailed error messages

---

**Built for the Alfabolt Hackathon 2026** 🚀
