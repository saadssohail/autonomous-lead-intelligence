'use client';

import { useState, useEffect } from 'react';
import type { LLMInteraction } from '@/lib/llm-provider';

interface LLMDebugPanelProps {
  runId?: string | null;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function LLMDebugPanel({ runId, autoRefresh = true, refreshInterval = 3000 }: LLMDebugPanelProps) {
  const [interactions, setInteractions] = useState<LLMInteraction[]>([]);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [showPanel, setShowPanel] = useState(false);

  const loadInteractions = async () => {
    try {
      const url = runId
        ? `/api/llm-interactions?runId=${encodeURIComponent(runId)}`
        : '/api/llm-interactions';
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setInteractions(data.interactions);
      }
    } catch (error) {
      console.error('Failed to load LLM interactions:', error);
    }
  };

  useEffect(() => {
    if (showPanel) {
      loadInteractions();
      
      if (autoRefresh) {
        const interval = setInterval(loadInteractions, refreshInterval);
        return () => clearInterval(interval);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPanel, autoRefresh, refreshInterval, runId]);

  const toggleExpanded = (index: number) => {
    setExpanded(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const truncate = (text: string, maxLength: number = 100) => {
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
  };

  if (!showPanel) {
    return (
      <button
        onClick={() => setShowPanel(true)}
        className="fixed bottom-4 right-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full shadow-lg z-50 flex items-center gap-2"
      >
        🤖 LLM Debug ({interactions.length})
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 w-full md:w-2/3 lg:w-1/2 h-2/3 bg-slate-900 border-t-2 border-l-2 border-purple-500 shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="bg-purple-600 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold">🤖 LLM Interactions</span>
          <span className="text-sm bg-purple-800 px-2 py-1 rounded">
            {interactions.length} requests
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadInteractions}
            className="bg-purple-700 hover:bg-purple-800 px-3 py-1 rounded text-sm"
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => setShowPanel(false)}
            className="bg-purple-700 hover:bg-purple-800 px-3 py-1 rounded text-sm"
          >
            ✕ Close
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {interactions.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No LLM interactions yet. Run an analysis to see them here.
          </div>
        ) : (
          interactions.map((interaction, index) => (
            <div
              key={index}
              className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden"
            >
              {/* Interaction Header */}
              <div
                className="p-3 cursor-pointer hover:bg-slate-750 flex items-center justify-between"
                onClick={() => toggleExpanded(index)}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-2xl ${interaction.error ? '❌' : '✅'}`}>
                    {interaction.error ? '❌' : '✅'}
                  </span>
                  <div>
                    <div className="font-semibold text-white">
                      {interaction.operation}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(interaction.timestamp).toLocaleTimeString()} • {interaction.duration}ms
                      {interaction.request.model && ` • ${interaction.request.model}`}
                    </div>
                  </div>
                </div>
                <div className="text-gray-400">
                  {expanded[index] ? '▼' : '▶'}
                </div>
              </div>

              {/* Expanded Content */}
              {expanded[index] && (
                <div className="border-t border-slate-700 p-3 space-y-3">
                  {/* Request */}
                  <div>
                    <div className="text-sm font-semibold text-blue-400 mb-1">
                      📤 Request Prompt:
                    </div>
                    <div className="bg-slate-900 p-2 rounded text-xs text-gray-300 font-mono overflow-x-auto max-h-40 overflow-y-auto">
                      <pre className="whitespace-pre-wrap">
                        {interaction.request.prompt}
                      </pre>
                    </div>
                    {interaction.request.temperature !== undefined && (
                      <div className="text-xs text-gray-400 mt-1">
                        Temperature: {interaction.request.temperature}
                      </div>
                    )}
                  </div>

                  {/* Response */}
                  {!interaction.error ? (
                    <div>
                      <div className="text-sm font-semibold text-green-400 mb-1">
                        📥 Response:
                      </div>
                      <div className="bg-slate-900 p-2 rounded text-xs text-gray-300 font-mono overflow-x-auto max-h-40 overflow-y-auto">
                        <pre className="whitespace-pre-wrap">
                          {interaction.response.content}
                        </pre>
                      </div>
                      {interaction.response.parsed && (
                        <div className="mt-2">
                          <div className="text-xs font-semibold text-purple-400 mb-1">
                            Parsed JSON:
                          </div>
                          <div className="bg-slate-900 p-2 rounded text-xs text-gray-300 font-mono overflow-x-auto max-h-32 overflow-y-auto">
                            <pre className="whitespace-pre-wrap">
                              {JSON.stringify(interaction.response.parsed, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="text-sm font-semibold text-red-400 mb-1">
                        ❌ Error:
                      </div>
                      <div className="bg-red-900/20 border border-red-500 p-2 rounded text-xs text-red-200">
                        {interaction.error}
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex gap-4 text-xs text-gray-400 pt-2 border-t border-slate-700">
                    <span>Prompt: {interaction.request.prompt.length} chars</span>
                    <span>Response: {interaction.response.content.length} chars</span>
                    <span>Duration: {interaction.duration}ms</span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
