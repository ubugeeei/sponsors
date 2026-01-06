# ubugeeei's sponsors

<p align="center">
  <img src="https://raw.githubusercontent.com/ubugeeei/sponsors/main/sponsors.png" alt="ubugeeei's sponsors" />
</p>

Elegant sponsor display generator. Creates SVG/PNG from GitHub Sponsors data, auto-updates every 15 minutes.

## Quick Start

```bash
# Using GitHub CLI with SSH (recommended)
gh auth login
echo "GITHUB_LOGIN=ubugeeei" > .env
bun install && bun run build

# Or with Personal Access Token
cp .env.example .env
# Edit .env with your GITHUB_TOKEN
bun install && bun run build
```

## Environment Variables

| Variable | Required | Notes |
|----------|----------|-------|
| `GITHUB_LOGIN` | ✅ | GitHub username/org |
| `GITHUB_TOKEN` | ❌ | PAT (optional if using GitHub CLI SSH) |

## Features

- Independent (no Sponsorkit)
- SSH authentication support via GitHub CLI
- Full Japanese support
- Automated via GitHub Actions (15 min intervals)

## License

MIT
