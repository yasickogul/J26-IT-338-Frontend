import { expect, test } from './fixtures/auth'

const claimId = '11111111-1111-4111-8111-111111111111'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('lexlanka_role', 'people')
  })
})

test('submits once and renders the persisted verdict and evidence', async ({ page }) => {
  let submissions = 0
  await page.route('**/api/v1/c3/claims/analyze', async (route) => {
    submissions += 1
    expect(route.request().postDataJSON()).toEqual({ text: 'A tenant must get notice.' })
    await route.fulfill({ status: 202, json: { claim_id: claimId, status: 'processing' } })
  })
  await page.route(`**/api/v1/c3/results/${claimId}`, async (route) => {
    await route.fulfill({ json: {
      claim_id: claimId,
      status: 'completed',
      result: {
        claim_verdict: 'Misleading',
        explanation: 'Notice depends on the tenancy terms.',
        citations: ['Source A'],
        evidence: { passages: [{ evidence_id: 'ev-1', text: 'A legal passage.', source: { title: 'Source A', citation: 'Source A, section 1' } }] },
      },
    } })
  })

  await page.goto('/legal-misinformation')
  await page.getByRole('textbox', { name: 'Claim text' }).fill('A tenant must get notice.')
  await page.getByRole('button', { name: 'Analyze claim' }).click()
  await expect(page.getByRole('heading', { name: 'Misleading' })).toBeVisible()
  await expect(page.getByText('Notice depends on the tenancy terms.')).toBeVisible()
  await expect(page.getByText('A legal passage.')).toBeVisible()
  expect(submissions).toBe(1)
})

test('a polling network failure stays an observable error, not a persisted failure', async ({ page }) => {
  await page.route('**/api/v1/c3/claims/analyze', (route) => route.fulfill({ status: 202, json: { claim_id: claimId, status: 'processing' } }))
  await page.route(`**/api/v1/c3/results/${claimId}`, (route) => route.abort('failed'))

  await page.goto('/legal-misinformation')
  await page.getByRole('textbox', { name: 'Claim text' }).fill('A tenant must get notice.')
  await page.getByRole('button', { name: 'Analyze claim' }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByText('The backend could not complete this analysis.')).toHaveCount(0)
  await expect(page.getByText('Retrieving legal evidence and preparing analysis…')).toBeVisible()
})

test('a persisted failed state is shown without endless polling', async ({ page }) => {
  let polls = 0
  await page.route('**/api/v1/c3/claims/analyze', (route) => route.fulfill({ status: 202, json: { claim_id: claimId, status: 'processing' } }))
  await page.route(`**/api/v1/c3/results/${claimId}`, async (route) => {
    polls += 1
    await route.fulfill({ json: { claim_id: claimId, status: 'failed', result: null } })
  })

  await page.goto('/legal-misinformation')
  await page.getByRole('textbox', { name: 'Claim text' }).fill('A tenant must get notice.')
  await page.getByRole('button', { name: 'Analyze claim' }).click()
  await expect(page.getByText('The backend could not complete this analysis.')).toBeVisible()
  await expect(page.locator('p.c3-error')).toContainText('claim analysis failed')
  expect(polls).toBe(1)
})

test('reopens a prior session claim after browser refresh', async ({ page }) => {
  await page.route('**/api/v1/c3/history?*', (route) => route.fulfill({ json: {
    page: 1,
    page_size: 20,
    items: [{ claim_id: claimId, extracted_claim: 'Stored tenancy claim', status: 'completed', verdict: 'True', created_at: '2026-01-01T00:00:00Z' }],
  } }))
  await page.route(`**/api/v1/c3/results/${claimId}`, (route) => route.fulfill({ json: {
    claim_id: claimId,
    status: 'completed',
    result: { claim_verdict: 'True', explanation: 'The stored evidence supports this claim.', citations: [], evidence: { passages: [] } },
  } }))

  await page.goto('/legal-misinformation')
  await page.reload()
  await page.getByRole('button', { name: 'Previous claims' }).click()
  await expect(page.getByText('Stored tenancy claim')).toBeVisible()
  await page.getByRole('button', { name: /Stored tenancy claim/ }).click()
  await expect(page.getByRole('heading', { name: 'True' })).toBeVisible()
  await expect(page.getByText('The stored evidence supports this claim.')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Stored claim text' })).toBeVisible()
})
