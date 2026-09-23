import { expect, test } from '@playwright/test'

// Every unmatched URL under static export resolves to the single root
// /404.html — with or without a /xx/ locale prefix, since nothing in this
// app ever calls notFound() from inside the [locale] segment (confirmed
// against the built output: there's exactly one _not-found route, never a
// per-locale one). This used to be English-only for every visitor, and
// separately was missing its own <html>/<body> wrapper entirely.
// NotFoundShell detects the locale client-side and swaps in that locale's
// strings while staying on the same URL — see src/components/NotFoundShell.tsx.
//
// Uses a multi-segment path (rather than a single bare segment) to sidestep
// a `next dev`-only quirk where Turbopack's dev router tries to resolve a
// single unmatched top-level segment as a `[locale]` param before falling
// back to not-found, and throws on `output: 'export'` when it isn't one —
// this doesn't happen in the actual static build (verified directly against
// `out/404.html`), only against the dev server these tests run on.
test.describe('404 (static-export fallback)', () => {
  test('shows German content for a German browser locale', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'de-DE' })
    const page = await context.newPage()
    const response = await page.goto('/this/page/does-not-exist')
    expect(response?.status()).toBe(404)
    await expect(page.getByText('Diese Seite hat die Prüfung nicht bestanden.')).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'de')
    await context.close()
  })

  test('falls back to English for an unsupported browser locale', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'ja-JP' })
    const page = await context.newPage()
    await page.goto('/this/page/does-not-exist')
    await expect(page.getByText("This page didn't make the cut.")).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await context.close()
  })

  test('home and editor links are locale-prefixed to the detected locale', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'es-ES' })
    const page = await context.newPage()
    await page.goto('/this/page/does-not-exist')
    await expect(page.getByRole('link', { name: /volver al inicio/i })).toHaveAttribute(
      'href',
      '/es/',
    )
    await expect(page.getByRole('link', { name: /abrir el editor/i })).toHaveAttribute(
      'href',
      '/es/editor/',
    )
    await context.close()
  })

  test('applies regardless of any locale prefix already in the URL', async ({ browser }) => {
    // There's no real route for this locale-prefixed path either — it still
    // resolves through the same root shell, still keyed off the browser's
    // locale rather than the URL's /fr/ segment.
    const context = await browser.newContext({ locale: 'de-DE' })
    const page = await context.newPage()
    await page.goto('/fr/this/page/does-not-exist')
    await expect(page.getByText('Diese Seite hat die Prüfung nicht bestanden.')).toBeVisible()
    await context.close()
  })
})
