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
    await expect(page).toHaveURL(/\/lawyer\/overview$/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    await page.getByRole('link', { name: 'Civil Case Analysis' }).click()
    await expect(page).toHaveURL(/\/lawyer\/civil-case-analysis$/)
    await expect(page.getByRole('heading', { name: 'Civil Case Analysis' })).toBeVisible()
  })

  test('direct navigation and refresh work for an existing route', async ({ lawyerPage }) => {
    await lawyerPage.goto('/lawyer/civil-case-analysis')
    await expect(lawyerPage).toHaveURL(/\/lawyer\/civil-case-analysis$/)
    await expect(lawyerPage.getByRole('heading', { name: 'Civil Case Analysis' })).toBeVisible()

    await lawyerPage.reload()
    await expect(lawyerPage).toHaveURL(/\/lawyer\/civil-case-analysis$/)
    await expect(lawyerPage.getByRole('heading', { name: 'Civil Case Analysis' })).toBeVisible()
  })

  test('legacy lawyer routes redirect without dropping query parameters', async ({ lawyerPage }) => {
    await lawyerPage.goto('/overview')
    await expect(lawyerPage).toHaveURL(/\/lawyer\/overview$/)

    await lawyerPage.goto('/settings')
    await expect(lawyerPage).toHaveURL(/\/lawyer\/settings$/)

    await lawyerPage.goto('/civil-case-analysis/new?draft=1')
    await expect(lawyerPage).toHaveURL(/\/lawyer\/civil-case-analysis\/new\?draft=1$/)
    await expect(lawyerPage.getByText('STEP 1 OF 5')).toBeVisible()
  })

  test('signed-out visitors cannot open the lawyer workspace', async ({ page }) => {
    await page.goto('/lawyer/overview')
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: 'Sign in to LexLanka' })).toBeVisible()
  })
})
