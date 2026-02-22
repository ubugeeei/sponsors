/**
 * スポンサー表示ジェネレーター
 * メインエントリーポイント
 */

import { writeFileSync } from 'fs';
import { fetchSponsors, classifySponsors } from './api/github';
import { elegantComposer } from './composer/elegant-composer';
import { convertToPng } from './png-converter';
import { config } from '../config';

/**
 * Download image and convert to base64 with retry logic
 */
async function imageUrlToBase64(url: string, retries: number = 3): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout per attempt

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; sponsorkit)',
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');

      // Determine MIME type from URL or use default
      const mimeType = url.includes('.png') ? 'image/png' : 'image/jpeg';

      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      lastError = error as Error;
      if (attempt < retries) {
        // Wait before retrying
        await new Promise(r => setTimeout(r, 500 * attempt));
      }
    }
  }

  console.warn(`Failed to load image after ${retries} attempts: ${url}`, lastError?.message);
  return ''; // Return empty string on error
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

async function main() {
  try {
    // 設定を検証
    if (!config.githubLogin) {
      throw new Error(
        'GitHub login is required. Set GITHUB_LOGIN or SPONSORKIT_GITHUB_LOGIN environment variable.'
      );
    }

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  SPONSOR KIT - Monochrome Edition');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  GitHub: ${config.githubLogin}`);
    console.log('');

    // Step 1: GitHub API からスポンサーデータを取得
    console.log('→ Fetching sponsors from GitHub...');
    const sponsors = await fetchSponsors(config.githubToken, config.githubLogin);
    console.log(`  ✓ Found ${sponsors.length} sponsors`);

    // Step 1.5: アバター画像を base64 に変換
    console.log('→ Embedding avatar images...');
    await embedAvatarImages(sponsors);

    // Step 2: スポンサーをティアごとに分類
    console.log('→ Classifying sponsors by tier...');
    const classifiedSponsors = classifySponsors(sponsors, config.tiers);

    // デバッグ: ティアごとのスポンサー数を表示
    for (const [tierTitle, tierSponsors] of classifiedSponsors) {
      const count = tierSponsors.length;
      if (count > 0) {
        console.log(`  • ${tierTitle}: ${count}`);
      }
    }

    // ティア順に並べたスポンサー配列を作成
    const tierSponsors = config.tiers.map((tier) => classifiedSponsors.get(tier.title) || []);

    // Step 3: SVG を生成（通常版）
    console.log('→ Generating SVG (with background)...');
    const svgContent = elegantComposer(tierSponsors, config.tiers, config.width, { transparent: false });
    const svgBuffer = Buffer.from(svgContent, 'utf-8');

    // Step 3.5: SVG を生成（透過版）
    console.log('→ Generating SVG (transparent)...');
    const svgTransparentContent = elegantComposer(tierSponsors, config.tiers, config.width, { transparent: true });

    // Step 3.6: SVG を生成（透過版・ダークテキスト）
    console.log('→ Generating SVG (transparent, dark text)...');
    const svgTransparentDarkContent = elegantComposer(tierSponsors, config.tiers, config.width, { transparent: true, darkText: true });

    // Step 4: SVG をファイルに保存
    const svgPath = `${config.outputDir}/sponsors.svg`;
    writeFileSync(svgPath, svgContent, 'utf-8');
    console.log(`  ✓ ${svgPath}`);

    // 透過版 SVG を保存
    const svgTransparentPath = `${config.outputDir}/sponsors-transparent.svg`;
    writeFileSync(svgTransparentPath, svgTransparentContent, 'utf-8');
    console.log(`  ✓ ${svgTransparentPath}`);

    // 透過版（ダークテキスト）SVG を保存
    const svgTransparentDarkPath = `${config.outputDir}/sponsors-transparent-dark.svg`;
    writeFileSync(svgTransparentDarkPath, svgTransparentDarkContent, 'utf-8');
    console.log(`  ✓ ${svgTransparentDarkPath}`);

    // Step 4.5: HTML ラッパーも出力（iframe 用）
    const htmlContent = `<!DOCTYPE html>
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
    const htmlPath = `${config.outputDir}/sponsors.html`;
    writeFileSync(htmlPath, htmlContent, 'utf-8');
    console.log(`  ✓ ${htmlPath}`);

    // Step 5: PNG に変換（通常版）
    console.log('→ Converting to PNG (with background)...');
    const pngPath = `${config.outputDir}/sponsors.png`;
    try {
      await convertToPng(svgBuffer, pngPath);
      console.log(`  ✓ ${pngPath}`);
    } catch (pngError) {
      console.warn('  ⚠ PNG generation failed');
    }

    // Step 5.5: PNG に変換（透過版）
    console.log('→ Converting to PNG (transparent)...');
    const pngTransparentPath = `${config.outputDir}/sponsors-transparent.png`;
    try {
      const svgTransparentBuffer = Buffer.from(svgTransparentContent, 'utf-8');
      await convertToPng(svgTransparentBuffer, pngTransparentPath, true);
      console.log(`  ✓ ${pngTransparentPath}`);
    } catch (pngError) {
      console.warn('  ⚠ Transparent PNG generation failed');
    }

    // Step 5.6: PNG に変換（透過版・ダークテキスト）
    console.log('→ Converting to PNG (transparent, dark text)...');
    const pngTransparentDarkPath = `${config.outputDir}/sponsors-transparent-dark.png`;
    try {
      const svgTransparentDarkBuffer = Buffer.from(svgTransparentDarkContent, 'utf-8');
      await convertToPng(svgTransparentDarkBuffer, pngTransparentDarkPath, true);
      console.log(`  ✓ ${pngTransparentDarkPath}`);
    } catch (pngError) {
      console.warn('  ⚠ Transparent dark text PNG generation failed');
    }

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  ✓ Generation completed');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
  } catch (error) {
    console.error('✗ Error:', error);
    process.exit(1);
  }
}

main();
