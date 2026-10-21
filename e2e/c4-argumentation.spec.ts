import { test, expect } from '@playwright/test'

const assessment = {
  case_summary: 'A mocked C4 assessment.',
  stated_facts: 'The user supplied the facts shown in the form.',
  evidence_sufficiency: 'insufficient',
  strengths: ['The position is clearly stated.'],
  weaknesses: ['The original deed is unavailable.'],
  missing_evidence: ['Original deed'],
  unsupported_claim_warnings: ['Ownership cannot be confirmed from the supplied record.'],
  disclaimer: 'Informational legal analysis only; not legal advice or a court verdict.',
  verified_court_case_references: [{
    source_id: 'S1', case_number: 'CA/0788/1997(F)', start_page: 5, end_page: 8, similarity_score: 0.56,
  }],
  uploaded_document_references: [{
    source_id: 'D1', document_id: 'document-1', sanitized_filename: 'synthetic-land.pdf', section_label: 'page-1', section_text: 'Synthetic deed content.', extraction_status: 'extracted', warning: null,
  }],
  plaintiff_arguments: {
    arguments: [{ claim: 'Long-term possession may support the stated position.', evidence_source_ids: ['D1'], evidence_support: ['D1 records the claimed possession period.'], missing_evidence: ['Original deed'] }],
    limitations: [],
  },
  defense_counterarguments: {
    counterarguments: [{ challenged_claim: 'Long-term possession proves ownership.', counterargument: 'Possession alone does not establish the deed\'s validity.', evidence_source_ids: ['S1'], missing_evidence: ['Chain of title'] }],
    limitations: [],
  },
  neutral_case_assessment: {
    assessment: 'The supplied evidence is insufficient to resolve ownership.',
    strengths: ['The dispute is identifiable.'], weaknesses: ['The deed has not been verified.'],
    missing_evidence: ['Original deed'], unsupported_claim_warnings: [], contradictory_claims: ['Possession period is disputed.'], verified_source_ids: ['S1'], evidence_sufficiency: 'insufficient',
  },
  citation_audits: {
    plaintiff: { valid_source_ids: ['S1'], invalid_source_ids: [], invalid_case_numbers: [] },
    defense: { valid_source_ids: ['S1'], invalid_source_ids: [], invalid_case_numbers: [] },
    auditor: { valid_source_ids: ['S1'], invalid_source_ids: [], invalid_case_numbers: [] },
  },
  execution_errors: [],
}

test('C4 live mode sends the backend contract and renders the assessment', async ({ page }) => {
  let requestBody: Record<string, unknown> | undefined
  let assessmentCalls = 0

  await page.route('**/api/v1/c_argumentation/assess', async route => {
    assessmentCalls += 1
    requestBody = route.request().postDataJSON()
    await new Promise(resolve => setTimeout(resolve, 200))
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(assessment) })
  })

  await page.addInitScript(() => localStorage.setItem('lexlanka_role', 'people'))
  await page.goto('/settlement-simulator')
  await page.getByRole('button', { name: 'Live' }).click()
  const submit = page.locator('button.c4x-primary')
  await submit.click()
  await expect(submit).toBeDisabled()

  await expect.poll(() => requestBody).toEqual({
    case_title: 'Rental Payment Dispute Between Landlord and Tenant',
    dispute_type: 'Rental Agreement Dispute',
    case_facts: 'Mr. Perera, the landlord, claims that Ms. Fernando has not paid rent for eight months. Ms. Fernando claims that she paid in cash without receipts and reports that the roof has leaked since March despite repeated notices.',
    user_position: 'I am the tenant. I paid my rent in cash, but the landlord claims that I have not paid.',
    opposing_position: 'The landlord claims that eight months of rent remain unpaid.',
    documents: [],
  })
  await page.getByRole('tab', { name: 'Neutral Case Assessment' }).click()
  await expect(page.getByText('Live C4 assessment: insufficient')).toBeVisible()
  await expect(page.getByText('The supplied evidence is insufficient to resolve ownership.')).toBeVisible()
  await expect(page.getByText('Long-term possession may support the stated position.')).toBeVisible()
  await expect(page.getByText('Possession alone does not establish the deed\'s validity.')).toBeVisible()
  await expect(page.getByText('CA/0788/1997(F)', { exact: false })).toBeVisible()
  await expect(page.getByText('Original deed')).toHaveCount(3)
  await page.getByRole('tab', { name: 'Debate' }).click()
  await expect(page.getByTestId('live-debate')).toContainText('Plaintiff Agent')
  await expect(page.getByTestId('live-debate')).toContainText('Long-term possession may support the stated position.')
  await expect(page.getByTestId('live-debate')).toContainText('Defense Agent')
  await expect(page.getByTestId('live-debate')).toContainText('Possession alone does not establish the deed\'s validity.')
  await expect(page.getByTestId('live-debate')).toContainText('Neutral Auditor')
  await expect(page.getByTestId('live-debate')).toContainText('CA/0788/1997(F)')
  await expect(page.getByTestId('live-debate')).toContainText('D1')
  await expect(page.getByTestId('live-debate')).toContainText('unverified extracted text')
  await expect(page.getByTestId('live-debate')).toContainText('Original deed')
  await page.getByRole('tab', { name: 'Argument Graph' }).click()
  await expect(page.getByTestId('live-graph')).toBeVisible()
  await expect(page.getByTestId('graph-node-user-claim')).toBeVisible()
  await expect(page.getByTestId('graph-node-plaintiff-0')).toContainText('Plaintiff argument')
  await expect(page.getByTestId('graph-node-defense-0')).toContainText('Defense counterargument')
  await expect(page.getByTestId('graph-node-auditor-findings')).toContainText('Neutral Auditor findings')
  await expect(page.getByTestId('graph-node-S1')).toContainText('S1')
  await expect(page.getByTestId('graph-node-D1')).toContainText('D1')
  await expect(page.getByTestId('graph-node-D1')).toContainText('unverified')
  await expect(page.getByTestId('graph-node-missing-0')).toContainText('Missing evidence')
  await expect(page.getByTestId('graph-edge')).toHaveCount(3)
  await expect.poll(() => assessmentCalls).toBe(1)
  await expect(submit).toBeEnabled()
})

test('C4 keeps Demo mode illustrative and shows a live empty state before assessment', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('lexlanka_role', 'people'))
  await page.goto('/settlement-simulator')
  await page.getByRole('tab', { name: 'Argument Graph' }).click()
  await expect(page.getByText('Demo graph · select a node for details')).toHaveCount(0)
  await expect(page.getByText('Argument graph is not ready')).toBeVisible()
  await page.getByRole('button', { name: 'Live' }).click()
  await expect(page.getByText('Live argument graph pending')).toBeVisible()
  await page.getByRole('tab', { name: 'Debate' }).click()
  await expect(page.getByText('Live debate pending')).toBeVisible()
  await expect(page.getByText('Payment history is disputed')).toHaveCount(0)
})

test('C4 live mode shows an error without displaying a fake assessment', async ({ page }) => {
  await page.route('**/api/v1/c_argumentation/assess', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }))
  await page.addInitScript(() => localStorage.setItem('lexlanka_role', 'people'))
  await page.goto('/settlement-simulator')
  await page.getByRole('button', { name: 'Live' }).click()
  await page.getByRole('button', { name: 'Start Multi-Agent Analysis' }).click()
  await expect(page.locator('p.c4x-error')).toContainText('HTTP 503')
  await page.getByRole('tab', { name: 'Neutral Case Assessment' }).click()
  await expect(page.getByText('Neutral assessment pending')).toBeVisible()
  await expect(page.getByText('Live C4 assessment:')).toHaveCount(0)
})

test('C4 includes multiple extracted documents while keeping them separate from court sources', async ({ page }) => {
  let assessmentRequest: Record<string, unknown> | undefined
  let extractionCount = 0
  await page.route('**/api/v1/c_argumentation/documents/extract', route => {
    const filename = extractionCount++ === 0 ? 'first.pdf' : 'second.pdf'
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        document_id: filename, sanitized_filename: filename, file_type: 'pdf', file_size: 100,
        extraction_status: 'extracted', page_count: 1, sections: [{ label: 'page-1', text: filename }],
        extracted_text: `[Page 1] ${filename}`, character_count: filename.length + 9, warnings: [], ocr_required: false,
        content_status: 'unverified_extracted_text',
      }),
    })
  })
  await page.route('**/api/v1/c_argumentation/assess', async route => {
    assessmentRequest = route.request().postDataJSON()
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(assessment) })
  })
  await page.addInitScript(() => localStorage.setItem('lexlanka_role', 'people'))
  await page.goto('/settlement-simulator')
  await page.locator('input[type="file"]').setInputFiles([
    { name: 'first.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-') },
    { name: 'second.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-') },
  ])
  await expect(page.getByText('Text extracted')).toHaveCount(2)
  await page.getByRole('button', { name: 'Live' }).click()
  await page.locator('button.c4x-primary').click()
  await expect.poll(() => assessmentRequest).toMatchObject({
    documents: expect.arrayContaining([
      expect.objectContaining({ sanitized_filename: 'first.pdf', content_status: 'unverified_extracted_text' }),
      expect.objectContaining({ sanitized_filename: 'second.pdf', content_status: 'unverified_extracted_text' }),
    ]),
  })
})
