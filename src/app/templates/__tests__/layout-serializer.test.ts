import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseLayoutStructure } from '../layout-serializer'

describe('parseLayoutStructure', () => {
  it('parses a valid layout', () => {
    const result = parseLayoutStructure({
      header: { style: 'split' },
      sections: [{ id: 'summary', breakable: true }],
    })
    expect(result.header).toEqual({ style: 'split' })
    expect(result.sections).toEqual([
      { kind: 'full', key: 'summary', id: 'summary', breakable: true },
    ])
  })

  it('parses sidebar_sections as strings and objects', () => {
    const result = parseLayoutStructure({
      header: { style: 'stacked' },
      sections: [],
      sidebar_sections: ['contact', { id: 'skills', breakable: false }],
    })
    expect(result.sidebarSections).toEqual([
      { id: 'contact', breakable: true },
      { id: 'skills', breakable: false },
    ])
  })

  it('parses columns sections within the allowed range', () => {
    const result = parseLayoutStructure({
      header: { style: 'split' },
      sections: [
        { type: 'columns', columns: 2, content: [['skills'], ['langs']], breakable: true },
      ],
    })
    expect(result.sections).toEqual([
      {
        kind: 'columns',
        key: 'columns-0',
        columns: 2,
        content: [['skills'], ['langs']],
        breakable: true,
      },
    ])
  })

  // Regression: this used to fall back to the raw, unvalidated input on
  // schema failure — a hostile or corrupted layout (e.g. from an imported
  // bundle) crashed the editor on load and re-crashed on every reload, with
  // no in-app recovery. It must now degrade to an empty, safe layout instead.
  it('falls back to an empty, safe layout on malformed sidebar_sections', () => {
    const result = parseLayoutStructure({
      header: { style: 'stacked' },
      sections: [{ id: 'summary', breakable: true }],
      sidebar_sections: 'not-an-array',
    })
    expect(result).toEqual({ header: { style: 'stacked' }, sections: [] })
  })

  it('falls back to an empty, safe layout on an out-of-range columns value', () => {
    const result = parseLayoutStructure({
      header: { style: 'split' },
      sections: [{ type: 'columns', columns: 1e9, content: [[], []], breakable: true }],
    })
    expect(result).toEqual({ header: { style: 'stacked' }, sections: [] })
  })

  it('falls back to an empty, safe layout on completely malformed input', () => {
    const result = parseLayoutStructure({ garbage: true })
    expect(result).toEqual({ header: { style: 'stacked' }, sections: [] })
  })

  // 7 of 12 shipped layout files omit header entirely; it must default, not reject.
  it('defaults header to stacked when omitted, without discarding sections', () => {
    const result = parseLayoutStructure({
      sections: [{ id: 'summary', breakable: true }],
    })
    expect(result).toEqual({
      header: { style: 'stacked' },
      sections: [{ kind: 'full', key: 'summary', id: 'summary', breakable: true }],
    })
  })

  // sidebar-default.json uses this value; it must be a valid header.style.
  it('accepts "sidebar" as a valid header.style', () => {
    const result = parseLayoutStructure({
      header: { style: 'sidebar' },
      sections: [{ id: 'summary', breakable: true }],
    })
    expect(result.header).toEqual({ style: 'sidebar' })
    expect(result.sections).toHaveLength(1)
  })

  // Every layout file the app ships should round-trip through this too.
  it('accepts every shipped default layout file without losing sections', () => {
    const dir = join(__dirname, '../../../layouts')
    const files = readdirSync(dir).filter((f) => f.endsWith('.json'))
    expect(files.length).toBeGreaterThan(0)
    for (const file of files) {
      const raw = JSON.parse(readFileSync(join(dir, file), 'utf-8'))
      const rawSectionCount = Array.isArray(raw.sections) ? raw.sections.length : 0
      const result = parseLayoutStructure(raw)
      expect(result.sections.length, `${file}: sections were dropped`).toBe(rawSectionCount)
    }
  })
})
