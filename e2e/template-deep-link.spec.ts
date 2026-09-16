/**
 * Verifies the /editor?template=<id> deep link used by the landing page's
 * template gallery cards — a known id preselects that template, an unknown one
 * falls back to the default instead of crashing.
 */

import { expect, type Page, test } from '@playwright/test'

/** Same onboarding dance as openEditor() in helpers.ts, but preserving the
 *  query string — the helper hardcodes a bare /en/editor. */
async function openEditorWith(page: Page, query: string) {
  await page.goto(`/en/editor${query}`)
  await page.evaluate(() => localStorage.setItem('proof-onboarded', '1'))
  await page.reload()
  await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' })
  await page.getByRole('tab', { name: /Template/i }).click()
}

test('?template=modern preselects the Modern template', async ({ page }) => {
  await openEditorWith(page, '?template=modern')

  await expect(page.getByTestId('template-btn-modern')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('template-btn-default')).toHaveAttribute('aria-pressed', 'false')
})

test('unknown ?template= value falls back to the default template', async ({ page }) => {
  await openEditorWith(page, '?template=does-not-exist')

  await expect(page.getByTestId('template-btn-default')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('template-btn-modern')).toHaveAttribute('aria-pressed', 'false')
})
