'use client';

import { useState } from 'react';
import Link from 'next/link';

const EXAMPLE_DIFF = `diff --git a/src/auth.js b/src/auth.js
index 1234567..abcdefg 100644
--- a/src/auth.js
+++ b/src/auth.js
@@ -15,6 +15,20 @@ export async function login(email, password) {
   return { token, user };
 }

+export async function refreshToken(token) {
+  const decoded = jwt.verify(token, process.env.JWT_SECRET);
+  if (decoded.exp - Date.now() / 1000 < 300) {
+    const newToken = jwt.sign(
+      { userId: decoded.userId },
+      process.env.JWT_SECRET,
+      { expiresIn: '1h' }
+    );
+    return newToken;
+  }
+  return token;
+}
+
 export async function logout(userId) {
   await redis.del(\`session:\${userId}\`);
 }`;

export default function Home() {
  const [diff, setDiff] = useState(EXAMPLE_DIFF);
  const [message, setMessage] = useState('');
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('generate');

  const generateMessage = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diff })
      });
      const data = await res.json();
      setMessage(data.message);
      setScore(data.score);
    } catch (err) {
      setMessage('Error: ' + err.message);
    }
    setLoading(false);
  };

  const scoreMessage = async () => {
    if (!message) return;
    setLoading(true);
    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      const data = await res.json();
      setScore(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen text-white">
      <nav className="border-b border-white/5 px-6 py-4 backdrop-blur-md bg-black/20 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold gradient-text">AI Commit</Link>
          <div className="flex gap-6">
            <Link href="/" className="nav-link active text-white font-medium">Generator</Link>
            <Link href="/analyze" className="nav-link text-gray-400 hover:text-white transition">Analyzer</Link>
          </div>
        </div>
      </nav>

      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="inline-block px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm mb-6">
          Powered by AI
        </div>
        <h2 className="text-6xl font-bold mb-6 leading-tight">
          <span className="gradient-text">Smart Commit Messages</span>
          <br />
          <span className="text-white">in Seconds</span>
        </h2>
        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Generate meaningful, conventional commit messages from your git diff. 
          Multi-provider support with quality scoring.
        </p>
        <div className="flex gap-4 justify-center items-center">
          <code className="card px-5 py-2.5 rounded-lg text-sm font-mono text-purple-300">
            npm install -g ai-commit
          </code>
          <span className="text-gray-600">or</span>
          <button 
            onClick={() => document.getElementById('demo').scrollIntoView({ behavior: 'smooth' })}
            className="btn-primary px-6 py-2.5 rounded-lg font-medium"
          >
            Try Online
          </button>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          <div className="stat-card p-6 rounded-xl">
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center text-2xl mb-4">
              &#9889;
            </div>
            <h3 className="text-lg font-semibold mb-2 text-white">Multi-Provider</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              OpenAI, Anthropic Claude, or local Ollama. Choose your preferred AI.
            </p>
          </div>
          <div className="stat-card p-6 rounded-xl">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center text-2xl mb-4">
              &#9733;
            </div>
            <h3 className="text-lg font-semibold mb-2 text-white">Quality Scoring</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Score your commits and get actionable improvement suggestions.
            </p>
          </div>
          <div className="stat-card p-6 rounded-xl">
            <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center text-2xl mb-4">
              &#128736;
            </div>
            <h3 className="text-lg font-semibold mb-2 text-white">Conventional Commits</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Follows the standard format. Clean git history, every time.
            </p>
          </div>
        </div>

        <div id="demo" className="card-glow rounded-2xl overflow-hidden">
          <div className="flex border-b border-white/5">
            <button
              onClick={() => setActiveTab('generate')}
              className={`px-6 py-4 text-sm font-medium transition relative ${
                activeTab === 'generate' 
                  ? 'text-white bg-white/5' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Generate Message
              {activeTab === 'generate' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('score')}
              className={`px-6 py-4 text-sm font-medium transition relative ${
                activeTab === 'score' 
                  ? 'text-white bg-white/5' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Score Message
              {activeTab === 'score' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500" />
              )}
            </button>
          </div>

          <div className="p-8">
            {activeTab === 'generate' ? (
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm text-gray-400 mb-3 font-medium">
                    Git Diff
                  </label>
                  <textarea
                    value={diff}
                    onChange={(e) => setDiff(e.target.value)}
                    className="input-field w-full h-80 rounded-xl p-4 text-sm font-mono text-gray-300 resize-none"
                    placeholder="Paste your git diff here..."
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-3 font-medium">
                    Generated Message
                  </label>
                  <div className="input-field h-80 rounded-xl p-4 overflow-auto">
                    {message ? (
                      <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap">
                        {message}
                      </pre>
                    ) : (
                      <p className="text-gray-600 text-sm">
                        Click generate to create a commit message
                      </p>
                    )}
                    {score && (
                      <div className="mt-4 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-gray-400 text-sm">Score:</span>
                          <span className={`text-lg font-bold px-3 py-1 rounded-lg ${
                            score.total >= 80 ? 'score-badge text-green-400' : 
                            score.total >= 60 ? 'score-badge warning text-yellow-400' : 
                            'score-badge danger text-red-400'
                          }`}>
                            {score.total}/100
                          </span>
                        </div>
                        {score.feedback?.length > 0 && (
                          <ul className="text-xs text-gray-500 space-y-1">
                            {score.feedback.map((f, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-purple-400">-</span> {f}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-xl mx-auto">
                <label className="block text-sm text-gray-400 mb-3 font-medium">
                  Commit Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="input-field w-full h-32 rounded-xl p-4 text-sm font-mono text-gray-300 resize-none mb-6"
                  placeholder="Enter a commit message to score..."
                />
                {score && (
                  <div className="card rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-gray-400">Score</span>
                      <span className={`text-3xl font-bold ${
                        score.total >= 80 ? 'text-green-400' : 
                        score.total >= 60 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {score.total}/100
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-3 text-xs text-center mb-6">
                      {Object.entries(score.scores || {}).map(([key, val]) => (
                        <div key={key} className="bg-white/5 rounded-lg p-3">
                          <div className="text-gray-500 capitalize mb-1">{key}</div>
                          <div className="text-white font-semibold">{val}</div>
                        </div>
                      ))}
                    </div>
                    {score.feedback?.length > 0 && (
                      <div className="text-sm">
                        <p className="font-medium mb-2 text-gray-300">Suggestions:</p>
                        <ul className="text-xs text-gray-500 space-y-1.5">
                          {score.feedback.map((f, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-purple-400">-</span> {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="mt-8 text-center">
              <button
                onClick={activeTab === 'generate' ? generateMessage : scoreMessage}
                disabled={loading}
                className="btn-primary px-10 py-3.5 rounded-xl font-medium text-white disabled:opacity-50"
              >
                {loading ? 'Processing...' : activeTab === 'generate' ? 'Generate' : 'Score'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 px-6 py-10 text-center">
        <p className="text-gray-500 text-sm">Built for Vibecoding Hackathon</p>
      </footer>
    </main>
  );
}
