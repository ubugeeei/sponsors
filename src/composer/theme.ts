/**
 * Clean, minimal, artistic theme
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
  textMuted: string;
  border: string;
  tierColors: Record<string, string>;
  fontFamily: string;
  fontFamilyDisplay: string;
}

export const elegantTheme: ElegantTheme = {
  background: '#000000',
  backgroundGradientStart: '#000000',
  backgroundGradientEnd: '#000000',
  primaryDark: '#FFFFFF',
  primaryLight: '#FFFFFF',
  accent: '#FFFFFF',
  accentLight: '#FFFFFF',
  accentDark: '#888888',
  shadow: 'rgba(255, 255, 255, 0.1)',
  shadowHeavy: 'rgba(255, 255, 255, 0.2)',
  text: '#FFFFFF',
  textSecondary: '#888888',
  textMuted: '#555555',
  border: 'rgba(255, 255, 255, 0.2)',
  tierColors: {
    platinum: '#FFFFFF',
    gold: '#FFFFFF',
    silver: '#AAAAAA',
    bronze: '#888888',
    supporter: '#666666',
    past: '#444444',
  },
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontFamilyDisplay: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

export const typographyConfig = {
  tierTitle: {
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: 0.1,
    fill: elegantTheme.textSecondary,
  },
  sponsorName: {
    fontSize: 11,
    fontWeight: 400,
    letterSpacing: 0,
    fill: elegantTheme.text,
  },
  sponsorAmount: {
    fontSize: 10,
    fontWeight: 400,
    letterSpacing: 0,
    fill: elegantTheme.textSecondary,
  },
  caption: {
    fontSize: 9,
    fontWeight: 400,
    letterSpacing: 0,
    fill: elegantTheme.textMuted,
  },
};

export const layoutConfig = {
  width: 800,
  minHeight: 400,
  padding: 48,
  tierTitleSize: 14,
  tierPadding: 32,
  tierGap: 24,
  cardWidth: 64,
  cardHeight: 64,
  cardRadius: 0,
  cardGap: 12,
  cardPadding: 0,
  avatarSize: 48,
  avatarRadius: 24,
  decorationLineWidth: 1,
  decorationLineGap: 16,
  dotPatternSize: 32,
};

export const filterConfig = {
  dropShadowBlur: 0,
  dropShadowOffsetY: 0,
  dropShadowOpacity: 0,
  textShadowBlur: 0,
  textShadowOffsetY: 0,
  textShadowOpacity: 0,
};
