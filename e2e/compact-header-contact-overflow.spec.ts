import { expect, test } from '@playwright/test'
import { COMPILE_TIMEOUT, openEditor } from './helpers'

// Regression: compact.typ's header put name+headline in a `1fr` grid column
// beside a contact-info column sized `auto` — and joined every contact entry
// onto one unbroken inline line ("a · b · c · d · e · f"). Typst sizes an
// `auto` column to its content's natural (unwrapped) width, so with several
// contact methods that column ballooned and crushed the name/headline column
// down to a sliver, wrapping the name across multiple lines character-by-
// character. Every other template either keeps contact on its own line below
// the name (no competing column) or — like default.typ, the only other
// template using this same adjacent-auto-column structure — stacks contact
// entries one per line, bounding the column to the single longest entry
// instead of the sum of all of them.
test.describe('Compact template header does not collapse with several contact entries', () => {
  test('the name renders on one line even with 6 contact methods', async ({ page }) => {
    test.setTimeout(60_000)
    await openEditor(page)

    const cv = {
      identity: {
        name: 'David Pérez Arbués',
        headline: 'Engineering Lead · adidas Digital Experiences (DXP)',
        contact: [
          { type: 'location', key: '', value: 'Zaragoza, Aragón, Spain' },
          { type: 'email', key: '', value: 'dperezarbues@gmail.com' },
          { type: 'phone', key: '', value: '+34 625 039 023' },
          { type: 'linkedin', key: '', value: 'linkedin.com/in/dperezarbues' },
          { type: 'github', key: '', value: 'github.com/dperezarbues' },
          { type: 'web', key: '', value: 'medium.com/@dperezarbues' },
        ],
      },
      summary: 'Engineering leader with 15+ years of experience.',
    }
    await page.evaluate((content) => {
      localStorage.setItem(
        'proof-cvs',
        JSON.stringify([
          { id: '6c', name: '6 Contacts CV', content: JSON.stringify(content), updatedAt: Date.now() },
        ]),
      )
      localStorage.setItem('proof-current-cv', '6c')
    }, cv)
    await page.reload()
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' })

    await page.getByRole('tab', { name: /Template/i }).click()
    await page.getByTestId('template-btn-compact').click()
    await page.getByRole('button', { name: 'Generate PDF' }).first().click()
    await expect(page.getByText('Generating PDF…')).not.toBeVisible({ timeout: COMPILE_TIMEOUT })

    const viewer = page.locator('[data-testid="pdfjs-viewer"]')
    await expect(viewer).toHaveAttribute('data-render-state', 'ready', { timeout: 15_000 })

    // "David" and "Arbués" (first and last word of the name) must sit on the
    // same text-layer line. If the name column got crushed, Typst wraps the
    // name across several lines and these words end up at different heights.
    const firstWord = viewer.locator('.textLayer span', { hasText: 'David' }).first()
    const lastWord = viewer.locator('.textLayer span', { hasText: 'Arbués' }).first()
    await expect(firstWord).toBeVisible()
    await expect(lastWord).toBeVisible()

    const firstBox = await firstWord.boundingBox()
    const lastBox = await lastWord.boundingBox()
    expect(firstBox).not.toBeNull()
    expect(lastBox).not.toBeNull()
    // Same line: vertical centers within a couple of px of each other.
    const firstCenterY = firstBox!.y + firstBox!.height / 2
    const lastCenterY = lastBox!.y + lastBox!.height / 2
    expect(Math.abs(firstCenterY - lastCenterY)).toBeLessThan(3)
  })
})
