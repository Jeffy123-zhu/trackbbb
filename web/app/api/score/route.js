import { NextResponse } from 'next/server';

const COMMIT_TYPES = ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'perf', 'ci', 'build', 'revert'];

function scoreCommitMessage(message) {
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
      feedback.push(`Unknown commit type "${type}". Consider: ${COMMIT_TYPES.slice(0, 5).join(', ')}`);
    }
  } else {
    feedback.push('Not following Conventional Commits format. Use: type(scope): description');
  }

  if (subject.length > 0 && subject.length <= 50) {
    scores.length = 20;
  } else if (subject.length <= 72) {
    scores.length = 15;
    feedback.push('Subject is good but could be shorter (aim for 50 chars)');
  } else {
    scores.length = 5;
    feedback.push(`Subject too long (${subject.length} chars). Keep under 72`);
  }

  const firstWord = subject.split(/[:\s]+/).pop()?.split(' ')[0]?.toLowerCase() || '';
  const badMoods = ['added', 'fixed', 'updated', 'changed', 'removed', 'deleted', 'modified'];
  if (!badMoods.includes(firstWord)) {
    scores.mood = 15;
  } else {
    feedback.push(`Use imperative mood: "${firstWord}" -> "${firstWord.replace(/ed$/, '')}"`);
  }

  const vagueWords = ['stuff', 'things', 'misc', 'update', 'fix', 'change'];
  const subjectLower = subject.toLowerCase();
  const isVague = vagueWords.some(w => subjectLower === w || subjectLower.endsWith(`: ${w}`));
  if (!isVague && subject.length > 10) {
    scores.clarity = 25;
  } else if (isVague) {
    scores.clarity = 5;
    feedback.push('Message is too vague. Be specific about what changed');
  } else {
    scores.clarity = 15;
    feedback.push('Consider adding more detail');
  }

  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  return { total, scores, feedback };
}

export async function POST(request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'No message provided' }, { status: 400 });
    }

    const result = scoreCommitMessage(message);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
