'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Brief, AnalysisRun } from '@/types';
import LLMDebugPanel from '@/components/LLMDebugPanel';

export default function AnalyzePage() {
  const [companyInput, setCompanyInput] = useState('');
  const [inputType, setInputType] = useState<'domain' | 'name'>('name');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [run, setRun] = useState<AnalysisRun | null>(null);

  const handleAnalyze = async () => {
    if (!companyInput.trim()) {
      setError('Please enter a company name or domain');
      return;
    }

    setLoading(true);
    setError(null);
    setBrief(null);
    setRun(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: {
            [inputType]: companyInput.trim(),
          },
          options: {
            useLiveData: false,
          },
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Analysis failed');
        return;
      }

      setBrief(data.brief);
      setRun(data.run);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze company');
    } finally {
      setLoading(false);
    }
  };

  const downloadJSON = () => {
    if (!brief) return;
    
    const dataStr = JSON.stringify(brief, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${brief.snapshot.name}-intelligence-brief.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-blue-400 hover:text-blue-300">
            ← Back to Home
          </Link>
          <Link href="/accounts" className="text-purple-400 hover:text-purple-300">
            View All Accounts →
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          Analyze Company
        </h1>

        {/* Input Form */}
        <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8">
          <div className="mb-4">
            <label className="block text-blue-200 mb-2">Input Type</label>
            <div className="flex gap-4">
              <label className="flex items-center text-white">
                <input
                  type="radio"
                  value="name"
                  checked={inputType === 'name'}
                  onChange={(e) => setInputType(e.target.value as 'name')}
                  className="mr-2"
                />
                Company Name
              </label>
              <label className="flex items-center text-white">
                <input
                  type="radio"
                  value="domain"
                  checked={inputType === 'domain'}
                  onChange={(e) => setInputType(e.target.value as 'domain')}
                  className="mr-2"
                />
                Domain
              </label>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-blue-200 mb-2">
              {inputType === 'name' ? 'Company Name' : 'Company Domain'}
            </label>
            <input
              type="text"
              value={companyInput}
              onChange={(e) => setCompanyInput(e.target.value)}
              placeholder={inputType === 'name' ? 'e.g., PayFlow' : 'e.g., payflow.example.com'}
              className="w-full px-4 py-3 rounded bg-white/20 text-white placeholder-blue-300 border border-blue-400 focus:outline-none focus:border-blue-300"
              onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white font-semibold py-3 px-6 rounded transition-colors"
          >
            {loading ? 'Analyzing...' : 'Run Analysis'}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500 rounded text-red-200">
              {error}
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-sm rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <div className="text-blue-200">
              <p className="text-xl mb-2">Analyzing company...</p>
              <p className="text-sm">This typically takes 10-30 seconds</p>
            </div>
          </div>
        )}

        {/* Results */}
        {brief && !loading && (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header with Score */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {brief.snapshot.name}
                  </h2>
                  <p className="text-blue-200">{brief.snapshot.domain}</p>
                  {brief.snapshot.description && (
                    <p className="text-blue-300 mt-2">{brief.snapshot.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-5xl font-bold text-blue-400 mb-1">
                    {brief.score.total}
                  </div>
                  <div className="text-blue-200">Lead Score</div>
                  <button
                    onClick={downloadJSON}
                    className="mt-4 bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-4 rounded"
                  >
                    Download JSON
                  </button>
                </div>
              </div>

              {/* Score Rationale */}
              <div className="mt-4 pt-4 border-t border-blue-400/30">
                <h3 className="text-white font-semibold mb-2">Score Breakdown</h3>
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{brief.score.breakdown.painSeverity}</div>
                    <div className="text-sm text-blue-200">Pain Severity</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{brief.score.breakdown.signalStrength}</div>
                    <div className="text-sm text-blue-200">Signal Strength</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{brief.score.breakdown.fitScore}</div>
                    <div className="text-sm text-blue-200">Fit Score</div>
                  </div>
                </div>
                <ul className="text-sm text-blue-200 space-y-1">
                  {brief.score.rationale.map((reason, idx) => (
                    <li key={idx}>• {reason}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Signals */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">🔔 Key Signals Detected</h3>
              <div className="space-y-3">
                {brief.signals.map((signal, idx) => (
                  <div key={idx} className="bg-white/5 rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-blue-400 font-semibold capitalize">
                        {signal.type.replace('_', ' ')}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        signal.strength === 'high' ? 'bg-green-500/30 text-green-200' :
                        signal.strength === 'medium' ? 'bg-yellow-500/30 text-yellow-200' :
                        'bg-gray-500/30 text-gray-200'
                      }`}>
                        {signal.strength}
                      </span>
                    </div>
                    <p className="text-blue-100">{signal.evidenceText}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pain Themes */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">💊 Dominant Customer Pain Themes</h3>
              <div className="space-y-4">
                {brief.painThemes.map((pain, idx) => (
                  <div key={idx} className="bg-white/5 rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-red-400 font-semibold">{pain.theme}</span>
                      <span className="text-sm text-red-300">
                        Severity: {pain.severityScore.toFixed(1)}/10
                      </span>
                    </div>
                    <div className="text-sm text-blue-200 mb-2">
                      Category: {pain.category.replace('_', ' ')}
                    </div>
                    <div className="text-sm text-blue-100">
                      <div className="font-semibold mb-1">Evidence:</div>
                      <ul className="space-y-1 pl-4">
                        {pain.supportingEvidence.slice(0, 3).map((evidence, eidx) => (
                          <li key={eidx} className="italic">
                            "{evidence.length > 100 ? evidence.slice(0, 100) + '...' : evidence}"
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reasoning Chains */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">🧠 Reasoning Chains</h3>
              <div className="space-y-4">
                {brief.reasoningChains.map((chain, idx) => (
                  <div key={idx} className="bg-white/5 rounded p-4">
                    <div className="flex items-center mb-3">
                      <span className={`text-xs px-2 py-1 rounded ${
                        chain.confidence === 'high' ? 'bg-green-500/30 text-green-200' :
                        chain.confidence === 'medium' ? 'bg-yellow-500/30 text-yellow-200' :
                        'bg-gray-500/30 text-gray-200'
                      }`}>
                        {chain.confidence} confidence
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-blue-400 font-semibold">Observation:</span>
                        <span className="text-blue-100 ml-2">{chain.observation}</span>
                      </div>
                      <div className="pl-4">
                        <span className="text-purple-400 font-semibold">→ Inference:</span>
                        <span className="text-blue-100 ml-2">{chain.inference}</span>
                      </div>
                      <div className="pl-8">
                        <span className="text-green-400 font-semibold">→ Opportunity:</span>
                        <span className="text-blue-100 ml-2">{chain.opportunity}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Why Now */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">⏰ Why Now</h3>
              <p className="text-blue-100 leading-relaxed">{brief.whyNow}</p>
            </div>

            {/* Why Alfabolt */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">🎯 Why Alfabolt</h3>
              <p className="text-blue-100 leading-relaxed">{brief.whyAlfabolt}</p>
            </div>

            {/* Outreach */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">📧 Recommended Outreach</h3>
              <div className="mb-4">
                <span className="text-blue-400 font-semibold">Angle:</span>
                <p className="text-blue-100 mt-1">{brief.outreachAngle}</p>
              </div>
              <div>
                <span className="text-blue-400 font-semibold">Opening Message:</span>
                <div className="mt-2 p-4 bg-white/5 rounded border border-blue-400/30">
                  <pre className="text-blue-100 whitespace-pre-wrap font-sans text-sm">
                    {brief.openingMessage}
                  </pre>
                </div>
              </div>
            </div>

            {/* Pipeline Logs */}
            {run && run.logs && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">📊 Pipeline Execution</h3>
                <div className="text-sm text-blue-200 mb-4">
                  Total time: {run.finishedAt && run.startedAt 
                    ? `${((new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()) / 1000).toFixed(2)}s`
                    : 'N/A'
                  }
                </div>
                <div className="space-y-2 text-sm">
                  {run.logs.map((log, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white/5 rounded px-3 py-2">
                      <span className="text-blue-100">{log.step.replace(/_/g, ' ')}</span>
                      <div className="flex items-center gap-3">
                        {log.duration && <span className="text-blue-300">{log.duration}ms</span>}
                        <span className={`px-2 py-1 rounded text-xs ${
                          log.status === 'completed' ? 'bg-green-500/30 text-green-200' :
                          log.status === 'failed' ? 'bg-red-500/30 text-red-200' :
                          'bg-blue-500/30 text-blue-200'
                        }`}>
                          {log.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* LLM Debug Panel */}
      <LLMDebugPanel />
    </main>
  );
}
