import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export function loadConfig() {
  const config = {
    apiKey: process.env.OPENAI_API_KEY || null,
    model: 'gpt-4o-mini',
    language: 'en'
  };

  // Check for local config file
  const localConfigPath = join(process.cwd(), '.ai-commit');
  const globalConfigPath = join(homedir(), '.ai-commit');

  const configPath = existsSync(localConfigPath) 
    ? localConfigPath 
    : existsSync(globalConfigPath) 
      ? globalConfigPath 
      : null;

  if (configPath) {
    try {
      const fileConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
      Object.assign(config, fileConfig);
    } catch {
      // Ignore invalid config
    }
  }

  return config;
}
