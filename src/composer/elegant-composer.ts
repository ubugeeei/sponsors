/**
 * Apple-inspired bold sponsor display
 * Clean, dramatic, typographically sophisticated
 */

import type { Sponsor, Tier } from '../types';
import { elegantTheme, layoutConfig } from './theme';
import { escapeXml } from './svg-utils';

export interface ComposerOptions {
  transparent?: boolean;
  darkText?: boolean;
}

export function elegantComposer(
  sponsorsOrTierSponsors: Sponsor[] | Array<Array<Sponsor>>,
  tiers: Tier[],
  width: number = 800,
  options: ComposerOptions = {}
): string {
  const { transparent = false, darkText = false } = options;

  let tierSponsors: Array<Array<Sponsor>>;
  if (sponsorsOrTierSponsors.length > 0 && Array.isArray(sponsorsOrTierSponsors[0])) {
    tierSponsors = sponsorsOrTierSponsors as Array<Array<Sponsor>>;
  } else {
    const sponsors = sponsorsOrTierSponsors as Sponsor[];
    tierSponsors = tiers.map(tier =>
      sponsors.filter(s => s.tier?.title === tier.title)
    );
  }

  // Reorder: high-value tiers first, Past Sponsors last
  const tiersWithSponsors = tiers.map((tier, i) => ({ tier, sponsors: tierSponsors[i] }))
    .filter(t => t.sponsors.length > 0);

  const pastIndex = tiersWithSponsors.findIndex(t => t.tier.title.toLowerCase().includes('past'));
  const pastTier = pastIndex >= 0 ? tiersWithSponsors.splice(pastIndex, 1)[0] : null;

  // Sort by monthlyDollars descending (highest tier first)
  tiersWithSponsors.sort((a, b) => (b.tier.monthlyDollars || 0) - (a.tier.monthlyDollars || 0));

  // Add past sponsors at the end
  if (pastTier) {
    tiersWithSponsors.push(pastTier);
  }

  const orderedTiers = tiersWithSponsors.map(t => t.tier);
  const orderedSponsors = tiersWithSponsors.map(t => t.sponsors);

  const padding = 64;
  const centerX = width / 2;

  // Calculate layout
  type Section = {
    tier: Tier;
    sponsors: Sponsor[];
    titleY: number;
    avatars: Array<{ x: number; y: number; size: number; sponsor: Sponsor }>;
    sectionHeight: number;
  };

  const sections: Section[] = [];
  let currentY = padding;

  // Header - minimal branding
  const headerHeight = 80;
  currentY += headerHeight;

  orderedTiers.forEach((tier, tierIdx) => {
    const sponsors = orderedSponsors[tierIdx];
    if (sponsors.length === 0) return;

    const isPast = tier.title.toLowerCase().includes('past');

    // Tier-based sizing (ordered by value, highest first)
    const activeTierCount = orderedTiers.filter(t => !t.title.toLowerCase().includes('past')).length;
    let avatarSize: number;
    if (isPast) {
      avatarSize = 36;
    } else if ((tier.monthlyDollars || 0) >= 256) {
      avatarSize = 120;
    } else if (tierIdx === 0) {
      avatarSize = 80;
    } else if (tierIdx === 1) {
      avatarSize = 68;
    } else if (tierIdx === 2) {
      avatarSize = 56;
    } else if (tierIdx === 3) {
      avatarSize = 48;
    } else {
      avatarSize = 44;
    }

    const gap = isPast ? 12 : Math.max(16, avatarSize * 0.3);
    const itemWidth = avatarSize + gap;
    const maxPerRow = Math.max(1, Math.floor((width - padding * 2 + gap) / itemWidth));
    const rows = Math.ceil(sponsors.length / maxPerRow);

    // Title position
    const titleY = currentY;
    currentY += isPast ? 36 : 56;

    // Calculate avatar positions (centered)
    const avatars: Array<{ x: number; y: number; size: number; sponsor: Sponsor }> = [];

    for (let i = 0; i < sponsors.length; i++) {
      const row = Math.floor(i / maxPerRow);
      const itemsInRow = Math.min(sponsors.length - row * maxPerRow, maxPerRow);
      const col = i % maxPerRow;

      const rowWidth = itemsInRow * avatarSize + (itemsInRow - 1) * gap;
      const startX = centerX - rowWidth / 2;

      const x = startX + col * (avatarSize + gap);
      const y = currentY + row * (avatarSize + gap);

      avatars.push({ x, y, size: avatarSize, sponsor: sponsors[i] });
    }

    const contentHeight = rows * (avatarSize + gap) - gap;

    sections.push({
      tier,
      sponsors,
      titleY,
      avatars,
      sectionHeight: contentHeight,
    });

    currentY += contentHeight + (isPast ? 48 : 72);
  });

  const height = Math.max(600, currentY + padding);

  // Build SVG
  let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  svg += `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n`;

  // Embedded font styles
  const colors = darkText
    ? { titleLarge: '#212121', titleMedium: 'rgba(33,33,33,0.85)', titleSmall: 'rgba(33,33,33,0.6)', header: 'rgba(33,33,33,0.4)', line: 'rgba(33,33,33,0.08)', titleLine: 'rgba(33,33,33,0.15)', ring: 'rgba(33,33,33,0.1)', fallbackAvatar: '#e0e0e0' }
    : { titleLarge: '#fff', titleMedium: 'rgba(255,255,255,0.85)', titleSmall: 'rgba(255,255,255,0.6)', header: 'rgba(255,255,255,0.4)', line: 'rgba(255,255,255,0.08)', titleLine: 'rgba(255,255,255,0.15)', ring: 'rgba(255,255,255,0.1)', fallbackAvatar: '#1a1a1a' };

  svg += `<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&amp;display=swap');
text { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif; }
.tier-title { font-weight: 300; letter-spacing: 0.25em; text-transform: uppercase; }
.tier-title-large { font-size: 24px; fill: ${colors.titleLarge}; }
.tier-title-medium { font-size: 18px; fill: ${colors.titleMedium}; }
.tier-title-small { font-size: 14px; fill: ${colors.titleSmall}; }
.header-text { font-weight: 500; font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; fill: ${colors.header}; }
a:hover g { opacity: 0.8; }
</style>\n`;

  // Defs for clip paths
  svg += '<defs>\n';

  // Gradient for subtle depth
  svg += `<linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="#0a0a0a"/>
    <stop offset="100%" stop-color="#000000"/>
  </linearGradient>\n`;

  // Clip paths for each avatar
  sections.forEach(section => {
    section.avatars.forEach(({ sponsor, size }) => {
      const id = sponsor.login.replace(/[^a-zA-Z0-9-_]/g, '_');
      const r = size / 2;
      svg += `<clipPath id="clip-${id}"><circle cx="${r}" cy="${r}" r="${r}"/></clipPath>\n`;
    });
  });

  svg += '</defs>\n';

  // Background
  if (!transparent) {
    svg += `<rect x="0" y="0" width="${width}" height="${height}" fill="url(#bgGrad)"/>\n`;
  }

  // Subtle top accent line
  svg += `<line x1="${padding}" y1="${padding - 20}" x2="${width - padding}" y2="${padding - 20}" stroke="${colors.line}" stroke-width="1"/>\n`;

  // Header
  svg += `<text x="${centerX}" y="${padding + 24}" text-anchor="middle" class="header-text">Sponsors</text>\n`;

  // Render sections
  sections.forEach((section, sectionIdx) => {
    const { tier, avatars, titleY } = section;
    const isPast = tier.title.toLowerCase().includes('past');

    // Determine title class based on tier importance
    let titleClass = 'tier-title ';
    if (isPast) {
      titleClass += 'tier-title-small';
    } else if (sectionIdx === 0) {
      titleClass += 'tier-title-large';
    } else if (sectionIdx <= 2) {
      titleClass += 'tier-title-medium';
    } else {
      titleClass += 'tier-title-small';
    }

    // Tier title - centered
    svg += `<text x="${centerX}" y="${titleY}" text-anchor="middle" class="${titleClass}">${escapeXml(tier.title)}</text>\n`;

    // Decorative line under title (only for active tiers)
    if (!isPast && sectionIdx < 3) {
      const lineWidth = Math.min(120, tier.title.length * 12);
      svg += `<line x1="${centerX - lineWidth/2}" y1="${titleY + 12}" x2="${centerX + lineWidth/2}" y2="${titleY + 12}" stroke="${colors.titleLine}" stroke-width="1"/>\n`;
    }

    // Avatars
    avatars.forEach(({ x, y, size, sponsor }) => {
      const id = sponsor.login.replace(/[^a-zA-Z0-9-_]/g, '_');
      const avatarUrl = (sponsor as any).avatarUrlBase64 || sponsor.avatarUrl || '';
      const profileUrl = escapeXml(sponsor.profile || '#');
      const opacity = isPast ? 0.5 : 1;

      svg += `<a href="${profileUrl}" target="_blank">\n`;
      svg += `<g transform="translate(${x}, ${y})" opacity="${opacity}">\n`;

      // Subtle ring around avatar
      if (!isPast) {
        svg += `<circle cx="${size/2}" cy="${size/2}" r="${size/2 + 2}" fill="none" stroke="${colors.ring}" stroke-width="1"/>\n`;
      }

      if (avatarUrl) {
        svg += `<image x="0" y="0" width="${size}" height="${size}" href="${escapeXml(avatarUrl)}" clip-path="url(#clip-${id})" preserveAspectRatio="xMidYMid slice"/>\n`;
      } else {
        svg += `<circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="${colors.fallbackAvatar}"/>\n`;
      }

      svg += `</g>\n</a>\n`;
    });
  });

  // Subtle bottom accent
  svg += `<line x1="${padding}" y1="${height - padding + 20}" x2="${width - padding}" y2="${height - padding + 20}" stroke="${colors.line}" stroke-width="1"/>\n`;

  svg += '</svg>';
  return svg;
}
