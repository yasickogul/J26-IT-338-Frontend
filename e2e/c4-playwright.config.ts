import baseConfig from '../playwright.config'

export default {
  ...baseConfig,
  testDir: '.',
  projects: [
    {
      name: 'msedge',
      use: {
        ...baseConfig.use,
        channel: 'msedge',
        launchOptions: {},
      },
    },
  ],
}