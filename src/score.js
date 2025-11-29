import chalk from 'chalk';

const COMMIT_TYPES = ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'perf', 'ci', 'build', 'revert'];

export function scoreCommitMessage(message) {
  const lines = message.split('\n');
  const subject = lines[0] || '';
  const body = lines.slice(2).join('\n');
  
  const scores = {
    format: 0,
    length: 0,
    clarity: 0,
    type: 0,
    mood: 0
  };
  
  const feedback = [];

  // Check conventional commit format
  const conventionalMatch = subject.match(/^(\w+)(\(.+\))?:\s*.+/);
  if (conventionalMatch) {
    scores.format = 25;
    const type = conventionalMatch[1].toLowerCase();
    if (COMMIT_TYPES.includes(type)) {
      scores.type = 15;
    } else {
      feedback.push(`Unknown commit type "${type}". Consider: ${COMMIT_TYPES.join(', ')}`);
    }
  } else {
    feedback.push('Not following Conventional Commits format. Use: type(scope): description');
  }

  // Check subject length
  if (subject.length > 0 && subject.length <= 50) {
    scores.length = 20;
  } else if (subject.length <= 72) {
    scores.length = 15;
    feedback.push('Subject is good but could be shorter (aim for 50 chars)');
  } else {
    scores.length = 5;
    feedback.push(`Subject too long (${subject.length} chars). Keep under 72, ideally under 50`);
  }

  // Check for imperative mood (simple heuristic)
  const firstWord = subject.split(/[:\s]+/).pop()?.split(' ')[0]?.toLowerCase() || '';
  const badMoods = ['added', 'fixed', 'updated', 'changed', 'removed', 'deleted', 'modified'];
  if (!badMoods.includes(firstWord)) {
    scores.mood = 15;
  } else {
    feedback.push(`Use imperative mood: "${firstWord}" -> "${firstWord.replace(/ed$/, '')}"`);
  }

  // Check clarity
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
    feedback.push('Consider adding more detail to the message');
  }

  const total = Object.values(scores).reduce((a, b) => a + b, 0);

  return { total, scores, feedback };
}

export function formatScore(result) {
  const { total, scores, feedback } = result;
  
  let grade, color;
  if (total >= 90) { grade = 'A'; color = chalk.green; }
  else if (total >= 80) { grade = 'B'; color = chalk.green; }
  else if (total >= 70) { grade = 'C'; color = chalk.yellow; }
  else if (total >= 60) { grade = 'D'; color = chalk.yellow; }
  else { grade = 'F'; color = chalk.red; }

  let output = '\n' + chalk.bold('Commit Message Score: ') + color(`${total}/100 (${grade})`) + '\n\n';
  
  output += chalk.gray('Breakdown:\n');
  output += `  Format:    ${scores.format}/25\n`;
  output += `  Type:      ${scores.type}/15\n`;
  output += `  Length:    ${scores.length}/20\n`;
  output += `  Mood:      ${scores.mood}/15\n`;
  output += `  Clarity:   ${scores.clarity}/25\n`;

  if (feedback.length > 0) {
    output += '\n' + chalk.yellow('Suggestions:\n');
    feedback.forEach(f => {
      output += chalk.gray(`  - ${f}\n`);
    });
  }

  return output;
}

export async function scoreLastCommits(count = 5) {
  const { simpleGit } = await import('simple-git');
  const git = simpleGit();
  
  const log = await git.log({ maxCount: count });
  const results = [];

  for (const commit of log.all) {
    const result = scoreCommitMessage(commit.message);
    results.push({
      hash: commit.hash.substring(0, 7),
      message: commit.message.split('\n')[0],
      score: result.total
    });
  }

  return results;
}
