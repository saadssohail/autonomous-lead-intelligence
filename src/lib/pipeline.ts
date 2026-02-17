/**
 * Analysis Pipeline - Core intelligence generation logic
 */

import type {
  CompanySnapshot,
  Signal,
  FeedbackItem,
  PainTheme,
  ReasoningChain,
  LeadScore,
  Brief,
  PipelineLog,
  CapabilityMatch,
} from '@/types';
import {
  getSeedCompanyByDomain,
  getSeedCompanyByName,
  type SeedCompany,
} from './seed-data';
import { getLLMProvider } from './llm-provider';
import { CAPABILITY_CATALOG, calculateCapabilityRelevance } from './capabilities';

export interface PipelineContext {
  companyName?: string;
  companyDomain?: string;
  useLiveData?: boolean;
  logs: PipelineLog[];
}

/**
 * Log a pipeline step
 */
function logStep(
  logs: PipelineLog[],
  step: string,
  status: 'started' | 'completed' | 'failed',
  details?: string
): void {
  const lastLog = logs[logs.length - 1];
  
  if (status === 'started') {
    logs.push({
      step,
      status,
      timestamp: new Date(),
      details,
    });
  } else if (lastLog && lastLog.step === step && lastLog.status === 'started') {
    lastLog.status = status;
    lastLog.duration = Date.now() - lastLog.timestamp.getTime();
    if (details) lastLog.details = details;
  } else {
    logs.push({
      step,
      status,
      timestamp: new Date(),
      details,
    });
  }
}

/**
 * Fetch website content
 */
async function fetchWebsiteText(domain: string, ctx: PipelineContext): Promise<string> {
  logStep(ctx.logs, 'fetch_website', 'started');
  
  try {
    // Check for seed data first
    const seedCompany = getSeedCompanyByDomain(domain);
    if (seedCompany) {
      logStep(ctx.logs, 'fetch_website', 'completed', 'Using seed data');
      return seedCompany.websiteText;
    }

    // If live data requested and enabled, fetch real website
    if (ctx.useLiveData) {
      try {
        // Dynamic imports — these are heavy and only needed for live scraping
        const [{ default: axios }, { JSDOM }] = await Promise.all([
          import('axios'),
          import('jsdom'),
        ]);
        
        const url = domain.startsWith('http') ? domain : `https://${domain}`;
        const response = await axios.get(url, {
          timeout: 10000,
          headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        
        const dom = new JSDOM(response.data);
        const text = dom.window.document.body.textContent || '';
        
        logStep(ctx.logs, 'fetch_website', 'completed', 'Fetched live website');
        return text.slice(0, 5000); // Limit to 5000 chars
      } catch (error) {
        console.warn('Failed to fetch website, using fallback:', error);
      }
    }

    logStep(ctx.logs, 'fetch_website', 'completed', 'Using placeholder data');
    return 'Financial technology platform providing innovative solutions.';
  } catch (error) {
    logStep(ctx.logs, 'fetch_website', 'failed', String(error));
    return '';
  }
}

/**
 * Load feedback data
 */
async function loadFeedback(
  companyName: string,
  domain: string,
  ctx: PipelineContext
): Promise<FeedbackItem[]> {
  logStep(ctx.logs, 'load_feedback', 'started');
  
  try {
    const seedCompany = getSeedCompanyByDomain(domain) || getSeedCompanyByName(companyName);
    
    if (seedCompany) {
      const feedback = seedCompany.feedback.map(f => ({
        source: f.source,
        quote: f.quote,
        sentiment: f.sentiment,
        url: f.url,
      }));
      
      logStep(ctx.logs, 'load_feedback', 'completed', `Loaded ${feedback.length} feedback items`);
      return feedback;
    }

    logStep(ctx.logs, 'load_feedback', 'completed', 'No feedback data available');
    return [];
  } catch (error) {
    logStep(ctx.logs, 'load_feedback', 'failed', String(error));
    return [];
  }
}

/**
 * Extract signals from various sources
 */
async function extractSignals(
  websiteText: string,
  feedback: FeedbackItem[],
  seedCompany: SeedCompany | undefined,
  ctx: PipelineContext
): Promise<Signal[]> {
  logStep(ctx.logs, 'extract_signals', 'started');
  
  const signals: Signal[] = [];
  const now = new Date();

  try {
    // Extract funding signals
    if (seedCompany?.fundingEvents) {
      seedCompany.fundingEvents.forEach(event => {
        signals.push({
          type: 'funding',
          evidenceText: `${event.type}: ${event.amount} - ${event.announcement}`,
          url: undefined,
          strength: 'high',
          extractedAt: now,
        });
      });
    }

    // Extract hiring signals from careers page
    if (seedCompany?.careersPageText) {
      const jobMatches = seedCompany.careersPageText.match(/(?:Senior|Lead|Staff|Principal)?\s*(?:Backend|Frontend|Full Stack|Platform|Security|DevOps|Data)\s*Engineer/gi);
      if (jobMatches && jobMatches.length > 0) {
        signals.push({
          type: 'hiring',
          evidenceText: `Hiring for ${jobMatches.length} engineering positions including ${jobMatches.slice(0, 3).join(', ')}`,
          url: undefined,
          strength: jobMatches.length >= 5 ? 'high' : 'medium',
          extractedAt: now,
        });
      }
    }

    // Extract technical signals from website
    const techKeywords = ['api', 'integration', 'scalability', 'cloud', 'infrastructure', 'security'];
    const foundKeywords = techKeywords.filter(kw => websiteText.toLowerCase().includes(kw));
    if (foundKeywords.length >= 3) {
      signals.push({
        type: 'technical',
        evidenceText: `Platform mentions: ${foundKeywords.join(', ')}`,
        url: undefined,
        strength: 'medium',
        extractedAt: now,
      });
    }

    // Extract product signals from feedback themes
    const productMentions = feedback.filter(f => 
      f.quote.toLowerCase().includes('feature') || 
      f.quote.toLowerCase().includes('product')
    );
    if (productMentions.length >= 3) {
      signals.push({
        type: 'product_launch',
        evidenceText: `${productMentions.length} customer feedback items mention features/products`,
        url: undefined,
        strength: 'low',
        extractedAt: now,
      });
    }

    logStep(ctx.logs, 'extract_signals', 'completed', `Extracted ${signals.length} signals`);
    return signals;
  } catch (error) {
    logStep(ctx.logs, 'extract_signals', 'failed', String(error));
    return signals;
  }
}

/**
 * Detect pain themes from feedback
 */
async function detectPainThemes(
  feedback: FeedbackItem[],
  ctx: PipelineContext
): Promise<PainTheme[]> {
  logStep(ctx.logs, 'detect_pain_themes', 'started');
  
  try {
    const llm = getLLMProvider();
    const feedbackQuotes = feedback.map(f => f.quote);
    
    const themes = await llm.detectPainThemes(feedbackQuotes);
    
    logStep(ctx.logs, 'detect_pain_themes', 'completed', `Detected ${themes.length} pain themes`);
    return themes;
  } catch (error) {
    logStep(ctx.logs, 'detect_pain_themes', 'failed', String(error));
    return [];
  }
}

/**
 * Generate reasoning chains
 */
async function reasonOverSignals(
  signals: Signal[],
  painThemes: PainTheme[],
  ctx: PipelineContext
): Promise<ReasoningChain[]> {
  logStep(ctx.logs, 'reason_over_signals', 'started');
  
  try {
    const llm = getLLMProvider();
    const chains = await llm.generateReasoningChains(signals, painThemes);
    
    logStep(ctx.logs, 'reason_over_signals', 'completed', `Generated ${chains.length} reasoning chains`);
    return chains;
  } catch (error) {
    logStep(ctx.logs, 'reason_over_signals', 'failed', String(error));
    return [];
  }
}

/**
 * Map pain themes and signals to capabilities
 */
async function mapToCapabilities(
  painThemes: PainTheme[],
  signals: Signal[],
  ctx: PipelineContext
): Promise<CapabilityMatch[]> {
  logStep(ctx.logs, 'map_capabilities', 'started');
  
  try {
    const painTexts = painThemes.map(p => `${p.theme} ${p.category}`);
    const signalTexts = signals.map(s => s.evidenceText);
    
    const matches: CapabilityMatch[] = [];
    
    CAPABILITY_CATALOG.forEach(capability => {
      const relevance = calculateCapabilityRelevance(capability, painTexts, signalTexts);
      
      if (relevance > 0.2) {
        const matchedPains = painThemes
          .filter(p => capability.keywords.some(kw => 
            p.theme.toLowerCase().includes(kw) || p.category.toLowerCase().includes(kw)
          ))
          .map(p => p.theme);
        
        const matchedSigs = signals
          .filter(s => capability.keywords.some(kw => 
            s.evidenceText.toLowerCase().includes(kw)
          ))
          .map(s => s.type);
        
        matches.push({
          capability,
          relevanceScore: relevance,
          matchedPainThemes: matchedPains,
          matchedSignals: matchedSigs,
        });
      }
    });
    
    const sorted = matches.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 3);
    logStep(ctx.logs, 'map_capabilities', 'completed', `Mapped ${sorted.length} capabilities`);
    return sorted;
  } catch (error) {
    logStep(ctx.logs, 'map_capabilities', 'failed', String(error));
    return [];
  }
}

/**
 * Generate "why Alfabolt" statement
 */
function generateWhyAlfabolt(capabilityMatches: CapabilityMatch[]): string {
  if (capabilityMatches.length === 0) {
    return 'Alfabolt brings deep fintech engineering expertise and a proven track record of accelerating product development for growing financial technology companies.';
  }
  
  const top = capabilityMatches[0];
  let why = `Alfabolt's ${top.capability.name.toLowerCase()} directly addresses your challenges. `;
  
  if (top.capability.proofPoints.length > 0) {
    why += top.capability.proofPoints[0] + ' ';
  }
  
  if (capabilityMatches.length > 1) {
    why += `Additionally, our ${capabilityMatches[1].capability.name.toLowerCase()} can help with ${capabilityMatches[1].matchedPainThemes[0] || 'platform improvements'}.`;
  }
  
  return why.trim();
}

/**
 * Calculate lead score
 */
function calculateLeadScore(
  signals: Signal[],
  painThemes: PainTheme[],
  reasoningChains: ReasoningChain[]
): LeadScore {
  const rationale: string[] = [];
  
  // Pain severity score (0-40 points)
  const avgPainSeverity = painThemes.length > 0
    ? painThemes.reduce((sum, p) => sum + p.severityScore, 0) / painThemes.length
    : 0;
  const painScore = Math.min(40, (avgPainSeverity / 10) * 40);
  
  if (painThemes.length > 0) {
    rationale.push(`${painThemes.length} pain themes with avg severity ${avgPainSeverity.toFixed(1)}/10`);
  }
  
  // Signal strength score (0-40 points)
  const highSignals = signals.filter(s => s.strength === 'high').length;
  const mediumSignals = signals.filter(s => s.strength === 'medium').length;
  const signalScore = Math.min(40, highSignals * 15 + mediumSignals * 8);
  
  if (signals.length > 0) {
    rationale.push(`${signals.length} signals detected (${highSignals} high-strength)`);
  }
  
  // Fit score (0-20 points) - fintech + reasoning quality
  const highConfidenceChains = reasoningChains.filter(rc => rc.confidence === 'high').length;
  const fitScore = Math.min(20, 10 + highConfidenceChains * 5); // Base 10 for fintech
  
  if (highConfidenceChains > 0) {
    rationale.push(`${highConfidenceChains} high-confidence opportunity chains`);
  }
  
  rationale.push(`Fintech vertical alignment (+10 points)`);
  
  const total = Math.round(painScore + signalScore + fitScore);
  
  return {
    total,
    breakdown: {
      painSeverity: Math.round(painScore),
      signalStrength: Math.round(signalScore),
      fitScore: Math.round(fitScore),
    },
    rationale,
  };
}

/**
 * Main pipeline execution
 */
export async function runAnalysisPipeline(
  companyName: string,
  companyDomain: string,
  useLiveData: boolean = false
): Promise<{ brief: Brief; logs: PipelineLog[] }> {
  const ctx: PipelineContext = {
    companyName,
    companyDomain,
    useLiveData,
    logs: [],
  };

  logStep(ctx.logs, 'pipeline_start', 'started', `Analyzing ${companyName || companyDomain}`);

  // Step 1: Fetch website
  const websiteText = await fetchWebsiteText(companyDomain, ctx);

  // Step 2: Load feedback
  const feedback = await loadFeedback(companyName, companyDomain, ctx);

  // Step 3: Get seed company (for other data)
  const seedCompany = getSeedCompanyByDomain(companyDomain) || getSeedCompanyByName(companyName);

  // Step 4: Extract signals
  const signals = await extractSignals(websiteText, feedback, seedCompany, ctx);

  // Step 5: Detect pain themes
  const painThemes = await detectPainThemes(feedback, ctx);
  
  // Guardrail: Ensure painThemes is always an array
  const safePainThemes = Array.isArray(painThemes) ? painThemes : [];

  // Step 6: Generate reasoning chains
  const reasoningChains = await reasonOverSignals(signals, safePainThemes, ctx);
  
  // Guardrail: Ensure reasoningChains is always an array
  const safeReasoningChains = Array.isArray(reasoningChains) ? reasoningChains : [];

  // Step 7: Map to capabilities
  const capabilityMatches = await mapToCapabilities(safePainThemes, signals, ctx);

  // Step 8: Generate why Alfabolt
  const whyAlfabolt = generateWhyAlfabolt(capabilityMatches);

  // Step 9: Generate why now
  logStep(ctx.logs, 'generate_why_now', 'started');
  const llm = getLLMProvider();
  const whyNow = await llm.generateWhyNow(safeReasoningChains, signals);
  logStep(ctx.logs, 'generate_why_now', 'completed');

  // Step 10: Generate outreach angle
  logStep(ctx.logs, 'generate_outreach_angle', 'started');
  const outreachAngle = await llm.generateOutreachAngle(safePainThemes, safeReasoningChains);
  logStep(ctx.logs, 'generate_outreach_angle', 'completed');

  // Step 11: Generate opening message
  logStep(ctx.logs, 'generate_opening_message', 'started');
  const openingMessage = await llm.generateOpeningMessage(
    companyName,
    whyNow,
    whyAlfabolt,
    outreachAngle
  );
  logStep(ctx.logs, 'generate_opening_message', 'completed');

  // Step 12: Calculate score
  logStep(ctx.logs, 'calculate_score', 'started');
  const score = calculateLeadScore(signals, safePainThemes, safeReasoningChains);
  logStep(ctx.logs, 'calculate_score', 'completed', `Score: ${score.total}/100`);

  // Build snapshot
  const snapshot: CompanySnapshot = {
    name: companyName || seedCompany?.name || 'Unknown',
    domain: companyDomain,
    country: seedCompany?.country,
    industry: 'fintech',
    description: seedCompany?.description,
    employeeCount: seedCompany?.employeeCount,
    foundedYear: seedCompany?.foundedYear,
  };

  const brief: Brief = {
    id: crypto.randomUUID(),
    companyId: '', // Will be set by API
    score,
    snapshot,
    signals,
    painThemes: safePainThemes,
    reasoningChains: safeReasoningChains,
    whyNow,
    whyAlfabolt,
    capabilityMatches,
    outreachAngle,
    openingMessage,
    createdAt: new Date(),
  };

  logStep(ctx.logs, 'pipeline_complete', 'completed', 'Analysis complete');

  return { brief, logs: ctx.logs };
}
