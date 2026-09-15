import { expect, test } from '@playwright/test'
import { COMPILE_TIMEOUT, openEditor } from './helpers'

// CSP headers in this app come from vercel.json, a *Vercel platform* feature —
// they're only applied when Vercel's edge actually serves the response.
// `next dev` (what every other spec in this suite runs against locally) never
// reads vercel.json at all, so there is no CSP header in a normal local/CI
// run and this test would pass trivially even with a badly broken CSP string.
// Guard against exactly that: only run when explicitly pointed at a real
// deployment via BASE_URL (see playwright.config.ts), where the header is
// genuinely enforced by the browser. src/lib/__tests__/csp.test.ts is the
// fast, always-run counterpart that guards the header *string* itself.
const isRealDeployment = !!process.env.BASE_URL && !process.env.BASE_URL.includes('localhost')

test.describe('CSP violations on a real deployment', () => {
  test.skip(!isRealDeployment, 'requires BASE_URL pointed at a deployed preview/production URL')

  test('generating and downloading a PDF produces no CSP violation errors', async ({ page }) => {
    test.setTimeout(COMPILE_TIMEOUT + 20_000)

    const cspViolations: string[] = []
    page.on('console', (msg) => {
      const text = msg.text()
      if (/Content Security Policy|EvalError/i.test(text)) cspViolations.push(text)
    })
    page.on('pageerror', (err) => {
      if (/Content Security Policy|EvalError/i.test(err.message)) cspViolations.push(err.message)
    })

    await openEditor(page)
    await page.getByTitle('New CV').click()
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('CSP Test CV')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('button', { name: 'CSP Test CV' })).toBeVisible()

    await page.getByRole('button', { name: 'Generate PDF' }).first().click()
    await expect(page.getByText('Generating PDF…')).not.toBeVisible({ timeout: COMPILE_TIMEOUT })
    await expect(page.locator('[data-testid="pdfjs-viewer"]')).toHaveAttribute(
      'data-render-state',
      'ready',
      { timeout: 15_000 },
    )

    // Triggers the download code path directly, same as clicking Download.
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Download' }).click()
    await downloadPromise

    expect(cspViolations).toEqual([])
  })
})
