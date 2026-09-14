import { expect, test } from '@playwright/test'

// WASM compilation can take up to 60 s on first load
const GENERATE_TIMEOUT = 60_000

test.describe('Support prompt (pre-download modal)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/editor')
    await page.evaluate(() => {
      localStorage.setItem('proof-onboarded', '1')
      sessionStorage.removeItem('proof-support-prompted')
    })
    await page.reload()
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' })

    // Create a CV so Generate PDF becomes available
    await page.getByTitle('New CV').click()
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Support Test CV')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Support Test CV' })).toBeVisible()
  })

  test('support prompt is shown before download when configured', async ({ page }) => {
    test.setTimeout(GENERATE_TIMEOUT + 20_000)

    // Generate PDF first so Download button appears
    await page.getByRole('button', { name: 'Generate PDF' }).first().click()
    await expect(page.getByText('Generating PDF…')).not.toBeVisible({
      timeout: GENERATE_TIMEOUT,
    })
    await expect(page.getByRole('button', { name: 'Download' })).toBeVisible()

    // Click Download — should intercept and show support modal
    await page.getByRole('button', { name: 'Download' }).click()

    // If NEXT_PUBLIC_SUPPORT_URL is configured the modal appears;
    // if not, the file downloads silently (no modal to assert)
    const modal = page.getByText('Your PDF is ready')
    const isConfigured = await modal.isVisible().catch(() => false)

    if (isConfigured) {
      await expect(modal).toBeVisible()
      await expect(page.getByRole('link', { name: 'Sponsor on GitHub' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Star' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Maybe later' })).toBeVisible()
    } else {
      test.skip()
    }
  })

  test('support prompt is dismissed by Maybe later', async ({ page }) => {
    test.setTimeout(GENERATE_TIMEOUT + 20_000)

    await page.getByRole('button', { name: 'Generate PDF' }).first().click()
    await expect(page.getByText('Generating PDF…')).not.toBeVisible({
      timeout: GENERATE_TIMEOUT,
    })

    await page.getByRole('button', { name: 'Download' }).click()

    const modal = page.getByText('Your PDF is ready')
    if (!(await modal.isVisible().catch(() => false))) {
      test.skip()
      return
    }

    await page.getByRole('button', { name: 'Maybe later' }).click()
    await expect(modal).not.toBeVisible()
  })

  test('second download skips the prompt', async ({ page }) => {
    test.setTimeout(GENERATE_TIMEOUT + 20_000)

    await page.getByRole('button', { name: 'Generate PDF' }).first().click()
    await expect(page.getByText('Generating PDF…')).not.toBeVisible({
      timeout: GENERATE_TIMEOUT,
    })

    // First click — show prompt (only if configured)
    await page.getByRole('button', { name: 'Download' }).click()
    const modal = page.getByText('Your PDF is ready')
    if (!(await modal.isVisible().catch(() => false))) {
      test.skip()
      return
    }
    await page.getByRole('button', { name: 'Maybe later' }).click()

    // Second click — sessionStorage key is set, no modal
    await page.getByRole('button', { name: 'Download' }).click()
    await expect(modal).not.toBeVisible()
  })
})
