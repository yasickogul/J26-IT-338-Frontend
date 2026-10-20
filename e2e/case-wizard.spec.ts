/**
 * Browser tests with local prototype auth (localStorage role).
 * Submit success/failure against C1 is mocked unless a live backend is intentionally targeted.
 */
import { test, expect, loginAsLawyer } from './fixtures/auth'
import { CASE_DRAFT_STORAGE_KEY } from '../lib/case-draft'

const MOCK_INTAKE_ID = '11111111-1111-1111-1111-111111111111'

function mockExtractedResult() {
  return {
    intake_id: MOCK_INTAKE_ID,
    status: 'done',
    case_information: {
      case_type: 'Employment',
      dispute_category: 'employment',
      title: 'Employee v. Employer',
      summary:
        'The employee was dismissed without statutory notice after asking about unpaid overtime wages.',
      remedy_requested: null,
    },
    parties_and_positions: [],
    legal_issues: [],
    claims: [],
    evidence_mentioned: [],
    cited_case_references: [],
    entities: [],
    structured_legal_info: {
      claims: [],
      parties: [],
      evidence: [],
      entities: [],
    },
    source_text_chars: 120,
    model_version: 'stage2-rules-v1',
    disclaimer: 'This is informational and not legal advice.',
    similar_cases_available: false,
    legal_relevance_score_available: false,
    llm_explanation_available: false,
  }
}

const REQUIRED_CATEGORIES = [
  'Contract dispute',
  'Property or land dispute',
  'Employment dispute',
  'Rental dispute',
] as const

async function openWizard(page: import('@playwright/test').Page) {
  await loginAsLawyer(page)
  await page.goto('/lawyer/civil-case-analysis/new')
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
    await page.getByRole('button', { name: 'Back', exact: true }).click()
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
    await expect(page).toHaveURL(/\/lawyer\/civil-case-analysis$/)
    await page.goto('/civil-case-analysis/new')
    await expect(page).toHaveURL(/\/lawyer\/civil-case-analysis\/new$/)
    // Draft restores the saved step (facts), so assert description + localStorage category.
    await expect(page.getByText('STEP 3 OF 5')).toBeVisible()
    await expect(page.locator('#case-description')).toHaveValue(/written tenancy early/)
    const stored = await page.evaluate((key) => window.localStorage.getItem(key), CASE_DRAFT_STORAGE_KEY)
    expect(stored).toBeTruthy()
    expect(stored!).toContain('"category":"rental"')
  })

  test('successful C1 intake submit opens the extraction result page', async ({ page }) => {
    await page.route('**/api/v1/c1/intake', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockExtractedResult()),
      })
    })
    await page.route(`**/api/v1/c1/intake/${MOCK_INTAKE_ID}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          intake_id: MOCK_INTAKE_ID,
          status: 'done',
          result: mockExtractedResult(),
          error: null,
        }),
      })
    })

    await openWizard(page)
    await page.getByRole('radio', { name: /Employment dispute/i }).click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.locator('#case-description').fill(
      'The employee was dismissed without statutory notice after asking about unpaid overtime wages.',
    )
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByText('STEP 4 OF 5')).toBeVisible()
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByText('STEP 5 OF 5')).toBeVisible()

    await page.getByRole('button', { name: /Find Relevant Cases/i }).click()
    await expect(page).toHaveURL(new RegExp(`/lawyer/civil-case-analysis/${MOCK_INTAKE_ID}$`))
    await expect(page.getByRole('status')).toContainText(/Intake saved/i)
    await expect(page.getByRole('heading', { name: 'Semantic retrieval' })).toBeVisible()
    await expect(page.getByText(/Not implemented yet/i).first()).toBeVisible()
  })

  test('API failure keeps the draft and shows an error', async ({ page }) => {
    await page.route('**/api/v1/c1/intake', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Simulated backend failure' }),
      })
    })

    await openWizard(page)
    await page.getByRole('radio', { name: /Contract dispute/i }).click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.locator('#case-description').fill(
      'A supplier delivered construction materials under a written agreement and the customer failed to pay.',
    )
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByText('STEP 5 OF 5')).toBeVisible()

    await page.getByRole('button', { name: /Find Relevant Cases/i }).click()
    await expect(page.locator('p.field-error[role="alert"]')).toContainText(
      /Simulated backend failure|could not process/i,
    )
    await expect(page).toHaveURL(/\/lawyer\/civil-case-analysis\/new$/)
    const stored = await page.evaluate((key) => window.localStorage.getItem(key), CASE_DRAFT_STORAGE_KEY)
    expect(stored).toBeTruthy()
    expect(stored!).toContain('"category":"contract"')
  })
})
