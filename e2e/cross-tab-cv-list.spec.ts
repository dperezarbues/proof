import { expect, test } from '@playwright/test'
import { openEditor } from './helpers'

// Regression: saveCv/deleteCv wrote this tab's ENTIRE in-memory cvList array
// to storage on every mutation. With two tabs open, whichever tab wrote
// second silently overwrote the other tab's changes with a stale array —
// losing newly-added CVs, or resurrecting ones just deleted elsewhere. For a
// privacy-first "your data never leaves this device" app, silent data loss
// with no error is the worst possible failure mode.
test.describe('Cross-tab CV list consistency', () => {
  test('two tabs saving CVs concurrently do not clobber each other', async ({ context }) => {
    const pageA = await context.newPage()
    const pageB = await context.newPage()

    await openEditor(pageA)
    await openEditor(pageB)

    await pageA.getByTitle('New CV').click()
    await pageA.getByRole('textbox', { name: 'Name', exact: true }).fill('Tab A CV')
    await pageA.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(pageA.getByRole('button', { name: 'Tab A CV' })).toBeVisible()

    // Tab B hydrated before Tab A's save landed in storage, so its in-memory
    // list started out stale — this is exactly the race being tested.
    await pageB.getByTitle('New CV').click()
    await pageB.getByRole('textbox', { name: 'Name', exact: true }).fill('Tab B CV')
    await pageB.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(pageB.getByRole('button', { name: 'Tab B CV' })).toBeVisible()

    // Both CVs must survive in the persisted list, the source of truth a
    // reload or relaunch reads from.
    const stored = await pageB.evaluate(() => localStorage.getItem('proof-cvs'))
    const names = (JSON.parse(stored ?? '[]') as { name: string }[]).map((c) => c.name).sort()
    expect(names).toEqual(['Tab A CV', 'Tab B CV'])
  })

  test('a tab saving after another tab deleted a CV does not resurrect it', async ({ context }) => {
    const pageA = await context.newPage()
    await openEditor(pageA)
    await pageA.getByTitle('New CV').click()
    await pageA.getByRole('textbox', { name: 'Name', exact: true }).fill('Shared CV')
    await pageA.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(pageA.getByRole('button', { name: 'Shared CV' })).toBeVisible()

    const pageB = await context.newPage()
    await openEditor(pageB)
    await expect(pageB.getByRole('button', { name: 'Shared CV' })).toBeVisible()

    const deleteRow = pageA.locator('div.group', { hasText: 'Shared CV' })
    await deleteRow.hover()
    await deleteRow.getByTitle('Delete').click()
    await expect(pageA.getByRole('button', { name: 'Shared CV' })).not.toBeVisible()

    // Tab B saves a CV of its own without ever refreshing — with the bug this
    // re-persists Tab B's stale in-memory list, bringing the deleted CV back.
    await pageB.getByTitle('New CV').click()
    await pageB.getByRole('textbox', { name: 'Name', exact: true }).fill('Tab B New CV')
    await pageB.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(pageB.getByRole('button', { name: 'Tab B New CV' })).toBeVisible()

    const stored = await pageB.evaluate(() => localStorage.getItem('proof-cvs'))
    const names = (JSON.parse(stored ?? '[]') as { name: string }[]).map((c) => c.name).sort()
    expect(names).toEqual(['Tab B New CV'])
  })
})
