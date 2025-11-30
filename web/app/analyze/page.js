'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const COLORS = ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444'];
const PIE_COLORS = ['#8b5cf6', '#6366f1', '#3b82f6', '#06b6d4', '#14b8a6', '#22c55e', '#84cc16', '#eab308'];

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

  const getGrade = (score) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-white/5 px-6 py-4 backdrop-blur-md bg-black/20 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold gradient-text">
            AI Commit
          </Link>
          <div className="flex gap-6">
            <Link href="/" className="nav-link text-gray-400 hover:text-white transition">
              Generator
            </Link>
            <Link href="/analyze" className="nav-link active text-white font-medium">
              Analyzer
            </Link>
          </div>
        </div>
      </nav>

      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mb-6">
            Repository Analysis
          </div>
          <h1 className="text-5xl font-bold mb-4">
            <span className="gradient-text">Analyze Your Commits</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Get insights into commit message quality across your entire repository
          </p>
        </div>

        <div className="flex gap-4 mb-12 max-w-2xl mx-auto">
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
            className="input-field flex-1 rounded-xl px-5 py-4 text-white placeholder-gray-500"
          />
          <button
            onClick={analyzeRepo}
            disabled={loading || !repoUrl}
            className="btn-primary px-8 py-4 rounded-xl font-medium text-white disabled:opacity-50"
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
              <div className="stat-card rounded-xl p-6 text-center">
                <div className={`text-5xl font-bold ${getGradeColor(data.averageScore)}`}>
                  {getGrade(data.averageScore)}
                </div>
                <div className={`text-2xl font-semibold ${getGradeColor(data.averageScore)} mt-1`}>
                  {data.averageScore}/100
                </div>
                <div className="text-gray-400 text-sm mt-2">Average Score</div>
              </div>
              <div className="stat-card rounded-xl p-6 text-center">
                <div className="text-4xl font-bold text-white">{data.totalCommits}</div>
                <div className="text-gray-400 text-sm mt-2">Total Commits</div>
              </div>
              <div className="stat-card rounded-xl p-6 text-center">
                <div className="text-4xl font-bold text-green-400">{data.goodCommits}</div>
                <div className="text-gray-400 text-sm mt-2">Good (80+)</div>
              </div>
              <div className="stat-card rounded-xl p-6 text-center">
                <div className="text-4xl font-bold text-red-400">{data.badCommits}</div>
                <div className="text-gray-400 text-sm mt-2">Needs Work (&lt;60)</div>
              </div>
            </div>

            <div className="card-glow rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-6">Score Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.trend.map((score, i) => ({ index: i + 1, score }))}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="index" stroke="#4b5563" fontSize={12} />
                  <YAxis domain={[0, 100]} stroke="#4b5563" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#9ca3af' }}
                    itemStyle={{ color: '#a78bfa' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fill="url(#scoreGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="card rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-6">Score Distribution</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.distribution} layout="vertical">
                    <XAxis type="number" stroke="#4b5563" fontSize={12} />
                    <YAxis dataKey="range" type="category" stroke="#4b5563" fontSize={12} width={60} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      labelStyle={{ color: '#9ca3af' }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {data.distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-6">Commit Types</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={data.typeBreakdown}
                      dataKey="count"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {data.typeBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Commits</h3>
              <div className="space-y-2">
                {data.recentCommits.map((commit, i) => (
                  <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-800 last:border-0">
                    <div className={`w-14 h-14 rounded-lg flex items-center justify-center text-xl font-bold ${
                      commit.score >= 80 ? 'bg-green-900/50 text-green-400' :
                      commit.score >= 60 ? 'bg-yellow-900/50 text-yellow-400' :
                      'bg-red-900/50 text-red-400'
                    }`}>
                      {commit.score}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm text-gray-300 truncate">
                        {commit.message}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{commit.author}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {data.contributors && data.contributors.length > 0 && (
              <div className="card rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Contributor Leaderboard</h3>
                <div className="space-y-3">
                  {data.contributors.map((contributor, i) => (
                    <div key={i} className="flex items-center gap-4 py-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        i === 0 ? 'bg-yellow-500 text-black' :
                        i === 1 ? 'bg-gray-400 text-black' :
                        i === 2 ? 'bg-amber-700 text-white' :
                        'bg-gray-800 text-gray-400'
                      }`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 text-gray-300">{contributor.name}</div>
                      <div className="text-sm text-gray-500">{contributor.commits} commits</div>
                      <div className={`w-20 text-center py-1 px-2 rounded font-bold ${
                        contributor.avgScore >= 80 ? 'bg-green-900/50 text-green-400' :
                        contributor.avgScore >= 60 ? 'bg-yellow-900/50 text-yellow-400' :
                        'bg-red-900/50 text-red-400'
                      }`}>
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
