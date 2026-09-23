import { expect, test } from '@playwright/test'
import { openEditor } from './helpers'

// Regression: switching the UI locale should only ever change chrome text.
// The in-app language switcher used to call next-intl's router, navigating
// to a different statically-generated page (/en/editor -> /fr/editor).
// Next's App Router treats that as a different route and remounts the whole
// client tree below it, silently discarding every piece of in-progress
// editor state that has nothing to do with UI language: the selected
// template, and the already-compiled PDF preview (which fell back to the
// sample PDF for the wrong, default template while a real recompile caught
// up). ClientLocaleProvider switches locale in place instead, with no
// navigation, so none of that state is ever touched.
test.describe('Locale switch preserves editor state', () => {
  test('switching locale does not reset the selected template or the compiled PDF', async ({
    page,
  }) => {
    test.setTimeout(60_000)
    await openEditor(page)
    await page.getByTitle('New CV').click()
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Locale Switch CV')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Locale Switch CV' })).toBeVisible()

    // Pick a non-default template so a reset-to-default would be observable.
    await page.getByRole('tab', { name: /Template/i }).click()
    await page.getByTestId('template-btn-modern').click()
    // Wait for the src to actually become a blob, not for the transient
    // "Generating PDF…" overlay to disappear — that races the trigger
    // itself: if this assertion's first poll lands before React has even
    // rendered the overlay for a just-started compile, "not visible"
    // trivially and immediately passes without waiting for the real compile.
    const viewer = page.locator('[data-testid="pdfjs-viewer"]')
    await page.getByRole('button', { name: 'Generate PDF' }).first().click()
    await expect(viewer).toHaveAttribute('data-pdf-src', /^blob:/, { timeout: 60_000 })
    const srcBefore = await viewer.getAttribute('data-pdf-src')

    await page.getByLabel('Language', { exact: true }).selectOption('fr')

    // UI text must actually reflect the new locale...
    await expect(page.getByRole('tab', { name: /Modèle/ })).toBeVisible()
    // ...while the compiled PDF must be untouched — the exact same blob, no
    // flash back to a sample/default-template PDF at any point.
    await expect(viewer).toHaveAttribute('data-pdf-src', srcBefore ?? '')
    await expect(page.getByTestId('template-btn-modern')).toHaveAttribute('data-testid', 'template-btn-modern')
    const modernRing = await page.getByTestId('template-btn-modern').getAttribute('style')
    expect(modernRing).toContain('var(--c-accent)')

    // <html lang> should follow the in-place switch too.
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
  })
})
