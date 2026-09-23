import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearStyleOverrides,
  loadLayoutOverride,
  loadSaves,
  loadStyleOverrides,
  mutateSaves,
  persistLayoutOverride,
  persistStyleOverride,
} from '../storage-helpers'
import type { SavedConfig } from '../types'

const storageData: Record<string, string> = {}

vi.mock('@/lib/storage', () => {
  const setItem = (k: string, v: string) => {
    storageData[k] = v
    return true
  }
  return {
    KEYS: {
      styleOverrides: 'proof-style-overrides',
      layoutOverrides: 'proof-layout-overrides',
      saves: 'proof-saves',
      cvs: 'proof-cvs',
      currentCv: 'proof-current-cv',
      onboarded: 'proof-onboarded',
      supportPrompted: 'proof-support-prompted',
    },
    getItem: (k: string) => storageData[k] ?? null,
    setItem,
    // Mirrors the real mutateStored — kept separate from the real @/lib/storage module
    // because intra-module calls (mutateStored -> setItem) bind to the original module's
    // own scope, not this mock, so re-exporting the real mutateStored here would silently
    // write through to actual localStorage instead of this test's in-memory storageData.
    mutateStored: <T>(key: string, read: () => T, mutate: (current: T) => T): T | null => {
      const next = mutate(read())
      return setItem(key, JSON.stringify(next)) ? next : null
    },
  }
})

const KEY = 'proof-style-overrides'

beforeEach(() => {
  for (const k in storageData) delete storageData[k]
})

// ── loadSaves / persistSaves ──────────────────────────────────────────────────

const minLayout = { header: { style: 'split' as const }, sections: [] }

describe('loadSaves', () => {
  it('returns [] for empty storage', () => {
    expect(loadSaves()).toEqual([])
  })

  it('returns saved configs', () => {
    const save: SavedConfig = {
      id: '1',
      name: 'My Save',
      templateId: 'default',
      savedAt: 0,
      layout: minLayout,
      style: {},
    }
    storageData['proof-saves'] = JSON.stringify([save])
    expect(loadSaves()).toHaveLength(1)
    expect(loadSaves()[0].name).toBe('My Save')
  })

  it('returns [] for corrupt storage', () => {
    storageData['proof-saves'] = 'not-json'
    expect(loadSaves()).toEqual([])
  })
})

describe('mutateSaves', () => {
  it('writes the mutated list to storage', () => {
    const save: SavedConfig = {
      id: '1',
      name: 'S',
      templateId: 'default',
      savedAt: 0,
      layout: minLayout,
      style: {},
    }
    const result = mutateSaves(() => [save])
    expect(result).toEqual([save])
    const stored = JSON.parse(storageData['proof-saves'])
    expect(stored).toHaveLength(1)
    expect(stored[0].id).toBe('1')
  })

  it('mutates whatever is currently persisted, not a stale snapshot', () => {
    storageData['proof-saves'] = JSON.stringify([
      {
        id: '1',
        name: 'Existing',
        templateId: 'default',
        savedAt: 0,
        layout: minLayout,
        style: {},
      },
    ])
    const result = mutateSaves((current) => [
      ...current,
      { id: '2', name: 'New', templateId: 'default', savedAt: 1, layout: minLayout, style: {} },
    ])
    expect(result).toHaveLength(2)
    const stored = JSON.parse(storageData['proof-saves'])
    expect(stored.map((s: SavedConfig) => s.id)).toEqual(['1', '2'])
  })
})

// ── loadLayoutOverride / persistLayoutOverride ────────────────────────────────
// Scoped by (templateId, layoutId): a template can have multiple structurally
// distinct layout variants (e.g. default's Split/Classic/Alt), so an override
// persisted on one variant must never bleed into another variant of the same
// template — see storage-helpers.ts's scopeKey().

const LAYOUT_KEY = 'proof-layout-overrides'
const sampleLayout = { header: { style: 'split' }, sections: [{ id: 'summary', breakable: true }] }

describe('loadLayoutOverride', () => {
  it('returns null for empty storage', () => {
    expect(loadLayoutOverride('default', 'default')).toBeNull()
  })

  it('returns the persisted layout for the requested template+layout pair', () => {
    storageData[LAYOUT_KEY] = JSON.stringify({ 'default::default': sampleLayout })
    expect(loadLayoutOverride('default', 'default')).toEqual(sampleLayout)
  })

  it('returns null for an unknown template', () => {
    storageData[LAYOUT_KEY] = JSON.stringify({ 'default::default': sampleLayout })
    expect(loadLayoutOverride('modern', 'default')).toBeNull()
  })

  it('does not bleed across layout variants of the same template', () => {
    storageData[LAYOUT_KEY] = JSON.stringify({ 'default::default': sampleLayout })
    expect(loadLayoutOverride('default', 'classic')).toBeNull()
  })

  it('returns {} for corrupt storage', () => {
    storageData[LAYOUT_KEY] = 'not-json'
    expect(loadLayoutOverride('default', 'default')).toBeNull()
  })
})

describe('persistLayoutOverride', () => {
  it('saves the layout under the template+layout bucket', () => {
    persistLayoutOverride('default', 'default', sampleLayout as Record<string, unknown>)
    const saved = JSON.parse(storageData[LAYOUT_KEY])
    expect(saved['default::default']).toEqual(sampleLayout)
  })

  it('does not affect other templates', () => {
    storageData[LAYOUT_KEY] = JSON.stringify({
      'modern::default': { header: { style: 'stacked' }, sections: [] },
    })
    persistLayoutOverride('default', 'default', sampleLayout as Record<string, unknown>)
    const saved = JSON.parse(storageData[LAYOUT_KEY])
    expect(saved['modern::default'].header.style).toBe('stacked')
    expect(saved['default::default']).toEqual(sampleLayout)
  })

  it('does not affect other layout variants of the same template', () => {
    storageData[LAYOUT_KEY] = JSON.stringify({
      'default::classic': { header: { style: 'stacked' }, sections: [] },
    })
    persistLayoutOverride('default', 'default', sampleLayout as Record<string, unknown>)
    const saved = JSON.parse(storageData[LAYOUT_KEY])
    expect(saved['default::classic'].header.style).toBe('stacked')
    expect(saved['default::default']).toEqual(sampleLayout)
  })
})

// ── loadStyleOverrides ────────────────────────────────────────────────────────

describe('loadStyleOverrides', () => {
  it('returns {} for empty storage', () => {
    expect(loadStyleOverrides('default')).toEqual({})
  })

  it('returns scoped overrides for the requested template', () => {
    storageData[KEY] = JSON.stringify({ default: { accent: '#ff0000' } })
    expect(loadStyleOverrides('default')).toEqual({ accent: '#ff0000' })
  })

  it('returns {} for an unknown template', () => {
    storageData[KEY] = JSON.stringify({ default: { accent: '#ff0000' } })
    expect(loadStyleOverrides('modern')).toEqual({})
  })

  it('isolates overrides between templates', () => {
    storageData[KEY] = JSON.stringify({
      default: { accent: '#111' },
      modern: { accent: '#222' },
    })
    expect(loadStyleOverrides('default')).toEqual({ accent: '#111' })
    expect(loadStyleOverrides('modern')).toEqual({ accent: '#222' })
  })
})

// ── persistStyleOverride ──────────────────────────────────────────────────────

describe('persistStyleOverride', () => {
  it('saves a new key under the template bucket', () => {
    persistStyleOverride('default', 'accent', '#abc')
    const saved = JSON.parse(storageData[KEY])
    expect(saved.default.accent).toBe('#abc')
  })

  it('preserves existing keys (read-modify-write)', () => {
    storageData[KEY] = JSON.stringify({ default: { font_size: 11 } })
    persistStyleOverride('default', 'accent', '#abc')
    const saved = JSON.parse(storageData[KEY])
    expect(saved.default.font_size).toBe(11)
    expect(saved.default.accent).toBe('#abc')
  })

  it('does not affect other templates', () => {
    storageData[KEY] = JSON.stringify({ modern: { accent: '#mod' } })
    persistStyleOverride('default', 'accent', '#def')
    const saved = JSON.parse(storageData[KEY])
    expect(saved.modern.accent).toBe('#mod')
    expect(saved.default.accent).toBe('#def')
  })

  it('stores numeric values', () => {
    persistStyleOverride('default', 'font_size', 12)
    const saved = JSON.parse(storageData[KEY])
    expect(saved.default.font_size).toBe(12)
  })
})

// ── clearStyleOverrides ───────────────────────────────────────────────────────

describe('clearStyleOverrides', () => {
  it('removes the specified keys from the template bucket', () => {
    storageData[KEY] = JSON.stringify({ default: { accent: '#abc', font_size: 11 } })
    clearStyleOverrides('default', ['accent'])
    const saved = JSON.parse(storageData[KEY])
    expect(saved.default.accent).toBeUndefined()
    expect(saved.default.font_size).toBe(11)
  })

  it('removes multiple keys at once', () => {
    storageData[KEY] = JSON.stringify({ default: { a: '1', b: '2', c: '3' } })
    clearStyleOverrides('default', ['a', 'b'])
    const saved = JSON.parse(storageData[KEY])
    expect(saved.default.a).toBeUndefined()
    expect(saved.default.b).toBeUndefined()
    expect(saved.default.c).toBe('3')
  })

  it('does not affect other templates', () => {
    storageData[KEY] = JSON.stringify({
      default: { accent: '#abc' },
      modern: { accent: '#mod' },
    })
    clearStyleOverrides('default', ['accent'])
    const saved = JSON.parse(storageData[KEY])
    expect(saved.modern.accent).toBe('#mod')
  })

  it('is a no-op for empty storage', () => {
    expect(() => clearStyleOverrides('default', ['k1'])).not.toThrow()
  })
})

// ── readScoped error path ─────────────────────────────────────────────────────

describe('readScoped error resilience', () => {
  it('returns {} when storage contains invalid JSON', () => {
    storageData[KEY] = 'not-json'
    expect(loadStyleOverrides('default')).toEqual({})
  })
})

// ── flat-format migration ─────────────────────────────────────────────────────

describe('migration from flat format', () => {
  it('migrates flat overrides into a "default" bucket on load', () => {
    storageData[KEY] = JSON.stringify({ accent: '#old', font_size: 10 })
    const overrides = loadStyleOverrides('default')
    expect(overrides).toEqual({ accent: '#old', font_size: 10 })
    // After load, storage should be in the new scoped format
    const migrated = JSON.parse(storageData[KEY])
    expect(migrated.default).toEqual({ accent: '#old', font_size: 10 })
  })

  it('returns {} for other templates after migration', () => {
    storageData[KEY] = JSON.stringify({ accent: '#old' })
    loadStyleOverrides('default') // triggers migration
    expect(loadStyleOverrides('modern')).toEqual({})
  })
})
