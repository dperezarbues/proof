import { expect, test } from '@playwright/test'

// Regression: the PDF-generation and Analytics sections' translated
// paragraph text already contained the full sentence, but the page also
// hardcoded an English continuation after the inline link — rendering the
// second half of each sentence twice, in every locale. Fixed by moving the
// link inline into the translation string via t.rich instead of splicing
// JSX text around a translated fragment.
test.describe('/terms page', () => {
  test('does not duplicate text around the Typst and GoatCounter links', async ({ page }) => {
    await page.goto('/en/terms')
    const body = await page.locator('body').innerText()
    expect(body.match(/compiler runs entirely in your browser/g)?.length).toBe(1)
    expect(body.match(/GoatCounter collects page views/g)?.length).toBe(1)
  })

  test('all seven sections render, including No warranty, in order', async ({ page }) => {
    await page.goto('/en/terms')
    const expected = [
      'Your CV data',
      'PDF generation',
      'Analytics',
      'Cookies',
      'Open source',
      'Changes',
      'No warranty',
    ]
    const titles = await page.getByTestId('terms-section-title').allTextContents()
    expect(titles).toEqual(expected)
  })

  test('the disclaimer text and links resolve correctly in a non-English locale', async ({
    page,
  }) => {
    await page.goto('/es/terms')
    await expect(page.getByText('Sin garantía', { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Typst' })).toHaveAttribute(
      'href',
      'https://typst.app',
    )
    await expect(page.getByRole('link', { name: 'GoatCounter', exact: true })).toHaveAttribute(
      'href',
      'https://www.goatcounter.com',
    )
  })
})
