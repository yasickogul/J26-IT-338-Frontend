/**
 * Browser tests with local prototype auth (localStorage role).
 * The wizard does not call the FastAPI backend yet (simulated submit only).
 * These are not full-stack integration tests.
 */
import { test, expect, loginAsLawyer } from './fixtures/auth'
import { CASE_DRAFT_STORAGE_KEY } from '../lib/case-draft'

const REQUIRED_CATEGORIES = [
  'Contract dispute',
  'Property or land dispute',
  'Employment dispute',
  'Rental dispute',
] as const

async function openWizard(page: import('@playwright/test').Page) {
  await loginAsLawyer(page)
  await page.goto('/civil-case-analysis/new')
  await expect(page.getByRole('heading', { name: 'Civil Case Analysis' })).toBeVisible()
  await expect(page.getByText('STEP 1 OF 5')).toBeVisible()
}

test.describe('Civil case analysis wizard', () => {
  test('category selector shows the four required dispute labels', async ({ page }) => {
    await openWizard(page)
    const group = page.getByRole('radiogroup', { name: 'Dispute category' })
    await expect(group).toBeVisible()

    for (const label of REQUIRED_CATEGORIES) {
      await expect(group.getByRole('radio', { name: new RegExp(label) })).toBeVisible()
    }

    // Actual UI also includes "Other civil dispute" (five categories total).
    await expect(group.getByRole('radio', { name: /Other civil dispute/i })).toBeVisible()
    // Avoid matching the word "commercial" inside the Rental description text.
    await expect(group.getByRole('radio', { name: /^Commercial dispute/i })).toHaveCount(0)
    await expect(group.getByRole('radio', { name: /^Compensation/i })).toHaveCount(0)

    const radios = group.getByRole('radio')
    await expect(radios).toHaveCount(5)
  })

  test('category selection and required-field validation work', async ({ page }) => {
    await openWizard(page)

    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.locator('p.field-error')).toContainText('Select a dispute category to continue.')

    await page.getByRole('radio', { name: /Employment dispute/i }).click()
    await expect(page.getByRole('radio', { name: /Employment dispute/i })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByText('STEP 2 OF 5')).toBeVisible()

    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByText('STEP 3 OF 5')).toBeVisible()

    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.locator('p.field-error')).toContainText(/case description/i)
  })

  test('wizard steps preserve entered values', async ({ page }) => {
    await openWizard(page)

    await page.getByRole('radio', { name: /Contract dispute/i }).click()
    await page.getByRole('button', { name: 'Continue' }).click()

    const titleInput = page.getByPlaceholder('For example, Perera v. Silva')
    await titleInput.fill('Silva v. Fernando Traders')

    await page.getByRole('button', { name: 'Continue' }).click()
    await page.locator('#case-description').fill(
      'The parties signed a written supply agreement and the buyer failed to pay invoices for delivered goods.',
    )
    await page.getByRole('button', { name: 'Back' }).click()
    await expect(page.getByText('STEP 2 OF 5')).toBeVisible()
    await expect(titleInput).toHaveValue('Silva v. Fernando Traders')

    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.locator('#case-description')).toHaveValue(
      /written supply agreement and the buyer failed to pay invoices/,
    )
  })

  test('draft save and reopen restore category and description', async ({ page }) => {
    await openWizard(page)
    await page.getByRole('radio', { name: /Rental dispute/i }).click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.locator('#case-description').fill(
      'The landlord ended a written tenancy early after a repair dispute and refused to return the deposit.',
    )
    await page.getByRole('button', { name: 'Save draft' }).click()
    await expect(page.getByRole('button', { name: 'Draft saved' })).toBeVisible()

    await page.goto('/civil-case-analysis')
    await page.goto('/civil-case-analysis/new')
    // Draft restores the saved step (facts), so assert description + localStorage category.
    await expect(page.getByText('STEP 3 OF 5')).toBeVisible()
    await expect(page.locator('#case-description')).toHaveValue(/written tenancy early/)
    const stored = await page.evaluate((key) => window.localStorage.getItem(key), CASE_DRAFT_STORAGE_KEY)
    expect(stored).toBeTruthy()
    expect(stored!).toContain('"category":"rental"')
  })

  test('successful simulated submit shows the prototype notice', async ({ page }) => {
    await openWizard(page)
    await page.getByRole('radio', { name: /Employment dispute/i }).click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.locator('#case-description').fill(
      'The employee was dismissed without statutory notice after asking about unpaid overtime wages.',
    )
    // Skip evidence step optional fields; advance to review.
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByText('STEP 4 OF 5')).toBeVisible()
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByText('STEP 5 OF 5')).toBeVisible()

    await page.getByRole('button', { name: /Find Relevant Cases/i }).click()
    await expect(page).toHaveURL(/\/civil-case-analysis$/)
    await expect(page.getByRole('status')).toContainText(/Prototype only/i)
    await expect(page.getByRole('status')).toContainText(/Nothing was sent to a server/i)
  })

  test('API failure UI is not implemented for the wizard yet', async ({ page }) => {
    test.info().annotations.push({
      type: 'missing-feature',
      description:
        'Wizard submit is local/simulated (submitted_to_backend: false). There is no backend fetch or API error state to assert.',
    })
    test.skip(true, 'No wizard API error state exists yet — report only, do not invent UI.')
  })
})
