import { expect, test } from '@playwright/test'
import { openEditor } from './helpers'

// Regression: persistLayoutOverride/persistStyleOverride correctly report success/failure
// (mutateStored), but every call site (the layout-change autosave effect, setStyleValue,
// resetStyle) discarded that return value — so a quota-exceeded failure while dragging a
// section or nudging a style slider failed completely silently, unlike an explicit CV save
// or named-preset save, which do surface an error. Same bug class, one layer up: the write
// now reports failure correctly, but nothing consumed that report until this fix.
test.describe('Layout/style autosave — storage quota exceeded', () => {
  test('a failed layout autosave surfaces an inline warning', async ({ page }) => {
    await openEditor(page)
    await page.getByTitle('New CV').click()
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Autosave Quota CV')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Autosave Quota CV' })).toBeVisible()
    await page.getByRole('tab', { name: /Layout/i }).click()

    await page.evaluate(() => {
      const orig = Storage.prototype.setItem
      Storage.prototype.setItem = function (key: string, value: string) {
        if (key === 'proof-layout-overrides') {
          throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
        }
        return orig.call(this, key, value)
      }
    })

    await expect(page.getByTestId('autosave-error')).not.toBeVisible()
    await page.getByRole('button', { name: 'stacked', exact: true }).click()
    await expect(page.getByTestId('autosave-error')).toBeVisible()
  })

  test('a failed style autosave surfaces the same inline warning', async ({ page }) => {
    await openEditor(page)
    await page.getByTitle('New CV').click()
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Autosave Style Quota CV')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Autosave Style Quota CV' })).toBeVisible()

    await page.evaluate(() => {
      const orig = Storage.prototype.setItem
      Storage.prototype.setItem = function (key: string, value: string) {
        if (key === 'proof-style-overrides') {
          throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
        }
        return orig.call(this, key, value)
      }
    })

    await page.getByRole('tab', { name: /Style/i }).click()
    const firstRange = page.locator('input[type="range"]').first()
    await firstRange.evaluate((el: HTMLInputElement) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
      setter.call(el, String(Number(el.max) || Number(el.value) + 1))
      el.dispatchEvent(new Event('input', { bubbles: true }))
    })

    await expect(page.getByTestId('autosave-error')).toBeVisible()
  })
})
