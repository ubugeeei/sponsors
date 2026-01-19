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
 * @param transparent Whether to use transparent background
 */
export async function convertToPng(
  svgBuffer: Buffer,
  outputPath: string,
  transparent: boolean = false
): Promise<void> {
  let browser;
  let tempHtmlPath: string | null = null;

  try {
    const { chromium } = await import('playwright');

    // Create temporary HTML file
    const svgString = svgBuffer.toString('utf-8');
    const backgroundColor = transparent ? 'transparent' : '#0A0A0A';

    const htmlContent = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; }
    body { background: ${backgroundColor}; }
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

    // Set viewport to match SVG dimensions
    await page.setViewportSize({
      width: dimensions.width,
      height: dimensions.height,
    });

    // Wait for rerender after viewport change
    await page.waitForTimeout(500);

    // Take screenshot
    await page.screenshot({
      path: outputPath,
      clip: {
        x: 0,
        y: 0,
        width: dimensions.width,
        height: dimensions.height,
      },
      omitBackground: transparent,
    });

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
