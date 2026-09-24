import { expect, type Page, test } from '@playwright/test'
import { openEditor, openStyleGroup } from './helpers'

/**
 * Verifies the combined CV+design export/import: "Download" on a CV bundles
 * its current template/layout/style alongside the data (not just the data,
 * as before) so the app's only backup story — download the JSON periodically,
 * there's no cloud backup — doesn't silently drop presentation customization.
 * Backward compatible: a bare CV-only file (no design) still imports exactly
 * as it always has.
 */

async function newCv(page: Page, name: string) {
  await page.getByTitle('New CV').click()
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill(name)
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByRole('button', { name })).toBeVisible()
}

async function downloadJson(
  page: Page,
  trigger: () => Promise<void>,
): Promise<Record<string, unknown>> {
  const downloadPromise = page.waitForEvent('download')
  await trigger()
  const download = await downloadPromise
  const stream = await download.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(chunk as Buffer)
  return JSON.parse(Buffer.concat(chunks).toString('utf-8'))
}

/** Downloads the named CV row specifically — the Download JSON button isn't
 *  unique on the page (one per row), so this walks from the row's own select
 *  button to its sibling download button rather than risking `.first()`
 *  silently grabbing a different row's. */
async function downloadRow(page: Page, name: string): Promise<Record<string, unknown>> {
  const selectBtn = page.getByRole('button', { name, exact: true })
  await selectBtn.hover()
  return downloadJson(page, () =>
    selectBtn.locator('xpath=following-sibling::button[@aria-label="Download JSON"]').click(),
  )
}

test.describe('CV + design bundle export/import', () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page)
  })

  test("download bundles the active CV's current design, not an inactive CV's", async ({
    page,
  }) => {
    await newCv(page, 'Bundle CV A')
    await newCv(page, 'Bundle CV B') // B is now the active CV

    await page.getByRole('tab', { name: /Template/i }).click()
    await page.getByTestId('template-btn-modern').click()
    await openStyleGroup(page, 'Typography')
    await page.locator('select#font_family').selectOption('Lato')

    await page.getByRole('tab', { name: /Data/i }).click()

    // Active CV (B): bundled with the current design. (The list entry name,
    // set via newCv() above, is separate from identity.name inside the CV
    // content — that stays whatever the starter template's default is,
    // since neither test edits the CV form — so this only checks `cv` is
    // present at all, and focuses the real assertions on `design`.)
    const bBundle = await downloadRow(page, 'Bundle CV B')
    expect(bBundle.cv).toBeTruthy()
    expect((bBundle.design as { templateId: string }).templateId).toBe('modern')
    expect((bBundle.design as { style: { font_family: string } }).style.font_family).toBe('Lato')

    // Inactive CV (A): data-only — no design to meaningfully attach, since
    // design is global, not per-CV.
    const aBundle = await downloadRow(page, 'Bundle CV A')
    expect(aBundle.design).toBeUndefined()
    expect(aBundle.cv).toBeUndefined() // bare CV shape — identity is top-level, not nested
    expect((aBundle.identity as { name: string }).name).toBeTruthy()
  })

  test('importing a downloaded bundle restores the CV, template, layout, and style', async ({
    page,
  }) => {
    await newCv(page, 'Round Trip CV')
    await page.getByRole('tab', { name: /Template/i }).click()
    await page.getByTestId('template-btn-modern').click()
    await openStyleGroup(page, 'Typography')
    await page.locator('select#font_family').selectOption('Lato')

    await page.getByRole('tab', { name: /Data/i }).click()
    const bundle = await downloadRow(page, 'Round Trip CV')

    // Move away from Modern so restoring it is an observable change.
    await page.getByRole('tab', { name: /Template/i }).click()
    await page.getByTestId('template-btn-default').click()

    await page.getByRole('tab', { name: /Data/i }).click()
    await page.setInputFiles('[data-testid="cv-import-input"]', {
      name: 'round-trip.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(bundle)),
    })
    await expect(page.getByRole('heading', { name: /New CV|Import/i })).toBeVisible()
    await page.getByRole('button', { name: 'Save', exact: true }).click()

    await page.getByRole('tab', { name: /Template/i }).click()
    await expect(page.getByTestId('template-btn-modern')).toHaveAttribute('aria-pressed', 'true')
    await openStyleGroup(page, 'Typography')
    await expect(page.locator('select#font_family')).toHaveValue('Lato')
  })

  test('importing a bundle for the already-active template/layout still applies it', async ({
    page,
  }) => {
    await newCv(page, 'Same Template CV')
    await page.getByRole('tab', { name: /Template/i }).click()
    await page.getByTestId('template-btn-modern').click()
    await openStyleGroup(page, 'Typography')
    await page.locator('select#font_family').selectOption('Lato')

    await page.getByRole('tab', { name: /Data/i }).click()
    const bundle = await downloadRow(page, 'Same Template CV')

    // Change the value again, WITHOUT switching template/layout — the
    // re-import below targets the template/layout that's already active, the
    // one case where naive setActiveTemplate/setActiveLayout calls would be
    // no-ops (same object references) and silently fail to pick up the
    // freshly-restored override.
    await page.getByRole('tab', { name: /Template/i }).click()
    await openStyleGroup(page, 'Typography')
    await page.locator('select#font_family').selectOption('EB Garamond')

    await page.getByRole('tab', { name: /Data/i }).click()
    await page.setInputFiles('[data-testid="cv-import-input"]', {
      name: 'same-template.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(bundle)),
    })
    await expect(page.getByRole('heading', { name: /New CV|Import/i })).toBeVisible()
    await page.getByRole('button', { name: 'Save', exact: true }).click()

    await page.getByRole('tab', { name: /Template/i }).click()
    await openStyleGroup(page, 'Typography')
    await expect(page.locator('select#font_family')).toHaveValue('Lato')
  })

  test('importing a bare CV JSON (no design wrapper) still imports data only, unchanged', async ({
    page,
  }) => {
    const bareCv = {
      identity: { name: 'Bare Import CV', contact: [] },
      summary: 'A plain CV file with no design bundled.',
      experience: [],
      education: [],
      skills: [],
      languages: [],
    }

    await page.getByRole('tab', { name: /Data/i }).click()
    await page.setInputFiles('[data-testid="cv-import-input"]', {
      name: 'bare-cv.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(bareCv)),
    })
    await expect(page.getByRole('heading', { name: /New CV|Import/i })).toBeVisible()
    await page.getByRole('button', { name: 'Save', exact: true }).click()

    // The saved list entry is named from the imported filename ("bare-cv"),
    // not identity.name inside the content — same as any other import.
    await expect(page.getByRole('button', { name: 'bare-cv' })).toBeVisible()
    // No design was bundled, so the template stays whatever it already was
    // (Default, the app's own initial state) rather than changing.
    await page.getByRole('tab', { name: /Template/i }).click()
    await expect(page.getByTestId('template-btn-default')).toHaveAttribute('aria-pressed', 'true')
  })

  // Regression: applyImportedDesign() discarded the boolean return of all
  // three of its localStorage writes — under quota pressure, the import
  // appeared to succeed (this session's own state already reflects it) and
  // then silently reverted to the previous design on the next reload, with
  // nothing telling the user why.
  test('a design import that fails to persist surfaces an inline warning', async ({ page }) => {
    await newCv(page, 'Quota Import CV')
    await page.getByRole('tab', { name: /Template/i }).click()
    await page.getByTestId('template-btn-modern').click()
    await openStyleGroup(page, 'Typography')
    await page.locator('select#font_family').selectOption('Lato')

    await page.getByRole('tab', { name: /Data/i }).click()
    const bundle = await downloadRow(page, 'Quota Import CV')

    await page.getByRole('tab', { name: /Template/i }).click()
    await page.getByTestId('template-btn-default').click()

    await page.evaluate(() => {
      const orig = Storage.prototype.setItem
      Storage.prototype.setItem = function (key: string, value: string) {
        if (key === 'proof-layout-overrides') {
          throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
        }
        return orig.call(this, key, value)
      }
    })

    await page.getByRole('tab', { name: /Data/i }).click()
    await page.setInputFiles('[data-testid="cv-import-input"]', {
      name: 'quota-import.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(bundle)),
    })
    await expect(page.getByRole('heading', { name: /New CV|Import/i })).toBeVisible()
    await expect(page.getByTestId('design-import-error')).not.toBeVisible()
    await page.getByRole('button', { name: 'Save', exact: true }).click()

    await expect(page.getByTestId('design-import-error')).toBeVisible()
  })
})
