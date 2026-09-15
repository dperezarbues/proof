/**
 * Smoke tests for the four supported locales (en, fr, de, es).
 * Verifies the editor loads, translated tab labels render, and the
 * onboarding modal is dismissible in each language.
 *
 * Does NOT do PDF generation — that's covered by the English-only
 * pdf-generation and mobile-pdf specs.
 */

import { expect, type Page, test } from '@playwright/test'

interface LocaleFixture {
  locale: string
  tabData: string
  tabTemplate: string
  nameLabel: string
  save: string
  getStarted: string
  genPDFMobile: string
  newCvTitle: string
}

const LOCALES: LocaleFixture[] = [
  { locale: 'en', tabData: 'Data',    tabTemplate: 'Template', nameLabel: 'Name',   save: 'Save',        getStarted: 'Get started',  genPDFMobile: 'Gen PDF',     newCvTitle: 'New CV' },
  { locale: 'fr', tabData: 'Données', tabTemplate: 'Modèle',   nameLabel: 'Nom',    save: 'Enregistrer', getStarted: 'Commencer',    genPDFMobile: 'Générer PDF', newCvTitle: 'Nouveau CV' },
  { locale: 'de', tabData: 'Daten',   tabTemplate: 'Vorlage',  nameLabel: 'Name',   save: 'Speichern',   getStarted: 'Loslegen',     genPDFMobile: 'PDF gen.',    newCvTitle: 'Neuer Lebenslauf' },
  { locale: 'es', tabData: 'Datos',   tabTemplate: 'Plantilla',nameLabel: 'Nombre', save: 'Guardar',     getStarted: 'Comenzar',     genPDFMobile: 'Gen. PDF',    newCvTitle: 'Nuevo CV' },
]

for (const { locale, tabData, tabTemplate, nameLabel, save, getStarted, genPDFMobile, newCvTitle } of LOCALES) {
  test.describe(`Locale: ${locale}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/${locale}/editor`)
      await page.evaluate(() => localStorage.setItem('proof-onboarded', '1'))
      await page.reload()
      await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' })
    })

    test(`[${locale}] editor loads without error`, async ({ page }) => {
      const viewer = page.locator('[data-testid="pdfjs-viewer"]')
      await expect(viewer).toBeVisible()
      const src = await viewer.getAttribute('data-pdf-src')
      expect(src).toMatch(/\.pdf/)
    })

    test(`[${locale}] desktop tab labels are translated`, async ({ page }) => {
      await expect(page.getByRole('tab', { name: tabData })).toBeVisible()
      await expect(page.getByRole('tab', { name: tabTemplate })).toBeVisible()
    })

    test(`[${locale}] onboarding modal uses translated Get started button`, async ({ page }) => {
      // Clear all storage so the modal appears (both legacy and current keys)
      await page.evaluate(() => localStorage.clear())
      await page.reload()
      await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' })

      const btn = page.getByRole('button', { name: getStarted })
      await expect(btn).toBeVisible()
      await btn.click()
      await expect(btn).not.toBeVisible()
    })

    test(`[${locale}] mobile tab bar Gen PDF button shows translated label`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.reload()
      await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' })

      const genBtn = page.getByTestId('mobile-tabbar').getByRole('button', { name: genPDFMobile, exact: true })
      await expect(genBtn).toBeVisible()
    })

    test(`[${locale}] CV can be created and saved`, async ({ page }) => {
      await page.getByTitle(newCvTitle).click()
      await page.getByRole('textbox', { name: nameLabel, exact: true }).fill(`Locale ${locale} CV`)
      await page.getByRole('button', { name: save, exact: true }).click()
      await expect(page.getByRole('button', { name: `Locale ${locale} CV` })).toBeVisible()
    })
  })
}
