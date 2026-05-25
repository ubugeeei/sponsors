/**
 * Sponsor display generator
 * Main entry point
 */

import { writeFileSync, mkdirSync } from "fs";
import { fetchSponsors, classifySponsors } from "./api/github";
import { elegantComposer, type ComposerOptions } from "./composer/elegant-composer";
import { convertToPng } from "./png-converter";
import { config } from "../config";
import type { Tool } from "./types";

interface OutputVariant {
  name: string;
  options: ComposerOptions;
  transparent: boolean;
}

const OUTPUT_VARIANTS: OutputVariant[] = [
  { name: "sponsors", options: {}, transparent: false },
  { name: "sponsors-transparent", options: { transparent: true }, transparent: true },
  {
    name: "sponsors-transparent-dark",
    options: { transparent: true, darkText: true },
    transparent: true,
  },
];

/**
 * Download image and convert to base64 with retry logic
 */
async function imageUrlToBase64(url: string, retries = 3): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; sponsorkit)" },
      });

      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const mimeType = url.includes(".png") ? "image/png" : "image/jpeg";

      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      lastError = error as Error;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 500 * attempt));
      }
    }
  }

  console.warn(`Failed to load image after ${retries} attempts: ${url}`, lastError?.message);
  return "";
}

/**
 * Convert all sponsor avatars to base64
 */
async function embedAvatarImages(sponsors: any[]): Promise<void> {
  let successCount = 0;
  let failCount = 0;

  for (const sponsor of sponsors) {
    if (sponsor.avatarUrl) {
      sponsor.avatarUrlBase64 = await imageUrlToBase64(sponsor.avatarUrl);
      if (sponsor.avatarUrlBase64) {
        successCount++;
      } else {
        failCount++;
        console.log(`   ℹ️  ${sponsor.login}: avatar not loaded (${sponsor.avatarUrl})`);
      }
    }
  }

  console.log(`   ✓ Avatar images: ${successCount} loaded, ${failCount} failed`);
}

function generateHtmlWrapper(svgContent: string): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sponsors</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #0A0A0A;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      min-height: 100vh;
    }
    svg {
      display: block;
      max-width: 100%;
      height: auto;
    }
  </style>
</head>
<body>
${svgContent}
</body>
</html>`;
}

/**
 * Local-preview HTML — renders all three variants on different backgrounds so the
 * dark / transparent / dark-text outputs can be eyeballed side-by-side.
 * Written only when running with a non-default OUTPUT_DIR (e.g. `bun run preview`).
 */
function generatePreviewHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sponsors · Preview</title>
  <style>
    :root { font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; color: #111; }
    .row { padding: 56px 48px; }
    .row + .row { border-top: 1px solid rgba(0,0,0,0.06); }
    .row.dark { background: #0a0a0a; color: #fff; }
    .row.light { background: #f4f4f0; }
    .row.checker {
      background-color: #fafafa;
      background-image:
        linear-gradient(45deg, #e9e9e6 25%, transparent 25%),
        linear-gradient(-45deg, #e9e9e6 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #e9e9e6 75%),
        linear-gradient(-45deg, transparent 75%, #e9e9e6 75%);
      background-size: 22px 22px;
      background-position: 0 0, 0 11px, 11px -11px, -11px 0px;
    }
    .label {
      font-size: 11px;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      font-weight: 500;
      opacity: 0.55;
      margin: 0 0 24px;
    }
    img, object {
      display: block;
      max-width: 1200px;
      width: 100%;
      height: auto;
    }
    .meta {
      font-size: 12px;
      opacity: 0.45;
      margin-top: 16px;
      font-family: ui-monospace, SFMono-Regular, monospace;
    }
  </style>
</head>
<body>
  <div class="row dark">
    <p class="label">01 · Default (sponsors.svg) on #0a0a0a</p>
    <img src="sponsors.svg" alt="sponsors default">
    <p class="meta">sponsors.svg / sponsors.png — dark canvas built in</p>
  </div>
  <div class="row light">
    <p class="label">02 · Transparent (sponsors-transparent-dark.svg) on light</p>
    <img src="sponsors-transparent-dark.svg" alt="sponsors transparent dark">
    <p class="meta">sponsors-transparent-dark.svg — dark-text variant, use on light surfaces</p>
  </div>
  <div class="row dark">
    <p class="label">03 · Transparent (sponsors-transparent.svg) on dark</p>
    <img src="sponsors-transparent.svg" alt="sponsors transparent light">
    <p class="meta">sponsors-transparent.svg — light-text variant, use on dark surfaces</p>
  </div>
  <div class="row checker">
    <p class="label">04 · Transparent (sponsors-transparent.svg) on checker</p>
    <img src="sponsors-transparent.svg" alt="sponsors transparent on checker">
    <p class="meta">Quick transparency sanity check</p>
  </div>
</body>
</html>`;
}

async function main() {
  try {
    if (!config.githubLogin) {
      throw new Error(
        "GitHub login is required. Set GITHUB_LOGIN or SPONSORKIT_GITHUB_LOGIN environment variable.",
      );
    }

    // Ensure the output directory exists (relevant for preview mode where it's a fresh subdir).
    mkdirSync(config.outputDir, { recursive: true });

    console.log("");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  SPONSOR KIT - Monochrome Edition");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`  GitHub: ${config.githubLogin}`);
    console.log(`  Output: ${config.outputDir}`);
    console.log("");

    // Fetch sponsors from GitHub API
    console.log("→ Fetching sponsors from GitHub...");
    const sponsors = await fetchSponsors(
      config.githubToken,
      config.githubLogin,
      config.amountOverrides,
    );
    console.log(`  ✓ Found ${sponsors.length} sponsors`);

    // Embed avatar images as base64
    console.log("→ Embedding avatar images...");
    await embedAvatarImages(sponsors);

    // Resolve tool sponsors (uses GitHub avatar redirect)
    const tools: Tool[] = (config.tools ?? []).map((t) => ({
      ...t,
      avatarUrl: `https://github.com/${t.login}.png?size=256`,
    }));
    if (tools.length > 0) {
      console.log("→ Embedding tool sponsor avatars...");
      await embedAvatarImages(tools as any);
    }

    // Classify sponsors by tier
    console.log("→ Classifying sponsors by tier...");
    const classifiedSponsors = classifySponsors(sponsors, config.tiers);

    for (const [tierTitle, tierSponsors] of classifiedSponsors) {
      if (tierSponsors.length > 0) {
        console.log(`  • ${tierTitle}: ${tierSponsors.length}`);
      }
    }

    // Build ordered sponsor arrays by tier
    const tierSponsors = config.tiers.map((tier) => classifiedSponsors.get(tier.title) || []);

    // Generate SVGs for all variants
    console.log("→ Generating SVGs...");
    const svgResults = OUTPUT_VARIANTS.map((variant) => {
      const content = elegantComposer(tierSponsors, config.tiers, config.width, {
        ...variant.options,
        tools,
      });
      const svgPath = `${config.outputDir}/${variant.name}.svg`;
      writeFileSync(svgPath, content, "utf-8");
      console.log(`  ✓ ${svgPath}`);
      return { ...variant, content };
    });

    // Generate HTML wrapper for iframe embedding
    const htmlPath = `${config.outputDir}/sponsors.html`;
    writeFileSync(htmlPath, generateHtmlWrapper(svgResults[0].content), "utf-8");
    console.log(`  ✓ ${htmlPath}`);

    // In preview mode (any non-default outputDir), emit a side-by-side viewer
    // as index.html so `vite preview --outDir preview` serves it at /.
    if (config.outputDir !== ".") {
      const indexPath = `${config.outputDir}/index.html`;
      writeFileSync(indexPath, generatePreviewHtml(), "utf-8");
      console.log(`  ✓ ${indexPath}`);
    }

    // Convert all variants to PNG
    for (const { name, content, transparent } of svgResults) {
      console.log(`→ Converting to PNG: ${name}...`);
      const pngPath = `${config.outputDir}/${name}.png`;
      try {
        await convertToPng(Buffer.from(content, "utf-8"), pngPath, transparent);
        console.log(`  ✓ ${pngPath}`);
      } catch {
        console.warn(`  ⚠ PNG generation failed: ${name}`);
      }
    }

    console.log("");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  ✓ Generation completed");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");
  } catch (error) {
    console.error("✗ Error:", error);
    process.exit(1);
  }
}

void main();
