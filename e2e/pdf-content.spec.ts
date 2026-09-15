/**
 * Verifies that configured style params are actually applied in the rendered PDF —
 * not just that a new compilation was triggered.
 *
 * Colors       → pdfjs getOperatorList() scans fill-colour operators in the compiled PDF blob.
 * Font sizes   → before/after comparison of text-layer span inline fontSize style.
 * Font family  → NOT tested here.  Only "New Computer Modern" fonts are bundled in
 *                /public/fonts/, so all font-family options produce identical output.
 *                The recompile trigger is already verified in style-shared-params.spec.ts.
 *
 * The test CV uses cv.starter.json placeholder content so we have predictable
 * text to target: "Your Name" (heading), "Your professional summary." (body),
 * "2020 – Present" (muted / period), "Job Title" (entry title).
 */

import { inflateRawSync, inflateSync } from 'node:zlib'
import { expect, type Locator, type Page, test } from '@playwright/test'
import {
  COMPILE_TIMEOUT,
  expandGroup,
  openEditor,
  openStyleTab,
  setColor,
  setRange,
  waitForNewPdf,
} from './helpers'

// ── setup ─────────────────────────────────────────────────────────────────────

/** Create a CV (uses cv.starter.json content), generate a PDF, wait for render. */
async function setupWithPdf(page: Page): Promise<string> {
  await page.getByTitle('New CV').click()
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Content Test CV')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Content Test CV' })).toBeVisible()
  await page.getByRole('tab', { name: /Layout/i }).click()
  await page.getByRole('button', { name: 'Generate PDF' }).first().click()
  await expect(page.getByText('Generating PDF…')).not.toBeVisible({ timeout: COMPILE_TIMEOUT })
  const viewer = page.locator('[data-testid="pdfjs-viewer"]')
  const src = await viewer.getAttribute('data-pdf-src')
  if (!src) throw new Error('data-pdf-src attribute not found after initial compile')
  expect(src).toMatch(/^blob:/)
  await expect(viewer).toHaveAttribute('data-render-state', 'ready', { timeout: 15_000 })
  return src
}

// ── content helpers ───────────────────────────────────────────────────────────

/**
 * Scans every `r g b scn` / `r g b rg` fill-colour operator in the compiled PDF and returns
 * the one where `channel` most dominates the other two.
 *
 * Approach: fetch the blob in the browser (only place a blob: URL is accessible),
 * return as base64, then decompress PDF FlateDecode content streams in Node.js
 * using node:zlib and regex-scan for the `rg` PDF operator.  This avoids any
 * pdfjs dependency in the evaluate context — bare npm specifiers can't be
 * resolved inside page.evaluate.
 */
async function pdfDominantFillColor(
  page: Page,
  channel: 'r' | 'g' | 'b',
): Promise<{ r: number; g: number; b: number }> {
  const src = await page
    .locator('[data-testid="pdfjs-viewer"]')
    .getAttribute('data-pdf-src')
  if (!src) throw new Error('data-pdf-src not found on viewer')

  // Transfer PDF bytes from browser to Node.js as base64.
  const base64: string = await page.evaluate(async (blobUrl) => {
    const buf = await (await fetch(blobUrl)).arrayBuffer()
    const bytes = new Uint8Array(buf)
    let binary = ''
    const CHUNK = 8192
    for (let i = 0; i < bytes.length; i += CHUNK) {
      binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + CHUNK, bytes.length)))
    }
    return btoa(binary)
  }, src)

  const pdfBytes = Buffer.from(base64, 'base64')

  // Scan all FlateDecode content streams for DeviceRGB fill colour operators.
  // Typst uses `scn` (after setting /DeviceRGB color space); `rg` is kept as fallback.
  const RG_PATTERN = /([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+(?:scn|rg)/g
  const STREAM_LF = Buffer.from('stream\n')
  const STREAM_CRLF = Buffer.from('stream\r\n')
  const ENDSTREAM = Buffer.from('endstream')

  let best = { r: 255, g: 255, b: 255, dom: -999 }
  let pos = 0

  while (pos < pdfBytes.length) {
    const i1 = pdfBytes.indexOf(STREAM_LF, pos)
    const i2 = pdfBytes.indexOf(STREAM_CRLF, pos)
    if (i1 === -1 && i2 === -1) break

    let dataStart: number
    if (i1 !== -1 && (i2 === -1 || i1 <= i2)) {
      dataStart = i1 + STREAM_LF.length
      pos = i1 + 1
    } else {
      dataStart = i2 + STREAM_CRLF.length
      pos = i2 + 1
    }

    const endIdx = pdfBytes.indexOf(ENDSTREAM, dataStart)
    if (endIdx === -1) break

    const raw = pdfBytes.subarray(dataStart, endIdx)
    let text: string
    try {
      text = inflateSync(raw).toString('latin1')
    } catch {
      try { text = inflateRawSync(raw).toString('latin1') } catch { continue }
    }

    RG_PATTERN.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = RG_PATTERN.exec(text)) !== null) {
      const r = Math.round(parseFloat(m[1]) * 255)
      const g = Math.round(parseFloat(m[2]) * 255)
      const b = Math.round(parseFloat(m[3]) * 255)
      const dom =
        channel === 'r' ? r - Math.max(g, b) : channel === 'g' ? g - Math.max(r, b) : b - Math.max(r, g)
      if (dom > best.dom) best = { r, g, b, dom }
    }
  }

  return { r: best.r, g: best.g, b: best.b }
}

/**
 * Extracts the numeric size from a text-layer span's inline fontSize style.
 * PDF.js sets it as `calc(var(--scale-factor)*Xpx)` where X approximates the
 * original font size in points.
 *
 * Throws (rather than returning 0) when the format is not recognised so that a
 * PDF.js API change surfaces as an explicit test failure rather than a vacuous
 * assertion (largeSize > 0 * ratio is always true for any positive largeSize).
 */
async function getSpanFontSizePx(span: Locator): Promise<number> {
  return span.evaluate((el: HTMLElement) => {
    // pdfjs v6 sets --font-height inline (PDF pt value labelled as px); v4 set fontSize directly
    const val = el.style.getPropertyValue('--font-height') || el.style.fontSize
    const match = val.match(/([\d.]+)/)
    if (!match) throw new Error(`unexpected fontSize: fontSize="${el.style.fontSize}" --font-height="${val}"`)
    return parseFloat(match[1])
  })
}

function textLayerSpan(page: Page, pattern: string | RegExp): Locator {
  return page
    .locator('[data-testid="pdfjs-viewer"] .textLayer span')
    .filter({ hasText: pattern })
    .first()
}

/**
 * Counts how many text-layer spans have a font size within ±tol of targetPt.
 *
 * Useful for verifying font-size params whose text content may be split into
 * individual character spans (e.g. section headings rendered with heavy
 * letter-tracking) so the full word cannot be matched by a text filter.
 */
async function countSpansAtSize(page: Page, targetPt: number, tol = 0.3): Promise<number> {
  return page.evaluate(
    ({ target, tolerance }) =>
      Array.from(document.querySelectorAll('[data-testid="pdfjs-viewer"] .textLayer span'))
        .filter((el) => {
          const htmlEl = el as HTMLElement
          // pdfjs v6: --font-height stores the PDF pt value; v4: fontSize inline style
          const val = htmlEl.style.getPropertyValue('--font-height') || htmlEl.style.fontSize
          const match = val.match(/([\d.]+)/)
          return match ? Math.abs(parseFloat(match[1]) - target) <= tolerance : false
        }).length,
    { target: targetPt, tolerance: tol },
  )
}

// ── color tests ───────────────────────────────────────────────────────────────

test.describe('PDF content — colours', () => {
  test.beforeEach(async ({ page }) => { await openEditor(page) })

  test('heading colour is applied to the rendered name', async ({ page }) => {
    test.setTimeout(COMPILE_TIMEOUT * 2 + 20_000)
    const old = await setupWithPdf(page)
    await openStyleTab(page)
    await expandGroup(page, 'Colors')
    // #cc0000 = rgb(204, 0, 0) — vivid red, unambiguously distinguishable from the
    // dark-grey defaults regardless of anti-aliasing.
    await setColor(page, 'heading_color', '#cc0000')
    await waitForNewPdf(page, old)

    await expect(async () => {
      const { r, g, b } = await pdfDominantFillColor(page, 'r')
      const label = `rgb(${r},${g},${b})`
      expect(r, `red dominant for #cc0000: ${label}`).toBeGreaterThan(g + 10)
      expect(r, `red dominant for #cc0000: ${label}`).toBeGreaterThan(b + 10)
    }).toPass({ timeout: COMPILE_TIMEOUT, intervals: [1000] })
  })

  test('body colour is applied to body text', async ({ page }) => {
    test.setTimeout(COMPILE_TIMEOUT * 2 + 20_000)
    const old = await setupWithPdf(page)
    await openStyleTab(page)
    await expandGroup(page, 'Colors')
    // #0000cc = rgb(0, 0, 204) — vivid blue
    await setColor(page, 'body_color', '#0000cc')
    await waitForNewPdf(page, old)

    await expect(async () => {
      const { r, g, b } = await pdfDominantFillColor(page, 'b')
      const label = `rgb(${r},${g},${b})`
      expect(b, `blue dominant for #0000cc: ${label}`).toBeGreaterThan(r + 10)
      expect(b, `blue dominant for #0000cc: ${label}`).toBeGreaterThan(g + 10)
    }).toPass({ timeout: COMPILE_TIMEOUT, intervals: [1000] })
  })

  test('muted colour is applied to period / meta text', async ({ page }) => {
    test.setTimeout(COMPILE_TIMEOUT * 2 + 20_000)
    const old = await setupWithPdf(page)
    await openStyleTab(page)
    await expandGroup(page, 'Colors')
    // #009900 = rgb(0, 153, 0) — vivid green.  Max channel value is 153 (lower than
    // red/blue options) so muted-colour text is thinner and more heavily anti-aliased;
    // use a wider dominance margin (+20) for robustness.
    await setColor(page, 'muted_color', '#009900')
    await waitForNewPdf(page, old)

    await expect(async () => {
      const { r, g, b } = await pdfDominantFillColor(page, 'g')
      const label = `rgb(${r},${g},${b})`
      expect(g, `green dominant for #009900: ${label}`).toBeGreaterThan(r + 20)
      expect(g, `green dominant for #009900: ${label}`).toBeGreaterThan(b + 20)
    }).toPass({ timeout: COMPILE_TIMEOUT, intervals: [1000] })
  })
})

// ── font-size tests ───────────────────────────────────────────────────────────

test.describe('PDF content — font sizes', () => {
  test.beforeEach(async ({ page }) => { await openEditor(page) })

  test('name size change is reflected in the rendered name span', async ({ page }) => {
    test.setTimeout(COMPILE_TIMEOUT * 2 + 20_000)
    const old = await setupWithPdf(page)

    // Measure at the DEFAULT size (17 pt).
    const span = textLayerSpan(page, /Your Name/)
    await expect(span).toBeVisible()
    const defaultSize = await getSpanFontSizePx(span)

    // Change to maximum (24 pt) — a ~41 % increase.
    await openStyleTab(page)
    await expandGroup(page, 'Typography')
    await setRange(page, 'name_size', 24)
    await waitForNewPdf(page, old)

    await expect(async () => {
      const span = textLayerSpan(page, /Your Name/)
      await expect(span).toBeVisible()
      const largeSize = await getSpanFontSizePx(span)
      expect(largeSize).toBeGreaterThan(defaultSize * 1.25)
    }).toPass({ timeout: COMPILE_TIMEOUT, intervals: [500] })
  })

  test('body text size change is reflected in summary text span', async ({ page }) => {
    test.setTimeout(COMPILE_TIMEOUT * 2 + 20_000)
    const old = await setupWithPdf(page)

    const span = textLayerSpan(page, /Your professional summary/)
    await expect(span).toBeVisible()
    const defaultSize = await getSpanFontSizePx(span)

    // Change from default 8.5 pt to maximum 11 pt — a ~29 % increase.
    await openStyleTab(page)
    await expandGroup(page, 'Typography')
    await setRange(page, 'body_size', 11)
    await waitForNewPdf(page, old)

    await expect(async () => {
      const span = textLayerSpan(page, /Your professional summary/)
      await expect(span).toBeVisible()
      const largeSize = await getSpanFontSizePx(span)
      expect(largeSize).toBeGreaterThan(defaultSize * 1.20)
    }).toPass({ timeout: COMPILE_TIMEOUT, intervals: [500] })
  })

  test('entry title size change is reflected in the job title span', async ({ page }) => {
    test.setTimeout(COMPILE_TIMEOUT * 2 + 20_000)
    const old = await setupWithPdf(page)

    // "Job Title" from the starter experience entry.
    const span = textLayerSpan(page, /Job Title/)
    await expect(span).toBeVisible()
    const defaultSize = await getSpanFontSizePx(span)

    // Change from default 9.5 pt to maximum 12 pt — a ~26 % increase.
    await openStyleTab(page)
    await expandGroup(page, 'Typography')
    await setRange(page, 'entry_size', 12)
    await waitForNewPdf(page, old)

    await expect(async () => {
      const span = textLayerSpan(page, /Job Title/)
      await expect(span).toBeVisible()
      const largeSize = await getSpanFontSizePx(span)
      expect(largeSize).toBeGreaterThan(defaultSize * 1.20)
    }).toPass({ timeout: COMPILE_TIMEOUT, intervals: [500] })
  })

  test('section label size change is reflected in the section heading spans', async ({ page }) => {
    test.setTimeout(COMPILE_TIMEOUT * 2 + 20_000)
    const old = await setupWithPdf(page)

    // Section headings use fs-xs = section_heading_size = 7.5 pt (default).
    // This size is unique in the layout:
    //   fs-2xl 17 pt | fs-xl ~10 pt | fs-lg 9.5 pt | fs-md 8.5 pt | fs-sm 8.0 pt |
    //   fs-xs 7.5 pt ← section headings | fs-2xs 6.5 pt
    // Typst applies heavy letter-tracking to section headings, which typically
    // splits the text across individual character spans in PDF.js.  We count
    // spans by font size rather than by text content to avoid that brittle match.
    const beforeCount = await countSpansAtSize(page, 7.5)
    expect(beforeCount, 'section heading spans should exist at default 7.5 pt').toBeGreaterThan(0)

    // Change to maximum 10 pt — a ~33 % increase.
    await openStyleTab(page)
    await expandGroup(page, 'Typography')
    await setRange(page, 'section_heading_size', 10)
    await waitForNewPdf(page, old)

    await expect(async () => {
      const afterAt10 = await countSpansAtSize(page, 10)
      expect(afterAt10, 'section heading spans should exist at new 10 pt').toBeGreaterThan(0)
      const afterAt7_5 = await countSpansAtSize(page, 7.5)
      expect(afterAt7_5, 'no spans should remain at old 7.5 pt').toBe(0)
    }).toPass({ timeout: COMPILE_TIMEOUT, intervals: [500] })
  })
})
