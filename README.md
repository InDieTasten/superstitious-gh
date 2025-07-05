# 🔮 Superstitious GitHub

> Project that ensures that no issue or PR receives a number that superstitious people would consider unlucky or bad

## Overview

Superstitious GitHub is a GitHub Action that automatically prevents issues and pull requests from receiving "unlucky" numbers such as 7, 13, 666, 777, etc. It works by creating temporary placeholder issues before unlucky numbers are assigned, then cleaning them up afterward.

## Features

- 🛡️ **Proactive Protection**: Prevents unlucky numbers from being assigned to real issues/PRs
- 🔧 **Configurable**: Customize which numbers to avoid via YAML configuration
- 🧹 **Clearing Mode**: Optionally move existing unlucky issues/PRs to safe numbers
- 🔍 **Dry Run**: Test the action without making actual changes
- ⚡ **Race Condition Safe**: Reserves multiple numbers ahead to prevent conflicts
- 📊 **Detailed Reporting**: Provides outputs and summaries of actions taken

## Default Unlucky Numbers

By default, the following numbers are considered unlucky:
- `7` - Unlucky in some cultures
- `13` - Triskaidekaphobia (fear of 13)
- `666` - Related to "Number of the Beast"

## Quick Start

### 1. Add to Your Repository

Create `.github/workflows/superstitious.yml` in your repository:

```yaml
name: Superstitious Protection

on:
  issues:
    types: [opened]
  pull_request:
    types: [opened]
  schedule:
    - cron: '0 * * * *'  # Run hourly for proactive protection

jobs:
  protect:
    permissions:
      issues: write
      pull-requests: write
      contents: read
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: InDieTasten/superstitious-gh@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

### 2. Configure (Optional)

Create `superstitious.yml` in your repository root:

```yaml
# Numbers to avoid
unlucky_numbers:
  - 7
  - 13
  - 666
  - 777

# How many numbers ahead to reserve (prevents race conditions)
reservation_space: 5

# Placeholder issue settings
placeholder:
  title: "🔮 Reserved for superstitious purposes"
  labels: ["superstitious", "placeholder"]
```

## Configuration Reference

### Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `github-token` | GitHub token for API access | Yes | `${{ github.token }}` |
| `config-path` | Path to configuration file | No | `superstitious.yml` |

### Outputs

| Output | Description |
|--------|-------------|
| `issues-created` | Number of placeholder issues created |
| `issues-cleared` | Number of unlucky issues cleared |
| `next-safe-number` | Next safe issue/PR number |

### Configuration File

Create `superstitious.yml` in your repository root:

```yaml
# Numbers to avoid for issues and pull requests
unlucky_numbers:
  - 7
  - 13
  - 66
  - 77
  - 666
  - 777
  - 1313
  - 1337

# How many numbers ahead to reserve (default: 1)
reservation_space: 1

# Whether to enable clearing mode by default
clearing_mode: false

# Placeholder issue settings
placeholder:
  title: "🔮 Reserved for superstitious purposes"
  body: |
    This issue was created automatically to prevent an unlucky number.
    **This is a placeholder and will be deleted shortly.**
  labels:
    - "superstitious"
    - "placeholder"

# Clearing mode settings
clearing:
  preserve_content: true
  title_suffix: " (moved from unlucky number)"
  add_explanation_comment: true

# Dry run mode
dry_run: false

# Whether to delete placeholder issues after use (adds additional labels and renames the issue title)
deletion_mode: false,
```

## Usage Examples

### Basic Protection

```yaml
- uses: InDieTasten/superstitious-gh@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

### Custom Configuration

```yaml
- uses: InDieTasten/superstitious-gh@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    config-path: '.github/superstitious-config.yml'
```

## How It Works

1. **Monitoring**: The action monitors for new issues and PRs
2. **Prediction**: It calculates what the next issue/PR numbers will be
3. **Detection**: It checks if any upcoming numbers are in the unlucky list
4. **Prevention**: It creates temporary placeholder issues to "use up" unlucky numbers
5. **Cleanup**: It removes the placeholder issues after a short delay

### Race Condition Prevention

The action reserves multiple numbers ahead (configurable via `reservation_space`) to ensure that if multiple issues/PRs are created simultaneously, none will accidentally receive an unlucky number.

## Clearing Mode

When enabled, clearing mode will:

1. Find existing issues/PRs with unlucky numbers
2. Create duplicates with safe numbers
3. Copy all content, comments, and metadata
4. Close the original unlucky issues/PRs
5. Add explanatory comments about the move

## Permissions

The action requires the following permissions:

```yaml
permissions:
  issues: write
  pull-requests: write
  contents: read
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Disclaimer

This action is created for entertainment and superstitious purposes. While it works as intended, the concept of "unlucky numbers" is purely based on cultural beliefs and superstitions. Use at your own discretion! 🔮