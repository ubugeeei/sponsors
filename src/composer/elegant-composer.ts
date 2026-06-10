/**
 * Sponsor display SVG composer — editorial bento layout.
 *
 * Hero sponsor on the left, asymmetric grid of feature cells in the middle,
 * curated "Tools" cell on the right, wide strips for lower tiers below,
 * compressed footer for past supporters. Monochrome, hairline, mode-leaning.
 */

import type { Sponsor, Tier, Tool } from "../types";
import { escapeXml } from "./svg-utils";

export interface ComposerOptions {
  transparent?: boolean;
  darkText?: boolean;
  tools?: Tool[];
}

type Palette = {
  bg: string;
  surface: string;
  surfaceStroke: string;
  heroSurface: string;
  heroStroke: string;
  rule: string;
  text: string;
  textMid: string;
  textDim: string;
  textFaint: string;
  textHero: string;
  ring: string;
  ringHero: string;
  fallbackAvatar: string;
  brandSurface: string;
};

const LIGHT_PALETTE: Palette = {
  bg: "url(#bgGrad)",
  surface: "rgba(255,255,255,0.018)",
  surfaceStroke: "rgba(255,255,255,0.07)",
  heroSurface: "rgba(255,255,255,0.028)",
  heroStroke: "rgba(255,255,255,0.18)",
  rule: "rgba(255,255,255,0.12)",
  text: "rgba(255,255,255,0.94)",
  textMid: "rgba(255,255,255,0.62)",
  textDim: "rgba(255,255,255,0.42)",
  textFaint: "rgba(255,255,255,0.22)",
  textHero: "#ffffff",
  ring: "rgba(255,255,255,0.14)",
  ringHero: "rgba(255,255,255,0.55)",
  fallbackAvatar: "#1a1a1f",
  brandSurface: "rgba(255,255,255,0.05)",
};

const DARK_PALETTE: Palette = {
  bg: "transparent",
  surface: "rgba(15,15,20,0.025)",
  surfaceStroke: "rgba(15,15,20,0.09)",
  heroSurface: "rgba(15,15,20,0.04)",
  heroStroke: "rgba(15,15,20,0.22)",
  rule: "rgba(15,15,20,0.16)",
  text: "rgba(15,15,20,0.94)",
  textMid: "rgba(15,15,20,0.62)",
  textDim: "rgba(15,15,20,0.42)",
  textFaint: "rgba(15,15,20,0.22)",
  textHero: "rgba(15,15,20,0.98)",
  ring: "rgba(15,15,20,0.16)",
  ringHero: "rgba(15,15,20,0.55)",
  fallbackAvatar: "#e6e6ea",
  brandSurface: "rgba(15,15,20,0.05)",
};

type CellKind = "hero" | "feature" | "wide" | "tools" | "footer";

type SponsorCell = {
  kind: Exclude<CellKind, "tools">;
  tier: Tier;
  sponsors: Sponsor[];
  x: number;
  y: number;
  w: number;
  h: number;
  index: number;
};

type ToolsCell = {
  kind: "tools";
  tools: Tool[];
  x: number;
  y: number;
  w: number;
  h: number;
  index: number;
};

type Cell = SponsorCell | ToolsCell;

type AvatarRender = {
  uid: string;
  x: number;
  y: number;
  size: number;
  shape: "circle" | "squircle";
  href: string;
  avatarUrl: string;
  caption?: { primary?: string; secondary?: string };
  opacity: number;
  ring: "none" | "thin" | "hero";
};

const PAD = 36;
const GUTTER = 16;
const HEADER_H = 144;
const CELL_RX = 4;

function isPastTier(tier: Tier): boolean {
  return tier.title.toLowerCase().includes("past") || (tier.monthlyDollars ?? 0) < 0;
}

function avatarSizeForDollars(dollars: number): number {
  if (dollars >= 256) return 152;
  if (dollars >= 64) return 80;
  if (dollars >= 24) return 60;
  if (dollars >= 8) return 44;
  if (dollars >= 4) return 34;
  return 30;
}

const TIER_LABEL_OVERRIDES: Record<string, string> = {
  "slightly fancier hair salon": "FANCIER",
};

function shortTierTitle(title: string): string {
  const cleaned = title
    .replace(/\bsponsors\b/gi, "")
    .replace(/\bfuns\b/gi, "")
    .trim();
  const key = cleaned.toLowerCase();
  if (TIER_LABEL_OVERRIDES[key]) return TIER_LABEL_OVERRIDES[key];
  return cleaned.toUpperCase();
}

function fitName(name: string, allotmentPx: number, fontSize: number): string {
  // Inter at this weight ≈ 0.55 em per char average. Cap to fit allotment.
  const approxCharW = fontSize * 0.55;
  const maxChars = Math.max(2, Math.floor(allotmentPx / approxCharW));
  if (name.length <= maxChars) return name;
  return name.slice(0, maxChars - 1) + "…";
}

function packGrid(
  count: number,
  innerW: number,
  innerH: number,
  baseSize: number,
  gap: number,
  hasCaption: boolean,
  captionH: number,
): { size: number; cols: number; rows: number } {
  let size = baseSize;
  for (let i = 0; i < 12; i++) {
    const cols = Math.max(1, Math.floor((innerW + gap) / (size + gap)));
    const rows = Math.ceil(count / cols);
    const cellH = size + (hasCaption ? captionH : 0);
    const needH = rows * cellH + (rows - 1) * gap;
    if (needH <= innerH && size <= baseSize) return { size, cols, rows };
    if (needH <= innerH) return { size, cols, rows };
    size = Math.max(18, Math.floor(size * 0.92));
  }
  const cols = Math.max(1, Math.floor((innerW + gap) / (size + gap)));
  const rows = Math.ceil(count / cols);
  return { size, cols, rows };
}

function layoutSponsorAvatars(
  sponsors: Sponsor[],
  cell: SponsorCell,
  innerInset: { top: number; bottom: number; side: number },
  showName: boolean,
): AvatarRender[] {
  const isHero = cell.kind === "hero";
  const isFooter = cell.kind === "footer";
  const dollars = cell.tier.monthlyDollars ?? 0;

  const baseSize = isFooter
    ? 26
    : isHero
      ? sponsors.length === 1
        ? 152
        : 110
      : avatarSizeForDollars(dollars);

  const innerW = cell.w - innerInset.side * 2;
  const innerH = cell.h - innerInset.top - innerInset.bottom;
  const gap = isFooter ? 10 : Math.max(10, Math.round(baseSize * 0.22));
  // One-time sponsors carry a "one-time" annotation under the avatar — reserve caption height
  // whenever the cell contains any of them. Suppressed in the footer (avatars are too tiny there;
  // stale one-time payments are archived anyway so the distinction is no longer load-bearing).
  const annotateOneTime = !isFooter;
  const hasOneTime = annotateOneTime && sponsors.some((s) => s.isOneTime === true);
  const captionH = showName || hasOneTime ? (isHero ? 28 : 16) : 0;

  const { size, cols, rows } = packGrid(
    sponsors.length,
    innerW,
    innerH,
    baseSize,
    gap,
    showName,
    captionH,
  );

  const cellHeight = size + captionH;
  const gridH = rows * cellHeight + (rows - 1) * gap;
  const startY = cell.y + innerInset.top + (innerH - gridH) / 2;

  // Hero with a single sponsor gets full cell width for its caption;
  // anyone else gets only the avatar slot plus the gap that separates them.
  const isHeroSingle = isHero && sponsors.length === 1;
  const nameFs = isHero ? 18 : 10;
  const nameAllot = isHeroSingle ? cell.w - 40 : size + gap;

  const out: AvatarRender[] = [];
  for (let i = 0; i < sponsors.length; i++) {
    const row = Math.floor(i / cols);
    const itemsInRow = Math.min(sponsors.length - row * cols, cols);
    const rowW = itemsInRow * size + (itemsInRow - 1) * gap;
    const startX = cell.x + (cell.w - rowW) / 2;
    const col = i % cols;
    const sponsor = sponsors[i];
    const isOneTime = sponsor.isOneTime === true;
    const primary = showName ? fitName(sponsor.name, nameAllot, nameFs) : undefined;
    const secondary = isOneTime && annotateOneTime ? "one-time" : undefined;
    out.push({
      uid: `s-${cell.index}-${i}`,
      x: startX + col * (size + gap),
      y: startY + row * (cellHeight + gap),
      size,
      shape: "circle",
      href: sponsor.profile || "#",
      avatarUrl: (sponsor as any).avatarUrlBase64 || sponsor.avatarUrl || "",
      caption: primary || secondary ? { primary, secondary } : undefined,
      opacity: isFooter ? 0.55 : 1,
      ring: isFooter ? "none" : "thin",
    });
  }
  return out;
}

function layoutToolAvatars(cell: ToolsCell): AvatarRender[] {
  const innerSide = 20;
  const top = 70;
  const bottom = 22;
  const innerW = cell.w - innerSide * 2;
  const innerH = cell.h - top - bottom;

  // Tight caption + gap; this matches how renderAvatar lays out primary + secondary captions.
  const captionH = 34;
  const rowGap = 24;

  // Base sizes — shrink uniformly if the column can't fit all tools at full size.
  let largeSize = Math.min(140, Math.floor(innerW * 0.82));
  let smallSize = 56;

  const sizeFor = (t: Tool) => (t.emphasis === "large" ? largeSize : smallSize);
  const totalContentH = () =>
    cell.tools.reduce(
      (sum, t, i) => sum + sizeFor(t) + captionH + (i > 0 ? rowGap : 0),
      0,
    );

  // Shrink large first (visually most expensive), then small if still too tall.
  while (totalContentH() > innerH && largeSize > 76) {
    largeSize -= 4;
  }
  while (totalContentH() > innerH && smallSize > 40) {
    smallSize -= 2;
  }

  let cursorY = cell.y + top + Math.max(0, (innerH - totalContentH()) / 2);

  const out: AvatarRender[] = [];
  cell.tools.forEach((t, i) => {
    const size = sizeFor(t);
    const x = cell.x + (cell.w - size) / 2;
    out.push({
      uid: `t-${cell.index}-${i}`,
      x,
      y: cursorY,
      size,
      shape: "squircle",
      href: t.profile,
      avatarUrl: t.avatarUrlBase64 || t.avatarUrl || "",
      caption: { primary: t.name, secondary: t.role },
      opacity: 1,
      ring: "thin",
    });
    cursorY += size + captionH + rowGap;
  });
  return out;
}

function renderAvatar(a: AvatarRender, palette: Palette): string {
  const r = a.size / 2;
  const rx = a.shape === "squircle" ? Math.round(a.size * 0.22) : 0;
  const ringR = r + 2;
  let svg = `<a href="${escapeXml(a.href)}" target="_blank">\n`;
  svg += `<g transform="translate(${fmt(a.x)}, ${fmt(a.y)})" opacity="${a.opacity}">\n`;

  if (a.shape === "squircle") {
    svg += `<rect x="0" y="0" width="${a.size}" height="${a.size}" rx="${rx}" fill="${palette.brandSurface}"/>\n`;
  }

  if (a.ring === "thin") {
    if (a.shape === "circle") {
      svg += `<circle cx="${r}" cy="${r}" r="${ringR}" fill="none" stroke="${palette.ring}" stroke-width="1"/>\n`;
    } else {
      svg += `<rect x="-1" y="-1" width="${a.size + 2}" height="${a.size + 2}" rx="${rx + 1}" fill="none" stroke="${palette.ring}" stroke-width="1"/>\n`;
    }
  }

  if (a.avatarUrl) {
    svg += `<image x="0" y="0" width="${a.size}" height="${a.size}" href="${escapeXml(a.avatarUrl)}" clip-path="url(#clip-${a.uid})" preserveAspectRatio="xMidYMid slice"/>\n`;
  } else {
    if (a.shape === "circle") {
      svg += `<circle cx="${r}" cy="${r}" r="${r}" fill="${palette.fallbackAvatar}"/>\n`;
    } else {
      svg += `<rect x="0" y="0" width="${a.size}" height="${a.size}" rx="${rx}" fill="${palette.fallbackAvatar}"/>\n`;
    }
  }

  if (a.caption?.primary || a.caption?.secondary) {
    const isLarge = a.size >= 110;
    const isMed = a.size >= 70;
    const fs = isLarge ? 18 : isMed ? 11 : 10;
    const baselineY = a.size + fs + 10;
    if (a.caption.primary) {
      svg += `<text x="${r}" y="${baselineY}" text-anchor="middle" class="${isLarge ? "name-hero" : "name"}">${escapeXml(a.caption.primary)}</text>\n`;
      if (a.caption.secondary) {
        const subY = baselineY + (isLarge ? 18 : 14);
        svg += `<text x="${r}" y="${subY}" text-anchor="middle" class="name-sub">${escapeXml(a.caption.secondary.toUpperCase())}</text>\n`;
      }
    } else if (a.caption.secondary) {
      // Secondary-only — typically a one-time annotation in a cell that doesn't show names.
      svg += `<text x="${r}" y="${baselineY}" text-anchor="middle" class="name-sub">${escapeXml(a.caption.secondary.toUpperCase())}</text>\n`;
    }
  }

  svg += `</g>\n</a>\n`;
  return svg;
}

function renderCellFrame(cell: Cell, palette: Palette): string {
  const isHero = cell.kind === "hero";
  const fill = isHero ? palette.heroSurface : palette.surface;
  const stroke = isHero ? palette.heroStroke : palette.surfaceStroke;
  return `<rect x="${fmt(cell.x)}" y="${fmt(cell.y)}" width="${cell.w}" height="${cell.h}" rx="${CELL_RX}" fill="${fill}" stroke="${stroke}" stroke-width="1"/>\n`;
}

/**
 * Editorial cell meta — no monetary figures, by design.
 * Two visual modes:
 *   - hero / feature / tools → small "N°" mark + the tier name promoted to display type. The label IS the graphic.
 *   - wide / footer → compact single-line meta strip.
 */
function renderCellMeta(cell: Cell, palette: Palette): string {
  const lx = cell.x + 20;
  const rx = cell.x + cell.w - 20;

  const noStr = `N° ${String(cell.index).padStart(2, "0")}`;
  let labelStr = "";
  if (cell.kind === "tools") labelStr = "TOOLS";
  else if (cell.kind === "footer") labelStr = "ARCHIVE";
  else labelStr = shortTierTitle(cell.tier.title);

  // Compact single-line meta for wide strips and footer (count only, no $ amount).
  if (cell.kind === "wide" || cell.kind === "footer") {
    const baseY = cell.y + 28;
    const count = cell.sponsors.length;
    const noun =
      cell.kind === "footer"
        ? count === 1
          ? "ENTRY"
          : "ENTRIES"
        : count === 1
          ? "SPONSOR"
          : "SPONSORS";
    const right = `${String(count).padStart(2, "0")} ${noun}`;
    let svg = `<text x="${lx}" y="${baseY}" class="cell-no" fill="${palette.textDim}">${noStr}</text>\n`;
    svg += `<text x="${lx + 60}" y="${baseY}" class="tier-display-inline" fill="${palette.text}">${escapeXml(labelStr)}</text>\n`;
    svg += `<text x="${rx}" y="${baseY}" text-anchor="end" class="display-mini" fill="${palette.textMid}">${escapeXml(right)}</text>\n`;
    return svg;
  }

  // Stacked meta for hero / feature / tools — N° + display-class tier name.
  const isHero = cell.kind === "hero";
  const ty = cell.y + 26;
  const count = cell.kind === "tools" ? cell.tools.length : cell.sponsors.length;
  const countNoun =
    cell.kind === "tools"
      ? count === 1
        ? "ITEM"
        : "ITEMS"
      : count === 1
        ? "SPONSOR"
        : "SPONSORS";
  const countStr = `${String(count).padStart(2, "0")} ${countNoun}`;

  let svg = `<text x="${lx}" y="${ty}" class="cell-no" fill="${palette.textDim}">${noStr}</text>\n`;
  // Count appears as a small mono accent on the right of the top row.
  svg += `<text x="${rx}" y="${ty}" text-anchor="end" class="display-mini" fill="${palette.textDim}">${escapeXml(countStr)}</text>\n`;
  // Tier name as the display element — sized to weight the cell.
  const tierY = ty + (isHero ? 38 : 28);
  svg += `<text x="${lx}" y="${tierY}" class="${isHero ? "tier-display-hero" : "tier-display"}" fill="${palette.text}">${escapeXml(labelStr)}</text>\n`;
  return svg;
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

export function elegantComposer(
  sponsorsOrTierSponsors: Sponsor[] | Array<Array<Sponsor>>,
  tiers: Tier[],
  width: number = 1200,
  options: ComposerOptions = {},
): string {
  const { transparent = false, darkText = false, tools = [] } = options;
  const palette = darkText ? DARK_PALETTE : LIGHT_PALETTE;

  // Normalize sponsor groupings.
  let tierSponsors: Array<Array<Sponsor>>;
  if (sponsorsOrTierSponsors.length > 0 && Array.isArray(sponsorsOrTierSponsors[0])) {
    tierSponsors = sponsorsOrTierSponsors as Array<Array<Sponsor>>;
  } else {
    const sponsors = sponsorsOrTierSponsors as Sponsor[];
    tierSponsors = tiers.map((tier) => sponsors.filter((s) => s.tier?.title === tier.title));
  }

  const groups = tiers
    .map((tier, i) => ({ tier, sponsors: tierSponsors[i] }))
    .filter((g) => g.sponsors.length > 0);

  // Anything at $0 or below collapses into the archive footer — tightens vertical rhythm.
  const archiveSponsors: Sponsor[] = [];
  for (const g of groups) {
    if (isPastTier(g.tier) || (g.tier.monthlyDollars ?? 0) <= 0) {
      archiveSponsors.push(...g.sponsors);
    }
  }
  const activeGroups = groups
    .filter((g) => !isPastTier(g.tier) && (g.tier.monthlyDollars ?? 0) > 0)
    .sort((a, b) => (b.tier.monthlyDollars || 0) - (a.tier.monthlyDollars || 0));

  // Layout — 3 columns in row 1: hero / features / tools.
  // Tools cell extends vertically through any wide strips below for a true-bento feel.
  const cells: Cell[] = [];
  let cellIndex = 1;

  const hasTools = tools.length > 0;
  const HERO_W = hasTools ? 460 : 580;
  const TOOLS_W = 244;
  const innerW = width - PAD * 2;
  const midW = hasTools
    ? innerW - HERO_W - TOOLS_W - GUTTER * 2
    : innerW - HERO_W - GUTTER;
  const ROW1_H = 360;
  const STRIP_H = 116;
  let currentY = PAD + HEADER_H;

  // Hero — top tier sponsor.
  if (activeGroups.length > 0) {
    const heroGroup = activeGroups.shift()!;
    cells.push({
      kind: "hero",
      tier: heroGroup.tier,
      sponsors: heroGroup.sponsors,
      x: PAD,
      y: currentY,
      w: HERO_W,
      h: ROW1_H,
      index: cellIndex++,
    });
  }

  // Middle column — feature cells stacked.
  const midX = PAD + HERO_W + GUTTER;
  const featureTiers = activeGroups.splice(0, 3);
  if (featureTiers.length === 1) {
    cells.push({
      kind: "feature",
      tier: featureTiers[0].tier,
      sponsors: featureTiers[0].sponsors,
      x: midX,
      y: currentY,
      w: midW,
      h: ROW1_H,
      index: cellIndex++,
    });
  } else if (featureTiers.length === 2) {
    const h = (ROW1_H - GUTTER) / 2;
    cells.push({
      kind: "feature",
      tier: featureTiers[0].tier,
      sponsors: featureTiers[0].sponsors,
      x: midX,
      y: currentY,
      w: midW,
      h,
      index: cellIndex++,
    });
    cells.push({
      kind: "feature",
      tier: featureTiers[1].tier,
      sponsors: featureTiers[1].sponsors,
      x: midX,
      y: currentY + h + GUTTER,
      w: midW,
      h,
      index: cellIndex++,
    });
  } else if (featureTiers.length >= 3) {
    const topH = (ROW1_H - GUTTER) / 2;
    const halfW = (midW - GUTTER) / 2;
    cells.push({
      kind: "feature",
      tier: featureTiers[0].tier,
      sponsors: featureTiers[0].sponsors,
      x: midX,
      y: currentY,
      w: halfW,
      h: topH,
      index: cellIndex++,
    });
    cells.push({
      kind: "feature",
      tier: featureTiers[1].tier,
      sponsors: featureTiers[1].sponsors,
      x: midX + halfW + GUTTER,
      y: currentY,
      w: halfW,
      h: topH,
      index: cellIndex++,
    });
    cells.push({
      kind: "feature",
      tier: featureTiers[2].tier,
      sponsors: featureTiers[2].sponsors,
      x: midX,
      y: currentY + topH + GUTTER,
      w: midW,
      h: topH,
      index: cellIndex++,
    });
  }

  // Right column — Tools cell stretches across row 1 + any wide strips.
  const wideTiers = activeGroups; // whatever's left
  const stripsTotalH = wideTiers.length > 0
    ? wideTiers.length * STRIP_H + (wideTiers.length - 1) * GUTTER
    : 0;
  if (hasTools) {
    const toolsH = ROW1_H + (wideTiers.length > 0 ? GUTTER + stripsTotalH : 0);
    cells.push({
      kind: "tools",
      tools,
      x: width - PAD - TOOLS_W,
      y: currentY,
      w: TOOLS_W,
      h: toolsH,
      index: cellIndex++,
    });
  }

  currentY += ROW1_H + GUTTER;

  // Wide strips beside the tools column (constrained width).
  const stripW = hasTools ? innerW - TOOLS_W - GUTTER : innerW;
  for (const g of wideTiers) {
    cells.push({
      kind: "wide",
      tier: g.tier,
      sponsors: g.sponsors,
      x: PAD,
      y: currentY,
      w: stripW,
      h: STRIP_H,
      index: cellIndex++,
    });
    currentY += STRIP_H + GUTTER;
  }

  // Footer — combined archive (past + chibi). Full width.
  if (archiveSponsors.length > 0) {
    const footerH = 88;
    const archiveTier: Tier = { title: "Archive", monthlyDollars: -1 };
    cells.push({
      kind: "footer",
      tier: archiveTier,
      sponsors: archiveSponsors,
      x: PAD,
      y: currentY,
      w: innerW,
      h: footerH,
      index: cellIndex++,
    });
    currentY += footerH;
  }

  const height = currentY + PAD;

  // Pre-compute all avatar render specs (needed for clipPath defs).
  const avatars: AvatarRender[] = [];
  for (const cell of cells) {
    if (cell.kind === "tools") {
      avatars.push(...layoutToolAvatars(cell));
    } else {
      const isHero = cell.kind === "hero";
      const isFooter = cell.kind === "footer";
      const isWide = cell.kind === "wide";
      const showName =
        isHero || (!isFooter && !isWide && cell.kind === "feature" && cell.sponsors.length === 1);
      // Avatars start below the meta block; hero's 38px tier display needs more clearance than feature's 24px.
      const inset = {
        top: isFooter ? 44 : isWide ? 48 : isHero ? 88 : 70,
        bottom: isFooter ? 16 : isWide ? 16 : 22,
        side: 20,
      };
      avatars.push(...layoutSponsorAvatars(cell.sponsors, cell, inset, showName));
    }
  }

  // ── SVG assembly ───────────────────────────────────────────────────────
  let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  svg += `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n`;

  svg += `<style>
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+JP:wght@400;500;600&amp;family=JetBrains+Mono:wght@400;500&amp;family=Space+Grotesk:wght@500;700&amp;display=swap');
text {
  font-family: 'Space Grotesk', 'IBM Plex Sans JP', -apple-system, BlinkMacSystemFont, sans-serif;
}
.brand {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-weight: 500;
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}
.brand-sub {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-weight: 400;
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  fill: ${palette.textDim};
}
.display-title {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 88px;
  letter-spacing: -0.03em;
  fill: ${palette.text};
}
.cell-no {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-weight: 500;
  font-size: 9px;
  letter-spacing: 0.16em;
}
.cell-label {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 500;
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}
.tier-display-hero {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 32px;
  letter-spacing: -0.015em;
  text-transform: uppercase;
}
.tier-display {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 500;
  font-size: 21px;
  letter-spacing: -0.005em;
  text-transform: uppercase;
}
.tier-display-inline {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 500;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
.display-mini {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-weight: 400;
  font-size: 9px;
  letter-spacing: 0.18em;
}
.name {
  font-family: 'IBM Plex Sans JP', sans-serif;
  font-weight: 400;
  font-size: 11px;
  fill: ${palette.textMid};
}
.name-hero {
  font-family: 'IBM Plex Sans JP', sans-serif;
  font-weight: 500;
  font-size: 22px;
  letter-spacing: -0.01em;
  fill: ${palette.textHero};
}
.name-sub {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-weight: 400;
  font-size: 8px;
  letter-spacing: 0.28em;
  fill: ${palette.textDim};
}
a { text-decoration: none; }
a:hover g { opacity: 0.78; }
</style>\n`;

  // Defs.
  svg += `<defs>\n`;
  svg += `<linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="#0c0c10"/>
    <stop offset="100%" stop-color="#050507"/>
  </linearGradient>\n`;
  svg += `<radialGradient id="bgVignette" cx="50%" cy="0%" r="80%">
    <stop offset="0%" stop-color="rgba(255,255,255,0.04)"/>
    <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
  </radialGradient>\n`;
  svg += `<pattern id="dotGrid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
    <circle cx="0.5" cy="0.5" r="0.5" fill="rgba(255,255,255,0.045)"/>
  </pattern>\n`;
  for (const a of avatars) {
    if (a.shape === "circle") {
      const r = a.size / 2;
      svg += `<clipPath id="clip-${a.uid}"><circle cx="${r}" cy="${r}" r="${r}"/></clipPath>\n`;
    } else {
      const rx = Math.round(a.size * 0.22);
      svg += `<clipPath id="clip-${a.uid}"><rect x="0" y="0" width="${a.size}" height="${a.size}" rx="${rx}"/></clipPath>\n`;
    }
  }
  svg += `</defs>\n`;

  // Background — single tonal gradient, no dot grid. Lets typography breathe.
  if (!transparent) {
    svg += `<rect x="0" y="0" width="${width}" height="${height}" fill="url(#bgGrad)"/>\n`;
    svg += `<rect x="0" y="0" width="${width}" height="${height}" fill="url(#bgVignette)"/>\n`;
  }

  // ── Editorial header ───────────────────────────────────────────────────
  const totalActive = cells
    .filter((c): c is SponsorCell => c.kind !== "tools")
    .reduce((sum, c) => sum + c.sponsors.length, 0);
  const totalTools = tools.length;

  const headerLx = PAD;
  const headerRx = width - PAD;

  // Top meta band.
  const metaY = PAD + 12;
  svg += `<text x="${headerLx}" y="${metaY}" class="brand" fill="${palette.text}">EDITORIAL · ${new Date().getFullYear()}</text>\n`;
  svg += `<text x="${headerRx}" y="${metaY}" text-anchor="end" class="brand-sub">N° ${String(totalActive).padStart(3, "0")} SPONSORS · ${String(totalTools).padStart(2, "0")} TOOLS</text>\n`;

  // Top hairline under meta band.
  const topRuleY = metaY + 14;
  svg += `<line x1="${headerLx}" y1="${topRuleY}" x2="${headerRx}" y2="${topRuleY}" stroke="${palette.rule}" stroke-width="1" opacity="0.6"/>\n`;

  // Massive display heading — the wow moment.
  const titleBaselineY = topRuleY + 88;
  svg += `<text x="${headerLx}" y="${titleBaselineY}" class="display-title">Sponsors.</text>\n`;

  // Bottom hairline of the header band.
  const bottomRuleY = PAD + HEADER_H - 12;
  svg += `<line x1="${headerLx}" y1="${bottomRuleY}" x2="${headerRx}" y2="${bottomRuleY}" stroke="${palette.rule}" stroke-width="1" opacity="0.5"/>\n`;

  // ── Cells ──────────────────────────────────────────────────────────────
  for (const cell of cells) {
    svg += renderCellFrame(cell, palette);
    svg += renderCellMeta(cell, palette);
  }

  for (const a of avatars) {
    svg += renderAvatar(a, palette);
  }

  // ── Footer rule + colophon ─────────────────────────────────────────────
  const footerRuleY = height - PAD + 12;
  svg += `<line x1="${headerLx}" y1="${footerRuleY}" x2="${headerRx}" y2="${footerRuleY}" stroke="${palette.rule}" stroke-width="1" opacity="0.5"/>\n`;

  svg += `</svg>`;
  return svg;
}
