/**
 * Fast (no WASM) visibility audit: for each template, verifies that the Style
 * panel renders every expected control label. No CV needed, no compilation.
 *
 * This is the "template → editor" direction of the audit: checks that every
 * variable consumed by a Typst template is exposed in the editor UI.
 */

import { expect, type Page, test } from '@playwright/test'

async function openEditorStyleTab(page: Page, templateName: string) {
  await page.goto('/en/editor')
  await page.evaluate(() => {
    localStorage.setItem('proof-onboarded', '1')
    sessionStorage.setItem('proof-storage-choice-made', '1')
  })
  await page.reload()

  await page.getByRole('tab', { name: /Template/i }).click()
  await page.getByTestId(`template-btn-${templateName.toLowerCase()}`).click()
  await page.getByRole('tab', { name: /Style/i }).click()
}

async function expandAllGroups(page: Page) {
  for (const group of ['Typography', 'Colors', 'Spacing', 'Extras', 'Header', 'Sidebar']) {
    const btn = page.locator('button').filter({ hasText: group }).filter({ hasText: '▼' })
    if ((await btn.count()) > 0) await btn.first().click()
  }
}

function expectLabels(page: Page, labels: string[]) {
  return Promise.all(
    labels.map((label) =>
      expect(
        page.locator('aside').getByText(label, { exact: true }).first(),
        `Missing style param: "${label}"`,
      ).toBeVisible(),
    ),
  )
}

// Shared params that must appear on every template
const SHARED_LABELS = [
  'Font',
  'Name',
  'Entry titles',
  'Body text',
  'Section labels',
  'Line height',
  'Page footer',
  'QR code',
  'QR target URL',
  'Contact icons',
  'Contact labels',
]

test.describe('Style visibility — shared params present on all templates', () => {
  for (const name of [
    'Default',
    'Modern',
    'Minimal',
    'Sidebar',
    'Compact',
    'Banner',
    'Timeline',
    'Academic',
    'Tech',
    'Editorial',
  ]) {
    test(`${name} — shared style params visible`, async ({ page }) => {
      await openEditorStyleTab(page, name)
      await expandAllGroups(page)
      await expectLabels(page, SHARED_LABELS)
    })
  }
})

test.describe('Style visibility — template-specific params', () => {
  test('Default — headline_size, accent_color, section_pre/post, section_rule_gap', async ({ page }) => {
    await openEditorStyleTab(page, 'Default')
    await expandAllGroups(page)
    await expectLabels(page, ['Headline', 'Links / accent', 'Before section', 'After rule', 'Title → rule'])
  })

  test('Modern — headline_size, accent, section_pre/post', async ({ page }) => {
    await openEditorStyleTab(page, 'Modern')
    await expandAllGroups(page)
    await expectLabels(page, ['Headline', 'Accent / links', 'Before section', 'After rule'])
  })

  test('Minimal — accent_color, section_pre/post', async ({ page }) => {
    await openEditorStyleTab(page, 'Minimal')
    await expandAllGroups(page)
    await expectLabels(page, ['Links / accent', 'Before section', 'After rule'])
  })

  test('Sidebar — all sidebar-specific params', async ({ page }) => {
    await openEditorStyleTab(page, 'Sidebar')
    await expandAllGroups(page)
    await expectLabels(page, [
      'Links / accent',
      'Background',
      'Section headings',
      'Links / icons',
      'Text',
      'Width',
      'Before section',
      'After rule',
      'Title → rule',
    ])
  })

  test('Compact — headline_size, accent_color, section_pre/post', async ({ page }) => {
    await openEditorStyleTab(page, 'Compact')
    await expandAllGroups(page)
    await expectLabels(page, ['Headline', 'Accent', 'Before section', 'After rule'])
  })

  test('Banner — headline_size, header_bg, accent_color, section_pre/post', async ({ page }) => {
    await openEditorStyleTab(page, 'Banner')
    await expandAllGroups(page)
    await expectLabels(page, ['Headline', 'Header background', 'Accent', 'Before section', 'After rule'])
  })

  test('Timeline — headline_size, accent_color, section_pre/post, section_rule_gap', async ({ page }) => {
    await openEditorStyleTab(page, 'Timeline')
    await expandAllGroups(page)
    await expectLabels(page, ['Headline', 'Accent', 'Before section', 'After rule', 'Title → rule'])
  })

  test('Academic — headline_size, accent_color, section_pre/post', async ({ page }) => {
    await openEditorStyleTab(page, 'Academic')
    await expandAllGroups(page)
    await expectLabels(page, ['Headline', 'Links / accent', 'Before section', 'After rule'])
  })

  test('Tech — headline_size, accent_color, section_pre/post', async ({ page }) => {
    await openEditorStyleTab(page, 'Tech')
    await expandAllGroups(page)
    await expectLabels(page, ['Headline', 'Accent', 'Before section', 'After rule'])
  })

  test('Editorial — accent_color, section_pre/post (no headline — uses fs-sm)', async ({ page }) => {
    await openEditorStyleTab(page, 'Editorial')
    await expandAllGroups(page)
    await expectLabels(page, ['Accent', 'Before section', 'After rule'])
  })
})
