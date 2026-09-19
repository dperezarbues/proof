import { expect, type Page, test } from '@playwright/test'
import { openEditor } from './helpers'

// Regression: toggling private mode moves data wholesale between localStorage
// and sessionStorage. Flipping it on with existing CVs silently moves them
// into storage that vanishes the instant this tab closes; flipping it off
// silently persists them to disk, which is the wrong outcome on a shared
// computer. Both were one unconfirmed checkbox click away from losing or
// exposing someone's CV data.
async function reopenOnboarding(page: Page) {
  await page.getByTitle('Help').click()
  await expect(page.getByRole('dialog')).toBeVisible()
}

test.describe('Private mode toggle confirmation', () => {
  test('enabling private mode with existing CVs asks for confirmation, and cancelling leaves it off', async ({
    page,
  }) => {
    await openEditor(page)
    await page.getByTitle('New CV').click()
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Private Toggle CV')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Private Toggle CV' })).toBeVisible()

    await reopenOnboarding(page)

    let dialogSeen = false
    page.once('dialog', (dialog) => {
      dialogSeen = true
      expect(dialog.message()).toMatch(/temporary storage|deleted/i)
      dialog.dismiss()
    })
    await page.locator('#private-mode-toggle').click()
    expect(dialogSeen).toBe(true)

    // Cancelling must leave the checkbox — and actual private mode — unchanged.
    await expect(page.locator('#private-mode-toggle')).not.toBeChecked()
    await page.getByRole('button', { name: 'Get started' }).click()
    await expect(page.getByText('Private', { exact: true })).not.toBeVisible()
  })

  test('confirming enables private mode', async ({ page }) => {
    await openEditor(page)
    await page.getByTitle('New CV').click()
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Private Toggle CV 2')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Private Toggle CV 2' })).toBeVisible()

    await reopenOnboarding(page)

    page.once('dialog', (dialog) => dialog.accept())
    await page.locator('#private-mode-toggle').click()
    await expect(page.locator('#private-mode-toggle')).toBeChecked()
    await page.getByRole('button', { name: 'Get started' }).click()
    await expect(page.getByText('Private', { exact: true })).toBeVisible()
  })

  test('toggling with no CVs saved yet does not prompt for confirmation', async ({ page }) => {
    await openEditor(page)
    await reopenOnboarding(page)

    let dialogSeen = false
    page.once('dialog', () => {
      dialogSeen = true
    })
    await page.locator('#private-mode-toggle').click()
    await expect(page.locator('#private-mode-toggle')).toBeChecked()
    expect(dialogSeen).toBe(false)
  })
})
