/**
 * SVG decoration and effects definitions
 * Minimalist, modern styling without gradients
 */

import { elegantTheme, filterConfig } from './theme';

/**
 * Generate SVG <defs> section
 */
export function generateDefsSection(theme: typeof elegantTheme = elegantTheme): string {
  return `
    <defs>
      ${generateFilters(theme)}
    </defs>
  `;
}

/**
 * Generate gradients (removed for modern aesthetic)
 */
export function generateGradients(theme: typeof elegantTheme = elegantTheme): string {
  return '';
}

/**
 * Generate filter effects (minimal, no drop shadows)
 */
export function generateFilters(theme: typeof elegantTheme = elegantTheme): string {
  return '';
}

/**
 * Generate patterns (removed for modern aesthetic)
 */
export function generatePatterns(theme: typeof elegantTheme = elegantTheme): string {
  return '';
}

/**
 * Generate CSS style definitions
 */
export function generateStyleSheet(theme: typeof elegantTheme = elegantTheme): string {
  return `
    <style type="text/css">
      @import url('https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;700&display=swap');
      <![CDATA[
        * {
          box-sizing: border-box;
        }

        text {
          font-family: ${theme.fontFamily};
          font-weight: 400;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .tier-title-group text {
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        .sponsor-item {
          cursor: pointer;
        }

        .sponsor-item:hover text {
          opacity: 0.8;
        }

        .timeline-connector {
          pointer-events: none;
        }

        .background {
          pointer-events: none;
        }

        text tspan {
          display: inline;
        }

        a {
          text-decoration: none;
          cursor: pointer;
        }

        a:hover text {
          opacity: 0.7;
        }
      ]]>
    </style>
  `;
}

/**
 * Generate solid background
 */
export function generateGradientBackground(
  width: number,
  height: number,
  theme: typeof elegantTheme = elegantTheme
): string {
  return `
    <rect
      x="0" y="0"
      width="${width}" height="${height}"
      fill="${theme.background}"
      class="background"
    />
  `;
}

/**
 * Generate subtle background lines
 */
export function generatePatternOverlay(
  width: number,
  height: number
): string {
  return `
    <defs>
      <pattern id="subtle-lines" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="100" stroke="#FFD700" stroke-width="0.5" opacity="0.05"/>
      </pattern>
    </defs>
    <rect
      x="0" y="0"
      width="${width}" height="${height}"
      fill="url(#subtle-lines)"
      class="background"
    />
  `;
}

/**
 * Generate decorative top bar (removed for modern aesthetic)
 */
export function generateDecorativeTopBar(
  width: number,
  theme: typeof elegantTheme = elegantTheme
): string {
  return '';
}

/**
 * Generate decorative bottom bar (removed for modern aesthetic)
 */
export function generateDecorativeBottomBar(
  width: number,
  y: number,
  theme: typeof elegantTheme = elegantTheme
): string {
  return '';
}

/**
 * 区切り線を生成
 */
export function generateDividerLine(
  x1: number,
  y: number,
  x2: number,
  theme: typeof elegantTheme = elegantTheme
): string {
  return `
    <line
      x1="${x1}" y1="${y}"
      x2="${x2}" y2="${y}"
      stroke="${theme.accentLight}"
      stroke-width="1"
      opacity="0.3"
    />
  `;
}
