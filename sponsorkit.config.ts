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
      title: 'chibi fun',
      preset: tierPresets.small,
    },
    {
      title: 'drink sponsor',
      monthlyDollars: 4,
      preset: tierPresets.medium,
    },
    {
      title: 'lunch sponsor',
      monthlyDollars: 8,
      preset: tierPresets.large,
    },
    {
      title: 'shiropractic sponsor',
      monthlyDollars: 24,
      preset: tierPresets.large,
    },
    {
      title: 'slightly fancier hair salon sponsor',
      monthlyDollars: 64,
      preset: tierPresets.xl,
    },
  ],
})
