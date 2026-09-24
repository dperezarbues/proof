/**
 * Shared Playwright helpers for the Proof e2e suite.
 *
 * Extracted from the individual spec files to eliminate copy-paste duplication
 * across style-shared-params, style-template-params, layout-options, and
 * pdf-content specs.
 */

import { expect, type Page } from '@playwright/test'

export const COMPILE_TIMEOUT = 60_000

export async function openEditor(page: Page) {
  await page.goto('/en/editor')
  await page.evaluate(() => {
    localStorage.setItem('proof-onboarded', '1')
    // Simulates a returning visitor who already answered the shared-computer
    // question in an earlier tab — otherwise every spec's first New/Import
    // click here would hit SharedComputerPrompt, which only
    // shared-computer-prompt.spec.ts is meant to exercise.
    sessionStorage.setItem('proof-storage-choice-made', '1')
  })
  await page.reload()
  await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' })
}

/**
 * Waits for a new PDF blob to appear AND for the viewer to finish rendering it.
 *
 * Uses `data-rendered-src` (set by PdfJsViewer after replaceChildren completes)
 * rather than `data-render-state` to avoid a React render-cycle race where
 * `data-pdf-src` updates one cycle before the effect sets render-state to
 * 'loading' — causing a stale 'ready' check to succeed prematurely.
 */
export async function waitForNewPdf(page: Page, oldSrc: string) {
  const viewer = page.locator('[data-testid="pdfjs-viewer"]')
  await expect(async () => {
    const src = await viewer.getAttribute('data-pdf-src')
    expect(src).toMatch(/^blob:/)
    expect(src).not.toEqual(oldSrc)
    // data-rendered-src is only set after replaceChildren — guarantees the new
    // text layer is in the DOM when this predicate succeeds.
    await expect(viewer).toHaveAttribute('data-rendered-src', src!, { timeout: 100 })
  }).toPass({ timeout: COMPILE_TIMEOUT + 20_000, intervals: [500] })
}

/**
 * Waits for data-pdf-src to be a blob AND stay unchanged across two
 * consecutive checks — a single check can land between two chained
 * compiles (every fresh EditorShell mount runs one immediately followed by
 * a queued retry, see useCompiler's pendingRef), so a bare blob check can
 * return a value that's about to be superseded a few ms later.
 */
export async function waitForSettledSrc(page: Page): Promise<string> {
  const viewer = page.locator('[data-testid="pdfjs-viewer"]')
  await expect(viewer).toHaveAttribute('data-pdf-src', /^blob:/, { timeout: COMPILE_TIMEOUT })
  let lastSeen: string | null = null
  await expect(async () => {
    const src = await viewer.getAttribute('data-pdf-src')
    expect(src).toMatch(/^blob:/)
    const unchanged = src === lastSeen
    lastSeen = src
    expect(unchanged).toBe(true)
  }).toPass({ timeout: COMPILE_TIMEOUT, intervals: [300] })
  if (!lastSeen) throw new Error('unreachable: toPass only resolves once lastSeen is a blob src')
  return lastSeen
}

export async function setRange(page: Page, id: string, value: number) {
  await page.locator(`input#${id}`).evaluate((el: HTMLInputElement, v) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    setter.call(el, String(v))
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }, value)
}

export async function setColor(page: Page, id: string, hex: string) {
  await page.locator(`input#${id}`).evaluate((el: HTMLInputElement, v) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    setter.call(el, v)
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
  }, hex)
}

/**
 * Opens a named style accordion group if it is collapsed.
 *
 * Checks whether the toggle button currently shows ▲ (open) or ▼ (closed)
 * and clicks only when needed.  After the call, asserts the group IS open so
 * the test fails immediately with a clear message rather than silently no-oping
 * and timing out 60 s later on a hidden input.
 */
export async function expandGroup(page: Page, title: string) {
  const grpBtn = page.locator('button').filter({ hasText: title }).first()
  const text = await grpBtn.textContent({ timeout: 5_000 })
  if (!text?.includes('▲')) await grpBtn.click()
  await expect(grpBtn).toContainText('▲')
}

export async function openStyleTab(page: Page) {
  await page.getByRole('tab', { name: /Style/i }).click()
}

/** Opens the Style tab and expands the named accordion group if it is collapsed. */
export async function openStyleGroup(page: Page, group: string) {
  await openStyleTab(page)
  await expandGroup(page, group)
}
