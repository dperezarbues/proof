import { expect, test } from '@playwright/test'
import { openEditor } from './helpers'

// Regression: template (and layout-variant) selection used to live only in
// React state — every fresh visit (no ?template= deep link) silently reset
// to Default, discarding whatever the user had actually been using. This
// only persists the *pointer* to the last-used template/layout; each
// template's own layout and style customization was already separately
// scoped per templateId and is untouched by this.
test.describe('Template selection persistence', () => {
  test('reloading without a ?template= deep link restores the last selected template', async ({
    page,
  }) => {
    await openEditor(page)
    await page.getByRole('tab', { name: /Template/i }).click()
    await page.getByTestId('template-btn-sidebar').click()
    await expect(page.getByTestId('template-btn-sidebar')).toHaveAttribute('aria-pressed', 'true')

    await page.reload()
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' })
    await page.getByRole('tab', { name: /Template/i }).click()

    await expect(page.getByTestId('template-btn-sidebar')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('template-btn-default')).toHaveAttribute('aria-pressed', 'false')
  })

  test('a ?template= deep link takes priority over a persisted selection', async ({ page }) => {
    await openEditor(page)
    await page.getByRole('tab', { name: /Template/i }).click()
    await page.getByTestId('template-btn-sidebar').click()
    await expect(page.getByTestId('template-btn-sidebar')).toHaveAttribute('aria-pressed', 'true')

    await page.goto('/en/editor?template=modern')
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' })
    await page.getByRole('tab', { name: /Template/i }).click()

    await expect(page.getByTestId('template-btn-modern')).toHaveAttribute('aria-pressed', 'true')
  })
})
