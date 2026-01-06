/**
 * SVG から PNG への変換
 * Playwright を使用（HTML経由でアバター画像対応）
 */

import { writeFileSync, unlinkSync } from 'fs';
import path from 'path';

/**
 * Convert SVG to PNG using Playwright with HTML wrapper
 * @param svgBuffer SVG buffer
 * @param outputPath Output file path
 */
export async function convertToPng(
  svgBuffer: Buffer,
  outputPath: string
): Promise<void> {
  let browser;
  let tempHtmlPath: string | null = null;

  try {
    const { chromium } = await import('playwright');

    // Create temporary HTML file
    const svgString = svgBuffer.toString('utf-8');
    const htmlContent = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; }
    body { background: white; }
    svg { display: block; }
  </style>
</head>
<body>
${svgString}
</body>
</html>`;

    tempHtmlPath = path.join(path.dirname(outputPath), '.sponsors-temp.html');
    writeFileSync(tempHtmlPath, htmlContent, 'utf-8');

    // Launch browser
    browser = await chromium.launch();
    const page = await browser.newPage();

    // Navigate to local file
    const fileUrl = `file://${path.resolve(tempHtmlPath)}`;
    await page.goto(fileUrl, { waitUntil: 'load', timeout: 60000 });

    // Wait for images and rendering
    await page.waitForTimeout(2000);

    // Get SVG dimensions
    const dimensions = await page.evaluate(() => {
      const svg = document.querySelector('svg');
      if (!svg) return { width: 800, height: 900 };

      const viewBox = svg.getAttribute('viewBox');
      const viewBoxValues = viewBox?.split(' ') || [];
      return {
        width: parseInt(viewBoxValues[2] || svg.getAttribute('width') || '800'),
        height: parseInt(viewBoxValues[3] || svg.getAttribute('height') || '900'),
      };
    });

    // Take screenshot
    await page.screenshot({
      path: outputPath,
      clip: {
        x: 0,
        y: 0,
        width: dimensions.width,
        height: dimensions.height,
      },
    });

    console.log(`✓ PNG generated: ${outputPath}`);
  } catch (error) {
    console.error(`✗ Failed to convert PNG: ${outputPath}`, error);
    throw error;
  } finally {
    // Cleanup
    if (browser) {
      await browser.close();
    }
    if (tempHtmlPath) {
      try {
        unlinkSync(tempHtmlPath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
}
