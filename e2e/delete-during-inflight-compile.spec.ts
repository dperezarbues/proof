import { expect, test } from '@playwright/test'
import { COMPILE_TIMEOUT, openEditor } from './helpers'

// Regression: useCompiler's generate() had no check that a completed compile's
// result still belonged to whatever CV is on screen. A cold first compile can
// take several seconds, and if the CV being compiled is deleted while that
// compile is still in flight, the stale result used to land anyway — briefly
// (or indefinitely) repainting a deleted person's data back onto the preview.
test.describe('Deleting a CV mid-compile', () => {
  test('a compile that resolves after its CV was deleted must not repaint its content', async ({
    page,
  }) => {
    test.setTimeout(COMPILE_TIMEOUT + 20_000)

    // Delay (not block) the compiler's WASM binary fetch so the first compile
    // stays in flight long enough to delete the CV being compiled before the
    // compile resolves.
    await page.route('**/wasm/typst-compiler.wasm', async (route) => {
      await new Promise((r) => setTimeout(r, 4000))
      await route.continue()
    })

    await openEditor(page)
    await page.getByTitle('New CV').click()
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Race Delete CV')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Race Delete CV' })).toBeVisible()

    // The first compile auto-starts on save and is now delayed in flight.
    await expect(page.getByText('Generating PDF…')).toBeVisible()

    const deleteRow = page.locator('div.group', { hasText: 'Race Delete CV' })
    await deleteRow.hover()
    await deleteRow.getByTitle('Delete').click()
    await expect(page.getByRole('button', { name: 'Race Delete CV' })).not.toBeVisible()

    // Let the delayed compile actually finish and attempt to paint its result.
    await expect(page.getByText('Generating PDF…')).not.toBeVisible({ timeout: COMPILE_TIMEOUT })

    // The deleted CV's compiled PDF must never reach the screen.
    const viewer = page.locator('[data-testid="pdfjs-viewer"]')
    await expect(viewer).toHaveAttribute('data-pdf-src', /\.pdf$/)
    await expect(page.getByText('No CV loaded')).toBeVisible()
  })
})
