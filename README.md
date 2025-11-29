# AI Commit

AI-powered git commit message generator with multi-provider support and commit quality scoring.

## Features

- Generate meaningful commit messages from staged changes
- Multiple AI providers: OpenAI, Anthropic Claude, Ollama (local)
- Commit message quality scoring with actionable feedback
- Follows Conventional Commits specification
- Interactive CLI with edit and regenerate options

## Installation

```bash
npm install -g ai-commit
```

## Setup

Choose your AI provider:

**OpenAI (default)**
```bash
export OPENAI_API_KEY=your-key
```

**Anthropic Claude**
```bash
export ANTHROPIC_API_KEY=your-key
ai-commit -p anthropic
```

**Ollama (local, free)**
```bash
# Install Ollama from https://ollama.ai
ollama pull llama3.2
ai-commit -p ollama
```

## Usage

### Generate Commit Message

```bash
# Basic usage
git add .
ai-commit

# Use specific provider
ai-commit -p anthropic
ai-commit -p ollama

# Stage all and generate
ai-commit --all

# Specify commit type
ai-commit --type feat

# Preview without committing
ai-commit --dry-run
```

### Score Commits

```bash
# Score last 5 commits
ai-commit score

# Score last N commits
ai-commit score -n 10

# Score a specific message
ai-commit score "fix: resolve login bug"
```

## Options

| Option | Description |
|--------|-------------|
| `-p, --provider <name>` | AI provider: openai, anthropic, ollama |
| `-l, --language <lang>` | Message language: en or zh |
| `-t, --type <type>` | Commit type: feat, fix, docs, etc. |
| `-a, --all` | Stage all changes before generating |
| `--dry-run` | Generate without committing |

## Configuration

Create `.ai-commit` in project root or home directory:

```json
{
  "provider": "openai",
  "apiKey": "your-api-key",
  "language": "en"
}
```

## Scoring Criteria

Commits are scored on:
- **Format (25)**: Conventional Commits compliance
- **Type (15)**: Valid commit type
- **Length (20)**: Subject line length
- **Mood (15)**: Imperative mood usage
- **Clarity (25)**: Specificity and detail

## Example

```
$ ai-commit

Analyzing changes... done
Generating with openai... done

Suggested commit message:
--------------------------------------------------
feat(auth): add JWT refresh token mechanism
--------------------------------------------------

Commit Message Score: 95/100 (A)

Breakdown:
  Format:    25/25
  Type:      15/15
  Length:    20/20
  Mood:      15/15
  Clarity:   20/25

Suggestions:
  - Consider adding more detail to the message

? What would you like to do?
> Commit with this message
  Edit message
  Regenerate
  Cancel
```

## License

MIT
