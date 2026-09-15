import { expect, test } from '@playwright/test'

test.describe('CV data modal — form editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/editor')
    await page.evaluate(() => localStorage.setItem('proof-onboarded', '1'))
    await page.reload()
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' })
    await page.getByTitle('New CV').click()
    await expect(page.getByRole('heading', { name: 'New CV' })).toBeVisible()
  })

  test('opens in editor mode with Identity fields visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Editor' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'JSON', exact: true })).toBeVisible()
    await expect(page.getByText('Full name', { exact: true })).toBeVisible()
    await expect(page.getByText('Headline', { exact: true })).toBeVisible()
    await expect(page.getByText('Contact', { exact: true })).toBeVisible()
  })

  test('JSON tab serialises form data to valid JSON with identity property', async ({ page }) => {
    await page.getByRole('button', { name: 'JSON', exact: true }).click()
    const textarea = page.locator('textarea[spellcheck="false"]')
    await expect(textarea).toBeVisible()
    const content = await textarea.inputValue()
    const parsed = JSON.parse(content) as Record<string, unknown>
    expect(parsed).toHaveProperty('identity')
    expect((parsed.identity as Record<string, unknown>).name).toBeTruthy()
  })

  test('can switch back to Editor from JSON', async ({ page }) => {
    await page.getByRole('button', { name: 'JSON', exact: true }).click()
    await expect(page.locator('textarea[spellcheck="false"]')).toBeVisible()
    await page.getByRole('button', { name: 'Editor' }).click()
    await expect(page.getByText('Full name')).toBeVisible()
    await expect(page.locator('textarea[spellcheck="false"]')).not.toBeVisible()
  })

  test('invalid JSON shows error on switch to Editor', async ({ page }) => {
    await page.getByRole('button', { name: 'JSON', exact: true }).click()
    await page.locator('textarea[spellcheck="false"]').fill('{ this is not : valid json }')
    await page.getByRole('button', { name: 'Editor' }).click()
    // Error message is rendered below the content area
    await expect(page.locator('p').filter({ hasText: /invalid|unexpected|json/i })).toBeVisible()
    // Should stay on JSON tab
    await expect(page.locator('textarea[spellcheck="false"]')).toBeVisible()
  })

  test('Format button is available in JSON mode', async ({ page }) => {
    await page.getByRole('button', { name: 'JSON', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Format' })).toBeVisible()
  })

  test('Experience section is open and shows Add button', async ({ page }) => {
    // Experience is in the initial open set — no need to click the toggle
    await expect(page.getByRole('button', { name: /Add experience/i })).toBeVisible()
  })

  test('can add a new experience entry', async ({ page }) => {
    await page.getByRole('button', { name: /Add experience/i }).click()
    // New item added with placeholder title
    await expect(page.getByText('New entry')).toBeVisible()
  })

  test('can toggle a section open and closed', async ({ page }) => {
    // Education is closed initially — open it
    await page.getByRole('button', { name: /^Education/ }).click()
    await expect(page.getByRole('button', { name: /Add education/i })).toBeVisible()
    // Close it again
    await page.getByRole('button', { name: /^Education/ }).click()
    await expect(page.getByRole('button', { name: /Add education/i })).not.toBeVisible()
  })

  test('saves from editor mode and CV appears in sidebar list', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Editor Mode CV')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'New CV' })).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Editor Mode CV' })).toBeVisible()
  })

  test('saves from JSON mode and CV appears in sidebar list', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('JSON Mode CV')
    await page.getByRole('button', { name: 'JSON', exact: true }).click()
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'New CV' })).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'JSON Mode CV' })).toBeVisible()
  })

  test('requires CV name to save', async ({ page }) => {
    // Name field is empty by default for a new CV
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByText('Name is required')).toBeVisible()
    // Modal stays open
    await expect(page.getByRole('heading', { name: 'New CV' })).toBeVisible()
  })
})

test.describe('CV data modal — edit existing CV', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/editor')
    await page.evaluate(() => localStorage.setItem('proof-onboarded', '1'))
    await page.reload()
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' })
    // Create a CV first
    await page.getByTitle('New CV').click()
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Original CV')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Original CV' })).toBeVisible()
  })

  test('edit modal opens with existing content pre-populated', async ({ page }) => {
    await page.getByTitle('Edit').click()
    await expect(page.getByRole('heading', { name: 'Edit CV' })).toBeVisible()
    // Name field should be pre-filled
    await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue(
      'Original CV',
    )
    // Editor mode should be active and identity fields should show starter content
    await expect(page.getByText('Full name')).toBeVisible()
  })

  test('can rename existing CV', async ({ page }) => {
    await page.getByTitle('Edit').click()
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Renamed CV')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Renamed CV' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Original CV' })).not.toBeVisible()
  })
})
