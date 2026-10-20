import baseConfig from '../playwright.config'

export default {
  ...baseConfig,
  testDir: '.',
  use: {
    ...baseConfig.use,
    launchOptions: { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' },
  },
}
