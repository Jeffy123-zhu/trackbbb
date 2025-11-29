export class OllamaProvider {
  constructor(model = 'llama3.2', baseUrl = 'http://localhost:11434') {
    this.model = model;
    this.baseUrl = baseUrl;
    this.name = 'ollama';
  }

  async generate(systemPrompt, userPrompt) {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.message.content.trim();
  }
}
