import { test, expect } from './fixtures/auth'

test.describe('Public page and navigation', () => {
  test('login page loads for signed-out visitors', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Sign in to LexLanka' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Continue as Lawyer/i })).toBeVisible()
  })

  test('prototype sign-in reaches overview and nav updates the URL', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /Continue as Lawyer/i }).click()
    await expect(page).toHaveURL(/\/overview/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    await page.getByRole('link', { name: 'Civil Case Analysis' }).click()
    await expect(page).toHaveURL(/\/civil-case-analysis$/)
    await expect(page.getByRole('heading', { name: 'Civil Case Analysis' })).toBeVisible()
  })

  test('direct navigation and refresh work for an existing route', async ({ lawyerPage }) => {
    await lawyerPage.goto('/civil-case-analysis')
    await expect(lawyerPage).toHaveURL(/\/civil-case-analysis$/)
    await expect(lawyerPage.getByRole('heading', { name: 'Civil Case Analysis' })).toBeVisible()

    await lawyerPage.reload()
    await expect(lawyerPage).toHaveURL(/\/civil-case-analysis$/)
    await expect(lawyerPage.getByRole('heading', { name: 'Civil Case Analysis' })).toBeVisible()
  })
})
