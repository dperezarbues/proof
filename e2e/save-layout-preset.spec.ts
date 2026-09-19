import { expect, test } from '@playwright/test'
import { openEditor } from './helpers'

// Regression: the "Save as…" trigger for named layout presets existed in the
// very first commit of this repo (in the old ActionsBar/LayoutEditor
// components) but got dropped somewhere during the later rebrand/restructure
// into EditorShell/TemplatesGallery — the underlying save/load/delete logic
// (useSavedConfigs, SaveModal, SavedList) kept working, but nothing in the UI
// could ever open SaveModal, so the feature was completely unreachable.
test.describe('Named layout presets', () => {
  test('saving, loading, and deleting a named layout preset works end to end', async ({
    page,
  }) => {
    await openEditor(page)
    await page.getByTitle('New CV').click()
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Preset Test CV')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Preset Test CV' })).toBeVisible()

    await page.getByRole('tab', { name: /Layout/i }).click()

    // No presets saved yet — the "Saved layouts" section must stay hidden.
    await expect(page.getByText('Saved layouts')).not.toBeVisible()

    await page.getByTestId('save-layout-as-btn').click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByPlaceholder('My dark sidebar').fill('My Preset')
    await page.getByRole('button', { name: 'Save', exact: true }).click()

    // Modal closes and the new preset now appears under "Saved layouts".
    await expect(page.getByText('Save configuration')).not.toBeVisible()
    await expect(page.getByText('Saved layouts')).toBeVisible()
    const presetRow = page.locator('div.group', { hasText: 'My Preset' })
    await expect(presetRow).toBeVisible()

    // Loading it must not error or remove it from the list.
    await presetRow.getByTitle('Load', { exact: true }).click()
    await expect(presetRow).toBeVisible()

    // Deleting it removes the row and re-hides the "Saved layouts" section.
    await presetRow.getByTitle('Delete', { exact: true }).click()
    await expect(page.getByText('My Preset')).not.toBeVisible()
    await expect(page.getByText('Saved layouts')).not.toBeVisible()
  })
})
