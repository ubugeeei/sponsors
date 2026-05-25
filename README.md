# ubugeeei's sponsors

<p align="center">
  <img src="https://raw.githubusercontent.com/ubugeeei/sponsors/main/sponsors.png" alt="ubugeeei's sponsors" />
</p>

Elegant sponsor display generator. Creates SVG/PNG from GitHub Sponsors data, auto-updates every hour.

## Stack

- Node.js **24 LTS**
- [**Vite Plus**](https://viteplus.dev) (`vp`) — the unified local toolchain; wraps the project's pnpm install (declared via `packageManager` in `package.json`). Follow the install steps at [viteplus.dev](https://viteplus.dev).
- **Vite** for the SSR/Node build of the CLI generator
- **Playwright** (Chromium) for SVG → PNG conversion

## Quick Start

```bash
# Using GitHub CLI with SSH (recommended)
gh auth login
echo "GITHUB_LOGIN=ubugeeei" > .env
vp install && vp build

# Or with Personal Access Token
cp .env.example .env
# Edit .env with your GITHUB_TOKEN
vp install && vp build
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
vp run preview
# Builds, generates into ./preview/ (gitignored), then opens
# vite preview at http://localhost:4173 serving preview/index.html
```

The preview page renders all three variants (default dark, transparent-on-light, transparent-on-dark) side-by-side so you can eyeball changes without touching the committed images at the repo root. CI keeps writing the canonical files on its own schedule.

## Features

- Independent (no Sponsorkit)
- SSH authentication support via GitHub CLI
- Full Japanese support
- Automated via GitHub Actions (hourly)
- One-time sponsorships rendered at their tier-matched avatar size with a `one-time` annotation

## License

MIT
