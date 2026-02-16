'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { BriefSummary } from '@/types';

export default function AccountsPage() {
  const [briefs, setBriefs] = useState<BriefSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'score' | 'createdAt'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const loadBriefs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/briefs?sortBy=${sortBy}&sortOrder=${sortOrder}`);
      const data = await response.json();
      
      if (data.success) {
        setBriefs(data.briefs);
      }
    } catch (error) {
      console.error('Failed to load briefs:', error);
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortOrder]);

  useEffect(() => {
    loadBriefs();
  }, [loadBriefs]);

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 70) return 'bg-green-500/20 border-green-500';
    if (score >= 50) return 'bg-yellow-500/20 border-yellow-500';
    return 'bg-orange-500/20 border-orange-500';
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-blue-400 hover:text-blue-300">
            ← Back to Home
          </Link>
          <Link href="/analyze" className="text-green-400 hover:text-green-300">
            Analyze New Company →
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          Prioritized Accounts
        </h1>

        {/* Controls */}
        <div className="max-w-6xl mx-auto bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="text-blue-200">
              Total Accounts: <span className="font-bold text-white">{briefs.length}</span>
            </div>
            
            <div className="flex items-center gap-4">
              <label className="text-blue-200">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'score' | 'createdAt')}
                className="bg-white/20 text-white border border-blue-400 rounded px-3 py-2 focus:outline-none focus:border-blue-300"
              >
                <option value="score">Lead Score</option>
                <option value="createdAt">Date Created</option>
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
              >
                {sortOrder === 'desc' ? '↓ Desc' : '↑ Asc'}
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="max-w-6xl mx-auto text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-blue-200">Loading accounts...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && briefs.length === 0 && (
          <div className="max-w-6xl mx-auto bg-white/10 backdrop-blur-sm rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-bold text-white mb-4">No Accounts Yet</h2>
            <p className="text-blue-200 mb-6">
              Start by analyzing your first company to build your prioritized account list.
            </p>
            <Link
              href="/analyze"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded transition-colors"
            >
              Analyze First Company
            </Link>
          </div>
        )}

        {/* Accounts List */}
        {!loading && briefs.length > 0 && (
          <div className="max-w-6xl mx-auto space-y-4">
            {briefs.map((brief, idx) => (
              <div
                key={brief.id}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-6 hover:bg-white/15 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-blue-400 text-2xl font-bold">
                        #{idx + 1}
                      </span>
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          {brief.companyName}
                        </h3>
                        <p className="text-blue-300 text-sm">{brief.companyDomain}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 space-y-1">
                      <p className="text-blue-200 font-semibold text-sm mb-2">Score Rationale:</p>
                      <ul className="text-sm text-blue-100 space-y-1 pl-4">
                        {brief.scoreRationale.map((reason, ridx) => (
                          <li key={ridx} className="list-disc">{reason}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="mt-4 text-xs text-blue-300">
                      Analyzed: {new Date(brief.createdAt).toLocaleDateString()} at{' '}
                      {new Date(brief.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                  
                  <div className="ml-6 text-right">
                    <div className={`${getScoreBg(brief.score)} border-2 rounded-lg p-4 mb-4`}>
                      <div className={`text-4xl font-bold ${getScoreColor(brief.score)}`}>
                        {brief.score}
                      </div>
                      <div className="text-blue-200 text-sm">Lead Score</div>
                    </div>
                    
                    <Link
                      href={`/briefs/${brief.id}`}
                      className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded transition-colors"
                    >
                      View Full Brief
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
