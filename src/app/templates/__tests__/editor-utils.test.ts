import { describe, expect, it } from 'vitest'
import { resolveQrUrl } from '../cv-editor/cv-utils'
import {
  parseLayoutStructure,
  parseStyleValues,
  serializeForTypst,
  serializeLayout,
  usedIds,
} from '../layout-serializer'
import type { EditorSection, LayoutStructure, StyleParam } from '../types'

// ── serializeLayout ───────────────────────────────────────────────────────────

describe('serializeLayout', () => {
  it('serializes a full section', () => {
    const layout: LayoutStructure = {
      header: { style: 'stacked' },
      sections: [{ kind: 'full', key: 'work', id: 'work', breakable: true }],
    }
    expect(serializeLayout(layout)).toEqual({
      header: { style: 'stacked' },
      sections: [{ id: 'work', breakable: true }],
    })
  })

  it('serializes a columns section', () => {
    const layout: LayoutStructure = {
      header: { style: 'split' },
      sections: [
        {
          kind: 'columns',
          key: 'columns-0',
          columns: 2,
          content: [['skills'], ['languages']],
          breakable: false,
        },
      ],
    }
    const result = serializeLayout(layout)
    expect(result.sections[0]).toEqual({
      type: 'columns',
      columns: 2,
      content: [['skills'], ['languages']],
      breakable: false,
    })
  })

  it('includes sidebar_sections when present', () => {
    const layout: LayoutStructure = {
      header: { style: 'split' },
      sidebarSections: [{ id: 'skills', breakable: true }],
      sections: [],
    }
    const result = serializeLayout(layout)
    expect(result.sidebar_sections).toEqual([{ id: 'skills', breakable: true }])
  })

  it('omits sidebar_sections when undefined', () => {
    const layout: LayoutStructure = {
      header: { style: 'stacked' },
      sections: [],
    }
    const result = serializeLayout(layout)
    expect(result).not.toHaveProperty('sidebar_sections')
  })

  it('includes spacing only when set', () => {
    const layout: LayoutStructure = {
      header: { style: 'stacked' },
      sections: [
        { kind: 'full', key: 'work', id: 'work', breakable: true, pre_spacing: 0.5 },
        { kind: 'full', key: 'edu', id: 'edu', breakable: true },
      ],
    }
    const [with_pre, without] = serializeLayout(layout).sections
    expect(with_pre).toHaveProperty('pre_spacing', 0.5)
    expect(without).not.toHaveProperty('pre_spacing')
    expect(without).not.toHaveProperty('post_spacing')
  })
})

// ── serializeForTypst ─────────────────────────────────────────────────────────

describe('serializeForTypst', () => {
  const layout: LayoutStructure = {
    header: { style: 'stacked' },
    sections: [{ kind: 'full', key: 'work', id: 'work', breakable: true }],
  }

  it('omits style key when style is empty', () => {
    const result = serializeForTypst(layout, {})
    expect(result).not.toHaveProperty('style')
  })

  it('includes style key when style has entries', () => {
    const result = serializeForTypst(layout, { accent: '#ff0000' })
    expect(result.style).toEqual({ accent: '#ff0000' })
  })
})

// ── parseLayoutStructure ──────────────────────────────────────────────────────

describe('parseLayoutStructure', () => {
  it('parses full sections', () => {
    const raw = {
      header: { style: 'stacked' },
      sections: [{ id: 'work', breakable: true }],
    }
    const result = parseLayoutStructure(raw)
    expect(result.sections).toEqual([{ kind: 'full', key: 'work', id: 'work', breakable: true }])
  })

  it('parses columns sections and assigns incrementing keys', () => {
    const raw = {
      header: { style: 'split' },
      sections: [
        { type: 'columns', columns: 2, content: [['skills'], ['langs']], breakable: false },
        { type: 'columns', columns: 2, content: [['certs'], []], breakable: true },
      ],
    }
    const { sections } = parseLayoutStructure(raw)
    expect(sections[0]).toMatchObject({ kind: 'columns', key: 'columns-0' })
    expect(sections[1]).toMatchObject({ kind: 'columns', key: 'columns-1' })
  })

  it('parses sidebar_sections as objects', () => {
    const raw = {
      header: { style: 'split' },
      sections: [],
      sidebar_sections: [{ id: 'skills', breakable: false, pre_spacing: 0.3 }],
    }
    const result = parseLayoutStructure(raw)
    expect(result.sidebarSections).toEqual([{ id: 'skills', breakable: false, pre_spacing: 0.3 }])
  })

  it('parses sidebar_sections as legacy strings', () => {
    const raw = {
      header: { style: 'split' },
      sections: [],
      sidebar_sections: ['skills', 'education'],
    }
    const result = parseLayoutStructure(raw)
    expect(result.sidebarSections).toEqual([
      { id: 'skills', breakable: true },
      { id: 'education', breakable: true },
    ])
  })

  it('omits sidebarSections when not present in raw', () => {
    const raw = { header: { style: 'stacked' }, sections: [] }
    const result = parseLayoutStructure(raw)
    expect(result.sidebarSections).toBeUndefined()
  })

  it('defaults header to stacked when missing', () => {
    const result = parseLayoutStructure({ sections: [] })
    expect(result.header).toEqual({ style: 'stacked' })
  })

  it('preserves spacing on full sections', () => {
    const raw = {
      header: { style: 'stacked' },
      sections: [{ id: 'work', breakable: true, pre_spacing: 0.5, post_spacing: 0.2 }],
    }
    const [section] = parseLayoutStructure(raw).sections
    expect(section).toMatchObject({ pre_spacing: 0.5, post_spacing: 0.2 })
  })

  it('round-trips through serializeLayout', () => {
    const original: LayoutStructure = {
      header: { style: 'split' },
      sidebarSections: [{ id: 'skills', breakable: true }],
      sections: [
        { kind: 'full', key: 'work', id: 'work', breakable: false, pre_spacing: 0.4 },
        {
          kind: 'columns',
          key: 'columns-0',
          columns: 2,
          content: [['certs'], ['langs']],
          breakable: true,
        },
      ],
    }
    const serialized = serializeLayout(original)
    const parsed = parseLayoutStructure(serialized as Record<string, unknown>)
    expect(parsed.header).toEqual(original.header)
    expect(parsed.sidebarSections).toEqual(original.sidebarSections)
    expect(parsed.sections[0]).toMatchObject({
      kind: 'full',
      id: 'work',
      breakable: false,
      pre_spacing: 0.4,
    })
    expect(parsed.sections[1]).toMatchObject({
      kind: 'columns',
      columns: 2,
      content: [['certs'], ['langs']],
    })
  })
})

// ── parseStyleValues ──────────────────────────────────────────────────────────

describe('parseStyleValues', () => {
  const params: StyleParam[] = [
    { key: 'accent', type: 'color', labelKey: 'test.accent', default: '#000000' },
    {
      key: 'font_size',
      type: 'range',
      labelKey: 'test.font_size',
      min: 8,
      max: 16,
      step: 0.5,
      unit: 'pt',
      default: 10,
    },
    {
      key: 'font',
      type: 'select',
      labelKey: 'test.font',
      options: [{ label: 'Inter', value: 'inter' }],
      default: 'inter',
    },
  ]

  it('uses values from raw when present', () => {
    const raw = { style: { accent: '#ff0000', font_size: 12, font: 'inter' } }
    const result = parseStyleValues(raw, params)
    expect(result).toEqual({ accent: '#ff0000', font_size: 12, font: 'inter' })
  })

  it('falls back to param default when key missing from raw', () => {
    const result = parseStyleValues({ style: {} }, params)
    expect(result).toEqual({ accent: '#000000', font_size: 10, font: 'inter' })
  })

  it('falls back to default for range param when value is not a number', () => {
    const raw = { style: { font_size: 'big' } }
    const result = parseStyleValues(raw, params)
    expect(result.font_size).toBe(10)
  })

  it('applies override when key not in raw', () => {
    const result = parseStyleValues({ style: {} }, params, { accent: '#aabbcc' })
    expect(result.accent).toBe('#aabbcc')
  })

  it('raw value wins over override', () => {
    const raw = { style: { accent: '#ff0000' } }
    const result = parseStyleValues(raw, params, { accent: '#aabbcc' })
    expect(result.accent).toBe('#ff0000')
  })

  it('returns empty object for empty params', () => {
    const result = parseStyleValues({ style: { accent: '#ff0000' } }, [])
    expect(result).toEqual({})
  })
})

// ── resolveQrUrl ──────────────────────────────────────────────────────────────

describe('resolveQrUrl', () => {
  it('returns explicit qr_url when set', () => {
    expect(resolveQrUrl('{}', { qr_url: 'https://example.com' })).toBe('https://example.com')
  })

  it('ignores whitespace-only qr_url', () => {
    const cv = JSON.stringify({ identity: { linkedin: 'linkedin.com/in/test' } })
    expect(resolveQrUrl(cv, { qr_url: '   ' })).toBe('https://linkedin.com/in/test')
  })

  it('prepends https:// when linkedin value has no scheme', () => {
    const cv = JSON.stringify({
      identity: { contact: [{ type: 'linkedin', value: 'linkedin.com/in/user' }] },
    })
    expect(resolveQrUrl(cv, {})).toBe('https://linkedin.com/in/user')
  })

  it('returns linkedin contact value as-is when already https', () => {
    const cv = JSON.stringify({
      identity: { contact: [{ type: 'linkedin', value: 'https://linkedin.com/in/user' }] },
    })
    expect(resolveQrUrl(cv, {})).toBe('https://linkedin.com/in/user')
  })

  it('falls back to identity.linkedin when no contact entry', () => {
    const cv = JSON.stringify({ identity: { linkedin: 'linkedin.com/in/fallback' } })
    expect(resolveQrUrl(cv, {})).toBe('https://linkedin.com/in/fallback')
  })

  it('returns linkedin.com when no linkedin info at all', () => {
    expect(resolveQrUrl(JSON.stringify({ identity: {} }), {})).toBe('https://linkedin.com')
  })

  it('returns linkedin.com on invalid JSON', () => {
    expect(resolveQrUrl('not-json', {})).toBe('https://linkedin.com')
  })
})

// ── usedIds ───────────────────────────────────────────────────────────────────

describe('usedIds', () => {
  it('collects ids from full sections', () => {
    const sections: EditorSection[] = [
      { kind: 'full', key: 'work', id: 'work', breakable: true },
      { kind: 'full', key: 'edu', id: 'edu', breakable: true },
    ]
    expect(usedIds(sections)).toEqual(new Set(['work', 'edu']))
  })

  it('collects ids from columns content', () => {
    const sections: EditorSection[] = [
      {
        kind: 'columns',
        key: 'columns-0',
        columns: 2,
        content: [['skills', 'certs'], ['langs']],
        breakable: true,
      },
    ]
    expect(usedIds(sections)).toEqual(new Set(['skills', 'certs', 'langs']))
  })

  it('combines full and columns ids', () => {
    const sections: EditorSection[] = [
      { kind: 'full', key: 'work', id: 'work', breakable: true },
      {
        kind: 'columns',
        key: 'columns-0',
        columns: 2,
        content: [['skills'], ['langs']],
        breakable: true,
      },
    ]
    expect(usedIds(sections)).toEqual(new Set(['work', 'skills', 'langs']))
  })

  it('returns empty set for no sections', () => {
    expect(usedIds([])).toEqual(new Set())
  })
})
