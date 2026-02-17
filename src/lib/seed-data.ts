/**
 * Seed data for demo mode
 * Contains 5 fintech companies with realistic signals, feedback, and website content
 */

export interface SeedCompany {
  name: string;
  domain: string;
  country: string;
  description: string;
  employeeCount: string;
  foundedYear: string;
  websiteText: string;
  careersPageText: string;
  feedback: SeedFeedback[];
  fundingEvents: SeedFunding[];
}

export interface SeedFeedback {
  source: string;
  quote: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  url?: string;
}

export interface SeedFunding {
  type: string;
  amount: string;
  date: string;
  investors: string;
  announcement: string;
}

export const SEED_COMPANIES: SeedCompany[] = [
  {
    name: 'PayFlow',
    domain: 'payflow.example.com',
    country: 'USA',
    description: 'B2B payment processing platform for SMBs',
    employeeCount: '50-200',
    foundedYear: '2021',
    websiteText: `
      PayFlow - Modern Payment Processing for Growing Businesses
      
      We help small and medium businesses accept payments faster and easier.
      Our platform provides:
      - Instant payment processing with 99.9% uptime
      - Support for all major payment methods
      - Real-time analytics and reporting dashboard
      - Automated reconciliation and accounting integrations
      - PCI-DSS Level 1 certified infrastructure
      
      Trusted by over 5,000 businesses processing $500M annually.
      
      Our API-first approach makes integration simple. Get started in minutes
      with our developer-friendly documentation and SDKs for all major platforms.
      
      Security and compliance are built into everything we do. SOC2 Type II certified.
    `,
    careersPageText: `
      Join Our Team - We're Hiring!
      
      Open Positions:
      - Senior Backend Engineer (Python/Go) - Remote
      - Platform Security Engineer - San Francisco
      - Product Manager, Payments - Remote
      - Customer Success Manager - New York
      - Senior Frontend Engineer (React) - Remote
      - DevOps Engineer (AWS/Kubernetes) - Remote
      
      We're a fast-growing fintech startup backed by top VCs. Our team is
      passionate about making payments simple for businesses everywhere.
    `,
    feedback: [
      {
        source: 'G2',
        quote: 'The initial setup was confusing. Documentation could be better. Took our dev team 3 days to integrate when we expected 1 day.',
        sentiment: 'negative',
        url: 'g2.com/products/payflow/reviews',
      },
      {
        source: 'G2',
        quote: 'Onboarding process was painful. Had to submit same KYC documents multiple times. Customer support was slow to respond.',
        sentiment: 'negative',
      },
      {
        source: 'Trustpilot',
        quote: 'Transaction dashboards are great but the reporting features are limited. We need more customization options for our accounting team.',
        sentiment: 'neutral',
      },
      {
        source: 'Trustpilot',
        quote: 'Had issues with their API going down twice last month. Each outage lasted 2-3 hours. This is unacceptable for payment processing.',
        sentiment: 'negative',
      },
      {
        source: 'G2',
        quote: 'Love PayFlow but wish they had better support for international payments. Limited currency support is holding us back.',
        sentiment: 'neutral',
      },
      {
        source: 'Capterra',
        quote: 'The mobile app needs work. Lots of bugs and crashes. Desktop version is solid though.',
        sentiment: 'negative',
      },
      {
        source: 'G2',
        quote: 'Customer support is hit or miss. Sometimes great, sometimes we wait days for a response on critical issues.',
        sentiment: 'negative',
      },
      {
        source: 'Trustpilot',
        quote: 'Compliance reporting is manual and time-consuming. Would love automated regulatory reports.',
        sentiment: 'negative',
      },
      {
        source: 'G2',
        quote: 'Great product overall. Pricing is competitive and features are solid. Main issue is the steep learning curve.',
        sentiment: 'positive',
      },
      {
        source: 'Capterra',
        quote: 'Integration with our accounting software was rocky. Had to build custom connectors ourselves.',
        sentiment: 'negative',
      },
    ],
    fundingEvents: [
      {
        type: 'Series A',
        amount: '$15M',
        date: '2024-11-01',
        investors: 'Sequoia Capital, Y Combinator',
        announcement: 'PayFlow raises $15M Series A to expand payment infrastructure and hire engineering talent.',
      },
    ],
  },
  {
    name: 'LendTech Solutions',
    domain: 'lendtech.example.com',
    country: 'UK',
    description: 'Digital lending platform for consumer and business loans',
    employeeCount: '100-500',
    foundedYear: '2019',
    websiteText: `
      LendTech Solutions - Digital Lending Made Simple
      
      We power digital lending for banks and fintechs worldwide.
      
      Our platform offers:
      - Automated loan origination and underwriting
      - Real-time credit decisioning powered by ML
      - Configurable loan products and workflows
      - Regulatory compliance automation (UK FCA, EU regulations)
      - Borrower portal with digital document signing
      
      Processing over £2B in loan applications annually for 50+ financial institutions.
      
      Built on modern cloud infrastructure for scale and reliability.
      Our risk models continuously learn and improve.
    `,
    careersPageText: `
      Careers at LendTech
      
      We're expanding rapidly and looking for talented individuals:
      
      Current Openings:
      - Lead ML Engineer (Credit Risk) - London
      - Senior Full Stack Developer - Remote (UK/EU)
      - Compliance Manager - London
      - Sales Engineer - Remote
      - QA Automation Engineer - Remote
      - Data Engineer (AWS) - London
    `,
    feedback: [
      {
        source: 'G2',
        quote: 'Our customers complain about the loan application process being too long. Takes 15-20 minutes when competitors do it in 5.',
        sentiment: 'negative',
      },
      {
        source: 'Capterra',
        quote: 'The decisioning engine is powerful but the UI for configuring rules is not intuitive. Our ops team struggles with it.',
        sentiment: 'negative',
      },
      {
        source: 'TrustRadius',
        quote: 'KYC verification process causes significant drop-off. Many applicants abandon during identity verification.',
        sentiment: 'negative',
      },
      {
        source: 'G2',
        quote: 'Missing integration with several key credit bureaus. Had to build custom connections which was expensive.',
        sentiment: 'negative',
      },
      {
        source: 'Trustpilot',
        quote: 'Reporting and analytics are basic. We need more detailed cohort analysis and portfolio performance metrics.',
        sentiment: 'neutral',
      },
      {
        source: 'G2',
        quote: 'Document collection and verification is clunky. Borrowers have to upload same documents multiple times if there are any issues.',
        sentiment: 'negative',
      },
      {
        source: 'Capterra',
        quote: 'Customer support for end borrowers is limited. We had to build our own support system on top.',
        sentiment: 'negative',
      },
      {
        source: 'G2',
        quote: 'The platform is solid but customization is limited. Hard to differentiate our loan products from competitors using the same platform.',
        sentiment: 'neutral',
      },
      {
        source: 'TrustRadius',
        quote: 'Compliance updates are slow. When regulations change, it takes them weeks to update the platform.',
        sentiment: 'negative',
      },
      {
        source: 'G2',
        quote: 'Mobile experience is poor. Most loan applications happen on mobile but their mobile UI is not optimized.',
        sentiment: 'negative',
      },
      {
        source: 'Capterra',
        quote: 'API documentation is incomplete. Our developers had to reverse-engineer several endpoints.',
        sentiment: 'negative',
      },
    ],
    fundingEvents: [
      {
        type: 'Series B',
        amount: '£25M',
        date: '2025-01-15',
        investors: 'Index Ventures, Balderton Capital',
        announcement: 'LendTech closes £25M Series B to expand across Europe and enhance AI-powered underwriting.',
      },
    ],
  },
  {
    name: 'WealthHub',
    domain: 'wealthhub.example.com',
    country: 'Canada',
    description: 'Robo-advisory and wealth management platform',
    employeeCount: '20-50',
    foundedYear: '2022',
    websiteText: `
      WealthHub - Intelligent Wealth Management for Everyone
      
      Automated investing made simple with our robo-advisory platform.
      
      Features:
      - Personalized portfolio recommendations
      - Tax-loss harvesting automation
      - Low fees (0.25% management fee)
      - Fractional shares and auto-rebalancing
      - Financial planning tools and calculators
      - Mobile-first experience
      
      Trusted by 10,000+ investors managing $200M in assets.
      
      CIPF protected and registered with Canadian securities regulators.
    `,
    careersPageText: `
      Join WealthHub - We're Growing!
      
      Open Roles:
      - Senior Software Engineer (Full Stack) - Toronto
      - Investment Operations Analyst - Remote
      - Marketing Manager - Toronto
      - Mobile Developer (iOS/Android) - Remote
    `,
    feedback: [
      {
        source: 'Trustpilot',
        quote: 'Account opening took 5 days. Competitor apps get you started in 24 hours. Very frustrating delay.',
        sentiment: 'negative',
      },
      {
        source: 'App Store',
        quote: 'App crashes frequently when trying to view portfolio performance. Had to reinstall twice this month.',
        sentiment: 'negative',
      },
      {
        source: 'Google Play',
        quote: 'The portfolio recommendations are too generic. Would love more customization based on my specific goals and risk tolerance.',
        sentiment: 'neutral',
      },
      {
        source: 'Trustpilot',
        quote: 'Tax reporting is confusing. Needed to hire an accountant to understand the tax documents they provide.',
        sentiment: 'negative',
      },
      {
        source: 'App Store',
        quote: 'Customer service is slow. Submitted a question about tax-loss harvesting and waited a week for response.',
        sentiment: 'negative',
      },
      {
        source: 'Trustpilot',
        quote: 'Love the concept but the educational content is lacking. New investors need more guidance.',
        sentiment: 'neutral',
      },
      {
        source: 'Google Play',
        quote: 'Rebalancing notifications are annoying and can\'t be customized. Getting alerts I don\'t need.',
        sentiment: 'negative',
      },
      {
        source: 'Trustpilot',
        quote: 'Dashboard is clean but I want more detailed analytics. Show me sector allocation, dividend yield, etc.',
        sentiment: 'neutral',
      },
      {
        source: 'App Store',
        quote: 'Deposits take too long to be invested. Money sits uninvested for 2-3 days.',
        sentiment: 'negative',
      },
      {
        source: 'Trustpilot',
        quote: 'No option for socially responsible investing. This is a must-have feature in 2026.',
        sentiment: 'negative',
      },
    ],
    fundingEvents: [
      {
        type: 'Seed',
        amount: 'CAD $3M',
        date: '2023-06-01',
        investors: 'BDC Capital, N49P',
        announcement: 'WealthHub secures $3M seed funding to build robo-advisory platform for Canadian millennials.',
      },
    ],
  },
  {
    name: 'CryptoGate',
    domain: 'cryptogate.example.com',
    country: 'Singapore',
    description: 'Cryptocurrency exchange and wallet platform',
    employeeCount: '200-500',
    foundedYear: '2020',
    websiteText: `
      CryptoGate - Your Gateway to Digital Assets
      
      Trade, store, and manage cryptocurrency with confidence.
      
      Platform Features:
      - 150+ cryptocurrencies supported
      - Advanced trading with spot and futures
      - Institutional-grade cold storage
      - Staking and yield earning opportunities
      - Licensed and regulated in Singapore (MAS)
      - 24/7 customer support
      
      1M+ users trading $5B+ monthly volume.
      
      Security is our priority: multi-sig wallets, 2FA, withdrawal whitelist.
    `,
    careersPageText: `
      Build the Future of Finance at CryptoGate
      
      We're hiring across multiple teams:
      
      Engineering:
      - Staff Security Engineer - Singapore
      - Senior Blockchain Engineer - Remote
      - Platform Reliability Engineer (SRE) - Singapore
      - Frontend Engineer (React/TypeScript) - Remote
      
      Operations:
      - Compliance Officer - Singapore
      - Risk Manager - Singapore
      - Customer Support Lead - Remote
      
      Product:
      - Senior Product Manager (Trading) - Singapore
    `,
    feedback: [
      {
        source: 'Trustpilot',
        quote: 'KYC verification is a nightmare. Submitted documents 3 times and still pending after 2 weeks. Lost money because I couldn\'t trade.',
        sentiment: 'negative',
      },
      {
        source: 'Reddit',
        quote: 'Withdrawal times are unpredictable. Sometimes instant, sometimes 24+ hours. No transparency on why.',
        sentiment: 'negative',
      },
      {
        source: 'Trustpilot',
        quote: 'App went down during high volatility. Classic. Could not access my account for 4 hours when I needed to sell.',
        sentiment: 'negative',
      },
      {
        source: 'Google Play',
        quote: 'Customer support is terrible. Tickets take days to get a response. Live chat is always "offline".',
        sentiment: 'negative',
      },
      {
        source: 'Trustpilot',
        quote: 'Fees are not transparent. Hidden fees on withdrawals that aren\'t shown clearly upfront.',
        sentiment: 'negative',
      },
      {
        source: 'App Store',
        quote: 'Two-factor authentication is buggy. Sometimes codes don\'t work and I get locked out of my account.',
        sentiment: 'negative',
      },
      {
        source: 'Trustpilot',
        quote: 'The staking UI is confusing. Unstaked by accident and lost rewards. Poor UX design.',
        sentiment: 'negative',
      },
      {
        source: 'Reddit',
        quote: 'No proper API rate limiting documentation. Our trading bot got banned without warning.',
        sentiment: 'negative',
      },
      {
        source: 'Google Play',
        quote: 'Charting tools are basic. Need TradingView integration or better technical analysis features.',
        sentiment: 'neutral',
      },
      {
        source: 'Trustpilot',
        quote: 'Account security features are good but setting them up is complicated. Better onboarding needed.',
        sentiment: 'neutral',
      },
      {
        source: 'App Store',
        quote: 'Fiat on-ramp options are limited. Can\'t use my preferred payment method.',
        sentiment: 'negative',
      },
      {
        source: 'Trustpilot',
        quote: 'Tax reporting is a mess. They don\'t provide proper cost basis calculations. Had to use third-party tools.',
        sentiment: 'negative',
      },
    ],
    fundingEvents: [
      {
        type: 'Series C',
        amount: '$50M',
        date: '2024-09-20',
        investors: 'Sequoia India, Lightspeed Venture Partners',
        announcement: 'CryptoGate raises $50M Series C to expand across Asia-Pacific and enhance institutional trading products.',
      },
    ],
  },
  {
    name: 'BizBank',
    domain: 'bizbank.example.com',
    country: 'USA',
    description: 'Digital banking platform for small businesses',
    employeeCount: '150-300',
    foundedYear: '2020',
    websiteText: `
      BizBank - Banking Built for Small Business
      
      Modern business banking with the tools you need to grow.
      
      What We Offer:
      - Business checking and savings accounts
      - Integrated invoicing and payments
      - Corporate credit cards with rewards
      - Expense management and categorization
      - Accounting software integrations (QuickBooks, Xero)
      - Multi-user access with role permissions
      - FDIC insured up to $250,000
      
      Serving 50,000+ small businesses across America.
      
      No monthly fees. No minimum balance. No hidden charges.
    `,
    careersPageText: `
      Careers at BizBank
      
      Join us in reshaping small business banking:
      
      Current Opportunities:
      - Senior Backend Engineer (Java/Spring) - New York
      - Product Designer - Remote
      - Risk & Compliance Analyst - New York
      - Business Development Manager - San Francisco
      - Senior Mobile Engineer (React Native) - Remote
      - Data Scientist - New York
      - Customer Success Manager - Remote
      - DevOps Engineer - Remote
    `,
    feedback: [
      {
        source: 'Trustpilot',
        quote: 'Business verification process is lengthy. Took 3 weeks to open an account. We needed banking immediately.',
        sentiment: 'negative',
      },
      {
        source: 'G2',
        quote: 'The invoicing feature constantly has sync issues with QuickBooks. Data doesn\'t match and creates accounting headaches.',
        sentiment: 'negative',
      },
      {
        source: 'Capterra',
        quote: 'Mobile app lacks key features that desktop has. Can\'t approve ACH transfers from mobile which is inconvenient.',
        sentiment: 'negative',
      },
      {
        source: 'Trustpilot',
        quote: 'Customer support for fraud issues is poor. Card got compromised and took 48 hours to get a response.',
        sentiment: 'negative',
      },
      {
        source: 'G2',
        quote: 'Multi-user permissions are too restrictive. Can\'t give my accountant read-only access to specific accounts.',
        sentiment: 'negative',
      },
      {
        source: 'Capterra',
        quote: 'Reporting features are basic. Need better cash flow forecasting and financial analytics.',
        sentiment: 'neutral',
      },
      {
        source: 'Trustpilot',
        quote: 'ACH transfers are slow. Takes 3 business days when competitors offer same-day or next-day.',
        sentiment: 'negative',
      },
      {
        source: 'G2',
        quote: 'The expense categorization AI is inaccurate. Constantly have to manually recategorize transactions.',
        sentiment: 'negative',
      },
      {
        source: 'Trustpilot',
        quote: 'No physical locations or ATM network. Sometimes you need to deposit cash or checks in person.',
        sentiment: 'negative',
      },
      {
        source: 'Capterra',
        quote: 'International wire transfers are complicated and expensive. Better FX rates needed.',
        sentiment: 'negative',
      },
      {
        source: 'G2',
        quote: 'Account alerts are too aggressive. Getting spammed with notifications for every $5 transaction.',
        sentiment: 'negative',
      },
    ],
    fundingEvents: [
      {
        type: 'Series B',
        amount: '$40M',
        date: '2025-02-01',
        investors: 'Ribbit Capital, Andreessen Horowitz',
        announcement: 'BizBank secures $40M Series B to expand product suite and grow engineering team.',
      },
    ],
  },
];

/**
 * Get seed company by domain
 */
export function getSeedCompanyByDomain(domain: string): SeedCompany | undefined {
  return SEED_COMPANIES.find(c => c.domain.toLowerCase() === domain.toLowerCase());
}

/**
 * Get seed company by name (fuzzy match)
 */
export function getSeedCompanyByName(name: string): SeedCompany | undefined {
  const normalizedName = name.toLowerCase().trim();
  if (!normalizedName) return undefined; // Guard against empty string matching everything
  return SEED_COMPANIES.find(c => 
    c.name.toLowerCase().includes(normalizedName) || 
    normalizedName.includes(c.name.toLowerCase())
  );
}

/**
 * Get all seed company domains
 */
export function getAllSeedDomains(): string[] {
  return SEED_COMPANIES.map(c => c.domain);
}
