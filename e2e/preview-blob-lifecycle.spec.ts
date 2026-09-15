import { expect, test } from '@playwright/test'
import { COMPILE_TIMEOUT, openEditor } from './helpers'

// Regression coverage: previewPdf used to be reset directly at several call
// sites (clear data, template switch, layout switch, reset) without revoking
// the outgoing blob URL — only the onPdfChange path did. Every one of those
// leaked a full PDF blob for the tab's lifetime. All resets now go through a
// single replacePreviewPdf() helper that always revokes; this spies on
// URL.revokeObjectURL (injected before the app's own JS runs) to prove it.
async function installRevokeSpy(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    ;(window as unknown as { __revoked: string[] }).__revoked = []
    const original = URL.revokeObjectURL.bind(URL)
    URL.revokeObjectURL = (url: string) => {
      ;(window as unknown as { __revoked: string[] }).__revoked.push(url)
      return original(url)
    }
  })
}

async function getRevoked(page: import('@playwright/test').Page): Promise<string[]> {
  return page.evaluate(() => (window as unknown as { __revoked: string[] }).__revoked)
}

test.describe('Preview PDF blob lifecycle', () => {
  test('switching template revokes the previous blob URL', async ({ page }) => {
    test.setTimeout(COMPILE_TIMEOUT + 20_000)
    await installRevokeSpy(page)
    await openEditor(page)

    await page.getByTitle('New CV').click()
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Blob Leak CV')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Blob Leak CV' })).toBeVisible()
    await expect(page.getByText('Generating PDF…')).not.toBeVisible({ timeout: COMPILE_TIMEOUT })

    const viewer = page.locator('[data-testid="pdfjs-viewer"]')
    const blobSrc = await viewer.getAttribute('data-pdf-src')
    expect(blobSrc).toMatch(/^blob:/)

    await page.getByRole('tab', { name: /Template/i }).click()
    await page.getByTestId('template-btn-modern').click()

    await expect(async () => {
      expect(await getRevoked(page)).toContain(blobSrc)
    }).toPass({ timeout: 2_000 })
  })

  test('Reset revokes the previous blob URL', async ({ page }) => {
    test.setTimeout(COMPILE_TIMEOUT + 20_000)
    await installRevokeSpy(page)
    await openEditor(page)

    await page.getByTitle('New CV').click()
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Blob Leak Reset CV')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Blob Leak Reset CV' })).toBeVisible()
    await expect(page.getByText('Generating PDF…')).not.toBeVisible({ timeout: COMPILE_TIMEOUT })

    const viewer = page.locator('[data-testid="pdfjs-viewer"]')
    const blobSrc = await viewer.getAttribute('data-pdf-src')
    expect(blobSrc).toMatch(/^blob:/)

    await page.getByRole('button', { name: 'Reset', exact: true }).click()

    expect(await getRevoked(page)).toContain(blobSrc)
  })
})
