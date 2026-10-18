import { test as base, expect, type Page } from '@playwright/test'

/**
 * Frontend auth is a prototype localStorage role (`lexlanka_role`).
 * This fixture seeds that role — it is not a production auth bypass.
 */
export async function loginAsLawyer(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('lexlanka_role', 'lawyer')
  })
}

export const test = base.extend<{ lawyerPage: Page }>({
  lawyerPage: async ({ page }, use) => {
    await loginAsLawyer(page)
    await use(page)
  },
})

export { expect }
