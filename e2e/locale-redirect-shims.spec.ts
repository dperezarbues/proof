import { test } from '@playwright/test'

// /, /editor, /terms, /for-llms are static-export shims outside the [locale] segment —
// there's no server to do locale detection, so each renders a bare HTML
// document (own <html>, no parent layout) that redirects client-side based
// on navigator.language, with a <meta refresh> fallback for no-JS.
test.describe('Locale-detection redirect shims', () => {
  test('/ redirects to the browser locale when supported', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'de-DE' })
    const page = await context.newPage()
    await page.goto('/')
    await page.waitForURL('**/de/')
    await context.close()
  })

  test('/ falls back to English for an unsupported locale', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'ja-JP' })
    const page = await context.newPage()
    await page.goto('/')
    await page.waitForURL('**/en/')
    await context.close()
  })

  test('/editor redirects preserving the path', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'fr-FR' })
    const page = await context.newPage()
    await page.goto('/editor')
    await page.waitForURL('**/fr/editor/')
    await context.close()
  })

  test('/terms redirects preserving the path', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'es-ES' })
    const page = await context.newPage()
    await page.goto('/terms')
    await page.waitForURL('**/es/terms/')
    await context.close()
  })

  test('/for-llms redirects preserving the path', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'de-DE' })
    const page = await context.newPage()
    await page.goto('/for-llms')
    await page.waitForURL('**/de/for-llms/')
    await context.close()
  })
})
