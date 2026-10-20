import { test, expect } from '@playwright/test'

test('C4 uploads a PDF and displays extraction status', async ({ page }) => {
  await page.route('**/api/v1/c_argumentation/documents/extract', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        document_id: '11111111-1111-4111-8111-111111111111', sanitized_filename: 'deed.pdf', file_type: 'pdf', file_size: 100,
        extraction_status: 'extracted', page_count: 2, sections: [{ label: 'page-1', text: 'Text' }], extracted_text: '[Page 1] Text',
        character_count: 13, warnings: [], ocr_required: false, content_status: 'unverified_extracted_text',
      }),
    })
  })
  await page.addInitScript(() => localStorage.setItem('lexlanka_role', 'people'))
  await page.goto('/settlement-simulator')
  await page.locator('input[type="file"]').setInputFiles({ name: 'deed.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-') })
  await expect(page.getByText('Text extracted')).toBeVisible()
})

test('C4 displays an OCR warning and supports removing a document', async ({ page }) => {
  await page.route('**/api/v1/c_argumentation/documents/extract', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      document_id: '22222222-2222-4222-8222-222222222222', sanitized_filename: 'scan.pdf', file_type: 'pdf', file_size: 100,
      extraction_status: 'ocr_required', page_count: 1, sections: [], extracted_text: '', character_count: 0,
      warnings: ['Page 1 contains scanned images without extractable text; OCR is required.'], ocr_required: true, content_status: 'unverified_extracted_text',
    }),
  }))
  await page.addInitScript(() => localStorage.setItem('lexlanka_role', 'people'))
  await page.goto('/settlement-simulator')
  await page.locator('input[type="file"]').setInputFiles({ name: 'scan.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-') })
  await expect(page.getByText('Text extracted; OCR required')).toBeVisible()
  await expect(page.getByText(/scanned images/)).toBeVisible()
  await page.getByRole('button', { name: 'Remove scan.pdf' }).click()
  await expect(page.getByText('scan.pdf')).toHaveCount(0)
})

test('C4 reports extraction errors without showing success', async ({ page }) => {
  await page.route('**/api/v1/c_argumentation/documents/extract', route => route.fulfill({ status: 415, contentType: 'application/json', body: JSON.stringify({ detail: 'Only PDF and DOCX files are supported.' }) }))
  await page.addInitScript(() => localStorage.setItem('lexlanka_role', 'people'))
  await page.goto('/settlement-simulator')
  await page.locator('input[type="file"]').setInputFiles({ name: 'evidence.txt', mimeType: 'text/plain', buffer: Buffer.from('not supported') })
  await expect(page.getByText('Only non-empty PDF or DOCX files up to 10 MB are accepted.')).toBeVisible()
  await expect(page.getByText('Text extracted')).toHaveCount(0)
})
