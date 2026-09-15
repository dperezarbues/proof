import { expect, test } from '@playwright/test'

// WASM compilation can take up to 30 s on first load
const GENERATE_TIMEOUT = 60_000

test.describe('PDF generation (WASM)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/editor')
    await page.evaluate(() => {
      localStorage.setItem('proof-onboarded', '1')
    })
    await page.reload()
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' })

    // Create a CV so Generate PDF is available
    await page.getByTitle('New CV').click()
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('WASM Test CV')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('button', { name: 'WASM Test CV' })).toBeVisible()
  })

  test('Generate PDF produces a preview blob URL', async ({ page }) => {
    test.setTimeout(GENERATE_TIMEOUT + 10_000)
    const iframe = page.locator('[data-testid="pdfjs-viewer"]')

    // Creating this CV already auto-triggered a first compile (it's the very
    // first CV in a fresh browser). Let that settle and reset back to a known
    // sample state before testing an explicit Generate click, rather than
    // racing the initial src check against that auto-compile.
    await expect(page.getByText('Generating PDF…')).not.toBeVisible({ timeout: GENERATE_TIMEOUT })
    await page.getByRole('button', { name: 'Reset' }).click()
    const initialSrc = await iframe.getAttribute('data-pdf-src')
    expect(initialSrc).toMatch(/\.pdf$/) // starts as sample

    // Click Generate PDF in the layout editor panel
    await page.getByRole('button', { name: 'Generate PDF' }).first().click()

    // Wait for generating overlay to disappear
    await expect(page.getByText('Generating PDF…')).not.toBeVisible({
      timeout: GENERATE_TIMEOUT,
    })

    // src should now be a blob URL and the text layer should be ready
    const newSrc = await iframe.getAttribute('data-pdf-src')
    expect(newSrc).toMatch(/^blob:/)
    await expect(iframe).toHaveAttribute('data-render-state', 'ready', { timeout: 15_000 })

    // "preview" badge should appear
    await expect(page.getByText('preview', { exact: true })).toBeVisible()

    // Download button should appear
    await expect(page.getByRole('button', { name: 'Download' })).toBeVisible()
  })

  test('PDF.js text layer is populated after generation (enables getByText in the viewer)', async ({
    page,
  }) => {
    test.setTimeout(GENERATE_TIMEOUT + 15_000)
    const viewer = page.locator('[data-testid="pdfjs-viewer"]')

    // Generate from the test CV
    await page.getByRole('button', { name: 'Generate PDF' }).first().click()
    await expect(page.getByText('Generating PDF…')).not.toBeVisible({ timeout: GENERATE_TIMEOUT })

    // Wait for render to finish — not just for a new URL but for canvas + text layer to paint.
    await expect(viewer).toHaveAttribute('data-render-state', 'ready', { timeout: 15_000 })

    // The text layer should contain at least one populated span.
    const textSpans = viewer.locator('.textLayer span').filter({ hasText: /\S/ })
    await expect(textSpans.first()).toBeVisible()

    // Collect all text to show the content is queryable.
    const texts = await textSpans.allTextContents()
    expect(texts.length).toBeGreaterThan(0)
    expect(texts.join(' ').trim().length).toBeGreaterThan(0)
  })

  test('Reset clears generated preview back to sample', async ({ page }) => {
    test.setTimeout(GENERATE_TIMEOUT + 10_000)
    // Generate first
    await page.getByRole('button', { name: 'Generate PDF' }).first().click()
    await expect(page.getByText('Generating PDF…')).not.toBeVisible({
      timeout: GENERATE_TIMEOUT,
    })
    await expect(page.getByRole('button', { name: 'Download' })).toBeVisible()

    // Reset
    await page.getByRole('button', { name: 'Reset' }).click()
    const src = await page.locator('[data-testid="pdfjs-viewer"]').getAttribute('data-pdf-src')
    expect(src).toMatch(/\.pdf$/) // back to sample
    await expect(page.getByText('preview', { exact: true })).not.toBeVisible()
  })
})
