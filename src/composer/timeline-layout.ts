/**
 * Clean grid layout calculation
 */

import { layoutConfig } from './theme';

export interface LayoutPosition {
  x: number;
  y: number;
}

export interface TierLayout {
  title: LayoutPosition;
  cards: LayoutPosition[];
  connectorStartY?: number;
  connectorEndY?: number;
  totalHeight: number;
}

export interface ComposedLayout {
  canvasWidth: number;
  canvasHeight: number;
  tiers: TierLayout[];
}

/**
 * Calculate tier layout with proper spacing
 */
export function calculateTierLayout(
  sponsorCount: number,
  tierIndex: number,
  tierTitle: string = ''
): TierLayout {
  const { padding, avatarSize, cardGap } = layoutConfig;
  const canvasWidth = layoutConfig.width;

  const isPast = tierTitle.toLowerCase().includes('past');
  const scale = isPast ? 0.7 : 1;
  const actualAvatarSize = avatarSize * scale;
  const actualGap = isPast ? 8 : cardGap;

  const itemWidth = actualAvatarSize + actualGap;
  const maxPerRow = Math.floor((canvasWidth - padding * 2 + actualGap) / itemWidth);
  const perRow = Math.min(sponsorCount, maxPerRow);
  const rows = Math.ceil(sponsorCount / perRow);

  const cards: LayoutPosition[] = [];
  for (let i = 0; i < sponsorCount; i++) {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    const rowCount = Math.min(sponsorCount - row * perRow, perRow);
    const rowWidth = rowCount * itemWidth - actualGap;
    const startX = (canvasWidth - rowWidth) / 2;

    cards.push({
      x: startX + col * itemWidth,
      y: row * (actualAvatarSize + actualGap),
    });
  }

  const contentHeight = rows * (actualAvatarSize + actualGap);

  return {
    title: { x: padding, y: 0 },
    cards,
    totalHeight: contentHeight,
  };
}

/**
 * Calculate complete layout
 */
export function calculateComposedLayout(
  tierSponsors: Array<Array<any>>,
  tierTitles: string[] = []
): ComposedLayout {
  const { padding, tierPadding } = layoutConfig;
  const canvasWidth = layoutConfig.width;
  const titleHeight = 24;
  const sectionGap = 48;

  let currentY = padding;
  const tiers: TierLayout[] = [];

  for (let i = 0; i < tierSponsors.length; i++) {
    const sponsors = tierSponsors[i];
    if (sponsors.length === 0) continue;

    const tierTitle = tierTitles[i] || '';
    const tierLayout = calculateTierLayout(sponsors.length, i, tierTitle);

    tierLayout.title.y = currentY;

    const avatarsStartY = currentY + titleHeight + tierPadding;
    tierLayout.cards = tierLayout.cards.map(card => ({
      x: card.x,
      y: card.y + avatarsStartY,
    }));

    tiers.push(tierLayout);
    currentY = avatarsStartY + tierLayout.totalHeight + sectionGap;
  }

  const totalHeight = currentY + padding;

  return {
    canvasWidth,
    canvasHeight: Math.max(layoutConfig.minHeight, totalHeight),
    tiers,
  };
}

export function snapToGrid(value: number, gridSize: number = 4): number {
  return Math.round(value / gridSize) * gridSize;
}

export function ensureMinHeight(height: number, minHeight: number = layoutConfig.minHeight): number {
  return Math.max(height, minHeight);
}

export function calculateBounds(layout: ComposedLayout) {
  const { padding, avatarSize } = layoutConfig;
  let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;

  for (const tier of layout.tiers) {
    for (const card of tier.cards) {
      minX = Math.min(minX, card.x);
      minY = Math.min(minY, card.y);
      maxX = Math.max(maxX, card.x + avatarSize);
      maxY = Math.max(maxY, card.y + avatarSize);
    }
    minX = Math.min(minX, tier.title.x);
    minY = Math.min(minY, tier.title.y);
  }

  return { x: minX, y: minY, width: maxX - minX + padding, height: maxY - minY + padding };
}
