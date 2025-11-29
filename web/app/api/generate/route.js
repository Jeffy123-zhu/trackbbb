import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const SYSTEM_PROMPT = `You are a git commit message generator. Analyze the provided git diff and generate a clear, concise commit message following the Conventional Commits specification.

Format: <type>(<scope>): <description>

Types:
- feat: A new feature
- fix: A bug fix
- docs: Documentation changes
- style: Code style changes
- refactor: Code refactoring
- test: Adding or updating tests
- chore: Maintenance tasks

Rules:
1. Keep the subject line under 72 characters
2. Use imperative mood ("add" not "added")
3. Don't end with a period
4. Be specific but concise
5. If changes are complex, add a body with bullet points

Only output the commit message, nothing else.`;

function scoreCommitMessage(message) {
  const COMMIT_TYPES = ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'perf', 'ci', 'build', 'revert'];
  const lines = message.split('\n');
  const subject = lines[0] || '';
  
  const scores = { format: 0, length: 0, clarity: 0, type: 0, mood: 0 };
  const feedback = [];

  const conventionalMatch = subject.match(/^(\w+)(\(.+\))?:\s*.+/);
  if (conventionalMatch) {
    scores.format = 25;
    const type = conventionalMatch[1].toLowerCase();
    if (COMMIT_TYPES.includes(type)) {
      scores.type = 15;
    } else {
      feedback.push(`Unknown commit type "${type}"`);
    }
  } else {
    feedback.push('Not following Conventional Commits format');
  }

  if (subject.length > 0 && subject.length <= 50) {
    scores.length = 20;
  } else if (subject.length <= 72) {
    scores.length = 15;
  } else {
    scores.length = 5;
    feedback.push('Subject too long');
  }

  const firstWord = subject.split(/[:\s]+/).pop()?.split(' ')[0]?.toLowerCase() || '';
  const badMoods = ['added', 'fixed', 'updated', 'changed', 'removed'];
  if (!badMoods.includes(firstWord)) {
    scores.mood = 15;
  } else {
    feedback.push('Use imperative mood');
  }

  const vagueWords = ['stuff', 'things', 'misc', 'update', 'fix', 'change'];
  const subjectLower = subject.toLowerCase();
  const isVague = vagueWords.some(w => subjectLower === w || subjectLower.endsWith(`: ${w}`));
  if (!isVague && subject.length > 10) {
    scores.clarity = 25;
  } else {
    scores.clarity = 10;
    feedback.push('Be more specific');
  }

  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  return { total, scores, feedback };
}

export async function POST(request) {
  try {
    const { diff } = await request.json();

    if (!diff) {
      return NextResponse.json({ error: 'No diff provided' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Demo mode: return a mock response
      const mockMessage = 'feat(auth): add token refresh mechanism';
      return NextResponse.json({
        message: mockMessage,
        score: scoreCommitMessage(mockMessage)
      });
    }

    const openai = new OpenAI({ apiKey });

    let userPrompt = `Generate a commit message for:\n\n${diff}`;
    if (diff.length > 8000) {
      userPrompt = `Generate a commit message for (truncated):\n\n${diff.substring(0, 8000)}...`;
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    const message = response.choices[0].message.content.trim();
    const score = scoreCommitMessage(message);

    return NextResponse.json({ message, score });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
