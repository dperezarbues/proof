import { expect, test } from '@playwright/test'
import { openEditor } from './helpers'

// Regression: switching templates resets previewPdf to null (so PdfPreview
// shows the sample banner for the new template) in the same render pass
// that unmounts/remounts EditorShell (and everything under it: useLayoutEditor,
// useCompiler). PdfJsViewer itself is NOT remounted — it just receives a new
// `src` prop — so its internal renderState (still 'ready' from the PREVIOUS
// template's compiled PDF) doesn't reflect that src has changed until its own
// effect runs. Every effect in the remount chain (persisting the restored
// layout, useCompiler's several setup effects, then finally the one that
// calls generate() and flips isGenerating true) has to run before anything
// covers the screen — a real, occasionally-visible window (worse under load,
// matching user reports of "if you play around for a while") where the sample
// banner for the NEW template renders on top of the OLD template's still-visible
// compiled canvas.
test.describe('Template switch does not flash stale content', () => {
  test('the loading cover appears in the same render the src changes, before any compile effect runs', async ({
    page,
  }) => {
    test.setTimeout(60_000)
    await openEditor(page)
    await page.getByTitle('New CV').click()
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Stale Flash CV')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Stale Flash CV' })).toBeVisible()

    await page.getByRole('button', { name: 'Generate PDF' }).first().click()
    await expect(page.getByText('Generating PDF…')).not.toBeVisible({ timeout: 60_000 })

    const viewer = page.locator('[data-testid="pdfjs-viewer"]')
    const srcBefore = await viewer.getAttribute('data-pdf-src')
    expect(srcBefore).toMatch(/^blob:/)

    // Slow the whole compile chain way down so the switch's async effect
    // chain (mount effects -> generate() -> isGenerating flips true) takes
    // long enough to sample reliably, instead of racing a sub-frame gap.
    // A network-route delay on the WASM fetch doesn't work here — the
    // compiler module loads once, eagerly, before this test's first
    // Generate PDF click even runs, so nothing refetches it on the second
    // (template-switch-triggered) compile; a route handler registered here
    // never fires. CPU throttling via CDP slows the actual compile
    // computation instead, which applies regardless of caching.
    const client = await page.context().newCDPSession(page)
    await client.send('Emulation.setCPUThrottlingRate', { rate: 20 })

    await page.getByRole('tab', { name: /Template/i }).click()
    await page.getByTestId('template-btn-modern').click()

    // Sample continuously across the whole transition window: whenever the
    // pdf-src has already changed away from the old real PDF (i.e. we're
    // mid-switch), the loading cover must be up — the old canvas must never
    // be left uncovered just because isGenerating/renderState haven't caught
    // up to the prop change yet.
    const deadline = Date.now() + 2500
    let sampledMidSwitch = false
    while (Date.now() < deadline) {
      const pdfSrc = await viewer.getAttribute('data-pdf-src').catch(() => null)
      if (pdfSrc !== null && pdfSrc !== srcBefore) {
        sampledMidSwitch = true
        const renderedSrc = await viewer.getAttribute('data-rendered-src')
        if (pdfSrc !== renderedSrc) {
          await expect(page.getByTestId('pdfjs-loading-cover')).toBeVisible()
        }
      }
      await page.waitForTimeout(10)
    }
    await client.send('Emulation.setCPUThrottlingRate', { rate: 1 })
    expect(sampledMidSwitch).toBe(true)
  })
})
