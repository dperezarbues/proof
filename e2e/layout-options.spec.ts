/**
 * Verifies Layout panel controls — section add/remove, columns group, and
 * the layout-variant picker — each trigger a PDF recompile (new blob URL in
 * the iframe).
 */

import { expect, type Page, test } from '@playwright/test'
import { COMPILE_TIMEOUT, openEditor, waitForNewPdf } from './helpers'

async function setupWithPdf(page: Page): Promise<string> {
  await page.getByTitle('New CV').click()
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Layout Test CV')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Layout Test CV' })).toBeVisible()

  // Layout tab is the starting point — EditorShell must be mounted
  await page.getByRole('tab', { name: /Layout/i }).click()
  await page.getByRole('button', { name: 'Generate PDF' }).first().click()
  await expect(page.getByText('Generating PDF…')).not.toBeVisible({ timeout: COMPILE_TIMEOUT })

  const src = await page.locator('[data-testid="pdfjs-viewer"]').getAttribute('data-pdf-src')
  if (!src) throw new Error('data-pdf-src attribute not found after initial compile')
  expect(src).toMatch(/^blob:/)
  return src
}

// ── Section management ────────────────────────────────────────────────────────

test.describe('Layout — section remove and add', () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page)
  })

  test('removing a section triggers recompile', async ({ page }) => {
    test.setTimeout(COMPILE_TIMEOUT * 2)
    const old = await setupWithPdf(page)
    await page.locator('button[data-testid="remove-section"]').first().click()
    await waitForNewPdf(page, old)
  })

  test('adding a section back triggers recompile', async ({ page }) => {
    test.setTimeout(COMPILE_TIMEOUT * 3)
    // Remove one first so there is an available section to add
    const old = await setupWithPdf(page)
    await page.locator('button[data-testid="remove-section"]').first().click()
    await waitForNewPdf(page, old)

    const afterRemove = await page
      .locator('[data-testid="pdfjs-viewer"]')
      .getAttribute('data-pdf-src')
    if (!afterRemove) throw new Error('data-pdf-src not found after remove compile')
    const addDropdown = page.locator('select').filter({ hasText: '+ add section' })
    await addDropdown.selectOption({ index: 1 })
    await waitForNewPdf(page, afterRemove)
  })
})

// ── Columns group ─────────────────────────────────────────────────────────────

test.describe('Layout — columns group', () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page)
  })

  test('adding a columns group triggers recompile', async ({ page }) => {
    test.setTimeout(COMPILE_TIMEOUT * 2)
    const old = await setupWithPdf(page)
    await page.getByRole('button', { name: '+ columns' }).click()
    await waitForNewPdf(page, old)
  })
})

// ── Layout variant switcher ───────────────────────────────────────────────────

test.describe('Layout — variant selection (default template)', () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page)
  })

  test('switching to Classic layout triggers recompile', async ({ page }) => {
    test.setTimeout(COMPILE_TIMEOUT * 2)
    const old = await setupWithPdf(page)

    // The layout picker is in the Template tab
    await page.getByRole('tab', { name: /Template/i }).click()
    await page.getByTestId('layout-btn-classic').click()

    // Switch back to Layout tab to resume editor view, then generate
    await page.getByRole('tab', { name: /Layout/i }).click()
    await page.getByRole('button', { name: 'Generate PDF' }).first().click()
    await expect(page.getByText('Generating PDF…')).not.toBeVisible({ timeout: COMPILE_TIMEOUT })

    const src = await page.locator('[data-testid="pdfjs-viewer"]').getAttribute('data-pdf-src')
    expect(src).toMatch(/^blob:/)
    // The blob URL after switching layout should be different from the Split-layout blob
    expect(src).not.toEqual(old)
  })
})
