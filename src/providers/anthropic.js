import Anthropic from '@anthropic-ai/sdk';

export class AnthropicProvider {
  constructor(apiKey) {
    this.client = new Anthropic({ apiKey });
    this.name = 'anthropic';
  }

  async generate(systemPrompt, userPrompt) {
    const response = await this.client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ]
    });
    return response.content[0].text.trim();
  }
}
