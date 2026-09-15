// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadSaves, mutateSaves } from '../../storage-helpers'
import type { SavedConfig } from '../../types'
import { useSavedConfigs } from '../useSavedConfigs'

vi.mock('../../storage-helpers', () => ({
  loadSaves: vi.fn(() => []),
  mutateSaves: vi.fn(),
}))
vi.mock('@/lib/storage', () => ({ KEYS: { saves: 'proof-saves' } }))

const loadSavesMock = vi.mocked(loadSaves)
const mutateSavesMock = vi.mocked(mutateSaves)

const minLayout = { header: { style: 'split' as const }, sections: [] }

function makeSave(overrides: Partial<SavedConfig> = {}): SavedConfig {
  return {
    id: '1',
    name: 'My Layout',
    templateId: 'default',
    savedAt: 0,
    layout: minLayout,
    style: {},
    ...overrides,
  }
}

function setup() {
  const onLoad = vi.fn()
  const onSaved = vi.fn()
  const view = renderHook(() =>
    useSavedConfigs({
      templateId: 'default',
      styleParams: [],
      getLayoutSnapshot: () => minLayout,
      style: {},
      onLoad,
      onSaved,
    }),
  )
  return { ...view, onLoad, onSaved }
}

beforeEach(() => {
  loadSavesMock.mockReturnValue([])
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('useSavedConfigs', () => {
  // Regression: persistSaves used to be void, so a write failure (e.g. quota exceeded)
  // was indistinguishable from success — the modal closed and the save "worked" either way.
  it('handleSave returns false and does not update state when the write fails', () => {
    mutateSavesMock.mockReturnValue(null)
    const { result, onSaved } = setup()

    let ok: boolean | undefined
    act(() => {
      ok = result.current.handleSave('My Layout')
    })

    expect(ok).toBe(false)
    expect(result.current.saves).toEqual([])
    expect(onSaved).not.toHaveBeenCalled()
  })

  it('handleSave returns true, updates saves, and closes the modal on success', () => {
    const saved = makeSave()
    mutateSavesMock.mockReturnValue([saved])
    const { result, onSaved } = setup()

    act(() => result.current.setShowSaveModal(true))
    let ok: boolean | undefined
    act(() => {
      ok = result.current.handleSave('My Layout')
    })

    expect(ok).toBe(true)
    expect(result.current.saves).toEqual([saved])
    expect(result.current.showSaveModal).toBe(false)
    expect(onSaved).toHaveBeenCalled()
  })

  // Regression: saves were only re-synced on explicit save/delete from THIS tab, so
  // another tab's change to the saved-layouts list left this tab's displayed list stale —
  // the same class of cross-tab bug fixed for the CV list, now closed here too.
  it('resyncs saves when another tab writes to the saves storage key', () => {
    const { result } = setup()
    const fromOtherTab = [makeSave({ id: '2', name: 'From other tab' })]
    loadSavesMock.mockReturnValue(fromOtherTab)

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'proof-saves' }))
    })

    expect(result.current.saves).toEqual(fromOtherTab)
  })

  it('ignores storage events for unrelated keys', () => {
    const { result } = setup()
    loadSavesMock.mockReturnValue([makeSave({ id: 'unrelated' })])

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'some-other-key' }))
    })

    expect(result.current.saves).toEqual([])
  })
})
