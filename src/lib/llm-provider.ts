/**
 * LLM Provider Interface and Implementations
 * Supports OpenAI with mock fallback for demo mode
 */

import OpenAI from 'openai';
import type { PainTheme, ReasoningChain, Signal } from '@/types';

// LLM Interaction Log for debugging and transparency
export interface LLMInteraction {
  timestamp: Date;
  operation: string;
  request: {
    prompt: string;
    model?: string;
    temperature?: number;
  };
  response: {
    content: string;
    parsed?: any;
    raw?: string;
  };
  duration: number;
  error?: string;
}

// Global interaction log (in-memory for demo)
const llmInteractions: LLMInteraction[] = [];

export function getLLMInteractions(): LLMInteraction[] {
  return llmInteractions;
}

export function clearLLMInteractions(): void {
  llmInteractions.length = 0;
}

// Helper to validate and ensure array return
function ensureArray<T>(value: any, fallback: T[] = []): T[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object' && Array.isArray(value.themes)) return value.themes;
  if (value && typeof value === 'object' && Array.isArray(value.chains)) return value.chains;
  return fallback;
}

// Helper to log LLM interactions
function logInteraction(interaction: LLMInteraction): void {
  llmInteractions.push(interaction);
  // Keep only last 50 interactions
  if (llmInteractions.length > 50) {
    llmInteractions.shift();
  }
  // Also log to console in dev mode
  if (process.env.NODE_ENV === 'development') {
    console.log(`[LLM] ${interaction.operation}:`, {
      duration: `${interaction.duration}ms`,
      promptLength: interaction.request.prompt.length,
      responseLength: interaction.response.content.length,
      error: interaction.error,
    });
  }
}

export interface LLMProvider {
  detectPainThemes(feedback: string[]): Promise<PainTheme[]>;
  generateReasoningChains(signals: Signal[], painThemes: PainTheme[]): Promise<ReasoningChain[]>;
  generateWhyNow(reasoningChains: ReasoningChain[], signals: Signal[]): Promise<string>;
  generateOutreachAngle(painThemes: PainTheme[], reasoningChains: ReasoningChain[]): Promise<string>;
  generateOpeningMessage(
    companyName: string,
    whyNow: string,
    whyAlfabolt: string,
    outreachAngle: string
  ): Promise<string>;
}

/**
 * OpenAI Provider Implementation
 */
export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey, timeout: 15_000 }); // 15s per-request timeout
  }

  async detectPainThemes(feedback: string[]): Promise<PainTheme[]> {
    const startTime = Date.now();
    
    // Guard: Don't process if no feedback (prevents hallucination)
    if (!feedback || feedback.length === 0) {
      console.log('Skipping pain theme detection: no feedback provided');
      return [];
    }
    
    const prompt = `Analyze the following customer feedback and identify dominant pain themes.
For each theme, provide:
- A concise theme name (2-4 words)
- A category (onboarding, compliance, payment_reliability, customer_support, integrations, performance, reporting, security, ux_design, mobile_experience)
- Supporting evidence (quotes from feedback)
- Severity score (0-10 based on frequency and intensity)

IMPORTANT: Only identify themes that are EXPLICITLY mentioned in the feedback below. Do not infer or assume pain points.

Feedback:
${feedback.map((f, i) => `${i + 1}. "${f}"`).join('\n')}

Return ONLY a JSON object with a "themes" array. Example format:
{
  "themes": [
    {
      "theme": "Slow KYC verification",
      "category": "onboarding",
      "supportingEvidence": ["quote1", "quote2"],
      "severityScore": 8.5
    }
  ]
}`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content || '{"themes":[]}';
      const parsed = JSON.parse(content);
      const themes = ensureArray<PainTheme>(parsed.themes || parsed, []);
      
      // Log interaction
      logInteraction({
        timestamp: new Date(),
        operation: 'detectPainThemes',
        request: { prompt, model: 'gpt-4o-mini', temperature: 0.3 },
        response: { content, parsed, raw: content },
        duration: Date.now() - startTime,
      });
      
      return themes;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logInteraction({
        timestamp: new Date(),
        operation: 'detectPainThemes',
        request: { prompt, model: 'gpt-4o-mini', temperature: 0.3 },
        response: { content: '', parsed: null },
        duration: Date.now() - startTime,
        error: errorMsg,
      });
      console.error('Pain theme detection failed:', error);
      return []; // Return empty array on error
    }
  }

  async generateReasoningChains(signals: Signal[], painThemes: PainTheme[]): Promise<ReasoningChain[]> {
    const startTime = Date.now();
    
    // Guard: Need at least one signal to generate reasoning
    if (!signals || signals.length === 0) {
      console.log('Skipping reasoning chain generation: no signals available');
      return [];
    }
    
    const hasPainThemes = painThemes && painThemes.length > 0;
    
    const prompt = `You are a B2B sales intelligence analyst. Given these signals${hasPainThemes ? ' and pain themes' : ''}, generate explicit reasoning chains following the pattern:
Observation → Inference → Opportunity

Signals:
${signals.map(s => `- ${s.type}: ${s.evidenceText}`).join('\n')}
${hasPainThemes ? `
Pain Themes:
${painThemes.map(p => `- ${p.theme} (severity: ${p.severityScore}/10)`).join('\n')}` : ''}

Generate ${signals.length >= 3 ? '3-5' : '1-2'} reasoning chains that connect signals${hasPainThemes ? ' and pain points' : ''} to business opportunities.
Each chain should have high/medium/low confidence.
Base your reasoning ONLY on the signals${hasPainThemes ? ' and pain themes' : ''} provided above.

Return ONLY a JSON object with a "chains" array. Example format:
{
  "chains": [
    {
      "observation": "Company raised $25M Series B and is hiring 5 backend engineers",
      "inference": "Rapid scaling underway with platform expansion plans",
      "opportunity": "Needs external engineering support to accelerate development without quality issues",
      "confidence": "high"
    }
  ]
}`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.4,
      });

      const content = response.choices[0]?.message?.content || '{"chains":[]}';
      const parsed = JSON.parse(content);
      const chains = ensureArray<ReasoningChain>(parsed.chains || parsed, []);
      
      // Log interaction
      logInteraction({
        timestamp: new Date(),
        operation: 'generateReasoningChains',
        request: { prompt, model: 'gpt-4o-mini', temperature: 0.4 },
        response: { content, parsed, raw: content },
        duration: Date.now() - startTime,
      });
      
      return chains;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logInteraction({
        timestamp: new Date(),
        operation: 'generateReasoningChains',
        request: { prompt, model: 'gpt-4o-mini', temperature: 0.4 },
        response: { content: '', parsed: null },
        duration: Date.now() - startTime,
        error: errorMsg,
      });
      console.error('Reasoning chain generation failed:', error);
      return []; // Return empty array on error
    }
  }

  async generateWhyNow(reasoningChains: ReasoningChain[], signals: Signal[]): Promise<string> {
    const startTime = Date.now();
    const prompt = `Based on these reasoning chains and signals, write a compelling 2-3 sentence "why now" statement explaining why this is the right time to engage this prospect.

Reasoning Chains:
${reasoningChains.map(rc => `- ${rc.observation} → ${rc.inference} → ${rc.opportunity}`).join('\n')}

Key Signals:
${signals.slice(0, 5).map(s => `- ${s.type}: ${s.evidenceText}`).join('\n')}

Write a concise, specific "why now" statement.`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 200,
      });

      const content = response.choices[0]?.message?.content || 'Timing is optimal based on recent signals.';
      
      // Log interaction
      logInteraction({
        timestamp: new Date(),
        operation: 'generateWhyNow',
        request: { prompt, model: 'gpt-4o-mini', temperature: 0.5 },
        response: { content, raw: content },
        duration: Date.now() - startTime,
      });
      
      return content;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logInteraction({
        timestamp: new Date(),
        operation: 'generateWhyNow',
        request: { prompt, model: 'gpt-4o-mini', temperature: 0.5 },
        response: { content: '' },
        duration: Date.now() - startTime,
        error: errorMsg,
      });
      console.error('Why now generation failed:', error);
      return 'Timing is optimal based on recent signals.';
    }
  }

  async generateOutreachAngle(painThemes: PainTheme[], reasoningChains: ReasoningChain[]): Promise<string> {
    const startTime = Date.now();
    const prompt = `Given these pain themes and reasoning chains, recommend a specific outreach angle (one sentence).

Pain Themes:
${painThemes.slice(0, 3).map(p => `- ${p.theme} (severity: ${p.severityScore})`).join('\n')}

Reasoning:
${reasoningChains.slice(0, 3).map(rc => `- ${rc.opportunity}`).join('\n')}

Provide one clear, specific outreach angle.`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 100,
      });

      const content = response.choices[0]?.message?.content || 'Lead with your proven expertise in their key pain area.';
      
      // Log interaction
      logInteraction({
        timestamp: new Date(),
        operation: 'generateOutreachAngle',
        request: { prompt, model: 'gpt-4o-mini', temperature: 0.6 },
        response: { content, raw: content },
        duration: Date.now() - startTime,
      });
      
      return content;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logInteraction({
        timestamp: new Date(),
        operation: 'generateOutreachAngle',
        request: { prompt, model: 'gpt-4o-mini', temperature: 0.6 },
        response: { content: '' },
        duration: Date.now() - startTime,
        error: errorMsg,
      });
      console.error('Outreach angle generation failed:', error);
      return 'Lead with your proven expertise in their key pain area.';
    }
  }

  async generateOpeningMessage(
    companyName: string,
    whyNow: string,
    whyAlfabolt: string,
    outreachAngle: string
  ): Promise<string> {
    const startTime = Date.now();
    const prompt = `Write a professional, personalized outreach email opening (2-3 short paragraphs) for ${companyName}.

Context:
- Why Now: ${whyNow}
- Why Alfabolt: ${whyAlfabolt}
- Angle: ${outreachAngle}

Keep it concise, specific, and value-focused. Don't be overly salesy.`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 300,
      });

      const content = response.choices[0]?.message?.content || `Hi ${companyName} team,\n\nI noticed your recent growth and wanted to reach out...`;
      
      // Log interaction
      logInteraction({
        timestamp: new Date(),
        operation: 'generateOpeningMessage',
        request: { prompt, model: 'gpt-4o-mini', temperature: 0.7 },
        response: { content, raw: content },
        duration: Date.now() - startTime,
      });
      
      return content;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logInteraction({
        timestamp: new Date(),
        operation: 'generateOpeningMessage',
        request: { prompt, model: 'gpt-4o-mini', temperature: 0.7 },
        response: { content: '' },
        duration: Date.now() - startTime,
        error: errorMsg,
      });
      console.error('Opening message generation failed:', error);
      return `Hi ${companyName} team,\n\nI noticed your recent growth and wanted to reach out...`;
    }
  }
}

/**
 * Mock Provider for Demo Mode (deterministic, fast)
 */
export class MockLLMProvider implements LLMProvider {
  async detectPainThemes(feedback: string[]): Promise<PainTheme[]> {
    // Simple keyword-based detection
    const themes: PainTheme[] = [];
    const feedbackText = feedback.join(' ').toLowerCase();

    const themePatterns = [
      {
        keywords: ['onboarding', 'kyc', 'verification', 'account opening', 'setup'],
        theme: 'Slow onboarding process',
        category: 'onboarding',
      },
      {
        keywords: ['support', 'customer service', 'response time', 'help'],
        theme: 'Inadequate customer support',
        category: 'customer_support',
      },
      {
        keywords: ['integration', 'api', 'connect', 'sync'],
        theme: 'Integration challenges',
        category: 'integrations',
      },
      {
        keywords: ['compliance', 'regulatory', 'reporting', 'audit'],
        theme: 'Manual compliance processes',
        category: 'compliance',
      },
      {
        keywords: ['mobile', 'app', 'crash', 'bug'],
        theme: 'Mobile app reliability issues',
        category: 'mobile_experience',
      },
      {
        keywords: ['report', 'analytics', 'dashboard', 'data'],
        theme: 'Limited reporting capabilities',
        category: 'reporting',
      },
      {
        keywords: ['slow', 'performance', 'downtime', 'outage'],
        theme: 'Platform performance issues',
        category: 'performance',
      },
      {
        keywords: ['ux', 'ui', 'design', 'confusing', 'intuitive'],
        theme: 'Poor user experience design',
        category: 'ux_design',
      },
    ];

    themePatterns.forEach(pattern => {
      const matches = pattern.keywords.filter(kw => feedbackText.includes(kw));
      if (matches.length > 0) {
        const evidence = feedback.filter(f => 
          matches.some(kw => f.toLowerCase().includes(kw))
        ).slice(0, 3);
        
        if (evidence.length > 0) {
          themes.push({
            theme: pattern.theme,
            category: pattern.category,
            supportingEvidence: evidence,
            severityScore: Math.min(10, matches.length * 2 + evidence.length),
          });
        }
      }
    });

    return themes.sort((a, b) => b.severityScore - a.severityScore).slice(0, 5);
  }

  async generateReasoningChains(signals: Signal[], painThemes: PainTheme[]): Promise<ReasoningChain[]> {
    const chains: ReasoningChain[] = [];

    // Generate chains from funding signals
    const fundingSignals = signals.filter(s => s.type === 'funding');
    if (fundingSignals.length > 0) {
      chains.push({
        observation: fundingSignals[0].evidenceText,
        inference: 'Company is in growth phase with fresh capital to invest',
        opportunity: 'High willingness to invest in external expertise to accelerate product development',
        confidence: 'high',
      });
    }

    // Generate chains from hiring signals
    const hiringSignals = signals.filter(s => s.type === 'hiring');
    if (hiringSignals.length > 0) {
      chains.push({
        observation: `Actively hiring for ${hiringSignals.length} engineering positions`,
        inference: 'Scaling technical team indicates growing product demands',
        opportunity: 'Can provide immediate engineering capacity while they ramp up permanent hires',
        confidence: 'high',
      });
    }

    // Generate chains from top pain themes
    if (painThemes.length > 0) {
      const topPain = painThemes[0];
      chains.push({
        observation: `Customers reporting ${topPain.theme} (severity: ${topPain.severityScore}/10)`,
        inference: 'User experience issues impacting customer satisfaction and retention',
        opportunity: `Alfabolt can rapidly address ${topPain.category} challenges with proven fintech experience`,
        confidence: 'medium',
      });
    }

    if (painThemes.length > 1) {
      const secondPain = painThemes[1];
      chains.push({
        observation: `Multiple pain points including ${secondPain.theme}`,
        inference: 'Platform maturity gaps requiring specialized expertise',
        opportunity: 'Comprehensive platform improvement engagement addressing multiple pain areas',
        confidence: 'medium',
      });
    }

    return chains;
  }

  async generateWhyNow(reasoningChains: ReasoningChain[], signals: Signal[]): Promise<string> {
    const fundingSignal = signals.find(s => s.type === 'funding');
    const hiringSignals = signals.filter(s => s.type === 'hiring');
    
    let whyNow = '';
    
    if (fundingSignal) {
      whyNow += 'Fresh funding provides capital and organizational momentum to tackle technical debt and scale product capabilities. ';
    }
    
    if (hiringSignals.length > 0) {
      whyNow += `Active hiring across ${hiringSignals.length} engineering roles signals urgent need for technical capacity. `;
    }
    
    if (reasoningChains.length > 0) {
      whyNow += 'Window is open to engage before internal priorities shift or competitors capture market opportunity.';
    } else {
      whyNow += 'Current growth trajectory and customer feedback indicate readiness for external partnership.';
    }
    
    return whyNow.trim();
  }

  async generateOutreachAngle(painThemes: PainTheme[], reasoningChains: ReasoningChain[]): Promise<string> {
    if (painThemes.length === 0) {
      return 'Lead with fintech platform modernization expertise and proven track record.';
    }
    
    const topPain = painThemes[0];
    return `Lead with proven solutions to ${topPain.category} challenges, specifically addressing ${topPain.theme}.`;
  }

  async generateOpeningMessage(
    companyName: string,
    whyNow: string,
    whyAlfabolt: string,
    outreachAngle: string
  ): Promise<string> {
    return `Hi ${companyName} team,

I've been following your growth and noticed you're scaling rapidly. ${whyNow}

${whyAlfabolt}

${outreachAngle}

Would you be open to a brief conversation about how we've helped similar fintech companies accelerate through growth phases?

Best regards,
Alfabolt Team`;
  }
}

/**
 * Get the appropriate LLM provider based on configuration
 */
export function getLLMProvider(): LLMProvider {
  const apiKey = process.env.OPENAI_API_KEY;
  const demoMode = process.env.DEMO_MODE === 'true';
  
  if (apiKey && !demoMode) {
    try {
      return new OpenAIProvider(apiKey);
    } catch (error) {
      console.warn('Failed to initialize OpenAI provider, falling back to mock:', error);
      return new MockLLMProvider();
    }
  }
  
  return new MockLLMProvider();
}
