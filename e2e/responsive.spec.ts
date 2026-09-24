/**
 * Responsive layout tests — verifies the three breakpoints:
 *   Mobile  < 768px  (375×667,  iPhone SE)
 *   Tablet  ≥ 768px  (768×1024, iPad)
 *   Desktop ≥ 1024px (1280×800, default)
 *
 * Strategy: each describe block sets a specific viewport size and checks
 * that the correct UI variant is rendered (elements shown/hidden, layout).
 * No CV data or PDF generation needed — these are purely structural checks.
 */

import { expect, type Page, test } from '@playwright/test'

// ── helpers ───────────────────────────────────────────────────────────────────

async function gotoEditor(page: Page) {
  await page.goto('/en/editor')
  await page.evaluate(() => localStorage.setItem('proof-onboarded', '1'))
  await page.reload()
  // Suppress Next.js dev overlay so it doesn't intercept pointer events on fixed UI
  await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' })
}

const MOBILE = { width: 375, height: 667 }
const TABLET = { width: 768, height: 1024 }
const DESKTOP = { width: 1280, height: 800 }

// ── Landing page ──────────────────────────────────────────────────────────────

test.describe('Landing — mobile (375×667)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE)
    await page.goto('/en/')
  })

  test('inline nav links are hidden, mobile CTA is shown', async ({ page }) => {
    // These links live in a `hidden md:inline` container — not visible on mobile
    // Use href-based selector to target the specific anchor (getByRole skips display:none)
    const editorAnchor = page.locator('nav a[href$="#editor"]')
    await expect(editorAnchor).toBeHidden()

    // Mobile-only "Editor →" button is visible
    const mobileCta = page.getByRole('navigation').getByRole('link', { name: /^Editor →$/ })
    await expect(mobileCta).toBeVisible()
  })

  test('nav links are reachable via the mobile hamburger menu', async ({ page }) => {
    // Regression: the inline nav links used to have no mobile equivalent at
    // all once hidden below md — Help, Schema, and Privacy were completely
    // unreachable from the header on a phone. MobileNav's hamburger now
    // surfaces the same links.
    const menuButton = page.getByRole('button', { name: 'Menu' })
    await expect(menuButton).toBeVisible()
    const menu = page.getByTestId('mobile-nav-menu')
    await expect(menu).not.toBeVisible()

    await menuButton.click()
    await expect(menu).toBeVisible()
    await expect(menu.getByRole('link', { name: 'Help' })).toBeVisible()
    await expect(menu.getByRole('link', { name: 'Schema' })).toBeVisible()
    await expect(menu.getByRole('link', { name: 'Privacy' })).toBeVisible()

    await menu.getByRole('link', { name: 'Help' }).click()
    await expect(page).toHaveURL(/\/en\/help/)
  })

  test('mobile hamburger menu closes on Escape and restores focus to the trigger', async ({
    page,
  }) => {
    const menuButton = page.getByRole('button', { name: 'Menu' })
    const menu = page.getByTestId('mobile-nav-menu')
    await menuButton.click()
    await expect(menu).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(menu).not.toBeVisible()
    await expect(menuButton).toBeFocused()
  })

  test('mobile hamburger menu closes on an outside click', async ({ page }) => {
    const menuButton = page.getByRole('button', { name: 'Menu' })
    const menu = page.getByTestId('mobile-nav-menu')
    await menuButton.click()
    await expect(menu).toBeVisible()

    await page.mouse.click(10, 10)
    await expect(menu).not.toBeVisible()
  })

  test('hero heading is visible and not horizontally clipped', async ({ page }) => {
    const h1 = page.getByRole('heading', { name: /Your CV/i })
    await expect(h1).toBeVisible()

    const box = await h1.boundingBox()
    expect(box).not.toBeNull()
    // Heading should not overflow the viewport width
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(MOBILE.width + 2) // 2px tolerance
  })

  test('template grid shows 2 columns', async ({ page }) => {
    // Get first two template card links (skip the "Browse all" header link)
    const cards = page.locator('section#templates [data-testid="template-grid"] a')
    const first = await cards.nth(0).boundingBox()
    const second = await cards.nth(1).boundingBox()
    const third = await cards.nth(2).boundingBox()

    expect(first).not.toBeNull()
    expect(second).not.toBeNull()
    expect(third).not.toBeNull()

    // Card 0 and card 1 should be on the same row (similar y)
    expect(Math.abs(first!.y - second!.y)).toBeLessThan(10)
    // Card 2 should be below card 0 (next row)
    expect(third!.y).toBeGreaterThan(first!.y + first!.height / 2)
  })

  test('footer stacks vertically', async ({ page }) => {
    const footer = page.locator('footer')
    const logo = footer.getByText('Proof — open source')
    const schemaLink = footer.getByRole('link', { name: 'Schema reference' })

    const logoBox = await logo.boundingBox()
    const linkBox = await schemaLink.boundingBox()
    expect(logoBox).not.toBeNull()
    expect(linkBox).not.toBeNull()

    // On mobile the footer is flex-col: logo is above the links
    expect(linkBox!.y).toBeGreaterThan(logoBox!.y + logoBox!.height / 2)
  })

  test('CTA section button is full-width', async ({ page }) => {
    const ctaBtn = page
      .locator('section')
      .filter({ hasText: 'Make your proof.' })
      .getByRole('link', { name: /Open the editor/i })
    await expect(ctaBtn).toBeVisible()
    const box = await ctaBtn.boundingBox()
    // On mobile the button fills the available width (no shrink-0, not flex-row)
    expect(box!.width).toBeGreaterThan(MOBILE.width * 0.5)
  })
})

test.describe('Landing — tablet (768×1024)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(TABLET)
    await page.goto('/en/')
  })

  test('nav links are visible at tablet width', async ({ page }) => {
    await expect(page.locator('nav a[href$="#editor"]')).toBeVisible()
    await expect(page.locator('nav a[href$="#templates"]')).toBeVisible()
    await expect(page.locator('nav a[href$="#privacy"]')).toBeVisible()
  })

  test('mobile CTA button is hidden at tablet width', async ({ page }) => {
    const mobileCta = page.getByRole('navigation').getByRole('link', { name: /^Editor →$/ })
    await expect(mobileCta).toBeHidden()
  })

  test('template grid shows at least 3 columns', async ({ page }) => {
    const cards = page.locator('section#templates [data-testid="template-grid"] a')
    const first = await cards.nth(0).boundingBox()
    const second = await cards.nth(1).boundingBox()
    const third = await cards.nth(2).boundingBox()

    // All three should be on the same row
    expect(Math.abs(first!.y - second!.y)).toBeLessThan(10)
    expect(Math.abs(first!.y - third!.y)).toBeLessThan(10)
  })

  test('footer renders in a single row', async ({ page }) => {
    const footer = page.locator('footer')
    const logo = footer.getByText('Proof — open source')
    const schemaLink = footer.getByRole('link', { name: 'Schema reference' })

    const logoBox = await logo.boundingBox()
    const linkBox = await schemaLink.boundingBox()

    // On tablet+ footer is flex-row: they share roughly the same y coordinate
    expect(Math.abs(logoBox!.y - linkBox!.y)).toBeLessThan(20)
  })
})

test.describe('Landing — desktop (1280×800)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DESKTOP)
    await page.goto('/en/')
  })

  test('all nav links and full open-editor CTA are visible', async ({ page }) => {
    const nav = page.getByRole('navigation')
    await expect(page.locator('nav a[href$="#editor"]')).toBeVisible()
    await expect(page.locator('nav a[href$="#templates"]')).toBeVisible()
    await expect(page.locator('nav a[href$="#privacy"]')).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Schema', exact: true })).toBeVisible()
    await expect(nav.getByRole('link', { name: /Open editor →/ })).toBeVisible()
  })

  test('hero is two-column: text and mockup side by side', async ({ page }) => {
    const h1 = page.getByRole('heading', { name: /Your CV/i })
    const badge = page.getByText('cv.json → PDF · 38ms')

    const h1Box = await h1.boundingBox()
    const badgeBox = await badge.boundingBox()

    // On desktop the grid is two-column: mockup (badge) is to the right of h1
    expect(badgeBox!.x).toBeGreaterThan(h1Box!.x + h1Box!.width * 0.5)
    // And they share roughly the same vertical region
    expect(badgeBox!.y).toBeGreaterThan(h1Box!.y - 50)
  })
})

// ── Editor ────────────────────────────────────────────────────────────────────

test.describe('Editor — mobile (375×667)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE)
    await gotoEditor(page)
  })

  test('mobile bottom tab bar is visible', async ({ page }) => {
    await expect(page.getByTestId('mobile-tabbar')).toBeVisible()
  })

  test('desktop sidebar is not visually accessible on load (panel closed)', async ({ page }) => {
    const aside = page.locator('.editor-aside')
    await expect(aside).toHaveAttribute('data-open', 'false')
  })

  test('tapping Data tab opens the panel', async ({ page }) => {
    await page.getByTestId('mobile-tab-data').click()
    const aside = page.locator('.editor-aside')
    await expect(aside).toHaveAttribute('data-open', 'true')
    // Panel content should be reachable
    await expect(page.getByText('Your CVs')).toBeVisible()
  })

  test('tapping Template tab opens the panel showing template grid', async ({ page }) => {
    await page.getByTestId('mobile-tab-template').click()
    await expect(page.locator('.editor-aside')).toHaveAttribute('data-open', 'true')
    await expect(page.getByText('Choose a template')).toBeVisible()
  })

  test('close button hides the panel', async ({ page }) => {
    await page.getByTestId('mobile-tab-data').click()
    await expect(page.locator('.editor-aside')).toHaveAttribute('data-open', 'true')

    await page.getByRole('button', { name: 'Close panel' }).click()
    await expect(page.locator('.editor-aside')).toHaveAttribute('data-open', 'false')
  })

  test('backdrop click hides the panel', async ({ page }) => {
    await page.getByTestId('mobile-tab-data').click()
    await expect(page.locator('.editor-aside')).toHaveAttribute('data-open', 'true')

    // Dispatch click directly on the backdrop element — bypasses z-index so we test the
    // handler, not pixel geometry that changes when layout changes.
    await page.getByTestId('editor-backdrop').dispatchEvent('click')
    await expect(page.locator('.editor-aside')).toHaveAttribute('data-open', 'false')
  })

  test('Escape key hides the panel', async ({ page }) => {
    await page.getByTestId('mobile-tab-data').click()
    await expect(page.locator('.editor-aside')).toHaveAttribute('data-open', 'true')

    await page.keyboard.press('Escape')
    await expect(page.locator('.editor-aside')).toHaveAttribute('data-open', 'false')
  })

  test('opening the panel moves focus to the close button', async ({ page }) => {
    await page.getByTestId('mobile-tab-data').click()
    await expect(page.locator('.editor-aside')).toHaveAttribute('data-open', 'true')

    await expect(page.getByRole('button', { name: 'Close panel' })).toBeFocused()
  })

  test('closing the panel restores focus to the tab that opened it', async ({ page }) => {
    const trigger = page.getByTestId('mobile-tab-data')
    await trigger.click()
    await expect(page.locator('.editor-aside')).toHaveAttribute('data-open', 'true')

    await page.getByRole('button', { name: 'Close panel' }).click()
    await expect(trigger).toBeFocused()
  })

  test('Gen PDF button is visible in tab bar', async ({ page }) => {
    const genBtn = page.getByTestId('mobile-tabbar').getByRole('button', { name: /Gen PDF/i })
    await expect(genBtn).toBeVisible()
  })

  test('Generate PDF button in the panel is also present', async ({ page }) => {
    await page.getByTestId('mobile-tab-data').click()
    // The sidebar actions bar has a full Generate PDF button
    const aside = page.locator('.editor-aside')
    await expect(aside.getByRole('button', { name: /Generate PDF/i })).toBeVisible()
  })

  test('PDF preview area takes up most of the screen above the tab bar', async ({ page }) => {
    // On mobile, Android cannot render PDFs in iframes, so the app renders a
    // placeholder div instead. Use the data-testid on the container.
    const previewArea = page.getByTestId('pdf-preview-area')
    const tabbar = page.getByTestId('mobile-tabbar')

    const previewBox = await previewArea.boundingBox()
    const tabbarBox = await tabbar.boundingBox()

    expect(previewBox).not.toBeNull()
    expect(tabbarBox).not.toBeNull()

    expect(previewBox!.y + previewBox!.height).toBeLessThanOrEqual(tabbarBox!.y + 2)
    expect(previewBox!.height).toBeGreaterThan(MOBILE.height * 0.6)
  })
})

test.describe('Editor — tablet (768×1024)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(TABLET)
    await gotoEditor(page)
  })

  test('mobile bottom tab bar is hidden', async ({ page }) => {
    await expect(page.getByTestId('mobile-tabbar')).toBeHidden()
  })

  test('sidebar is always visible in the layout', async ({ page }) => {
    const aside = page.locator('.editor-aside')
    await expect(aside).toBeVisible()
    const box = await aside.boundingBox()
    expect(box).not.toBeNull()
    // Sidebar should be on the left side of the screen
    expect(box!.x).toBeLessThan(50)
    // Sidebar should span most of the viewport height
    expect(box!.height).toBeGreaterThan(TABLET.height * 0.8)
  })

  test('Proof brand is visible in the sidebar', async ({ page }) => {
    await expect(page.locator('.editor-aside').getByText('Proof', { exact: true })).toBeVisible()
  })

  test('Step nav tabs are visible in the sidebar', async ({ page }) => {
    const aside = page.locator('.editor-aside')
    await expect(aside.getByRole('tab', { name: /Data/i })).toBeVisible()
    await expect(aside.getByRole('tab', { name: /Template/i })).toBeVisible()
    await expect(aside.getByRole('tab', { name: /Layout/i })).toBeVisible()
    await expect(aside.getByRole('tab', { name: /Style/i })).toBeVisible()
  })

  test('Generate PDF button is always visible in sidebar', async ({ page }) => {
    await expect(
      page.locator('.editor-aside').getByRole('button', { name: /Generate PDF/i }),
    ).toBeVisible()
  })

  test('PDF preview is to the right of the sidebar', async ({ page }) => {
    const aside = page.locator('.editor-aside')
    const previewArea = page.getByTestId('pdf-preview-area')

    const asideBox = await aside.boundingBox()
    const previewBox = await previewArea.boundingBox()

    expect(previewBox!.x).toBeGreaterThan(asideBox!.x + asideBox!.width - 5)
  })
})

test.describe('Editor — desktop (1280×800)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DESKTOP)
    await gotoEditor(page)
  })

  test('mobile bottom tab bar is hidden', async ({ page }) => {
    await expect(page.getByTestId('mobile-tabbar')).toBeHidden()
  })

  test('sidebar is wider on desktop than tablet', async ({ page }) => {
    const aside = page.locator('.editor-aside')
    const box = await aside.boundingBox()
    expect(box).not.toBeNull()
    // Desktop sidebar is 380px; tablet is 320px
    expect(box!.width).toBeGreaterThanOrEqual(370)
  })

  test('footer links (← Home, Clear data) are visible in sidebar', async ({ page }) => {
    const aside = page.locator('.editor-aside')
    await expect(aside.getByRole('link', { name: '← Home' })).toBeVisible()
    await expect(aside.getByRole('button', { name: 'Clear data' })).toBeVisible()
  })
})

// ── Modals ────────────────────────────────────────────────────────────────────

test.describe('CV Data Modal — mobile (375×667)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE)
    await gotoEditor(page)
  })

  test('modal is full-screen on mobile', async ({ page }) => {
    await page.getByTestId('mobile-tab-data').click()
    // The brand-header "New CV" button is hidden on mobile (inside hidden md:flex).
    // Use the data tab's dedicated new-cv-btn which is always visible when the panel is open.
    await page.getByTestId('new-cv-btn').click()
    await expect(page.getByRole('heading', { name: 'New CV' })).toBeVisible()

    // The modal inner container should fill the viewport height
    const modal = page.locator('.fixed.inset-0.z-50').locator('> div')
    const box = await modal.boundingBox()
    expect(box).not.toBeNull()
    // Full-screen: height should be close to viewport height
    expect(box!.height).toBeGreaterThan(MOBILE.height * 0.9)
    // Full-width: no side margins on mobile
    expect(box!.width).toBeGreaterThanOrEqual(MOBILE.width - 2)
  })
})

test.describe('CV Data Modal — tablet (768×1024)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(TABLET)
    await gotoEditor(page)
  })

  test('modal is centred and constrained on tablet', async ({ page }) => {
    await page.locator('.editor-aside').getByTitle('New CV').first().click()
    await expect(page.getByRole('heading', { name: 'New CV' })).toBeVisible()

    const modal = page.locator('.fixed.inset-0.z-50').locator('> div')
    const box = await modal.boundingBox()
    expect(box).not.toBeNull()

    // Should not be full-width at tablet — capped at max-w-[672px]
    expect(box!.width).toBeLessThan(TABLET.width - 20)
    // Should be centred (roughly equal margins)
    const leftMargin = box!.x
    const rightMargin = TABLET.width - (box!.x + box!.width)
    expect(Math.abs(leftMargin - rightMargin)).toBeLessThan(20)
  })
})

test.describe('Onboarding Modal — mobile (375×667)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE)
    await page.goto('/en/editor')
    await page.evaluate(() => localStorage.removeItem('proof-onboarded'))
    await page.reload()
  })

  test('modal slides up from bottom with rounded top corners', async ({ page }) => {
    await expect(page.getByText('Welcome to Proof')).toBeVisible()

    const modal = page.locator('.fixed.inset-0.z-50').locator('> div')
    const box = await modal.boundingBox()
    expect(box).not.toBeNull()

    // On mobile the modal is pinned to the bottom (items-end on the overlay)
    // Its bottom edge should be at or near the viewport bottom
    expect(box!.y + box!.height).toBeGreaterThan(MOBILE.height * 0.8)

    // Full width on mobile
    expect(box!.width).toBeGreaterThanOrEqual(MOBILE.width - 2)
  })
})
