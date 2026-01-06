/**
 * タイムラインレイアウト計算ロジック
 * スポンサーの配置位置とティア間隔を計算
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
 * ティアのレイアウトを計算
 * カードの数に基づいて、効率的な配置を計算
 */
export function calculateTierLayout(
  sponsorCount: number,
  tierIndex: number
): TierLayout {
  const { padding, cardWidth, cardHeight, cardGap, tierPadding, tierGap } = layoutConfig;
  const canvasWidth = layoutConfig.width;

  // ティア内のカード幅（ギャップを含む）
  const cardWidthWithGap = cardWidth + cardGap;

  // 1行に配置できるカード数を計算
  const maxCardsPerRow = Math.floor((canvasWidth - padding * 2) / cardWidthWithGap);
  const actualCardsPerRow = Math.min(sponsorCount, maxCardsPerRow);

  // 行数を計算
  const rowCount = Math.ceil(sponsorCount / actualCardsPerRow);

  // 各行の高さ
  const rowHeight = cardHeight + cardGap;
  const tiersTotal = rowCount * rowHeight;

  // カード位置を計算
  const cards: LayoutPosition[] = [];
  for (let i = 0; i < sponsorCount; i++) {
    const row = Math.floor(i / actualCardsPerRow);
    const col = i % actualCardsPerRow;

    // 行全体の幅を計算（中央寄せ）
    const rowActualCardsCount = Math.min(
      sponsorCount - row * actualCardsPerRow,
      actualCardsPerRow
    );
    const rowTotalWidth = rowActualCardsCount * cardWidthWithGap - cardGap;
    const rowStartX = (canvasWidth - rowTotalWidth) / 2;

    const x = rowStartX + col * cardWidthWithGap;
    const y = padding + tierPadding + (tierIndex > 0 ? tierIndex * tierGap : 0) + row * rowHeight;

    cards.push({ x, y });
  }

  // ティアタイトル位置
  const titleY = padding + tierPadding + (tierIndex > 0 ? tierIndex * tierGap : 0) - 20;

  return {
    title: { x: padding, y: titleY },
    cards,
    totalHeight: tiersTotal + tierGap,
  };
}

/**
 * 複数ティアのレイアウト全体を計算
 */
export function calculateComposedLayout(
  tierSponsors: Array<Array<any>>
): ComposedLayout {
  const { padding, tierGap } = layoutConfig;
  const canvasWidth = layoutConfig.width;

  let currentY = padding;
  const tiers: TierLayout[] = [];

  for (let tierIndex = 0; tierIndex < tierSponsors.length; tierIndex++) {
    const sponsors = tierSponsors[tierIndex];

    if (sponsors.length === 0) {
      continue; // スポンサーがないティアはスキップ
    }

    const tierLayout = calculateTierLayout(sponsors.length, tierIndex);

    // Y 座標を更新
    tierLayout.title.y = currentY;
    tierLayout.cards = tierLayout.cards.map((card) => ({
      x: card.x,
      y: card.y + (currentY - padding - tierGap * tierIndex),
    }));

    tierLayout.connectorStartY = currentY - 10;
    tierLayout.connectorEndY = currentY + tierLayout.totalHeight - tierGap;

    tiers.push(tierLayout);
    currentY += tierLayout.totalHeight;
  }

  const totalHeight = currentY + padding;

  return {
    canvasWidth,
    canvasHeight: Math.max(layoutConfig.minHeight, totalHeight),
    tiers,
  };
}

/**
 * グリッドスナップ機能（オプション）
 * 位置を グリッド値に合わせる
 */
export function snapToGrid(value: number, gridSize: number = 5): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * 高さの最適化（最小高さ以上であることを保証）
 */
export function ensureMinHeight(
  height: number,
  minHeight: number = layoutConfig.minHeight
): number {
  return Math.max(height, minHeight);
}

/**
 * レイアウトのバウンディングボックスを計算
 */
export function calculateBounds(layout: ComposedLayout) {
  const { padding } = layoutConfig;
  const { cardWidth, cardHeight } = layoutConfig;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = 0;
  let maxY = 0;

  for (const tier of layout.tiers) {
    for (const card of tier.cards) {
      minX = Math.min(minX, card.x);
      minY = Math.min(minY, card.y);
      maxX = Math.max(maxX, card.x + cardWidth);
      maxY = Math.max(maxY, card.y + cardHeight);
    }

    minX = Math.min(minX, tier.title.x);
    minY = Math.min(minY, tier.title.y);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX + padding,
    height: maxY - minY + padding,
  };
}
