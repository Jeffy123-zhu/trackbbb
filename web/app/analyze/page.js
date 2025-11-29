'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AnalyzePage() {
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const analyzeRepo = async () => {
    if (!repoUrl) return;
    
    setLoading(true);
    setError('');
    setData(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl })
      });
      
      const result = await res.json();
      
      if (result.error) {
        setError(result.error);
      } else {
        setData(result);
      }
    } catch (err) {
      setError('Failed to analyze repository');
    }
    
    setLoading(false);
  };

  const getGradeColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getBarColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold hover:text-gray-300 transition">
            AI Commit
          </Link>
          <div className="flex gap-6">
            <Link href="/" className="text-gray-400 hover:text-white transition">
              Generator
            </Link>
            <Link href="/analyze" className="text-white font-medium">
              Analyzer
            </Link>
          </div>
        </div>
      </nav>

      <section className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-4">Repository Analyzer</h1>
        <p className="text-gray-400 mb-8">
          Analyze commit message quality across your entire repository
        </p>

        <div className="flex gap-4 mb-12">
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
          />
          <button
            onClick={analyzeRepo}
            disabled={loading || !repoUrl}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-8 py-3 rounded-lg font-medium transition disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 mb-8 text-red-400">
            {error}
          </div>
        )}

        {data && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 text-center">
                <div className={`text-4xl font-bold ${getGradeColor(data.averageScore)}`}>
                  {data.averageScore}
                </div>
                <div className="text-gray-400 text-sm mt-1">Average Score</div>
              </div>
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 text-center">
                <div className="text-4xl font-bold text-white">{data.totalCommits}</div>
                <div className="text-gray-400 text-sm mt-1">Total Commits</div>
              </div>
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 text-center">
                <div className="text-4xl font-bold text-green-400">{data.goodCommits}</div>
                <div className="text-gray-400 text-sm mt-1">Good (80+)</div>
              </div>
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 text-center">
                <div className="text-4xl font-bold text-red-400">{data.badCommits}</div>
                <div className="text-gray-400 text-sm mt-1">Needs Work (&lt;60)</div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h3 className="text-lg font-semibold mb-4">Score Distribution</h3>
                <div className="space-y-3">
                  {data.distribution.map((item) => (
                    <div key={item.range} className="flex items-center gap-3">
                      <div className="w-20 text-sm text-gray-400">{item.range}</div>
                      <div className="flex-1 bg-gray-800 rounded-full h-6 overflow-hidden">
                        <div
                          className={`h-full ${getBarColor(parseInt(item.range))} transition-all duration-500`}
                          style={{ width: `${(item.count / data.totalCommits) * 100}%` }}
                        />
                      </div>
                      <div className="w-12 text-sm text-right text-gray-400">{item.count}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h3 className="text-lg font-semibold mb-4">Commit Types</h3>
                <div className="space-y-3">
                  {data.typeBreakdown.map((item) => (
                    <div key={item.type} className="flex items-center gap-3">
                      <div className="w-20 text-sm text-gray-400 font-mono">{item.type}</div>
                      <div className="flex-1 bg-gray-800 rounded-full h-6 overflow-hidden">
                        <div
                          className="h-full bg-purple-500 transition-all duration-500"
                          style={{ width: `${(item.count / data.totalCommits) * 100}%` }}
                        />
                      </div>
                      <div className="w-12 text-sm text-right text-gray-400">{item.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h3 className="text-lg font-semibold mb-4">Score Trend (Last 30 Commits)</h3>
              <div className="h-48 flex items-end gap-1">
                {data.trend.map((score, i) => (
                  <div
                    key={i}
                    className={`flex-1 ${getBarColor(score)} rounded-t transition-all duration-300 hover:opacity-80`}
                    style={{ height: `${score}%` }}
                    title={`Score: ${score}`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Older</span>
                <span>Recent</span>
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Commits</h3>
              <div className="space-y-2">
                {data.recentCommits.map((commit, i) => (
                  <div key={i} className="flex items-center gap-4 py-2 border-b border-gray-800 last:border-0">
                    <div className={`w-12 text-center font-bold ${getGradeColor(commit.score)}`}>
                      {commit.score}
                    </div>
                    <div className="flex-1 font-mono text-sm text-gray-300 truncate">
                      {commit.message}
                    </div>
                    <div className="text-xs text-gray-500">{commit.author}</div>
                  </div>
                ))}
              </div>
            </div>

            {data.contributors && data.contributors.length > 0 && (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h3 className="text-lg font-semibold mb-4">Contributor Leaderboard</h3>
                <div className="space-y-2">
                  {data.contributors.map((contributor, i) => (
                    <div key={i} className="flex items-center gap-4 py-2 border-b border-gray-800 last:border-0">
                      <div className="w-8 text-center text-gray-500 font-bold">#{i + 1}</div>
                      <div className="flex-1 text-gray-300">{contributor.name}</div>
                      <div className="text-sm text-gray-500">{contributor.commits} commits</div>
                      <div className={`w-16 text-center font-bold ${getGradeColor(contributor.avgScore)}`}>
                        {contributor.avgScore}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
