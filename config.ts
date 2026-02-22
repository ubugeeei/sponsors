/**
 * スポンサー表示の設定
 */

export const config = {
  // SVG 設定
  width: 800,
  outputDir: '.',

  // ティア設定
  tiers: [
    {
      title: 'Past Sponsors',
      monthlyDollars: -1,
    },
    {
      title: 'chibi Funs',
      monthlyDollars: 0,
    },
    {
      title: 'Drink Sponsors',
      monthlyDollars: 4,
    },
    {
      title: 'Lunch Sponsors',
      monthlyDollars: 8,
    },
    {
      title: 'Shiropractic Sponsors',
      monthlyDollars: 24,
    },
    {
      title: 'Slightly Fancier Hair Salon Sponsors',
      monthlyDollars: 64,
    },
    {
      title: 'Rent Relief Sponsors',
      monthlyDollars: 256,
    },
  ],

  // 環境変数
  githubToken: process.env.GITHUB_TOKEN,
  githubLogin: process.env.GITHUB_LOGIN,
};
