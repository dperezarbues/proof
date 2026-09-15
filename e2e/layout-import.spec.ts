import { type Page, expect, test } from '@playwright/test'

/** Trigger React's onChange on a hidden file input by creating a real File via DataTransfer. */
async function uploadJsonFile(page: Page, testid: string, content: string) {
  await page.locator(`[data-testid="${testid}"]`).waitFor({ state: 'attached', timeout: 10_000 })
  await page.evaluate(
    ({ testid, content }) => {
      const el = document.querySelector(`[data-testid="${testid}"]`) as HTMLInputElement
      if (!el) throw new Error(`No element with data-testid="${testid}"`)
      const file = new File([content], 'layout.json', { type: 'application/json' })
      const dt = new DataTransfer()
      dt.items.add(file)
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'files')?.set
      if (setter) setter.call(el, dt.files)
      el.dispatchEvent(new Event('change', { bubbles: true }))
    },
    { testid, content },
  )
}

const EDITOR_URL = '/en/editor'

test.describe('Layout import', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(EDITOR_URL)
    await page.evaluate(() => localStorage.setItem('proof-onboarded', '1'))
    await page.reload()
    // Suppress Next.js dev overlay so it doesn't intercept pointer events
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' })
    // Switch to Layout tab so the layout panel (and its Import button) is rendered
    await page.getByRole('tab', { name: /Layout/i }).click()
    await expect(page.getByRole('button', { name: 'Generate PDF' }).first()).toBeVisible({
      timeout: 10_000,
    })
    // Wait for the section list to populate (Generate PDF may appear before EditorShell hydrates)
    await expect(
      page.getByTestId('section-list').getByTestId('section-label').first(),
    ).toBeVisible({ timeout: 10_000 })
  })

  test('importing a layout JSON replaces the section list', async ({ page }) => {
    // The default layout has: Summary, Experience, Awards, Skills, 2-col group, Side Projects.
    // Import a layout that has ONLY certifications and languages (not present by default as full sections).
    const layout = {
      header: { style: 'stacked' as const },
      sections: [
        { id: 'certifications', breakable: false },
        { id: 'languages', breakable: false },
      ],
    }
    await uploadJsonFile(page, 'layout-import-input', JSON.stringify(layout))

    // Scope assertions to section card spans within the section list
    const sectionSpans = page.getByTestId('section-list').locator('[data-testid="section-label"]')

    // Wait for Summary to disappear (confirms the import fired and replaced the default layout)
    await expect(sectionSpans.filter({ hasText: 'Summary' })).toHaveCount(0, { timeout: 15000 })

    // Now verify the imported sections are present
    await expect(sectionSpans.filter({ hasText: 'Certifications' })).toHaveCount(1)
    await expect(sectionSpans.filter({ hasText: 'Languages' })).toHaveCount(1)

    // Default sections should be gone
    const labels = await sectionSpans.allTextContents()
    expect(labels).not.toContain('Experience')
  })

  test('importing an invalid JSON is a no-op (sections unchanged)', async ({ page }) => {
    const sectionSpans = page.getByTestId('section-list').locator('[data-testid="section-label"]')
    const before = await sectionSpans.allTextContents()

    await uploadJsonFile(page, 'layout-import-input', 'this is not json at all')

    // A known default section still present confirms the import was rejected.
    // Using a deterministic assertion avoids an arbitrary waitForTimeout.
    await expect(sectionSpans.filter({ hasText: 'Summary' })).toHaveCount(1, { timeout: 2000 })
    const after = await sectionSpans.allTextContents()
    expect(after).toEqual(before)
  })
})
