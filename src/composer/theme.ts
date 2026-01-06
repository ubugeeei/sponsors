/**
 * エレガントなスポンサー表示テーマ定義
 * ライトエレガントなビジュアルスタイル
 */

export interface ElegantTheme {
  background: string;
  backgroundGradientStart: string;
  backgroundGradientEnd: string;
  primaryDark: string;
  primaryLight: string;
  accent: string;
  accentLight: string;
  accentDark: string;
  shadow: string;
  shadowHeavy: string;
  text: string;
  textSecondary: string;
  border: string;
  tierColors: Record<string, string>;
  fontFamily: string;
}

export const elegantTheme: ElegantTheme = {
  // Main colors
  background: '#0F1419',
  backgroundGradientStart: '#1A1F2E',
  backgroundGradientEnd: '#0F1419',
  primaryDark: '#FFFFFF',
  primaryLight: '#E8E8E8',
  accent: '#FFD700',
  accentLight: '#FFF8DC',
  accentDark: '#FFA500',

  // Shadow
  shadow: 'rgba(255, 215, 0, 0.1)',
  shadowHeavy: 'rgba(255, 215, 0, 0.2)',

  // Text color
  text: '#FFFFFF',
  textSecondary: '#B8B8B8',
  border: 'rgba(255, 215, 0, 0.3)',

  // Tier colors
  tierColors: {
    platinum: '#E8E8E8',
    gold: '#FFD700',
    silver: '#C0C0C0',
    bronze: '#CD7F32',
    supporter: '#FFA500',
  },

  // Font settings (Japanese support with Zen Kaku Gothic New - bold & distinctive)
  fontFamily: "'Zen Kaku Gothic New', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif",
};

export const typographyConfig = {
  // Tier title
  tierTitle: {
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: 0.06,
    fill: elegantTheme.accent,
  },

  // Sponsor name
  sponsorName: {
    fontSize: 14,
    fontWeight: 500,
    letterSpacing: 0.015,
    fill: elegantTheme.text,
  },

  // Support amount
  sponsorAmount: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.03,
    fill: elegantTheme.accent,
  },

  // Caption text
  caption: {
    fontSize: 10,
    fontWeight: 400,
    letterSpacing: 0.02,
    fill: elegantTheme.textSecondary,
  },
};

export const layoutConfig = {
  // SVG overall
  width: 800,
  minHeight: 400,
  padding: 20,

  // Tier section
  tierTitleSize: 28,
  tierPadding: 16,
  tierGap: 80,

  // Sponsor item (modern minimalist)
  cardWidth: 180,
  cardHeight: 56,
  cardRadius: 0,
  cardGap: 18,
  cardPadding: 8,

  // Avatar
  avatarSize: 50,
  avatarRadius: 25,

  // Decoration
  decorationLineWidth: 1,
  decorationLineGap: 15,
  dotPatternSize: 20,
};

export const filterConfig = {
  // Drop shadow
  dropShadowBlur: 8,
  dropShadowOffsetY: 4,
  dropShadowOpacity: 0.3,

  // Text shadow
  textShadowBlur: 2,
  textShadowOffsetY: 2,
  textShadowOpacity: 0.5,
};
