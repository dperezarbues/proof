import { expect, test } from '@playwright/test'
import { openEditor } from './helpers'

// Regression: setItem silently swallowed a QuotaExceededError (only a
// dev-only console.warn), so a save that failed because storage was full
// looked identical to a successful one — the modal closed and the CV
// appeared to have saved, but nothing was actually persisted and it would
// vanish on the next reload with zero indication anything went wrong.
test.describe('CV save — storage quota exceeded', () => {
  test('a failed save due to full storage surfaces an error and keeps the modal open', async ({
    page,
  }) => {
    await openEditor(page)

    // Simulate a full localStorage by making the CV-list write throw the same
    // exception a real quota-exceeded browser produces.
    await page.evaluate(() => {
      const orig = Storage.prototype.setItem
      Storage.prototype.setItem = function (key: string, value: string) {
        if (key === 'proof-cvs') {
          throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
        }
        return orig.call(this, key, value)
      }
    })

    await page.getByTitle('New CV').click()
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Quota Test CV')
    await page.getByRole('button', { name: 'Save', exact: true }).click()

    // The modal must stay open with a visible error — not close as if the save worked.
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText(/storage is full|unavailable/i)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Quota Test CV' })).not.toBeVisible()
  })
})
