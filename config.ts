/**
 * Sponsor display configuration
 */

export const config = {
  width: 1200,
  // Override with OUTPUT_DIR (e.g. `OUTPUT_DIR=preview` to write to a gitignored preview dir).
  outputDir: process.env.OUTPUT_DIR || ".",

  tiers: [
    {
      title: "Past Sponsors",
      monthlyDollars: -1,
    },
    {
      title: "chibi Funs",
      monthlyDollars: 0,
    },
    {
      title: "Drink Sponsors",
      monthlyDollars: 4,
    },
    {
      title: "Lunch Sponsors",
      monthlyDollars: 8,
    },
    {
      title: "Shiropractic Sponsors",
      monthlyDollars: 24,
    },
    {
      title: "Slightly Fancier Hair Salon Sponsors",
      monthlyDollars: 64,
    },
    {
      title: "Blue Note Sponsors",
      monthlyDollars: 85,
    },
    {
      title: "Rent Relief Sponsors",
      monthlyDollars: 256,
    },
  ],

  /**
   * Override monthly dollar amounts for sponsors whose tier info is unavailable from the API.
   * The amount is used to infer the appropriate tier automatically.
   */
  amountOverrides: {
    yyx990803: 256,
  } as Record<string, number>,

  /**
   * Tool Sponsors — products / services that materially support the work.
   * Rendered in a dedicated cell of the layout. `emphasis: "large"` gets a hero treatment within the cell.
   */
  tools: [
    {
      login: "openai",
      name: "OpenAI",
      role: "AI",
      emphasis: "large" as const,
      profile: "https://github.com/openai",
    },
    {
      login: "useblacksmith",
      name: "Blacksmith",
      role: "CI",
      emphasis: "large" as const,
      profile: "https://github.com/useblacksmith",
    },
    {
      login: "icarusgk",
      name: "icarusgk",
      role: "Font",
      emphasis: "small" as const,
      profile: "https://github.com/icarusgk",
    },
  ],

  githubToken: process.env.SPONSORKIT_GITHUB_TOKEN || process.env.GITHUB_TOKEN,
  githubLogin: process.env.GITHUB_LOGIN,
};
