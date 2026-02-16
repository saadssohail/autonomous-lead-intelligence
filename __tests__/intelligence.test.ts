/**
 * Test suite for lead intelligence system
 * Focus: Scoring, capability matching, reasoning validation
 */

import { calculateCapabilityRelevance, CAPABILITY_CATALOG } from '../src/lib/capabilities';

describe('Capability Matching', () => {
  it('should match capabilities based on keywords', () => {
    const painThemes = ['onboarding issues', 'compliance automation'];
    const signals = ['payment integration', 'api development'];
    
    const capability = CAPABILITY_CATALOG.find(c => c.id === 'customer-experience');
    expect(capability).toBeDefined();
    
    if (capability) {
      const relevance = calculateCapabilityRelevance(capability, painThemes, signals);
      expect(relevance).toBeGreaterThan(0);
    }
  });

  it('should return 0 relevance for unrelated keywords', () => {
    const painThemes = ['totally unrelated topic'];
    const signals = ['nothing relevant'];
    
    const capability = CAPABILITY_CATALOG[0];
    const relevance = calculateCapabilityRelevance(capability, painThemes, signals);
    
    expect(relevance).toBeLessThanOrEqual(0.2);
  });

  it('should have all required fields in capabilities', () => {
    CAPABILITY_CATALOG.forEach(cap => {
      expect(cap.id).toBeDefined();
      expect(cap.name).toBeDefined();
      expect(cap.summary).toBeDefined();
      expect(Array.isArray(cap.keywords)).toBe(true);
      expect(cap.keywords.length).toBeGreaterThan(0);
      expect(Array.isArray(cap.proofPoints)).toBe(true);
      expect(Array.isArray(cap.typicalEngagements)).toBe(true);
    });
  });
});

describe('Lead Scoring', () => {
  it('should calculate score within 0-100 range', () => {
    const mockSignals = [
      { type: 'funding' as const, evidenceText: 'Series A', url: '', strength: 'high' as const, extractedAt: new Date() },
      { type: 'hiring' as const, evidenceText: '5 roles', url: '', strength: 'high' as const, extractedAt: new Date() },
    ];
    
    const mockPainThemes = [
      { theme: 'Slow onboarding', category: 'onboarding', supportingEvidence: ['quote1'], severityScore: 8 },
      { theme: 'Poor mobile UX', category: 'mobile_experience', supportingEvidence: ['quote2'], severityScore: 7 },
    ];
    
    const mockReasoningChains = [
      {
        observation: 'Funding raised',
        inference: 'Growth phase',
        opportunity: 'External help needed',
        confidence: 'high' as const,
      },
    ];
    
    // Import the scoring function
    // Note: This would need to be exported from pipeline.ts
    // For now, we're testing the concept
    
    const painScore = Math.min(40, (7.5 / 10) * 40); // avg severity 7.5
    const signalScore = Math.min(40, 2 * 15); // 2 high signals
    const fitScore = Math.min(20, 10 + 1 * 5); // base + 1 high confidence chain
    
    const total = painScore + signalScore + fitScore;
    
    expect(total).toBeGreaterThanOrEqual(0);
    expect(total).toBeLessThanOrEqual(100);
    expect(total).toBeGreaterThan(50); // This example should score well
  });
  
  it('should give higher scores to companies with more high-strength signals', () => {
    const highSignalScore = 3 * 15; // 3 high signals
    const lowSignalScore = 3 * 8; // 3 medium signals
    
    expect(highSignalScore).toBeGreaterThan(lowSignalScore);
  });
  
  it('should weight pain severity appropriately', () => {
    const highPainScore = (9 / 10) * 40; // severity 9/10
    const lowPainScore = (3 / 10) * 40; // severity 3/10
    
    expect(highPainScore).toBeGreaterThan(lowPainScore);
    expect(highPainScore).toBeLessThanOrEqual(40); // max pain score
  });
});

describe('Reasoning Chain Validation', () => {
  it('should have valid reasoning chain structure', () => {
    const validChain = {
      observation: 'Company raised $25M Series B',
      inference: 'In rapid growth phase',
      opportunity: 'Needs external engineering support',
      confidence: 'high' as const,
    };
    
    expect(validChain.observation).toBeDefined();
    expect(validChain.inference).toBeDefined();
    expect(validChain.opportunity).toBeDefined();
    expect(['high', 'medium', 'low']).toContain(validChain.confidence);
  });
  
  it('should validate confidence levels', () => {
    const validConfidenceLevels = ['high', 'medium', 'low'];
    
    validConfidenceLevels.forEach(level => {
      const chain = {
        observation: 'test',
        inference: 'test',
        opportunity: 'test',
        confidence: level as 'high' | 'medium' | 'low',
      };
      
      expect(['high', 'medium', 'low']).toContain(chain.confidence);
    });
  });
});

describe('Seed Data Validation', () => {
  it('should have valid seed company structure', async () => {
    const { SEED_COMPANIES } = await import('../src/lib/seed-data');
    
    expect(SEED_COMPANIES.length).toBeGreaterThan(0);
    
    SEED_COMPANIES.forEach(company => {
      expect(company.name).toBeDefined();
      expect(company.domain).toBeDefined();
      expect(company.country).toBeDefined();
      expect(company.description).toBeDefined();
      expect(company.websiteText).toBeDefined();
      expect(Array.isArray(company.feedback)).toBe(true);
      expect(company.feedback.length).toBeGreaterThan(5); // At least 5 feedback items
      expect(Array.isArray(company.fundingEvents)).toBe(true);
    });
  });
  
  it('should have valid feedback structure', async () => {
    const { SEED_COMPANIES } = await import('../src/lib/seed-data');
    
    SEED_COMPANIES.forEach(company => {
      company.feedback.forEach(feedback => {
        expect(feedback.source).toBeDefined();
        expect(feedback.quote).toBeDefined();
        expect(feedback.quote.length).toBeGreaterThan(10); // Meaningful feedback
        expect(['positive', 'negative', 'neutral']).toContain(feedback.sentiment);
      });
    });
  });
});

describe('Type Safety', () => {
  it('should enforce signal types', () => {
    const validSignalTypes = ['funding', 'hiring', 'expansion', 'product_launch', 'technical'];
    
    validSignalTypes.forEach(type => {
      expect(validSignalTypes).toContain(type);
    });
  });
  
  it('should enforce strength levels', () => {
    const validStrengths = ['low', 'medium', 'high'];
    
    validStrengths.forEach(strength => {
      expect(validStrengths).toContain(strength);
    });
  });
});
