import { NextResponse } from 'next/server';

const COMMIT_TYPES = ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'perf', 'ci', 'build', 'revert'];

function scoreCommitMessage(message) {
  const lines = message.split('\n');
  const subject = lines[0] || '';
  
  const scores = { format: 0, length: 0, clarity: 0, type: 0, mood: 0 };

  const conventionalMatch = subject.match(/^(\w+)(\(.+\))?:\s*.+/);
  if (conventionalMatch) {
    scores.format = 25;
    const type = conventionalMatch[1].toLowerCase();
    if (COMMIT_TYPES.includes(type)) {
      scores.type = 15;
    }
  }

  if (subject.length > 0 && subject.length <= 50) {
    scores.length = 20;
  } else if (subject.length <= 72) {
    scores.length = 15;
  } else {
    scores.length = 5;
  }

  const firstWord = subject.split(/[:\s]+/).pop()?.split(' ')[0]?.toLowerCase() || '';
  const badMoods = ['added', 'fixed', 'updated', 'changed', 'removed'];
  if (!badMoods.includes(firstWord)) {
    scores.mood = 15;
  }

  const vagueWords = ['stuff', 'things', 'misc', 'wip'];
  const subjectLower = subject.toLowerCase();
  const isVague = vagueWords.some(w => subjectLower === w || subjectLower.includes(w));
  if (!isVague && subject.length > 10) {
    scores.clarity = 25;
  } else if (!isVague) {
    scores.clarity = 15;
  } else {
    scores.clarity = 5;
  }

  return Object.values(scores).reduce((a, b) => a + b, 0);
}

function extractCommitType(message) {
  const match = message.match(/^(\w+)(\(.+\))?:/);
  if (match && COMMIT_TYPES.includes(match[1].toLowerCase())) {
    return match[1].toLowerCase();
  }
  return 'other';
}

function parseGitHubUrl(url) {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
}

export async function POST(request) {
  try {
    const { repoUrl } = await request.json();

    if (!repoUrl) {
      return NextResponse.json({ error: 'Repository URL required' }, { status: 400 });
    }

    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 });
    }

    const { owner, repo } = parsed;

    // Fetch commits from GitHub API
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?per_page=100`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'AI-Commit-Analyzer',
          ...(process.env.GITHUB_TOKEN && { 'Authorization': `token ${process.env.GITHUB_TOKEN}` })
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
      }
      if (response.status === 403) {
        return NextResponse.json({ error: 'Rate limited. Try again later.' }, { status: 403 });
      }
      return NextResponse.json({ error: 'Failed to fetch repository' }, { status: 500 });
    }

    const commits = await response.json();

    if (!commits.length) {
      return NextResponse.json({ error: 'No commits found' }, { status: 404 });
    }

    // Analyze commits
    const analyzed = commits.map(c => ({
      message: c.commit.message.split('\n')[0],
      author: c.commit.author?.name || 'Unknown',
      score: scoreCommitMessage(c.commit.message),
      type: extractCommitType(c.commit.message)
    }));

    const scores = analyzed.map(c => c.score);
    const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    // Distribution
    const distribution = [
      { range: '90-100', count: scores.filter(s => s >= 90).length },
      { range: '80-89', count: scores.filter(s => s >= 80 && s < 90).length },
      { range: '70-79', count: scores.filter(s => s >= 70 && s < 80).length },
      { range: '60-69', count: scores.filter(s => s >= 60 && s < 70).length },
      { range: '0-59', count: scores.filter(s => s < 60).length },
    ];

    // Type breakdown
    const typeCounts = {};
    analyzed.forEach(c => {
      typeCounts[c.type] = (typeCounts[c.type] || 0) + 1;
    });
    const typeBreakdown = Object.entries(typeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Trend (last 30)
    const trend = analyzed.slice(0, 30).reverse().map(c => c.score);

    // Contributors
    const contributorMap = {};
    analyzed.forEach(c => {
      if (!contributorMap[c.author]) {
        contributorMap[c.author] = { scores: [], commits: 0 };
      }
      contributorMap[c.author].scores.push(c.score);
      contributorMap[c.author].commits++;
    });

    const contributors = Object.entries(contributorMap)
      .map(([name, data]) => ({
        name,
        commits: data.commits,
        avgScore: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 10);

    return NextResponse.json({
      totalCommits: commits.length,
      averageScore,
      goodCommits: scores.filter(s => s >= 80).length,
      badCommits: scores.filter(s => s < 60).length,
      distribution,
      typeBreakdown,
      trend,
      recentCommits: analyzed.slice(0, 10),
      contributors
    });

  } catch (error) {
    console.error('Analyze error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
