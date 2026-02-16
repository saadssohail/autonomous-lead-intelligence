import type { DeliveryCapability } from '@/types';

/**
 * Hardcoded capability catalog for the hackathon MVP
 * Maps Alfabolt's delivery capabilities to pain themes and signals
 */
export const CAPABILITY_CATALOG: DeliveryCapability[] = [
  {
    id: 'fintech-engineering',
    name: 'Fintech Engineering Excellence',
    summary: 'End-to-end fintech product development and architecture',
    keywords: ['payment', 'banking', 'compliance', 'api', 'integration', 'scalability', 'security'],
    proofPoints: [
      'Built payment processing systems handling $100M+ annually for Nomod',
      'Fintech compliance implementations (PCI-DSS, SOC2)',
      'Real-time transaction monitoring and fraud detection systems',
    ],
    typicalEngagements: [
      'Payment gateway integration and optimization',
      'Banking API development',
      'Compliance automation systems',
      'Transaction processing pipelines',
    ],
  },
  {
    id: 'platform-modernization',
    name: 'Platform Modernization & Scale',
    summary: 'Modernize legacy systems and scale infrastructure',
    keywords: ['legacy', 'migration', 'cloud', 'infrastructure', 'performance', 'scalability', 'architecture'],
    proofPoints: [
      'Migrated monolithic banking platforms to microservices',
      'Reduced infrastructure costs by 40% through cloud optimization',
      'Scaled systems to handle 10x traffic growth',
    ],
    typicalEngagements: [
      'Legacy system modernization',
      'Cloud migration (AWS, Azure, GCP)',
      'Performance optimization',
      'Scalability engineering',
    ],
  },
  {
    id: 'customer-experience',
    name: 'Customer Experience Engineering',
    summary: 'Build seamless, intuitive customer-facing products',
    keywords: ['onboarding', 'ux', 'mobile', 'web', 'dashboard', 'user experience', 'conversion'],
    proofPoints: [
      'Redesigned onboarding flows increasing conversion by 35%',
      'Built mobile-first banking experiences with 4.8+ app store ratings',
      'Customer dashboard implementations improving engagement by 50%',
    ],
    typicalEngagements: [
      'Digital onboarding optimization',
      'Mobile app development',
      'Customer dashboard design and development',
      'UX research and implementation',
    ],
  },
  {
    id: 'data-analytics',
    name: 'Data & Analytics Engineering',
    summary: 'Turn data into actionable insights and automation',
    keywords: ['analytics', 'reporting', 'dashboard', 'insights', 'data', 'business intelligence', 'automation'],
    proofPoints: [
      'Built real-time analytics platforms processing 1M+ events/day',
      'Custom reporting systems reducing manual work by 80%',
      'ML-powered fraud detection reducing false positives by 60%',
    ],
    typicalEngagements: [
      'Analytics platform development',
      'Custom reporting and dashboards',
      'Data pipeline engineering',
      'Predictive analytics implementation',
    ],
  },
  {
    id: 'regulatory-compliance',
    name: 'Regulatory & Compliance Tech',
    summary: 'Automate compliance and reduce regulatory burden',
    keywords: ['compliance', 'kyc', 'aml', 'regulatory', 'audit', 'reporting', 'governance'],
    proofPoints: [
      'Automated KYC/AML workflows reducing review time by 70%',
      'Compliance reporting systems for multi-jurisdiction operations',
      'Audit trail implementations meeting regulatory requirements',
    ],
    typicalEngagements: [
      'KYC/AML automation',
      'Regulatory reporting automation',
      'Compliance monitoring systems',
      'Audit trail and documentation',
    ],
  },
  {
    id: 'integration-automation',
    name: 'Integration & Automation',
    summary: 'Connect systems and automate workflows',
    keywords: ['integration', 'api', 'automation', 'workflow', 'third-party', 'connector', 'webhook'],
    proofPoints: [
      'Integrated 20+ third-party services for fintech platforms',
      'Built custom API layers handling 1M+ requests/day',
      'Automated manual workflows saving 100+ hours/week',
    ],
    typicalEngagements: [
      'Third-party API integration',
      'Workflow automation',
      'Custom API development',
      'System integration architecture',
    ],
  },
];

/**
 * Get capabilities by matching keywords
 */
export function matchCapabilities(
  painThemes: string[],
  signals: string[],
  threshold: number = 0.3
): DeliveryCapability[] {
  const searchText = [...painThemes, ...signals].join(' ').toLowerCase();
  
  return CAPABILITY_CATALOG.filter(capability => {
    const keywordMatches = capability.keywords.filter(keyword =>
      searchText.includes(keyword.toLowerCase())
    );
    const relevanceScore = keywordMatches.length / capability.keywords.length;
    return relevanceScore >= threshold;
  });
}

/**
 * Calculate relevance score for a capability
 */
export function calculateCapabilityRelevance(
  capability: DeliveryCapability,
  painThemes: string[],
  signals: string[]
): number {
  const searchText = [...painThemes, ...signals].join(' ').toLowerCase();
  const keywordMatches = capability.keywords.filter(keyword =>
    searchText.includes(keyword.toLowerCase())
  );
  return keywordMatches.length / capability.keywords.length;
}
