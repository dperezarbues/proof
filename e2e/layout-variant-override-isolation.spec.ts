import { expect, test } from '@playwright/test'
import { openEditor } from './helpers'

// Regression: layout overrides auto-persist on every edit (not just an explicit
// save), scoped only by templateId — not by which layout VARIANT was active.
// The "default" template has three structurally different base layouts (Split:
// a 2-col "education + certifications" group; Classic: those same sections
// flattened full-width; Alt: a 2-col "education + skills" group). Customizing
// anything while on one variant persisted an override under the templateId
// alone, so switching to a different variant of the SAME template reloaded
// that override instead of the variant's own JSON — silently discarding
// whichever variant should actually be in effect. From the user's perspective,
// clicking Split/Classic/Alt appeared to do nothing once any edit had been made.
test.describe('Layout overrides do not bleed across layout variants', () => {
  test('editing one variant does not corrupt a different variant of the same template', async ({
    page,
  }) => {
    test.setTimeout(60_000)
    await openEditor(page)
    await page.getByTitle('New CV').click()
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Variant Isolation CV')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Variant Isolation CV' })).toBeVisible()

    // Default template's default layout ("Split") starts active. Make an edit
    // to it — this triggers the auto-persist effect under templateId "default".
    await page.getByRole('tab', { name: /Layout/i }).click()
    const sectionList = page.getByTestId('section-list')
    await expect(sectionList.getByText('2-col group')).toBeVisible()
    const firstBreakCheckbox = sectionList.locator('input[type="checkbox"]').first()
    await firstBreakCheckbox.click()

    // Switch to the Classic variant of the SAME template — a genuinely
    // different base structure (no 2-col group; Education/Certifications are
    // separate full-width sections).
    await page.getByRole('tab', { name: /Template/i }).click()
    await page.getByTestId('layout-btn-classic').click()
    await page.getByRole('tab', { name: /Layout/i }).click()

    // Classic's own structure must be showing — not Split's overridden shape.
    await expect(sectionList.getByText('2-col group')).not.toBeVisible()
    await expect(sectionList.getByText('Education')).toBeVisible()
    await expect(sectionList.getByText('Certifications')).toBeVisible()

    // Switching back to Split must restore ITS own (edited) structure too —
    // proving both variants keep independent, correctly-scoped overrides.
    await page.getByRole('tab', { name: /Template/i }).click()
    await page.getByTestId('layout-btn-default').click()
    await page.getByRole('tab', { name: /Layout/i }).click()
    await expect(sectionList.getByText('2-col group')).toBeVisible()
  })
})
