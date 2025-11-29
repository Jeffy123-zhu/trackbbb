#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { getGitDiff, getStagedFiles, commitChanges } from './git.js';
import { generateCommitMessage } from './ai.js';
import { loadConfig } from './config.js';
import { scoreCommitMessage, formatScore, scoreLastCommits } from './score.js';

const program = new Command();

program
  .name('ai-commit')
  .description('AI-powered git commit message generator')
  .version('1.0.0');

program
  .command('generate', { isDefault: true })
  .description('Generate a commit message for staged changes')
  .option('-l, --language <lang>', 'commit message language (en/zh)', 'en')
  .option('-t, --type <type>', 'commit type (feat/fix/docs/style/refactor/test/chore)')
  .option('-a, --all', 'stage all changes before commit')
  .option('-p, --provider <provider>', 'AI provider (openai/anthropic/ollama)', 'openai')
  .option('--dry-run', 'generate message without committing')
  .action(async (options) => {
    try {
      await runGenerate(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('score [message]')
  .description('Score a commit message or recent commits')
  .option('-n, --number <count>', 'number of recent commits to score', '5')
  .action(async (message, options) => {
    try {
      await runScore(message, options);
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

async function runGenerate(options) {
  const config = loadConfig();
  const provider = options.provider || config.provider || 'openai';
  
  const mergedConfig = { ...config, provider };

  if (provider !== 'ollama' && !mergedConfig.apiKey) {
    const envKey = provider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY';
    if (!process.env[envKey]) {
      console.log(chalk.yellow('No API key found.'));
      console.log(chalk.gray(`Set your API key: export ${envKey}=your-key-here`));
      console.log(chalk.gray('Or use Ollama for local inference: ai-commit -p ollama'));
      process.exit(1);
    }
  }

  const stagedFiles = await getStagedFiles();
  
  if (stagedFiles.length === 0) {
    if (options.all) {
      console.log(chalk.yellow('Staging all changes...'));
      const { execSync } = await import('child_process');
      execSync('git add -A', { stdio: 'inherit' });
    } else {
      console.log(chalk.yellow('No staged changes found.'));
      console.log(chalk.gray('Stage your changes with: git add <files>'));
      console.log(chalk.gray('Or use: ai-commit --all'));
      process.exit(1);
    }
  }

  const spinner = ora('Analyzing changes...').start();
  const diff = await getGitDiff();
  
  if (!diff) {
    spinner.fail('No changes to commit');
    process.exit(1);
  }

  spinner.text = `Generating with ${provider}...`;
  const message = await generateCommitMessage(diff, {
    language: options.language,
    type: options.type,
    ...mergedConfig
  });
  spinner.succeed('Done');

  console.log('\n' + chalk.cyan('Suggested commit message:'));
  console.log(chalk.gray('-'.repeat(50)));
  console.log(chalk.green(message));
  console.log(chalk.gray('-'.repeat(50)));

  const scoreResult = scoreCommitMessage(message);
  console.log(formatScore(scoreResult));

  if (options.dryRun) {
    console.log(chalk.gray('(dry run - no commit made)'));
    return;
  }

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: 'Commit with this message', value: 'commit' },
        { name: 'Edit message', value: 'edit' },
        { name: 'Regenerate', value: 'regenerate' },
        { name: 'Cancel', value: 'cancel' }
      ]
    }
  ]);

  if (action === 'commit') {
    await commitChanges(message);
    console.log(chalk.green('Committed successfully!'));
  } else if (action === 'edit') {
    const { editedMessage } = await inquirer.prompt([
      {
        type: 'editor',
        name: 'editedMessage',
        message: 'Edit your commit message:',
        default: message
      }
    ]);
    await commitChanges(editedMessage.trim());
    console.log(chalk.green('Committed successfully!'));
  } else if (action === 'regenerate') {
    await runGenerate(options);
  } else {
    console.log(chalk.gray('Cancelled.'));
  }
}

async function runScore(message, options) {
  if (message) {
    const result = scoreCommitMessage(message);
    console.log(formatScore(result));
  } else {
    const count = parseInt(options.number, 10);
    console.log(chalk.cyan(`\nScoring last ${count} commits:\n`));
    
    const results = await scoreLastCommits(count);
    
    results.forEach(r => {
      let color;
      if (r.score >= 80) color = chalk.green;
      else if (r.score >= 60) color = chalk.yellow;
      else color = chalk.red;
      
      console.log(`${chalk.gray(r.hash)} ${color(`[${r.score}]`)} ${r.message}`);
    });

    const avg = Math.round(results.reduce((a, b) => a + b.score, 0) / results.length);
    console.log(chalk.gray('\n' + '-'.repeat(50)));
    console.log(chalk.bold(`Average score: ${avg}/100`));
  }
}

program.parse();
