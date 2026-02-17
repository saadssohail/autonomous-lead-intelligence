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
 * Fetch website content with enhanced extraction
 */
async function fetchWebsiteText(domain: string, ctx: PipelineContext): Promise<string> {
  logStep(ctx.logs, 'fetch_website', 'started');
  
  try {
    // Check for seed data first
    const seedCompany = getSeedCompanyByDomain(domain);
    if (seedCompany && !ctx.useLiveData) {
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
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        });
        
        const dom = new JSDOM(response.data);
        const doc = dom.window.document;
        
        // Remove script, style, and nav elements
        doc.querySelectorAll('script, style, nav, header, footer').forEach(el => el.remove());
        
        // Extract main content with better structure
        const mainContent = doc.querySelector('main, [role="main"], .content, #content');
        const text = (mainContent ? mainContent.textContent : doc.body.textContent) || '';
        
        // Clean up whitespace
        const cleanText = text.replace(/\s+/g, ' ').trim();
        
        logStep(ctx.logs, 'fetch_website', 'completed', `Fetched live website (${cleanText.length} chars)`);
        return cleanText.slice(0, 10000); // Increased limit for better context
      } catch (error) {
        console.warn('Failed to fetch website:', error);
        logStep(ctx.logs, 'fetch_website', 'failed', `Error: ${error instanceof Error ? error.message : String(error)}`);
        return '';
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
 * Scrape careers page for hiring signals
 */
async function scrapeCareersPage(
  domain: string,
  ctx: PipelineContext
): Promise<string | null> {
  try {
    const [{ default: axios }, { JSDOM }] = await Promise.all([
      import('axios'),
      import('jsdom'),
    ]);
    
    const baseUrl = domain.startsWith('http') ? domain : `https://${domain}`;
    const careerUrls = [
      `${baseUrl}/careers`,
      `${baseUrl}/jobs`,
      `${baseUrl}/join`,
      `${baseUrl}/about/careers`,
      `${baseUrl}/company/careers`,
    ];
    
    for (const url of careerUrls) {
      try {
        const response = await axios.get(url, {
          timeout: 8000,
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          validateStatus: (status) => status === 200,
        });
        
        const dom = new JSDOM(response.data);
        const text = dom.window.document.body.textContent || '';
        
        // If we found a careers page with substantial content
        if (text.length > 500) {
          return text.slice(0, 5000);
        }
      } catch (error) {
        // Continue to next URL
        continue;
      }
    }
    
    return null;
  } catch (error) {
    console.warn('Failed to scrape careers page:', error);
    return null;
  }
}

/**
 * Scrape customer testimonials/reviews from website
 */
async function scrapeWebsiteFeedback(
  domain: string,
  ctx: PipelineContext
): Promise<FeedbackItem[]> {
  try {
    const [{ default: axios }, { JSDOM }] = await Promise.all([
      import('axios'),
      import('jsdom'),
    ]);
    
    const feedback: FeedbackItem[] = [];
    const url = domain.startsWith('http') ? domain : `https://${domain}`;
    
    // Try common testimonial/review pages
    const pagesToCheck = [
      url,
      `${url}/testimonials`,
      `${url}/reviews`,
      `${url}/customers`,
      `${url}/case-studies`,
    ];
    
    for (const pageUrl of pagesToCheck) {
      try {
        const response = await axios.get(pageUrl, {
          timeout: 8000,
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          validateStatus: (status) => status === 200,
        });
        
        const dom = new JSDOM(response.data);
        const doc = dom.window.document;
        
        // Look for testimonial-like content
        const selectors = [
          '.testimonial, .review, .customer-quote, [class*="testimonial"], [class*="review"]',
          'blockquote',
          '[itemtype*="Review"]',
        ];
        
        for (const selector of selectors) {
          const elements = doc.querySelectorAll(selector);
          elements.forEach((el, idx) => {
            const text = el.textContent?.trim();
            if (text && text.length > 50 && text.length < 1000) {
              feedback.push({
                source: pageUrl === url ? 'website' : pageUrl.split('/').pop() || 'website',
                quote: text,
                sentiment: 'neutral' as const,
                url: pageUrl,
              });
            }
          });
          
          if (feedback.length >= 5) break;
        }
        
        if (feedback.length >= 5) break;
      } catch (error) {
        // Silently continue to next page
        continue;
      }
    }
    
    return feedback.slice(0, 10); // Limit to 10 testimonials
  } catch (error) {
    console.warn('Failed to scrape website feedback:', error);
    return [];
  }
}

/**
 * Scrape reviews from third-party platforms (Glassdoor, G2, Trustpilot, etc.)
 */
async function scrapeThirdPartyReviews(
  companyName: string,
  domain: string,
  ctx: PipelineContext
): Promise<FeedbackItem[]> {
  try {
    const [{ default: axios }, { JSDOM }] = await Promise.all([
      import('axios'),
      import('jsdom'),
    ]);
    
    const feedback: FeedbackItem[] = [];
    const headers = { 
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    };
    
    // Extract company slug from name (e.g., "10Pearls" -> "10pearls")
    const companySlug = companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const domainBase = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('.')[0];
    
    // 1. Try Glassdoor (employee reviews - great for discovering pain points)
    try {
      const glassdoorUrl = `https://www.glassdoor.com/Reviews/${companySlug}-reviews-SRCH_KE0,${companySlug.length}.htm`;
      const response = await axios.get(glassdoorUrl, {
        timeout: 8000,
        headers,
        validateStatus: (status) => status === 200,
      });
      
      const dom = new JSDOM(response.data);
      const doc = dom.window.document;
      
      // Look for review content (Glassdoor structure)
      const reviewElements = doc.querySelectorAll('[class*="reviewBodyCell"], [class*="ReviewDetails"], .empReview, [data-test="review"]');
      reviewElements.forEach((el) => {
        const text = el.textContent?.trim();
        if (text && text.length > 100 && text.length < 1500) {
          feedback.push({
            source: 'Glassdoor',
            quote: text.slice(0, 800), // Limit length
            sentiment: 'neutral' as const,
            url: glassdoorUrl,
          });
        }
      });
    } catch (error) {
      // Glassdoor might block scraping - skip silently
    }
    
    // 2. Try G2 (software reviews - excellent for SaaS/tech companies)
    try {
      const g2Url = `https://www.g2.com/products/${companySlug}/reviews`;
      const response = await axios.get(g2Url, {
        timeout: 8000,
        headers,
        validateStatus: (status) => status === 200,
      });
      
      const dom = new JSDOM(response.data);
      const doc = dom.window.document;
      
      // Look for G2 review content
      const reviewElements = doc.querySelectorAll('[class*="review-text"], [itemprop="reviewBody"], .pjax-content p');
      reviewElements.forEach((el) => {
        const text = el.textContent?.trim();
        if (text && text.length > 50 && text.length < 1000 && !feedback.some(f => f.quote === text)) {
          feedback.push({
            source: 'G2',
            quote: text,
            sentiment: 'neutral' as const,
            url: g2Url,
          });
        }
      });
    } catch (error) {
      // G2 might not have the company or block scraping - skip silently
    }
    
    // 3. Try Trustpilot (customer reviews)
    try {
      const trustpilotUrl = `https://www.trustpilot.com/review/${domainBase}.com`;
      const response = await axios.get(trustpilotUrl, {
        timeout: 8000,
        headers,
        validateStatus: (status) => status === 200,
      });
      
      const dom = new JSDOM(response.data);
      const doc = dom.window.document;
      
      // Look for Trustpilot review content
      const reviewElements = doc.querySelectorAll('[class*="review-content"], [data-service-review-text-typography], p[class*="typography"]');
      reviewElements.forEach((el) => {
        const text = el.textContent?.trim();
        if (text && text.length > 50 && text.length < 1000 && !feedback.some(f => f.quote === text)) {
          feedback.push({
            source: 'Trustpilot',
            quote: text,
            sentiment: 'neutral' as const,
            url: trustpilotUrl,
          });
        }
      });
    } catch (error) {
      // Trustpilot might not have the company - skip silently
    }
    
    // 4. Search Google for "[company] reviews" and scrape snippets
    try {
      const searchQuery = encodeURIComponent(`${companyName} customer reviews feedback`);
      const googleUrl = `https://www.google.com/search?q=${searchQuery}`;
      const response = await axios.get(googleUrl, {
        timeout: 8000,
        headers,
        validateStatus: (status) => status === 200,
      });
      
      const dom = new JSDOM(response.data);
      const doc = dom.window.document;
      
      // Extract snippets from search results (these often contain review excerpts)
      const snippets = doc.querySelectorAll('.VwiC3b, [data-content-feature="1"], .hgKElc, .s');
      snippets.forEach((el) => {
        const text = el.textContent?.trim();
        if (text && text.length > 80 && text.length < 500 && !feedback.some(f => f.quote === text)) {
          // Only include if it looks like a review (contains review-like words)
          if (text.match(/review|customer|experience|using|service|product|software|platform/i)) {
            feedback.push({
              source: 'Google Search',
              quote: text,
              sentiment: 'neutral' as const,
              url: googleUrl,
            });
          }
        }
      });
    } catch (error) {
      // Google might block - skip silently
    }
    
    return feedback.slice(0, 15); // Limit to 15 third-party reviews
  } catch (error) {
    console.warn('Failed to scrape third-party reviews:', error);
    return [];
  }
}

/**
 * Load feedback data from seed or live sources
 */
async function loadFeedback(
  companyName: string,
  domain: string,
  ctx: PipelineContext
): Promise<FeedbackItem[]> {
  logStep(ctx.logs, 'load_feedback', 'started');
  
  try {
    const seedCompany = getSeedCompanyByDomain(domain) || getSeedCompanyByName(companyName);
    
    // If we have seed data and not explicitly requesting live data, use it
    if (seedCompany && !ctx.useLiveData) {
      const feedback = seedCompany.feedback.map(f => ({
        source: f.source,
        quote: f.quote,
        sentiment: f.sentiment,
        url: f.url,
      }));
      
      logStep(ctx.logs, 'load_feedback', 'completed', `Loaded ${feedback.length} feedback items from seed data`);
      return feedback;
    }
    
    // For live data, try multiple sources in parallel
    if (ctx.useLiveData) {
      const [websiteFeedback, thirdPartyFeedback] = await Promise.all([
        scrapeWebsiteFeedback(domain, ctx),
        scrapeThirdPartyReviews(companyName, domain, ctx),
      ]);
      
      // Combine all feedback sources
      const allFeedback = [...websiteFeedback, ...thirdPartyFeedback];
      
      if (allFeedback.length > 0) {
        // Deduplicate based on quote similarity (simple check)
        const uniqueFeedback: FeedbackItem[] = [];
        allFeedback.forEach(item => {
          const isDuplicate = uniqueFeedback.some(existing => 
            existing.quote.toLowerCase().includes(item.quote.toLowerCase().slice(0, 100)) ||
            item.quote.toLowerCase().includes(existing.quote.toLowerCase().slice(0, 100))
          );
          if (!isDuplicate) {
            uniqueFeedback.push(item);
          }
        });
        
        const sources = Array.from(new Set(uniqueFeedback.map(f => f.source)));
        logStep(ctx.logs, 'load_feedback', 'completed', 
          `Scraped ${uniqueFeedback.length} reviews from ${sources.length} sources: ${sources.join(', ')}`);
        return uniqueFeedback.slice(0, 20); // Limit to top 20 reviews
      }
    }

    logStep(ctx.logs, 'load_feedback', 'completed', 'No feedback data available - will skip pain theme detection');
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
  careersPageText: string | null,
  ctx: PipelineContext
): Promise<Signal[]> {
  logStep(ctx.logs, 'extract_signals', 'started');
  
  const signals: Signal[] = [];
  const now = new Date();

  try {
    // Extract funding signals from seed data
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

    // Extract hiring signals from careers page (seed or live data)
    const careerText = careersPageText || seedCompany?.careersPageText;
    if (careerText) {
      const jobMatches = careerText.match(/(?:Senior|Lead|Staff|Principal)?\s*(?:Backend|Frontend|Full Stack|Platform|Security|DevOps|Data|Software)\s*Engineer/gi);
      if (jobMatches && jobMatches.length > 0) {
        signals.push({
          type: 'hiring',
          evidenceText: `Hiring for ${jobMatches.length} engineering positions including ${jobMatches.slice(0, 3).join(', ')}`,
          url: undefined,
          strength: jobMatches.length >= 5 ? 'high' : 'medium',
          extractedAt: now,
        });
      } else {
        // Check for general hiring signals
        const hiringIndicators = careerText.toLowerCase();
        if (hiringIndicators.includes('open position') || hiringIndicators.includes('join our team') || hiringIndicators.includes('we\'re hiring')) {
          signals.push({
            type: 'hiring',
            evidenceText: 'Company is actively hiring based on careers page',
            url: undefined,
            strength: 'low',
            extractedAt: now,
          });
        }
      }
    }

    // For live data: Extract signals from actual website content
    if (ctx.useLiveData && websiteText) {
      const lowerText = websiteText.toLowerCase();
      
      // Detect hiring/growth signals from website
      const hiringKeywords = ['hiring', 'we\'re hiring', 'join our team', 'careers', 'open positions', 'now hiring'];
      const growthKeywords = ['raised', 'funding', 'series', 'investment', 'expanding', 'growth'];
      const techKeywords = ['api', 'integration', 'scalability', 'cloud', 'infrastructure', 'security', 'platform', 'microservices'];
      const productKeywords = ['launching', 'new feature', 'announcing', 'released', 'beta'];
      
      // Check for hiring signals
      const hiringCount = hiringKeywords.filter(kw => lowerText.includes(kw)).length;
      if (hiringCount >= 2) {
        signals.push({
          type: 'hiring',
          evidenceText: `Website mentions hiring and careers (found ${hiringCount} hiring-related keywords)`,
          url: undefined,
          strength: hiringCount >= 3 ? 'medium' : 'low',
          extractedAt: now,
        });
      }
      
      // Check for growth/funding signals
      const growthCount = growthKeywords.filter(kw => lowerText.includes(kw)).length;
      if (growthCount >= 2) {
        signals.push({
          type: 'funding',
          evidenceText: `Website indicates recent growth or funding activity (found ${growthCount} growth indicators)`,
          url: undefined,
          strength: 'low',
          extractedAt: now,
        });
      }
      
      // Check for technical signals
      const techCount = techKeywords.filter(kw => lowerText.includes(kw)).length;
      if (techCount >= 4) {
        signals.push({
          type: 'technical',
          evidenceText: `Platform has strong technical focus: ${techKeywords.filter(kw => lowerText.includes(kw)).slice(0, 5).join(', ')}`,
          url: undefined,
          strength: 'medium',
          extractedAt: now,
        });
      }
      
      // Check for product launch signals
      const productCount = productKeywords.filter(kw => lowerText.includes(kw)).length;
      if (productCount >= 2) {
        signals.push({
          type: 'product_launch',
          evidenceText: `Recent product activity detected (found ${productCount} product-related announcements)`,
          url: undefined,
          strength: 'low',
          extractedAt: now,
        });
      }
    } else if (!seedCompany && websiteText) {
      // Fallback: Basic signal extraction for non-live, non-seed data
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
    }

    // Extract product signals from feedback themes (both seed and live)
    if (feedback && feedback.length > 0) {
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
    // Guard: Don't call LLM if no feedback (prevents hallucination)
    if (!feedback || feedback.length === 0) {
      logStep(ctx.logs, 'detect_pain_themes', 'completed', 'Skipped - no feedback data available');
      return [];
    }
    
    const llm = getLLMProvider();
    const feedbackQuotes = feedback.map(f => f.quote);
    
    const themes = await llm.detectPainThemes(feedbackQuotes);
    
    logStep(ctx.logs, 'detect_pain_themes', 'completed', `Detected ${themes.length} pain themes from ${feedback.length} feedback items`);
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

  // Step 3.5: Scrape careers page if using live data
  let careersPageText: string | null = null;
  if (ctx.useLiveData && !seedCompany) {
    logStep(ctx.logs, 'scrape_careers', 'started');
    careersPageText = await scrapeCareersPage(companyDomain, ctx);
    if (careersPageText) {
      logStep(ctx.logs, 'scrape_careers', 'completed', `Found careers page (${careersPageText.length} chars)`);
    } else {
      logStep(ctx.logs, 'scrape_careers', 'completed', 'No careers page found');
    }
  }

  // Step 4: Extract signals
  const signals = await extractSignals(websiteText, feedback, seedCompany, careersPageText, ctx);

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

  // Step 9 & 10: Generate whyNow and outreachAngle in parallel (independent)
  const llm = getLLMProvider();
  logStep(ctx.logs, 'generate_why_now', 'started');
  logStep(ctx.logs, 'generate_outreach_angle', 'started');
  const [whyNow, outreachAngle] = await Promise.all([
    llm.generateWhyNow(safeReasoningChains, signals),
    llm.generateOutreachAngle(safePainThemes, safeReasoningChains),
  ]);
  logStep(ctx.logs, 'generate_why_now', 'completed');
  logStep(ctx.logs, 'generate_outreach_angle', 'completed');

  // Step 11: Generate opening message (depends on whyNow + outreachAngle)
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
