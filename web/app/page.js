'use client';

import { useState } from 'react';

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
    <main className="min-h-screen">
      <nav className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">AI Commit</h1>
          <a 
            href="https://github.com" 
            target="_blank"
            className="text-gray-400 hover:text-white transition"
          >
            GitHub
          </a>
        </div>
      </nav>

      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h2 className="text-5xl font-bold mb-6">
          <span className="gradient-text">AI-Powered</span> Commit Messages
        </h2>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
          Generate meaningful, conventional commit messages from your git diff. 
          Supports OpenAI, Claude, and local Ollama.
        </p>
        <div className="flex gap-4 justify-center">
          <code className="bg-gray-800 px-4 py-2 rounded-lg text-sm">
            npm install -g ai-commit
          </code>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
            <div className="text-3xl mb-4">&#9889;</div>
            <h3 className="text-lg font-semibold mb-2">Multi-Provider</h3>
            <p className="text-gray-400 text-sm">
              OpenAI, Anthropic Claude, or local Ollama. Your choice.
            </p>
          </div>
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
            <div className="text-3xl mb-4">&#9733;</div>
            <h3 className="text-lg font-semibold mb-2">Quality Scoring</h3>
            <p className="text-gray-400 text-sm">
              Score your commits and get actionable improvement suggestions.
            </p>
          </div>
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
            <div className="text-3xl mb-4">&#128736;</div>
            <h3 className="text-lg font-semibold mb-2">Conventional Commits</h3>
            <p className="text-gray-400 text-sm">
              Follows the standard format. Clean git history, every time.
            </p>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="flex border-b border-gray-800">
            <button
              onClick={() => setActiveTab('generate')}
              className={`px-6 py-3 text-sm font-medium transition ${
                activeTab === 'generate' 
                  ? 'bg-gray-800 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Generate Message
            </button>
            <button
              onClick={() => setActiveTab('score')}
              className={`px-6 py-3 text-sm font-medium transition ${
                activeTab === 'score' 
                  ? 'bg-gray-800 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Score Message
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'generate' ? (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Git Diff
                  </label>
                  <textarea
                    value={diff}
                    onChange={(e) => setDiff(e.target.value)}
                    className="w-full h-80 bg-gray-950 border border-gray-700 rounded-lg p-4 text-sm font-mono text-gray-300 resize-none"
                    placeholder="Paste your git diff here..."
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Generated Message
                  </label>
                  <div className="h-80 bg-gray-950 border border-gray-700 rounded-lg p-4 overflow-auto">
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
                      <div className="mt-4 pt-4 border-t border-gray-800">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-gray-400 text-sm">Score:</span>
                          <span className={`font-bold ${
                            score.total >= 80 ? 'text-green-400' : 
                            score.total >= 60 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {score.total}/100
                          </span>
                        </div>
                        {score.feedback?.length > 0 && (
                          <ul className="text-xs text-gray-500">
                            {score.feedback.map((f, i) => (
                              <li key={i}>- {f}</li>
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
                <label className="block text-sm text-gray-400 mb-2">
                  Commit Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full h-32 bg-gray-950 border border-gray-700 rounded-lg p-4 text-sm font-mono text-gray-300 resize-none mb-4"
                  placeholder="Enter a commit message to score..."
                />
                {score && (
                  <div className="bg-gray-950 border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-gray-400">Score</span>
                      <span className={`text-2xl font-bold ${
                        score.total >= 80 ? 'text-green-400' : 
                        score.total >= 60 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {score.total}/100
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-2 text-xs text-center mb-4">
                      {Object.entries(score.scores || {}).map(([key, val]) => (
                        <div key={key} className="bg-gray-900 rounded p-2">
                          <div className="text-gray-500 capitalize">{key}</div>
                          <div className="text-white font-medium">{val}</div>
                        </div>
                      ))}
                    </div>
                    {score.feedback?.length > 0 && (
                      <div className="text-sm text-gray-400">
                        <p className="font-medium mb-1">Suggestions:</p>
                        <ul className="text-xs text-gray-500 space-y-1">
                          {score.feedback.map((f, i) => (
                            <li key={i}>- {f}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={activeTab === 'generate' ? generateMessage : scoreMessage}
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-8 py-3 rounded-lg font-medium transition disabled:opacity-50"
              >
                {loading ? 'Processing...' : activeTab === 'generate' ? 'Generate' : 'Score'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-800 px-6 py-8 text-center text-gray-500 text-sm">
        Built for Vibecoding Hackathon
      </footer>
    </main>
  );
}
