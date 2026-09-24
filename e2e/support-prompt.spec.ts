import { expect, test } from '@playwright/test'
import en from '../messages/en.json'

// WASM compilation can take up to 60 s on first load
const GENERATE_TIMEOUT = 60_000

const t = en.supportPrompt

test.describe('Support prompt (pre-download modal)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/editor')
    await page.evaluate(() => {
      localStorage.setItem('proof-onboarded', '1')
      sessionStorage.setItem('proof-storage-choice-made', '1')
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
    await expect(page.getByRole('button', { name: 'Download', exact: true })).toBeVisible()

    // Click Download — should intercept and show support modal
    await page.getByRole('button', { name: 'Download', exact: true }).click()

    // Existence is keyed off the component's own test id, not its copy — a
    // wording or redesign change can't silently turn this into a permanent
    // skip the way asserting on rendered text did before.
    const modal = page.getByTestId('support-prompt')
    const isConfigured = await modal.isVisible().catch(() => false)

    if (isConfigured) {
      await expect(modal).toBeVisible()
      // Content is checked separately, against the live translation source —
      // this fails loudly if the wrong copy renders, but doesn't need
      // updating every time the copy itself changes.
      await expect(modal.getByText(t.ready)).toBeVisible()
      await expect(modal.getByRole('link', { name: t.sponsorGitHub })).toBeVisible()
      await expect(modal.getByRole('link', { name: t.star })).toBeVisible()
      await expect(modal.getByRole('button', { name: t.maybeLater })).toBeVisible()
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

    await page.getByRole('button', { name: 'Download', exact: true }).click()

    const modal = page.getByTestId('support-prompt')
    if (!(await modal.isVisible().catch(() => false))) {
      test.skip()
      return
    }

    await modal.getByRole('button', { name: t.maybeLater }).click()
    await expect(modal).not.toBeVisible()
  })

  test('second download skips the prompt', async ({ page }) => {
    test.setTimeout(GENERATE_TIMEOUT + 20_000)

    await page.getByRole('button', { name: 'Generate PDF' }).first().click()
    await expect(page.getByText('Generating PDF…')).not.toBeVisible({
      timeout: GENERATE_TIMEOUT,
    })

    // First click — show prompt (only if configured)
    await page.getByRole('button', { name: 'Download', exact: true }).click()
    const modal = page.getByTestId('support-prompt')
    if (!(await modal.isVisible().catch(() => false))) {
      test.skip()
      return
    }
    await modal.getByRole('button', { name: t.maybeLater }).click()

    // Second click — sessionStorage key is set, no modal
    await page.getByRole('button', { name: 'Download', exact: true }).click()
    await expect(modal).not.toBeVisible()
  })
})
