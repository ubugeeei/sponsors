/**
 * SVG generation utility functions
 */

import type { Sponsor } from '../types';
import { elegantTheme, layoutConfig, typographyConfig } from './theme';

/**
 * Safely escape XML text
 */
export function escapeXml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Truncate text to specified width
 */
export function truncateText(text: string, maxLength: number = 30): string {
  if (text.length > maxLength) {
    return text.substring(0, maxLength - 2) + '…';
  }
  return text;
}

/**
 * Generate sponsor item (modern minimalist design)
 */
export function generateSponsorCard(
  x: number,
  y: number,
  sponsor: Sponsor,
  theme: typeof elegantTheme = elegantTheme
): string {
  const { avatarSize, avatarRadius } = layoutConfig;
  const name = truncateText(sponsor.name || sponsor.login, 20);
  const escapedName = escapeXml(name);
  // Use base64 encoded image if available, otherwise fall back to original URL
  const avatarUrl = (sponsor as any).avatarUrlBase64 || sponsor.avatarUrl || '';
  const escapedAvatarUrl = escapeXml(avatarUrl);
  const sanitizedLogin = sponsor.login.replace(/[^a-zA-Z0-9-_]/g, '_');

  return `
    <g class="sponsor-item" transform="translate(${x}, ${y})">
      <!-- Avatar circle background -->
      <circle
        cx="${avatarRadius}" cy="${avatarRadius}"
        r="${avatarRadius}"
        fill="${theme.accent}"
        opacity="0.15"
      />

      ${
        avatarUrl
          ? `<image
        x="0" y="0"
        width="${avatarSize}" height="${avatarSize}"
        href="${escapedAvatarUrl}"
        xlink:href="${escapedAvatarUrl}"
        clip-path="url(#avatar-clip-${sanitizedLogin})"
        preserveAspectRatio="xMidYMid slice"
      />`
          : `<circle
        cx="${avatarRadius}" cy="${avatarRadius}"
        r="${avatarRadius}"
        fill="${theme.accent}"
        opacity="0.3"
      />`
      }

      <!-- Avatar border -->
      <circle
        cx="${avatarRadius}" cy="${avatarRadius}"
        r="${avatarRadius}"
        fill="none"
        stroke="${theme.accent}"
        stroke-width="1"
        opacity="0.2"
      />

      <!-- Name -->
      <text
        x="${avatarSize + 8}" y="${avatarSize / 2 + 6}"
        fill="${theme.text}"
        font-size="${typographyConfig.sponsorName.fontSize}"
        font-weight="${typographyConfig.sponsorName.fontWeight}"
        font-family="${theme.fontFamily}"
      >
        ${escapedName}
      </text>
    </g>
  `;
}

/**
 * Get tier icon based on tier name
 */
function getTierIcon(title: string): string {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('hair salon') || lowerTitle.includes('platinum')) return '◆◆◆◆◆';
  if (lowerTitle.includes('shiropractic') || lowerTitle.includes('gold')) return '◆◆◆◆';
  if (lowerTitle.includes('lunch') || lowerTitle.includes('silver')) return '◆◆◆';
  if (lowerTitle.includes('drink') || lowerTitle.includes('bronze')) return '◆◆';
  if (lowerTitle.includes('chibi')) return '◆';
  if (lowerTitle.includes('past')) return '◇';
  return '●';
}

/**
 * Format tier title to make it more concise
 */
function formatTierTitle(title: string): string {
  const lowerTitle = title.toLowerCase();

  // Shorten long tier names while keeping them meaningful
  if (lowerTitle.includes('slightly fancier')) return 'Hair Salon Sponsors';
  if (lowerTitle.includes('hair salon')) return 'Hair Salon Sponsors';
  if (lowerTitle.includes('shiropractic')) return 'Shiropractic Sponsors';
  if (lowerTitle.includes('lunch')) return 'Lunch Sponsors';
  if (lowerTitle.includes('drink')) return 'Drink Sponsors';
  if (lowerTitle.includes('chibi')) return 'chibi Funs';
  if (lowerTitle.includes('past')) return 'Past Sponsors';

  return title;
}

/**
 * Generate tier title
 */
export function generateTierTitle(
  x: number,
  y: number,
  title: string,
  theme: typeof elegantTheme = elegantTheme
): string {
  const formattedTitle = formatTierTitle(title);
  const escapedTitle = escapeXml(formattedTitle);

  return `
    <g class="tier-title-group">
      <!-- Title text -->
      <text
        x="${x}" y="${y}"
        fill="${theme.primaryDark}"
        font-size="${typographyConfig.tierTitle.fontSize}"
        font-weight="${typographyConfig.tierTitle.fontWeight}"
        letter-spacing="${typographyConfig.tierTitle.letterSpacing}"
        font-family="${theme.fontFamily}"
        filter="url(#text-shadow)"
      >
        ${escapedTitle}
      </text>
    </g>
  `;
}

/**
 * Generate timeline connector
 */
export function generateTimelineConnector(
  x: number,
  fromY: number,
  toY: number,
  theme: typeof elegantTheme = elegantTheme
): string {
  const midY = (fromY + toY) / 2;

  return `
    <g class="timeline-connector">
      <!-- Connector line -->
      <line
        x1="${x}" y1="${fromY}"
        x2="${x}" y2="${toY}"
        stroke="${theme.accent}"
        stroke-width="2"
        stroke-dasharray="6,4"
        opacity="0.3"
      />

      <!-- Center marker -->
      <circle
        cx="${x}" cy="${midY}"
        r="4"
        fill="${theme.accent}"
        opacity="0.4"
      />
    </g>
  `;
}

/**
 * 背景レイアウトを生成
 */
export function generateBackground(
  width: number,
  height: number,
  theme: typeof elegantTheme = elegantTheme
): string {
  return `
    <!-- Background gradient -->
    <rect
      x="0" y="0"
      width="${width}" height="${height}"
      fill="url(#bg-gradient)"
    />

    <!-- Decorative pattern -->
    <rect
      x="0" y="0"
      width="${width}" height="${height}"
      fill="url(#dot-pattern)"
    />
  `;
}

/**
 * ラッパー g タグを生成
 */
export function wrapWithGroup(
  content: string,
  className: string = ''
): string {
  return `<g class="${className}">${content}</g>`;
}

/**
 * SVG メタデータを生成
 */
export function generateSVGMetadata(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>`;
}
