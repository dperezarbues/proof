import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

// color-contrast is a known design trade-off (text-gray-400 on white is intentionally light).
// These tests target structural/ARIA violations — especially custom controls like DnD handles,
// accordion toggles, and tab widgets — which are regression-prone and not caught by TypeScript.
const DISABLED_RULES = ['color-contrast']

test.describe('Accessibility — axe-core regression', () => {
  test('landing page has no structural violations', async ({ page }) => {
    await page.goto('/en/')
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(DISABLED_RULES)
      .analyze()
    expect(results.violations).toEqual([])
  })

  test('editor page (onboarded) has no structural violations', async ({ page }) => {
    await page.goto('/en/editor')
    await page.evaluate(() => localStorage.setItem('proof-onboarded', '1'))
    await page.reload()
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(DISABLED_RULES)
      // The PDF.js canvas viewer renders imperatively — exclude it from axe scan
      .exclude('[data-testid="pdfjs-viewer"]')
      .analyze()
    expect(results.violations).toEqual([])
  })

  test('CV data modal (Editor tab) has no structural violations', async ({ page }) => {
    await page.goto('/en/editor')
    await page.evaluate(() => localStorage.setItem('proof-onboarded', '1'))
    await page.reload()
    await page.getByTitle('New CV').click()
    await expect(page.getByRole('heading', { name: 'New CV' })).toBeVisible()

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(DISABLED_RULES)
      .exclude('[data-testid="pdfjs-viewer"]')
      .analyze()
    expect(results.violations).toEqual([])
  })

  test('CV data modal (JSON tab) has no structural violations', async ({ page }) => {
    await page.goto('/en/editor')
    await page.evaluate(() => localStorage.setItem('proof-onboarded', '1'))
    await page.reload()
    await page.getByTitle('New CV').click()
    await page.getByRole('button', { name: 'JSON', exact: true }).click()
    await expect(page.locator('textarea[spellcheck="false"]')).toBeVisible()

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(DISABLED_RULES)
      .exclude('[data-testid="pdfjs-viewer"]')
      .analyze()
    expect(results.violations).toEqual([])
  })

  test('layout editor panel (DnD drag handles, section toggles) has no structural violations', async ({
    page,
  }) => {
    await page.goto('/en/editor')
    await page.evaluate(() => localStorage.setItem('proof-onboarded', '1'))
    await page.reload()

    // Open the layout editor panel where DnD drag handles live
    const layoutTab = page.getByRole('button', { name: /Layout/i })
    if (await layoutTab.isVisible()) {
      await layoutTab.click()
    }

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(DISABLED_RULES)
      .exclude('[data-testid="pdfjs-viewer"]')
      .analyze()
    expect(results.violations).toEqual([])
  })

  test('mobile panel (dialog role, aria-modal) has no structural violations', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/en/editor')
    await page.evaluate(() => localStorage.setItem('proof-onboarded', '1'))
    await page.reload()
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' })
    // Open the panel so the dialog role and aria-modal are active during the scan
    await page.getByTestId('mobile-tab-data').click()
    await expect(page.locator('.editor-aside')).toHaveAttribute('data-open', 'true')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(DISABLED_RULES)
      .exclude('[data-testid="pdfjs-viewer"]')
      .analyze()
    expect(results.violations).toEqual([])
  })
})
