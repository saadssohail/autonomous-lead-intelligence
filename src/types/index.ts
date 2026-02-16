import { z } from 'zod';

// ============ Input Schemas ============

export const CompanyInputSchema = z.object({
  name: z.string().optional(),
  domain: z.string().optional(),
}).refine(data => data.name || data.domain, {
  message: "Either name or domain must be provided"
});

export const AnalyzeRequestSchema = z.object({
  company: CompanyInputSchema,
  options: z.object({
    useLiveData: z.boolean().optional(),
    sources: z.array(z.string()).optional(),
  }).optional(),
});

// ============ Domain Types ============

export interface CompanySnapshot {
  name: string;
  domain: string;
  country?: string;
  industry: string;
  description?: string;
  employeeCount?: string;
  foundedYear?: string;
}

export interface Signal {
  type: 'funding' | 'hiring' | 'expansion' | 'product_launch' | 'technical';
  evidenceText: string;
  url?: string;
  strength: 'low' | 'medium' | 'high';
  extractedAt: Date;
}

export interface FeedbackItem {
  source: string;
  quote: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  url?: string;
}

export interface PainTheme {
  theme: string;
  category: string; // onboarding, compliance, payment_reliability, etc.
  supportingEvidence: string[];
  severityScore: number; // 0-10
  affectedUserCount?: number;
}

export interface ReasoningChain {
  observation: string;
  inference: string;
  opportunity: string;
  confidence: 'low' | 'medium' | 'high';
}

export interface DeliveryCapability {
  id: string;
  name: string;
  summary: string;
  keywords: string[];
  proofPoints: string[];
  typicalEngagements: string[];
}

export interface CapabilityMatch {
  capability: DeliveryCapability;
  relevanceScore: number;
  matchedPainThemes: string[];
  matchedSignals: string[];
}

export interface LeadScore {
  total: number; // 0-100
  breakdown: {
    painSeverity: number;
    signalStrength: number;
    fitScore: number;
  };
  rationale: string[];
}

export interface Brief {
  id: string;
  companyId: string;
  score: LeadScore;
  snapshot: CompanySnapshot;
  signals: Signal[];
  painThemes: PainTheme[];
  reasoningChains: ReasoningChain[];
  whyNow: string;
  whyAlfabolt: string;
  capabilityMatches: CapabilityMatch[];
  outreachAngle: string;
  openingMessage: string;
  createdAt: Date;
}

export interface PipelineLog {
  step: string;
  status: 'started' | 'completed' | 'failed';
  timestamp: Date;
  duration?: number; // milliseconds
  details?: string;
}

export interface AnalysisRun {
  id: string;
  input: z.infer<typeof AnalyzeRequestSchema>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  logs: PipelineLog[];
  startedAt: Date;
  finishedAt?: Date;
  briefId?: string;
  error?: string;
}

// ============ API Response Types ============

export interface BriefSummary {
  id: string;
  companyName: string;
  companyDomain: string;
  score: number;
  scoreRationale: string[];
  createdAt: Date;
}

export interface AnalyzeResponse {
  success: boolean;
  brief?: Brief;
  run?: AnalysisRun;
  error?: string;
}

export interface ListBriefsResponse {
  success: boolean;
  briefs: BriefSummary[];
  total: number;
}

export interface GetBriefResponse {
  success: boolean;
  brief?: Brief;
  error?: string;
}

// ============ Type Exports ============

export type CompanyInput = z.infer<typeof CompanyInputSchema>;
export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;
