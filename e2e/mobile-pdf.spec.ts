/**
 * Verifies the mobile PDF generation flow end-to-end:
 * create a CV → tap the tab-bar "Gen PDF" button → PDF.js renders canvases.
 *
 * This covers the specific regression path that was missing: the existing
 * responsive tests only checked layout with the sample PDF (no CV created,
 * no generation triggered).
 */

import { expect, type Page, test } from '@playwright/test'

const MOBILE = { width: 375, height: 667 }
const GENERATE_TIMEOUT = 60_000

async function gotoEditorMobile(page: Page) {
  await page.setViewportSize(MOBILE)
  await page.goto('/en/editor')
  await page.evaluate(() => localStorage.setItem('proof-onboarded', '1'))
  await page.reload()
  await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' })
}

async function createCvOnMobile(page: Page, name: string) {
  // Create the CV at desktop width where the sidebar is always visible,
  // then switch back to mobile to test the mobile PDF generation flow.
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.getByTitle('New CV').click()
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill(name)
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByRole('button', { name: name })).toBeVisible()
  await page.setViewportSize(MOBILE)
}

// ── Gen PDF via tab bar ───────────────────────────────────────────────────────

test.describe('Mobile PDF generation — tab bar button', () => {
  test.beforeEach(async ({ page }) => {
    await gotoEditorMobile(page)
  })

  test('Gen PDF tab-bar button generates a PDF and renders canvases', async ({ page }) => {
    test.setTimeout(GENERATE_TIMEOUT + 20_000)

    await createCvOnMobile(page, 'Mobile Gen CV')

    const firstCanvas = page
      .getByTestId('pdf-preview-area')
      .locator('canvas')
      .first()

    const genBtn = page.getByTestId('mobile-tabbar').getByRole('button', { name: /Gen PDF/i })
    await expect(genBtn).toBeEnabled()
    await genBtn.click()

    // Wait for PDF.js to render at least one canvas page
    await expect(firstCanvas).toBeVisible({ timeout: GENERATE_TIMEOUT })
  })

  test('Download button appears in preview header after mobile PDF generation', async ({ page }) => {
    test.setTimeout(GENERATE_TIMEOUT + 20_000)

    await createCvOnMobile(page, 'Mobile Download CV')

    await page.getByTestId('mobile-tabbar').getByRole('button', { name: /Gen PDF/i }).click()

    await expect(
      page.getByTestId('pdf-preview-area').locator('canvas').first(),
    ).toBeVisible({ timeout: GENERATE_TIMEOUT })
    await expect(page.getByRole('button', { name: 'Download', exact: true })).toBeVisible()
  })

  test('mobile preview area fills screen above tab bar after generation', async ({ page }) => {
    test.setTimeout(GENERATE_TIMEOUT + 20_000)

    await createCvOnMobile(page, 'Mobile Layout CV')

    await page.getByTestId('mobile-tabbar').getByRole('button', { name: /Gen PDF/i }).click()
    await expect(
      page.getByTestId('pdf-preview-area').locator('canvas').first(),
    ).toBeVisible({ timeout: GENERATE_TIMEOUT })

    // The pdf-preview-area div should occupy most of the screen above the tab bar
    const previewArea = page.getByTestId('pdf-preview-area')
    const tabbarBox = await page.getByTestId('mobile-tabbar').boundingBox()
    const previewBox = await previewArea.boundingBox()

    expect(previewBox).not.toBeNull()
    expect(tabbarBox).not.toBeNull()
    expect(previewBox!.height).toBeGreaterThan(MOBILE.height * 0.6)
    expect(previewBox!.y + previewBox!.height).toBeLessThanOrEqual(tabbarBox!.y + 2)
  })

  test('Reset returns to sample state on mobile', async ({ page }) => {
    test.setTimeout(GENERATE_TIMEOUT + 20_000)

    await createCvOnMobile(page, 'Mobile Reset CV')

    await page.getByTestId('mobile-tabbar').getByRole('button', { name: /Gen PDF/i }).click()
    await expect(
      page.getByTestId('pdf-preview-area').locator('canvas').first(),
    ).toBeVisible({ timeout: GENERATE_TIMEOUT })

    await page.getByRole('button', { name: 'Reset', exact: true }).click()

    // After reset the Download button should be gone (back to sample state)
    await expect(page.getByRole('button', { name: 'Download', exact: true })).not.toBeVisible()
  })

  test('Gen PDF button is disabled before a CV is created', async ({ page }) => {
    const genBtn = page.getByTestId('mobile-tabbar').getByRole('button', { name: /Gen PDF/i })
    await expect(genBtn).toBeDisabled()
  })
})
