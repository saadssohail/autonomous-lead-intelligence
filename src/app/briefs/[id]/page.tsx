'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { Brief } from '@/types';

export default function BriefDetailPage() {
  const params = useParams();
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBrief = useCallback(async () => {
    try {
      const response = await fetch(`/api/briefs/${params.id}`);
      const data = await response.json();
      
      if (data.success) {
        setBrief(data.brief);
      } else {
        setError(data.error || 'Failed to load brief');
      }
    } catch (err) {
      setError('Failed to load brief');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadBrief();
  }, [loadBrief]);

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

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-blue-200">Loading brief...</p>
        </div>
      </main>
    );
  }

  if (error || !brief) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto bg-red-500/20 border border-red-500 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
            <p className="text-red-200 mb-6">{error || 'Brief not found'}</p>
            <Link href="/accounts" className="text-blue-400 hover:text-blue-300">
              ← Back to Accounts
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/accounts" className="text-blue-400 hover:text-blue-300">
            ← Back to Accounts
          </Link>
          <button
            onClick={downloadJSON}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
          >
            Download JSON
          </button>
        </div>

        {/* Content - Reuse same structure as analyze page */}
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Company Header */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {brief.snapshot.name}
                </h1>
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
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-blue-400/30">
              <h3 className="text-white font-semibold mb-2">Score Rationale</h3>
              <ul className="text-sm text-blue-200 space-y-1">
                {(brief.score.rationale || []).map((reason, idx) => (
                  <li key={idx}>• {reason}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Signals */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">🔔 Key Signals</h2>
            {(brief.signals || []).length === 0 ? (
              <p className="text-blue-300 italic">No signals detected for this company.</p>
            ) : (
              <div className="space-y-3">
                {(brief.signals || []).map((signal, idx) => (
                  <div key={idx} className="bg-white/5 rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-blue-400 font-semibold capitalize">
                        {(signal.type || '').replace('_', ' ')}
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
            )}
          </div>

          {/* Pain Themes */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">💊 Customer Pain Themes</h2>
            {(brief.painThemes || []).length === 0 ? (
              <p className="text-blue-300 italic">No pain themes detected for this company.</p>
            ) : (
              <div className="space-y-4">
                {(brief.painThemes || []).map((pain, idx) => (
                  <div key={idx} className="bg-white/5 rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-red-400 font-semibold">{pain.theme}</span>
                      <span className="text-sm text-red-300">
                        Severity: {(pain.severityScore ?? 0).toFixed(1)}/10
                      </span>
                    </div>
                    <div className="text-sm text-blue-200 mb-2">
                      Category: {(pain.category || '').replace('_', ' ')}
                    </div>
                    {pain.supportingEvidence && pain.supportingEvidence.length > 0 && (
                      <div className="text-sm text-blue-100">
                        <div className="font-semibold mb-1">Evidence:</div>
                        <ul className="space-y-1 pl-4">
                          {pain.supportingEvidence.slice(0, 3).map((evidence: string, eidx: number) => (
                            <li key={eidx} className="italic">
                              &quot;{evidence.length > 100 ? evidence.slice(0, 100) + '...' : evidence}&quot;
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reasoning Chains */}
          {(brief.reasoningChains || []).length > 0 && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">🧠 Reasoning Chains</h2>
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
          )}

          {/* Why Now & Why Alfabolt */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">⏰ Why Now</h2>
              <p className="text-blue-100 leading-relaxed">{brief.whyNow}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">🎯 Why Alfabolt</h2>
              <p className="text-blue-100 leading-relaxed">{brief.whyAlfabolt}</p>
            </div>
          </div>

          {/* Outreach */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">📧 Recommended Outreach</h2>
            {brief.outreachAngle && (
              <div className="mb-4">
                <span className="text-blue-400 font-semibold">Angle:</span>
                <p className="text-blue-100 mt-1">{brief.outreachAngle}</p>
              </div>
            )}
            <div>
              <span className="text-blue-400 font-semibold">Opening Message:</span>
              <div className="mt-2 p-4 bg-white/5 rounded border border-blue-400/30">
                <pre className="text-blue-100 whitespace-pre-wrap font-sans text-sm">
                  {brief.openingMessage}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
