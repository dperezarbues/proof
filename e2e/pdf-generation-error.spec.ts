import { expect, type Page, test } from '@playwright/test'

// WASM compilation can take up to 30 s on first load
const GENERATE_TIMEOUT = 60_000

async function openEditorWithCv(page: Page, name: string) {
  await page.goto('/en/editor')
  await page.evaluate(() => localStorage.setItem('proof-onboarded', '1'))
  await page.reload()
  await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' })

  await page.getByTitle('New CV').click()
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill(name)
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByRole('button', { name })).toBeVisible()
}

test.describe('PDF generation — compile failure recovery', () => {
  test('a failed compile surfaces an error and re-enables Generate instead of hanging', async ({
    page,
  }) => {
    test.setTimeout(GENERATE_TIMEOUT + 20_000)

    // Block before any navigation — the app warms up the compiler on mount, so
    // routing this in after the page has already loaded would just miss an
    // already-initialized worker and the compile would succeed regardless.
    await page.route('**/wasm/typst-compiler.wasm', (route) => route.abort())
    await openEditorWithCv(page, 'Failure Test CV')

    const generateBtn = page.getByRole('button', { name: 'Generate PDF' }).first()
    await generateBtn.click()

    // Must not hang forever in the generating state.
    await expect(page.getByText('Generating PDF…')).not.toBeVisible({
      timeout: GENERATE_TIMEOUT,
    })

    // The compile error must reach the UI, not just the console.
    await expect(page.getByText(/⚠/)).toBeVisible()

    // Generate must be clickable again, not stuck disabled.
    await expect(generateBtn).toBeEnabled()

    // Preview must still show the last-known-good (sample) PDF, not a blank/broken state.
    const src = await page.locator('[data-testid="pdfjs-viewer"]').getAttribute('data-pdf-src')
    expect(src).toMatch(/\.pdf$/)
  })

  test('a retry after the failure succeeds once the blocked asset is available again', async ({
    page,
  }) => {
    test.setTimeout(GENERATE_TIMEOUT * 2 + 20_000)

    await page.route('**/wasm/typst-compiler.wasm', (route) => route.abort())
    await openEditorWithCv(page, 'Recovery Test CV')

    const generateBtn = page.getByRole('button', { name: 'Generate PDF' }).first()
    await generateBtn.click()
    await expect(page.getByText('Generating PDF…')).not.toBeVisible({ timeout: GENERATE_TIMEOUT })
    await expect(page.getByText(/⚠/)).toBeVisible()

    await page.unroute('**/wasm/typst-compiler.wasm')

    await generateBtn.click()
    await expect(page.getByText('Generating PDF…')).not.toBeVisible({ timeout: GENERATE_TIMEOUT })
    await expect(page.getByText(/⚠/)).not.toBeVisible()

    const src = await page.locator('[data-testid="pdfjs-viewer"]').getAttribute('data-pdf-src')
    expect(src).toMatch(/^blob:/)
  })
})
