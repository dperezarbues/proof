import { expect, test } from '@playwright/test'
import { COMPILE_TIMEOUT, openEditor } from './helpers'

// Regression: deleteCv() never touched previewPdf, so deleting the CV
// currently on screen left its rendered PDF (a blob URL, holding the
// now-deleted person's data) visible indefinitely — for a privacy-first app,
// "delete" silently not deleting the visible output is the worst class of bug.
test.describe('Deleting a CV clears its preview', () => {
  test('deleting the only CV reverts the preview to the sample', async ({ page }) => {
    test.setTimeout(COMPILE_TIMEOUT + 20_000)
    await openEditor(page)

    await page.getByTitle('New CV').click()
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Delete Me CV')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Delete Me CV' })).toBeVisible()
    await expect(page.getByText('Generating PDF…')).not.toBeVisible({ timeout: COMPILE_TIMEOUT })

    const viewer = page.locator('[data-testid="pdfjs-viewer"]')
    await expect(viewer).toHaveAttribute('data-pdf-src', /^blob:/)

    const deleteRow = page.locator('div.group', { hasText: 'Delete Me CV' })
    await deleteRow.hover()
    await deleteRow.getByTitle('Delete').click()

    await expect(page.getByRole('button', { name: 'Delete Me CV' })).not.toBeVisible()
    await expect(viewer).toHaveAttribute('data-pdf-src', /\.pdf$/)
    await expect(page.getByText('No CV loaded')).toBeVisible()
  })

  test('deleting a non-active CV does not disturb the active preview', async ({ page }) => {
    test.setTimeout(COMPILE_TIMEOUT * 2 + 20_000)
    await openEditor(page)

    await page.getByTitle('New CV').click()
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Keep This CV')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Keep This CV' })).toBeVisible()
    await expect(page.getByText('Generating PDF…')).not.toBeVisible({ timeout: COMPILE_TIMEOUT })

    await page.getByTitle('New CV').click()
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Delete This CV')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Delete This CV' })).toBeVisible()

    // Switch back to the first CV so it's the active one on screen.
    await page.getByRole('button', { name: 'Keep This CV' }).click()
    await expect(page.getByText('Generating PDF…')).not.toBeVisible({ timeout: COMPILE_TIMEOUT })
    const viewer = page.locator('[data-testid="pdfjs-viewer"]')
    const activeSrc = await viewer.getAttribute('data-pdf-src')
    expect(activeSrc).toMatch(/^blob:/)

    const deleteRow = page.locator('div.group', { hasText: 'Delete This CV' })
    await deleteRow.hover()
    await deleteRow.getByTitle('Delete').click()

    await expect(page.getByRole('button', { name: 'Delete This CV' })).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Keep This CV' })).toBeVisible()
    // The still-active CV's preview must be untouched.
    await expect(viewer).toHaveAttribute('data-pdf-src', activeSrc ?? '')
  })
})
