import { expect, test } from '@playwright/test'

// WASM compilation can take up to 30 s on first load
const GENERATE_TIMEOUT = 60_000

test.describe('PDF generation (WASM)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/editor')
    await page.evaluate(() => {
      localStorage.setItem('proof-onboarded', '1')
      sessionStorage.setItem('proof-storage-choice-made', '1')
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
    // first CV in a fresh browser). Wait for it to actually produce a result
    // — not for the transient "Generating PDF…" overlay to disappear, which
    // races the trigger itself: if this assertion's first poll lands before
    // React has even rendered the overlay for a just-started compile,
    // "not visible" trivially and immediately passes without ever having
    // waited for the real compile to finish.
    await expect(iframe).toHaveAttribute('data-pdf-src', /^blob:/, { timeout: GENERATE_TIMEOUT })
    await page.getByRole('button', { name: 'Reset' }).click()
    const initialSrc = await iframe.getAttribute('data-pdf-src')
    expect(initialSrc).toMatch(/\.pdf$/) // starts as sample

    // Click Generate PDF in the layout editor panel
    await page.getByRole('button', { name: 'Generate PDF' }).first().click()

    // src should become a blob URL and the text layer should be ready
    await expect(iframe).toHaveAttribute('data-pdf-src', /^blob:/, { timeout: GENERATE_TIMEOUT })
    await expect(iframe).toHaveAttribute('data-render-state', 'ready', { timeout: 15_000 })

    // "preview" badge should appear
    await expect(page.getByText('preview', { exact: true })).toBeVisible()

    // Download button should appear
    await expect(page.getByRole('button', { name: 'Download', exact: true })).toBeVisible()
  })

  test('PDF.js text layer is populated after generation (enables getByText in the viewer)', async ({
    page,
  }) => {
    test.setTimeout(GENERATE_TIMEOUT + 15_000)
    const viewer = page.locator('[data-testid="pdfjs-viewer"]')

    // Generate from the test CV
    await page.getByRole('button', { name: 'Generate PDF' }).first().click()
    await expect(viewer).toHaveAttribute('data-pdf-src', /^blob:/, { timeout: GENERATE_TIMEOUT })

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
    const iframe = page.locator('[data-testid="pdfjs-viewer"]')

    // Generate first
    await page.getByRole('button', { name: 'Generate PDF' }).first().click()
    await expect(iframe).toHaveAttribute('data-pdf-src', /^blob:/, { timeout: GENERATE_TIMEOUT })
    await expect(page.getByRole('button', { name: 'Download', exact: true })).toBeVisible()

    // Reset
    await page.getByRole('button', { name: 'Reset' }).click()
    const src = await iframe.getAttribute('data-pdf-src')
    expect(src).toMatch(/\.pdf$/) // back to sample
    await expect(page.getByText('preview', { exact: true })).not.toBeVisible()
  })
})
