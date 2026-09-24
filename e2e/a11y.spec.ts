import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { openEditor, openStyleTab } from './helpers'

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
    await page.evaluate(() => {
      localStorage.setItem('proof-onboarded', '1')
      sessionStorage.setItem('proof-storage-choice-made', '1')
    })
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
    await page.evaluate(() => {
      localStorage.setItem('proof-onboarded', '1')
      sessionStorage.setItem('proof-storage-choice-made', '1')
    })
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
    await page.evaluate(() => {
      localStorage.setItem('proof-onboarded', '1')
      sessionStorage.setItem('proof-storage-choice-made', '1')
    })
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
    await page.evaluate(() => {
      localStorage.setItem('proof-onboarded', '1')
      sessionStorage.setItem('proof-storage-choice-made', '1')
    })
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
    await page.evaluate(() => {
      localStorage.setItem('proof-onboarded', '1')
      sessionStorage.setItem('proof-storage-choice-made', '1')
    })
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

  test('style tab has no structural violations', async ({ page }) => {
    await openEditor(page)
    await page.getByTitle('New CV').click()
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('A11y Style CV')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('button', { name: 'A11y Style CV' })).toBeVisible()
    await openStyleTab(page)

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(DISABLED_RULES)
      .exclude('[data-testid="pdfjs-viewer"]')
      .analyze()
    expect(results.violations).toEqual([])
  })

  // Every other test in this file sets proof-onboarded up front specifically
  // to skip past this modal — scan the one state where it's actually visible.
  test('onboarding modal (real first-visit state) has no structural violations', async ({
    page,
  }) => {
    await page.goto('/en/editor')
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' })
    await expect(page.getByRole('dialog')).toBeVisible()

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(DISABLED_RULES)
      // The PDF.js canvas viewer renders imperatively — exclude it from axe scan
      .exclude('[data-testid="pdfjs-viewer"]')
      .analyze()
    expect(results.violations).toEqual([])
  })

  // Onboarded (so the welcome modal is skipped) but no per-tab storage
  // choice recorded yet — the state SharedComputerPrompt is built for.
  test('shared computer prompt has no structural violations', async ({ page }) => {
    await page.goto('/en/editor')
    await page.evaluate(() => localStorage.setItem('proof-onboarded', '1'))
    await page.reload()
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' })
    await page.getByTitle('New CV').click()
    await expect(page.getByRole('dialog')).toBeVisible()

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(DISABLED_RULES)
      .exclude('[data-testid="pdfjs-viewer"]')
      .analyze()
    expect(results.violations).toEqual([])
  })

  test('save layout preset modal has no structural violations', async ({ page }) => {
    await openEditor(page)
    await page.getByTitle('New CV').click()
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('A11y Save Modal CV')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('button', { name: 'A11y Save Modal CV' })).toBeVisible()
    await page.getByRole('tab', { name: /Layout/i }).click()
    await page.getByTestId('save-layout-as-btn').click()
    await expect(page.getByRole('dialog')).toBeVisible()

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(DISABLED_RULES)
      // The PDF.js canvas viewer renders imperatively — exclude it from axe scan
      .exclude('[data-testid="pdfjs-viewer"]')
      .analyze()
    expect(results.violations).toEqual([])
  })

  // Only renders when NEXT_PUBLIC_SUPPORT_URL is configured — skip rather
  // than fail when it isn't, matching support-prompt.spec.ts's own pattern.
  test('support prompt has no structural violations (when configured)', async ({ page }) => {
    test.setTimeout(80_000)
    await openEditor(page)
    await page.getByTitle('New CV').click()
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('A11y Support CV')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('button', { name: 'A11y Support CV' })).toBeVisible()

    await page.getByRole('button', { name: 'Generate PDF' }).first().click()
    await expect(page.getByText('Generating PDF…')).not.toBeVisible({ timeout: 60_000 })
    await page.getByRole('button', { name: 'Download', exact: true }).click()

    const modal = page.getByTestId('support-prompt')
    if (!(await modal.isVisible().catch(() => false))) {
      test.skip()
      return
    }

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(DISABLED_RULES)
      // The PDF.js canvas viewer renders imperatively — exclude it from axe scan
      .exclude('[data-testid="pdfjs-viewer"]')
      .analyze()
    expect(results.violations).toEqual([])
  })

  test('landing page in a non-English locale has no structural violations', async ({ page }) => {
    await page.goto('/es/')
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(DISABLED_RULES)
      .analyze()
    expect(results.violations).toEqual([])
  })

  // Regression: --c-accent (used for error/status text) only reaches ~3.2:1
  // against --c-paper — this failure was invisible because color-contrast is
  // disabled globally above (a deliberate trade-off for decorative text
  // elsewhere). Error text isn't decorative, so it gets its own scoped,
  // full-strength check instead of relying on the blanket exclusion.
  test('error message text meets WCAG AA color contrast', async ({ page }) => {
    await openEditor(page)

    await page.evaluate(() => {
      const orig = Storage.prototype.setItem
      Storage.prototype.setItem = function (key: string, value: string) {
        if (key === 'proof-cvs') {
          throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
        }
        return orig.call(this, key, value)
      }
    })
    await page.getByTitle('New CV').click()
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Contrast Test CV')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByText(/storage is full|unavailable/i)).toBeVisible()

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('[role="alert"]')
      .withRules(['color-contrast'])
      .analyze()
    expect(results.violations).toEqual([])
  })
})
