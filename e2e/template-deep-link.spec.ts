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
  await page.evaluate(() => {
    localStorage.setItem('proof-onboarded', '1')
    sessionStorage.setItem('proof-storage-choice-made', '1')
  })
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

test('switching templates in-app keeps ?template= in sync, without remounting the gallery', async ({
  page,
}) => {
  await openEditorWith(page, '?template=modern') // ends on the Template tab
  await expect(page.getByTestId('template-btn-modern')).toHaveAttribute('aria-pressed', 'true')
  expect(new URL(page.url()).searchParams.get('template')).toBe('modern')

  await page.getByTestId('template-btn-sidebar').click()

  await expect(page.getByTestId('template-btn-sidebar')).toHaveAttribute('aria-pressed', 'true')
  await expect(page).toHaveURL(/[?&]template=sidebar(&|$)/)

  // A remount of TemplatesGallery would reset its top-level activeTab state
  // back to its 'data' default — the Template tab would silently stop being
  // selected. That's the regression this guards against: keeping ?template=
  // in sync via the Next.js router (instead of history.replaceState) would
  // re-enter the useSearchParams()-consuming Suspense boundary and remount
  // the whole gallery on every switch.
  await expect(page.getByRole('tab', { name: /Template/i })).toHaveAttribute(
    'aria-selected',
    'true',
  )
})
