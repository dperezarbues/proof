import { expect, test } from '@playwright/test'

// This whole file deliberately does NOT use the shared openEditor() helper —
// that helper pre-marks the storage choice as made specifically so every
// other spec can skip past this prompt. These tests need the "onboarded
// browser, but this tab was never asked" state SharedComputerPrompt exists
// for, so they set up localStorage/sessionStorage by hand instead.
async function openOnboardedTabWithNoStorageChoice(page: import('@playwright/test').Page) {
  await page.goto('/en/editor')
  await page.evaluate(() => localStorage.setItem('proof-onboarded', '1'))
  await page.reload()
  await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' })
}

test.describe('Shared computer prompt', () => {
  test('is not shown on first-ever visit — the onboarding modal already asks this', async ({
    page,
  }) => {
    await page.goto('/en/editor')
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' })
    // Onboarding modal covers the whole viewport, so "New CV" isn't even
    // reachable yet — confirms there's no second, stacked prompt behind it.
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'New CV' })).not.toBeVisible()
  })

  test('is shown the first time New CV is clicked in a tab that was never asked', async ({
    page,
  }) => {
    await openOnboardedTabWithNoStorageChoice(page)
    await page.getByTitle('New CV').click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'New CV' })).not.toBeVisible()
  })

  test('choosing "shared" switches to session storage and still proceeds to New CV', async ({
    page,
  }) => {
    await openOnboardedTabWithNoStorageChoice(page)
    await page.getByTitle('New CV').click()
    await page.getByRole('button', { name: /temporary storage/i }).click()

    await expect(page.getByRole('heading', { name: 'New CV' })).toBeVisible()
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Shared PC CV')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Shared PC CV' })).toBeVisible()

    const inSessionStorage = await page.evaluate(() => sessionStorage.getItem('proof-private'))
    expect(inSessionStorage).toBe('1')
    const cvInLocalStorage = await page.evaluate(() => localStorage.getItem('proof-cvs'))
    expect(cvInLocalStorage).toBeNull()
  })

  test('choosing "not shared" keeps normal storage and still proceeds to New CV', async ({
    page,
  }) => {
    await openOnboardedTabWithNoStorageChoice(page)
    await page.getByTitle('New CV').click()
    await page.getByRole('button', { name: /save normally/i }).click()

    await expect(page.getByRole('heading', { name: 'New CV' })).toBeVisible()
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Own PC CV')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Own PC CV' })).toBeVisible()

    const cvInLocalStorage = await page.evaluate(() => localStorage.getItem('proof-cvs'))
    expect(cvInLocalStorage).toContain('Own PC CV')
  })

  test('does not re-prompt for a second New CV / Import in the same tab', async ({ page }) => {
    await openOnboardedTabWithNoStorageChoice(page)
    await page.getByTitle('New CV').click()
    await page.getByRole('button', { name: /save normally/i }).click()
    await page.getByRole('button', { name: 'Close' }).click()

    await page.getByTitle('New CV').click()
    await expect(page.getByRole('heading', { name: 'New CV' })).toBeVisible()
    await expect(page.getByRole('button', { name: /save normally/i })).not.toBeVisible()
  })
})
