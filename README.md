# ubugeeei's sponsors

<p align="center">
  <img src="https://raw.githubusercontent.com/ubugeeei/sponsors/main/sponsors.png" alt="ubugeeei's sponsors" />
</p>

Elegant sponsor display generator. Creates SVG/PNG from GitHub Sponsors data, auto-updates every hour.

## Stack

- Node.js **22 LTS**
- **pnpm** (declared via `packageManager` in `package.json`)
- **Vite** for the SSR/Node build of the CLI generator
- **Playwright** (Chromium) for SVG → PNG conversion

## Quick Start

```bash
# Using GitHub CLI with SSH (recommended)
gh auth login
echo "GITHUB_LOGIN=ubugeeei" > .env
pnpm install && pnpm build

# Or with Personal Access Token
cp .env.example .env
# Edit .env with your GITHUB_TOKEN
pnpm install && pnpm build
```

## Environment Variables

| Variable | Required | Notes |
|----------|----------|-------|
| `GITHUB_LOGIN` | ✅ | GitHub username/org |
| `GITHUB_TOKEN` | ❌ | PAT (optional if using GitHub CLI SSH) |
| `SPONSORKIT_GITHUB_TOKEN` | ❌ | Required for GitHub Actions. Use a PAT from the sponsored account so tier amounts are available. |

For the scheduled workflow, add `SPONSORKIT_GITHUB_TOKEN` as a repository secret. The built-in Actions token can fetch sponsor logins, but not enough tier data for this layout.

## Local preview

```bash
pnpm preview
# Builds, generates into ./preview/ (gitignored), then opens
# vite preview at http://localhost:4173 serving preview/index.html
```

The preview page renders all three variants (default dark, transparent-on-light, transparent-on-dark) side-by-side so you can eyeball changes without touching the committed images at the repo root. CI keeps writing the canonical files on its own schedule.

## Features

- Independent (no Sponsorkit)
- SSH authentication support via GitHub CLI
- Full Japanese support
- Automated via GitHub Actions (hourly)

## License

MIT
