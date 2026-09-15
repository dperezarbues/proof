import { expect, type Page, test } from '@playwright/test'
import { COMPILE_TIMEOUT, openEditor } from './helpers'

/** Samples `check` repeatedly across an unpredictable-duration async window
 * (rather than at one point in time) and fails immediately on the first
 * violation — needed because a warm-worker recompile can finish in well
 * under 100ms locally, too fast to reliably catch with a single poll. */
async function assertHoldsThroughout(page: Page, check: () => Promise<void>, windowMs: number) {
  const deadline = Date.now() + windowMs
  while (Date.now() < deadline) {
    await check()
    await page.waitForTimeout(25)
  }
}

test.describe('First-compile loading state', () => {
  test('a brand-new CV shows a clean loading state instead of the sample PDF during its first compile', async ({
    page,
  }) => {
    test.setTimeout(COMPILE_TIMEOUT + 20_000)

    await openEditor(page)
    await page.getByTitle('New CV').click()
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Loading State CV')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Loading State CV' })).toBeVisible()

    // The very first compile auto-starts on CV creation. While it's in flight,
    // the sample PDF's placeholder content must never be visible — only the
    // dedicated loading state.
    await expect(page.getByTestId('first-compile-loading')).toBeVisible()
    await expect(page.getByText('Alex Rivera')).not.toBeVisible()

    await expect(page.getByText('Generating PDF…')).not.toBeVisible({ timeout: COMPILE_TIMEOUT })
    await expect(page.getByTestId('first-compile-loading')).not.toBeVisible()
    await expect(page.locator('[data-testid="pdfjs-viewer"]')).toHaveAttribute(
      'data-render-state',
      'ready',
      { timeout: 15_000 },
    )
  })

  test('recompiling an already-generated CV dims the existing PDF instead of reverting to the loading state', async ({
    page,
  }) => {
    test.setTimeout(COMPILE_TIMEOUT * 2 + 20_000)

    await openEditor(page)
    await page.getByTitle('New CV').click()
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Recompile CV')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Recompile CV' })).toBeVisible()
    await expect(page.getByText('Generating PDF…')).not.toBeVisible({ timeout: COMPILE_TIMEOUT })

    const viewer = page.locator('[data-testid="pdfjs-viewer"]')
    const oldSrc = await viewer.getAttribute('data-pdf-src')

    await page.getByTestId('cv-language-de').click()

    // Sample continuously across the whole recompile — whether it takes 20ms
    // or 2s on this run, the loading state and the sample must never appear.
    await assertHoldsThroughout(
      page,
      async () => {
        await expect(page.getByTestId('first-compile-loading')).not.toBeVisible()
        await expect(page.getByText('Alex Rivera')).not.toBeVisible()
      },
      1_500,
    )

    await expect(page.getByText('Generating PDF…')).not.toBeVisible({ timeout: COMPILE_TIMEOUT })
    await expect(viewer).not.toHaveAttribute('data-pdf-src', oldSrc ?? '')
  })
})
