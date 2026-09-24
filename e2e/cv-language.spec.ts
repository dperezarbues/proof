import { expect, test } from '@playwright/test'
import { COMPILE_TIMEOUT, openEditor, waitForNewPdf, waitForSettledSrc } from './helpers'

// Every template id except 'default' (covered by the test above) — each has
// its own section-heading render function, so each is a separate regression
// surface for the "custom template hardcodes English titles" bug class.
const OTHER_TEMPLATES = [
  'modern',
  'minimal',
  'sidebar',
  'compact',
  'banner',
  'timeline',
  'academic',
  'tech',
  'editorial',
]

test.describe('CV language selector', () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page)
    await page.getByTitle('New CV').click()
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Lang Test CV')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Lang Test CV' })).toBeVisible()
  })

  test('English is selected by default', async ({ page }) => {
    await expect(page.getByTestId('cv-language-en')).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByTestId('cv-language-de')).toHaveAttribute('aria-checked', 'false')
  })

  test('switching language changes the rendered PDF section headings', async ({ page }) => {
    test.setTimeout(COMPILE_TIMEOUT * 2 + 20_000)
    const viewer = page.locator('[data-testid="pdfjs-viewer"]')

    await page.getByRole('button', { name: 'Generate PDF' }).first().click()
    const oldSrc = await waitForSettledSrc(page)
    const enText = (await viewer.locator('.textLayer').textContent()) || ''
    expect(enText).toMatch(/S\s*U\s*M\s*M\s*A\s*R\s*Y/)

    // Changing the language already auto-triggers a debounced recompile —
    // wait for that rather than re-clicking Generate, which can race ahead of
    // React committing the content change and read back stale, pre-switch
    // content (the click fires before the content-change effect's ref updates).
    await page.getByTestId('cv-language-de').click()
    await expect(page.getByTestId('cv-language-de')).toHaveAttribute('aria-checked', 'true')
    await expect(viewer).not.toHaveAttribute('data-pdf-src', oldSrc ?? '', {
      timeout: COMPILE_TIMEOUT,
    })
    await expect(viewer).toHaveAttribute('data-render-state', 'ready', { timeout: 15_000 })

    const deText = (await viewer.locator('.textLayer').textContent()) || ''
    expect(deText).toMatch(/Z\s*U\s*S\s*A\s*M\s*M\s*E\s*N\s*F\s*A\s*S\s*S\s*U\s*N\s*G/)
    expect(deText).not.toMatch(/S\s*U\s*M\s*M\s*A\s*R\s*Y/)
  })

  for (const templateId of OTHER_TEMPLATES) {
    test(`${templateId} template translates section headings (not just default)`, async ({
      page,
    }) => {
      test.setTimeout(COMPILE_TIMEOUT * 2 + 20_000)
      const viewer = page.locator('[data-testid="pdfjs-viewer"]')

      await page.getByRole('tab', { name: /Template/i }).click()
      await page.getByTestId(`template-btn-${templateId}`).click()
      await page.getByRole('button', { name: 'Generate PDF' }).first().click()
      const oldSrc = await waitForSettledSrc(page)

      await page.getByRole('tab', { name: /Data/i }).click()
      await page.getByTestId('cv-language-de').click()
      await waitForNewPdf(page, oldSrc)

      // Check the Experience heading rather than Summary: the sample CV's
      // placeholder body text literally contains the word "summary" ("Your
      // professional summary."), which a case-insensitive match would catch
      // as a false pass/fail. "experience" never appears in the placeholder
      // body text, so it's a clean heading-only signal.
      const deText = (await viewer.locator('.textLayer').textContent()) || ''
      expect(deText).toMatch(/B\s*E\s*R\s*U\s*F\s*S\s*E\s*R\s*F\s*A\s*H\s*R\s*U\s*N\s*G/i)
      expect(deText).not.toMatch(/E\s*X\s*P\s*E\s*R\s*I\s*E\s*N\s*C\s*E/i)
    })
  }

  // Regression: editorial's left meta column (Contact/Skills/Education/
  // Languages) hardcoded its English labels instead of using section-title(),
  // so it stayed in English no matter the selected CV language — the main
  // column's headings (checked above) are rendered by a separate function and
  // were already correct, which is why this slipped past that coverage.
  test('editorial template translates the meta column, not just the main column', async ({
    page,
  }) => {
    test.setTimeout(COMPILE_TIMEOUT * 2 + 20_000)
    const viewer = page.locator('[data-testid="pdfjs-viewer"]')

    await page.getByRole('tab', { name: /Template/i }).click()
    await page.getByTestId('template-btn-editorial').click()
    await page.getByRole('button', { name: 'Generate PDF' }).first().click()
    const oldSrc = await waitForSettledSrc(page)

    await page.getByRole('tab', { name: /Data/i }).click()
    await page.getByTestId('cv-language-de').click()
    await waitForNewPdf(page, oldSrc)

    const deText = (await viewer.locator('.textLayer').textContent()) || ''
    expect(deText).toMatch(/A\s*U\s*S\s*B\s*I\s*L\s*D\s*U\s*N\s*G/i)
    expect(deText).not.toMatch(/E\s*D\s*U\s*C\s*A\s*T\s*I\s*O\s*N/i)
  })

  test('selection persists across reload', async ({ page }) => {
    await page.getByTestId('cv-language-fr').click()
    await expect(page.getByTestId('cv-language-fr')).toHaveAttribute('aria-checked', 'true')

    await page.reload()
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' })

    await expect(page.getByTestId('cv-language-fr')).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByTestId('cv-language-en')).toHaveAttribute('aria-checked', 'false')
  })
})
