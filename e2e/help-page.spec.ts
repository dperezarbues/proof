import { expect, test } from '@playwright/test'

test.describe('/help page', () => {
  test('all eight sections render, including Privacy, in order', async ({ page }) => {
    await page.goto('/en/help')
    const expected = [
      'Adding your CV',
      'Choosing a template',
      'Arranging sections',
      'Customizing appearance',
      'CV language',
      'Generating & downloading the PDF',
      'Saving, exporting & backup',
      'Privacy',
    ]
    const titles = await page.getByTestId('help-section-title').allTextContents()
    expect(titles).toEqual(expected)
  })

  test('the Privacy section links to /terms, not an external tab', async ({ page }) => {
    await page.goto('/en/help')
    // Scoped to .first() — SiteFooter has its own "Privacy & Terms" link too.
    const link = page.getByRole('link', { name: 'Privacy & Terms' }).first()
    await expect(link).toHaveAttribute('href', '/en/terms/')
    await expect(link).not.toHaveAttribute('target', '_blank')
    await link.click()
    await expect(page).toHaveURL(/\/en\/terms/)
  })

  test('renders correctly in a non-English locale', async ({ page }) => {
    await page.goto('/es/help')
    await expect(page.getByRole('heading', { name: 'Cómo funciona Proof' })).toBeVisible()
    await expect(page.getByText('Añadir su CV', { exact: true })).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Privacidad y Términos' }).first(),
    ).toHaveAttribute('href', '/es/terms/')
  })

  test('the site nav Help link opens the help page', async ({ page }) => {
    await page.goto('/en/')
    await page.getByRole('link', { name: 'Help', exact: true }).click()
    await expect(page).toHaveURL(/\/en\/help/)
  })
})
