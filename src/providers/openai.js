import OpenAI from 'openai';

export class OpenAIProvider {
  constructor(apiKey) {
    this.client = new OpenAI({ apiKey });
    this.name = 'openai';
  }

  async generate(systemPrompt, userPrompt) {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 500
    });
    return response.choices[0].message.content.trim();
  }
}
