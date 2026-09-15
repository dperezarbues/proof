import { getItem, KEYS, mutateStored, setItem } from '@/lib/storage'
import type { SavedConfig, StyleOverrides } from './types'

export function loadSaves(): SavedConfig[] {
  try {
    return JSON.parse(getItem(KEYS.saves) ?? '[]')
  } catch {
    return []
  }
}

/** Returns the new list on success, or null if the write failed (e.g. quota exceeded) — callers
 *  on the save path must surface that rather than assuming it worked. Goes through mutateStored
 *  so the mutation applies to whatever is CURRENTLY persisted, not a stale in-memory snapshot. */
export function mutateSaves(
  mutate: (current: SavedConfig[]) => SavedConfig[],
): SavedConfig[] | null {
  return mutateStored(KEYS.saves, loadSaves, mutate)
}

type ScopedOverrides = Record<string, StyleOverrides>

function readScoped(): ScopedOverrides {
  try {
    const raw = JSON.parse(getItem(KEYS.styleOverrides) ?? '{}') as Record<string, unknown>
    if (Object.keys(raw).length === 0) return {}
    // Detect old flat format: values are primitives rather than objects
    const firstVal = Object.values(raw)[0]
    if (typeof firstVal !== 'object' || firstVal === null) {
      // Migrate flat data into a "default" template bucket
      const migrated: ScopedOverrides = { default: raw as StyleOverrides }
      setItem(KEYS.styleOverrides, JSON.stringify(migrated))
      return migrated
    }
    return raw as ScopedOverrides
  } catch {
    return {}
  }
}

export function loadStyleOverrides(templateId: string): StyleOverrides {
  return readScoped()[templateId] ?? {}
}

export function persistStyleOverride(
  templateId: string,
  canonicalKey: string,
  value: string | number,
): boolean {
  const next = mutateStored(KEYS.styleOverrides, readScoped, (scoped) => ({
    ...scoped,
    [templateId]: { ...(scoped[templateId] ?? {}), [canonicalKey]: value },
  }))
  return next !== null
}

export function clearStyleOverrides(templateId: string, canonicalKeys: string[]): boolean {
  const next = mutateStored(KEYS.styleOverrides, readScoped, (scoped) => {
    const bucket = { ...(scoped[templateId] ?? {}) }
    for (const k of canonicalKeys) delete bucket[k]
    return { ...scoped, [templateId]: bucket }
  })
  return next !== null
}

// ── Layout overrides ──────────────────────────────────────────────────────────

type ScopedLayouts = Record<string, Record<string, unknown>>

function readScopedLayouts(): ScopedLayouts {
  try {
    return JSON.parse(getItem(KEYS.layoutOverrides) ?? '{}') as ScopedLayouts
  } catch {
    return {}
  }
}

export function loadLayoutOverride(templateId: string): Record<string, unknown> | null {
  return readScopedLayouts()[templateId] ?? null
}

export function persistLayoutOverride(
  templateId: string,
  layout: Record<string, unknown>,
): boolean {
  const next = mutateStored(KEYS.layoutOverrides, readScopedLayouts, (scoped) => ({
    ...scoped,
    [templateId]: layout,
  }))
  return next !== null
}

export function clearLayoutOverride(templateId: string): boolean {
  const next = mutateStored(KEYS.layoutOverrides, readScopedLayouts, (scoped) => {
    const { [templateId]: _removed, ...rest } = scoped
    return rest
  })
  return next !== null
}
