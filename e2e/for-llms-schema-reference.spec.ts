import { expect, test } from '@playwright/test'
import { openEditor } from './helpers'

// The schema reference now lives at /[locale]/for-llms, a real translated
// page like the rest of the site (src/app/[locale]/layout.tsx provides its
// <html>/<body> and Archivo/Space Mono fonts, same as every other locale
// route). Bare /for-llms is now just a LocaleRedirect shim to it — see
// locale-redirect-shims.spec.ts for that redirect behaviour. Schema field
// names, JSON examples, and type vocabulary stay in English at every
// locale; only the surrounding prose is translated.
test.describe('/for-llms schema reference page', () => {
  test('renders a valid document with the site fonts, no runtime error', async ({ page }) => {
    const resp = await page.goto('/en/for-llms')
    expect(resp?.status()).toBe(200)

    await expect(page.getByText('Runtime Error')).not.toBeVisible()
    const html = page.locator('html')
    await expect(html).toHaveAttribute('lang', 'en')
    const cls = await html.getAttribute('class')
    expect(cls).toMatch(/archivo.*variable/)
    expect(cls).toMatch(/space_mono.*variable/)

    await expect(page.getByRole('heading', { name: 'Schema Reference' })).toBeVisible()
  })

  // Regression: the section-IDs table used to mislabel core_strengths as
  // sidebar-only (it's available on every template) and never mentioned
  // leadership_profile at all, despite both being real, implemented sections.
  test('documents core_strengths and leadership_profile accurately', async ({ page }) => {
    await page.goto('/en/for-llms')
    await expect(page.getByText('core_strengths').first()).toBeVisible()
    await expect(page.getByText(/not sidebar-only/)).toBeVisible()
    await expect(page.getByText('leadership_profile').first()).toBeVisible()
  })

  // The page is now genuinely localized — switching languages should
  // translate the surrounding prose while schema keys stay in English.
  test('the language switcher translates prose but keeps schema keys in English', async ({
    page,
  }) => {
    await page.goto('/en/for-llms')
    await expect(page.getByRole('heading', { name: 'Schema Reference' })).toBeVisible()

    await page.getByLabel('Language').selectOption('es')
    await page.waitForURL('**/es/for-llms/')
    await expect(page.getByRole('heading', { name: 'Referencia del esquema' })).toBeVisible()
    // "identity" is a schema key referenced inside translated prose — it
    // must survive untranslated regardless of locale.
    await expect(page.getByText('identity', { exact: true }).first()).toBeVisible()
  })

  // Regression: the style-parameters example JSON used a fictional font
  // ("Helvetica Neue" — not one of the 5 real options), a fictional
  // header.style value ("band" — not a valid split|stacked enum member),
  // and the wrong key name for the accent colour ("accent" instead of the
  // real accent_color). Validate the CURRENT example against the app's
  // real layout-import schema, not just that it looks plausible.
  test('the style-parameters example JSON is valid against the real import schema', async ({
    page,
  }) => {
    await openEditor(page)
    await page.getByTitle('New CV').click()
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Schema Example CV')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Schema Example CV' })).toBeVisible()
    await page.getByRole('tab', { name: /Template/i }).click()
    await page.getByTestId('template-btn-banner').click()
    await page.getByRole('tab', { name: /Layout/i }).click()

    // Exactly the JSON documented in the "Style embedded in layout" example.
    const exampleJson = {
      header: { style: 'split' },
      style: {
        font_family: 'Lato',
        header_bg: '#0f172a',
        accent_color: '#f59e0b',
        headline_size: 11,
        body_size: 9.0,
        line_height: 0.75,
        show_footer: 'true',
        show_contact_icons: 'true',
      },
      sections: [
        { id: 'summary', breakable: true },
        { id: 'experience', breakable: true },
      ],
    }
    await page.setInputFiles('[data-testid="layout-import-input"]', {
      name: 'example.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(exampleJson)),
    })

    const sectionList = page.getByTestId('section-list')
    await expect(sectionList.getByText('Summary', { exact: true })).toBeVisible()
    await expect(sectionList.getByText('Experience', { exact: true })).toBeVisible()
    expect(await sectionList.locator('> div').count()).toBe(2)
  })
})
