import { defineConfig, tierPresets } from 'sponsorkit'

export default defineConfig({
  outputDir: '.',
  width: 800,
  formats: ['svg', 'png'],
  renderer: 'tiers',
  tiers: [
    {
      title: 'Past Sponsors',
      monthlyDollars: -1,
      preset: tierPresets.xs,
    },
    {
      title: 'chibi Funs',
      preset: tierPresets.small,
    },
    {
      title: 'Drink Sponsors',
      monthlyDollars: 4,
      preset: tierPresets.medium,
    },
    {
      title: 'Lunch Sponsors',
      monthlyDollars: 8,
      preset: tierPresets.large,
    },
    {
      title: 'Shiropractic Sponsors',
      monthlyDollars: 24,
      preset: tierPresets.large,
    },
    {
      title: 'Slightly Fancier Hair Salon Sponsors',
      monthlyDollars: 64,
      preset: tierPresets.xl,
    },
  ],
})
