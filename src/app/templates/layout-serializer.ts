import { LayoutImportSchema } from './schemas'
import type {
  EditorSection,
  LayoutData,
  LayoutStructure,
  SidebarSection,
  StyleOverrides,
  StyleParam,
  StyleValues,
} from './types'

export const DEFAULT_PRE = 0.5
export const DEFAULT_POST = 0.2

/** Converts the editor's mutable LayoutStructure into the serializable LayoutData format used by Typst. */
export function serializeLayout(layout: LayoutStructure): LayoutData {
  return {
    header: layout.header,
    ...(layout.sidebarSections !== undefined && {
      sidebar_sections: layout.sidebarSections.map((s) => ({
        id: s.id,
        breakable: s.breakable,
        ...(s.pre_spacing != null && { pre_spacing: s.pre_spacing }),
        ...(s.post_spacing != null && { post_spacing: s.post_spacing }),
      })),
    }),
    sections: layout.sections.map((s) =>
      s.kind === 'full'
        ? {
            id: s.id,
            breakable: s.breakable,
            ...(s.pre_spacing != null && { pre_spacing: s.pre_spacing }),
            ...(s.post_spacing != null && { post_spacing: s.post_spacing }),
          }
        : {
            type: 'columns' as const,
            columns: s.columns,
            content: s.content,
            breakable: s.breakable,
            ...(s.pre_spacing != null && { pre_spacing: s.pre_spacing }),
            ...(s.post_spacing != null && { post_spacing: s.post_spacing }),
          },
    ),
  }
}

/** Merges layout and style into the single object passed to the Typst compiler. Omits `style` if empty. */
export function serializeForTypst(
  layout: LayoutStructure,
  style: StyleValues,
): LayoutData & { style?: StyleValues } {
  return {
    ...serializeLayout(layout),
    ...(Object.keys(style).length > 0 && { style }),
  }
}

/** Parses a raw LayoutData object (from JSON or localStorage) into the editor's LayoutStructure. */
export function parseLayoutStructure(raw: Record<string, unknown>): LayoutStructure {
  const parsed = LayoutImportSchema.safeParse(raw)
  if (!parsed.success) {
    // Malformed shape (e.g. a hostile or corrupted import) — falling back to
    // `raw` here used to let unvalidated data straight through, which was
    // the root cause of a crash that re-triggered on every reload. An empty,
    // valid layout is always safe to render; the user can rebuild it.
    return { header: { style: 'stacked' }, sections: [] }
  }
  const validated = parsed.data
  let colIdx = 0
  // Cast to Record<string, unknown> for the branch below: Zod's `.passthrough()`
  // gives the plain-section arm an index signature, which defeats TS's
  // literal-discriminant narrowing on `type` even though the runtime check
  // is exact. Shape is already guaranteed by LayoutImportSchema above.
  const sections: EditorSection[] = (
    validated.sections as unknown as Record<string, unknown>[]
  ).map((s) => {
    if (s.type === 'columns') {
      return {
        kind: 'columns' as const,
        key: `columns-${colIdx++}`,
        columns: s.columns as number,
        content: s.content as string[][],
        breakable: s.breakable as boolean,
        ...(s.pre_spacing != null && { pre_spacing: s.pre_spacing as number }),
        ...(s.post_spacing != null && { post_spacing: s.post_spacing as number }),
      }
    }
    return {
      kind: 'full' as const,
      key: s.id as string,
      id: s.id as string,
      breakable: s.breakable as boolean,
      ...(s.pre_spacing != null && { pre_spacing: s.pre_spacing as number }),
      ...(s.post_spacing != null && { post_spacing: s.post_spacing as number }),
    }
  })

  let sidebarSections: SidebarSection[] | undefined
  if (validated.sidebar_sections != null) {
    sidebarSections = validated.sidebar_sections.map((s) =>
      typeof s === 'string'
        ? { id: s, breakable: true }
        : {
            id: s.id,
            breakable: s.breakable ?? true,
            ...(s.pre_spacing != null && { pre_spacing: s.pre_spacing as number }),
            ...(s.post_spacing != null && { post_spacing: s.post_spacing as number }),
          },
    )
  }

  return {
    header: validated.header,
    sidebarSections,
    sections,
  }
}

/** Extracts style values from a raw layout object, merging user overrides and falling back to param defaults. */
export function parseStyleValues(
  raw: Record<string, unknown>,
  styleParams: StyleParam[],
  overrides?: StyleOverrides,
): StyleValues {
  const rawStyle = (raw.style as StyleValues) ?? {}
  const style: StyleValues = {}
  for (const p of styleParams) {
    const ck = p.canonical ?? p.key
    const override = overrides?.[p.key] ?? overrides?.[ck]
    if (p.type === 'range') {
      const v = rawStyle[p.key] ?? override
      const num = typeof v === 'number' ? v : p.default
      style[p.key] = Math.min(Math.max(num, p.min), p.max)
    } else {
      style[p.key] =
        (rawStyle[p.key] as string | undefined) ?? (override as string | undefined) ?? p.default
    }
  }
  return style
}

/** Returns the set of all section IDs currently placed in the layout (full and column sections). */
export function usedIds(sections: EditorSection[]): Set<string> {
  const used = new Set<string>()
  for (const s of sections) {
    if (s.kind === 'full') used.add(s.id)
    else for (const col of s.content) for (const id of col) used.add(id)
  }
  return used
}
