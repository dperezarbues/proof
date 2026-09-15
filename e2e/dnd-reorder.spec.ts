import { expect, test } from '@playwright/test'

const EDITOR_URL = '/en/editor'

test.describe('DnD — section reorder via pointer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(EDITOR_URL)
    await page.evaluate(() => localStorage.setItem('proof-onboarded', '1'))
    await page.reload()
    // Suppress Next.js dev overlay so it doesn't intercept pointer events
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' })
    // Switch to Layout tab so section drag handles are rendered
    await page.getByRole('tab', { name: /Layout/i }).click()
    // Wait for LayoutEditor to finish loading
    await expect(page.getByRole('button', { name: 'Generate PDF' }).first()).toBeVisible({
      timeout: 10_000,
    })
    // Wait for the section list to populate (Generate PDF may appear before EditorShell hydrates)
    await expect(
      page.getByTestId('section-list').locator('span.flex-1.text-sm.text-gray-800').first(),
    ).toBeVisible({ timeout: 10_000 })
  })

  test('moving Summary down one position puts Experience first', async ({ page }) => {
    // Default layout order: Summary, Experience, Awards, Skills, 2-col group, Side Projects
    const sectionList = page.getByTestId('section-list')
    const sectionSpans = sectionList.locator('span.flex-1.text-sm.text-gray-800')

    const before = await sectionSpans.allTextContents()
    expect(before[0]).toBe('Summary')
    expect(before[1]).toBe('Experience')

    // Locate the drag handles (⠿ button inside each section card)
    const dragHandles = sectionList.getByTestId('section-drag-handle')

    // Get bounding boxes for the first handle and the second section card
    const firstHandle = dragHandles.nth(0)
    const secondCard = sectionList.locator('.group').nth(1)

    const handleBox = await firstHandle.boundingBox()
    const targetBox = await secondCard.boundingBox()
    expect(handleBox).not.toBeNull()
    expect(targetBox).not.toBeNull()

    const startX = handleBox!.x + handleBox!.width / 2
    const startY = handleBox!.y + handleBox!.height / 2
    // Drop below the center of the second card so dnd-kit treats it as "after"
    const endY = targetBox!.y + targetBox!.height * 0.75

    await page.mouse.move(startX, startY)
    await page.mouse.down()
    // Move in small steps so dnd-kit registers the pointer movement
    await page.mouse.move(startX, startY + 5, { steps: 3 })
    await page.mouse.move(startX, endY, { steps: 10 })
    await page.mouse.up()

    // After reorder: Experience should be first, Summary second
    await expect(sectionSpans.nth(0)).toHaveText('Experience')
    await expect(sectionSpans.nth(1)).toHaveText('Summary')
  })
})
