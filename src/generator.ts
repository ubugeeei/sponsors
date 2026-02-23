/**
 * Sponsor display generator
 * Main entry point
 */

import { writeFileSync } from "fs";
import { fetchSponsors, classifySponsors } from "./api/github";
import { elegantComposer, type ComposerOptions } from "./composer/elegant-composer";
import { convertToPng } from "./png-converter";
import { config } from "../config";

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

async function main() {
  try {
    if (!config.githubLogin) {
      throw new Error(
        "GitHub login is required. Set GITHUB_LOGIN or SPONSORKIT_GITHUB_LOGIN environment variable.",
      );
    }

    console.log("");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  SPONSOR KIT - Monochrome Edition");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`  GitHub: ${config.githubLogin}`);
    console.log("");

    // Fetch sponsors from GitHub API
    console.log("→ Fetching sponsors from GitHub...");
    const sponsors = await fetchSponsors(config.githubToken, config.githubLogin);
    console.log(`  ✓ Found ${sponsors.length} sponsors`);

    // Embed avatar images as base64
    console.log("→ Embedding avatar images...");
    await embedAvatarImages(sponsors);

    // Classify sponsors by tier
    console.log("→ Classifying sponsors by tier...");
    const classifiedSponsors = classifySponsors(sponsors, config.tiers, config.tierOverrides);

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
      const content = elegantComposer(tierSponsors, config.tiers, config.width, variant.options);
      const svgPath = `${config.outputDir}/${variant.name}.svg`;
      writeFileSync(svgPath, content, "utf-8");
      console.log(`  ✓ ${svgPath}`);
      return { ...variant, content };
    });

    // Generate HTML wrapper for iframe embedding
    const htmlPath = `${config.outputDir}/sponsors.html`;
    writeFileSync(htmlPath, generateHtmlWrapper(svgResults[0].content), "utf-8");
    console.log(`  ✓ ${htmlPath}`);

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
