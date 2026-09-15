import { expect, test } from '@playwright/test'

const EDITOR_URL = '/en/editor'

test.describe('Editor — initial load', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(EDITOR_URL)
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' })
  })

  test('shows welcome modal on first visit', async ({ page }) => {
    await expect(page.getByRole('dialog', { name: /Welcome to Proof/i })).toBeVisible()
    await expect(page.getByText('A privacy-first CV editor')).toBeVisible()
  })

  test('dismisses welcome modal and shows editor', async ({ page }) => {
    await page.getByRole('button', { name: 'Get started' }).click()
    await expect(page.getByRole('dialog', { name: /Welcome to Proof/i })).not.toBeVisible()
    // Proof brand mark is visible in the left pane
    await expect(page.locator('aside').getByText('Proof', { exact: true })).toBeVisible()
  })

  test('shows sample PDF banner when no CV exists', async ({ page }) => {
    await page.getByRole('button', { name: 'Get started' }).click()
    await expect(page.getByText('Add your CV to generate your own PDF')).toBeVisible()
    await expect(page.getByRole('button', { name: '+ New CV' })).toBeVisible()
  })

  test('private mode checkbox is present in welcome modal', async ({ page }) => {
    const checkbox = page.getByRole('checkbox', { name: /shared computer/i })
    await expect(checkbox).toBeVisible()
    await expect(checkbox).not.toBeChecked()
  })

  test('? button reopens welcome modal', async ({ page }) => {
    await page.getByRole('button', { name: 'Get started' }).click()
    await page.getByTitle('Help').click()
    await expect(page.getByRole('dialog', { name: /Welcome to Proof/i })).toBeVisible()
  })
})

test.describe('Editor — template and layout selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(EDITOR_URL)
    await page.evaluate(() => localStorage.setItem('proof-onboarded', '1'))
    await page.reload()
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' })
  })

  test('shows template grid in template tab', async ({ page }) => {
    await page.getByRole('tab', { name: /Template/i }).click()
    await expect(page.getByText('Choose a template')).toBeVisible()
  })

  test('PDF preview viewer is rendered with sample PDF', async ({ page }) => {
    const viewer = page.locator('[data-testid="pdfjs-viewer"]')
    await expect(viewer).toBeVisible()
    const src = await viewer.getAttribute('data-pdf-src')
    expect(src).toMatch(/\.pdf/)
  })

  test('layout tab is accessible', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /Layout/i })).toBeVisible()
  })

  test('style tab is accessible', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /Style/i })).toBeVisible()
  })
})

test.describe('Editor — CV management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(EDITOR_URL)
    await page.evaluate(() => localStorage.setItem('proof-onboarded', '1'))
    await page.reload()
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' })
  })

  test('opens New CV modal', async ({ page }) => {
    await page.getByTitle('New CV').click()
    await expect(page.getByRole('heading', { name: 'New CV' })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toBeVisible()
  })

  test('can fill in CV name and cancel', async ({ page }) => {
    await page.getByTitle('New CV').click()
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('My Test CV')
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByRole('heading', { name: 'New CV' })).not.toBeVisible()
  })

  test('saves a new CV and shows it in the list', async ({ page }) => {
    await page.getByTitle('New CV').click()
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('E2E Test CV')
    await page.getByRole('button', { name: 'Save', exact: true }).click()

    await expect(page.getByRole('heading', { name: 'New CV' })).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'E2E Test CV' })).toBeVisible()
    await expect(page.getByText('Add your CV to generate your own PDF')).not.toBeVisible()
  })

  test('closes New CV modal with × button', async ({ page }) => {
    await page.getByTitle('New CV').click()
    await expect(page.getByRole('heading', { name: 'New CV' })).toBeVisible()
    await page.getByRole('button', { name: 'Close' }).click()
    await expect(page.getByRole('heading', { name: 'New CV' })).not.toBeVisible()
  })
})

test.describe('Editor — layout and style tabs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(EDITOR_URL)
    await page.evaluate(() => localStorage.setItem('proof-onboarded', '1'))
    await page.reload()
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' })
    // Create a CV so Generate PDF becomes enabled
    await page.getByTitle('New CV').click()
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Tab Test CV')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Tab Test CV' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Generate PDF' }).first()).toBeVisible({
      timeout: 10_000,
    })
  })

  test('Layout tab shows layout panel', async ({ page }) => {
    await page.getByRole('tab', { name: /Layout/i }).click()
    await expect(page.getByRole('tab', { name: /Layout/i })).toHaveAttribute('aria-selected', 'true')
  })

  test('Style tab shows style params', async ({ page }) => {
    await page.getByRole('tab', { name: /Style/i }).click()
    await expect(page.getByRole('button', { name: /Reset to defaults/i })).toBeVisible()
  })

  test('Generate PDF button is present and enabled', async ({ page }) => {
    const generateBtn = page.getByRole('button', { name: 'Generate PDF' })
    await expect(generateBtn).toBeVisible()
    await expect(generateBtn).toBeEnabled()
  })
})
