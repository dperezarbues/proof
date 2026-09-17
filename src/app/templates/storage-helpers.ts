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

// ── Current template + layout-variant selection ─────────────────────────────
//
// Just the *pointer* — which template/layout the user last had selected, so a
// fresh visit returns to it instead of always resetting to Default. The
// actual layout/style customization for that template is already handled by
// loadLayoutOverride/loadStyleOverrides below, scoped per template — this
// doesn't duplicate or override any of that.

type CurrentTemplateRef = { templateId: string; layoutId: string }

export function loadCurrentTemplate(): CurrentTemplateRef | null {
  try {
    const raw = getItem(KEYS.currentTemplate)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<CurrentTemplateRef>
    if (typeof parsed.templateId !== 'string' || typeof parsed.layoutId !== 'string') return null
    return { templateId: parsed.templateId, layoutId: parsed.layoutId }
  } catch {
    return null
  }
}

export function persistCurrentTemplate(templateId: string, layoutId: string): boolean {
  return setItem(KEYS.currentTemplate, JSON.stringify({ templateId, layoutId }))
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
//
// Scoped by (templateId, layoutId), not just templateId: a template like
// "default" has multiple structurally distinct base layouts (Split/Classic/
// Alt), so an override persisted while editing one variant must never be
// reapplied when switching to a different variant of the same template —
// that would silently discard whichever variant's own JSON should be in
// effect, making the layout-variant switcher appear to do nothing.

type ScopedLayouts = Record<string, Record<string, unknown>>

function scopeKey(templateId: string, layoutId: string): string {
  return `${templateId}::${layoutId}`
}

function readScopedLayouts(): ScopedLayouts {
  try {
    return JSON.parse(getItem(KEYS.layoutOverrides) ?? '{}') as ScopedLayouts
  } catch {
    return {}
  }
}

export function loadLayoutOverride(
  templateId: string,
  layoutId: string,
): Record<string, unknown> | null {
  return readScopedLayouts()[scopeKey(templateId, layoutId)] ?? null
}

export function persistLayoutOverride(
  templateId: string,
  layoutId: string,
  layout: Record<string, unknown>,
): boolean {
  const next = mutateStored(KEYS.layoutOverrides, readScopedLayouts, (scoped) => ({
    ...scoped,
    [scopeKey(templateId, layoutId)]: layout,
  }))
  return next !== null
}

export function clearLayoutOverride(templateId: string, layoutId: string): boolean {
  const key = scopeKey(templateId, layoutId)
  const next = mutateStored(KEYS.layoutOverrides, readScopedLayouts, (scoped) => {
    const { [key]: _removed, ...rest } = scoped
    return rest
  })
  return next !== null
}
