/**
 * Sponsor display configuration
 */

export const config = {
  width: 800,
  outputDir: ".",

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
      title: "Rent Relief Sponsors",
      monthlyDollars: 256,
    },
  ],

  githubToken: process.env.GITHUB_TOKEN,
  githubLogin: process.env.GITHUB_LOGIN,
};
