/**
 * Clean SVG generation
 */

import type { Sponsor } from '../types';
import { elegantTheme, layoutConfig, typographyConfig } from './theme';

export function escapeXml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function truncateText(text: string, maxLength: number = 30): string {
  if (text.length > maxLength) {
    return text.substring(0, maxLength - 1) + '…';
  }
  return text;
}

/**
 * Generate sponsor avatar
 */
export function generateSponsorCard(
  x: number,
  y: number,
  sponsor: Sponsor,
  theme: typeof elegantTheme = elegantTheme,
  small: boolean = false
): string {
  const scale = small ? 0.7 : 1;
  const size = layoutConfig.avatarSize * scale;
  const radius = layoutConfig.avatarRadius * scale;
  const opacity = small ? 0.5 : 1;

  const avatarUrl = (sponsor as any).avatarUrlBase64 || sponsor.avatarUrl || '';
  const escapedAvatarUrl = escapeXml(avatarUrl);
  const sanitizedLogin = sponsor.login.replace(/[^a-zA-Z0-9-_]/g, '_');

  return `
    <g class="sponsor-item" transform="translate(${x}, ${y})" opacity="${opacity}">
      ${avatarUrl
        ? `<image x="0" y="0" width="${size}" height="${size}" href="${escapedAvatarUrl}" xlink:href="${escapedAvatarUrl}" clip-path="url(#avatar-clip-${sanitizedLogin})" preserveAspectRatio="xMidYMid slice"/>`
        : `<circle cx="${radius}" cy="${radius}" r="${radius}" fill="#333"/>`
      }
    </g>
  `;
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
  const escaped = escapeXml(title);
  const isPast = title.toLowerCase().includes('past');
  const opacity = isPast ? 0.5 : 0.6;

  return `
    <text x="${x}" y="${y + 14}" fill="${theme.textSecondary}" font-size="13" font-weight="500" letter-spacing="0.05em" font-family="${theme.fontFamily}" opacity="${opacity}">${escaped}</text>
  `;
}

export function generateTimelineConnector(
  x: number, fromY: number, toY: number,
  theme: typeof elegantTheme = elegantTheme
): string {
  return '';
}

export function generateBackground(
  width: number, height: number,
  theme: typeof elegantTheme = elegantTheme
): string {
  return `<rect x="0" y="0" width="${width}" height="${height}" fill="#000"/>`;
}

export function wrapWithGroup(content: string, className: string = ''): string {
  return `<g class="${className}">${content}</g>`;
}

export function generateSVGMetadata(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>`;
}
