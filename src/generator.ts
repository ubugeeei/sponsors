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

    console.log('🚀 Starting sponsor generation...');
    console.log(`   GitHub Login: ${config.githubLogin}`);

    // Step 1: GitHub API からスポンサーデータを取得
    console.log('📡 Fetching sponsors from GitHub...');
    const sponsors = await fetchSponsors(config.githubToken, config.githubLogin);
    console.log(`✓ Fetched ${sponsors.length} sponsors`);

    // Step 1.5: アバター画像を base64 に変換
    console.log('🖼️  Embedding avatar images...');
    await embedAvatarImages(sponsors);
    console.log(`✓ Avatar images embedded`);

    // Step 2: スポンサーをティアごとに分類
    console.log('📋 Classifying sponsors by tier...');
    const classifiedSponsors = classifySponsors(sponsors, config.tiers);

    // デバッグ: ティアごとのスポンサー数を表示
    for (const [tierTitle, tierSponsors] of classifiedSponsors) {
      console.log(`   ${tierTitle}: ${tierSponsors.length} sponsors`);
    }

    // ティア順に並べたスポンサー配列を作成
    const tierSponsors = config.tiers.map((tier) => classifiedSponsors.get(tier.title) || []);

    // Step 3: SVG を生成
    console.log('🎨 Generating SVG...');
    // elegantComposer accepts pre-classified tier sponsors
    const svgContent = elegantComposer(tierSponsors, config.tiers, config.width);
    const svgBuffer = Buffer.from(svgContent, 'utf-8');

    // Step 4: SVG をファイルに保存
    const svgPath = `${config.outputDir}/sponsors.svg`;
    writeFileSync(svgPath, svgContent, 'utf-8');
    console.log(`✓ SVG saved: ${svgPath}`);

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
      background: #0F1419;
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
    console.log(`✓ HTML saved: ${htmlPath}`);

    // Step 5: PNG に変換
    console.log('🖼️  Converting to PNG...');
    const pngPath = `${config.outputDir}/sponsors.png`;
    try {
      await convertToPng(svgBuffer, pngPath);
    } catch (pngError) {
      console.warn('⚠️  PNG generation failed, but SVG/HTML were created successfully');
    }

    console.log('✨ Sponsor generation completed successfully!');
    console.log(`   📄 SVG: ${svgPath}`);
    console.log(`   🖼️  PNG: ${pngPath}`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
