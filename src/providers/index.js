import { OpenAIProvider } from './openai.js';
import { AnthropicProvider } from './anthropic.js';
import { OllamaProvider } from './ollama.js';

export function createProvider(config) {
  const { provider = 'openai' } = config;

  switch (provider) {
    case 'openai':
      if (!config.apiKey && !process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key required. Set OPENAI_API_KEY or add apiKey to config.');
      }
      return new OpenAIProvider(config.apiKey || process.env.OPENAI_API_KEY);

    case 'anthropic':
      if (!config.apiKey && !process.env.ANTHROPIC_API_KEY) {
        throw new Error('Anthropic API key required. Set ANTHROPIC_API_KEY or add apiKey to config.');
      }
      return new AnthropicProvider(config.apiKey || process.env.ANTHROPIC_API_KEY);

    case 'ollama':
      return new OllamaProvider(config.model, config.ollamaUrl);

    default:
      throw new Error(`Unknown provider: ${provider}. Supported: openai, anthropic, ollama`);
  }
}
