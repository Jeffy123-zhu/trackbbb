import { createProvider } from './providers/index.js';

const SYSTEM_PROMPT = `You are a git commit message generator. Analyze the provided git diff and generate a clear, concise commit message following the Conventional Commits specification.

Format: <type>(<scope>): <description>

Types:
- feat: A new feature
- fix: A bug fix
- docs: Documentation changes
- style: Code style changes (formatting, semicolons, etc.)
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

export async function generateCommitMessage(diff, options = {}) {
  const { language = 'en', type, ...config } = options;

  const provider = createProvider(config);

  let systemPrompt = SYSTEM_PROMPT;
  if (language === 'zh') {
    systemPrompt += '\n\nWrite the commit message in Chinese.';
  }
  
  let userPrompt = `Generate a commit message for the following changes:\n\n${diff}`;
  
  if (type) {
    userPrompt += `\n\nUse commit type: ${type}`;
  }

  if (diff.length > 10000) {
    userPrompt = `Generate a commit message for the following changes (truncated):\n\n${diff.substring(0, 10000)}...\n\n[Diff truncated due to length]`;
  }

  try {
    return await provider.generate(systemPrompt, userPrompt);
  } catch (error) {
    if (error.message.includes('api_key') || error.message.includes('API key')) {
      throw new Error('Invalid API key. Please check your configuration.');
    }
    throw new Error('Failed to generate commit message: ' + error.message);
  }
}
