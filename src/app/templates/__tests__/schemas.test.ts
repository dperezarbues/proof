import { describe, expect, it } from 'vitest'
import { CvSchema, DesignSchema, LayoutImportSchema, SectionDefListSchema } from '../schemas'

// ── CvSchema ──────────────────────────────────────────────────────────────────

describe('CvSchema', () => {
  it('accepts a minimal valid CV', () => {
    const result = CvSchema.safeParse({ identity: { name: 'Alice' } })
    expect(result.success).toBe(true)
  })

  it('accepts extra top-level fields (passthrough)', () => {
    const result = CvSchema.safeParse({
      identity: { name: 'Alice' },
      experience: [],
      custom_field: 'ok',
    })
    expect(result.success).toBe(true)
  })

  it('accepts extra identity fields (passthrough)', () => {
    const result = CvSchema.safeParse({
      identity: { name: 'Alice', headline: 'Engineer', contact: [] },
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing identity', () => {
    const result = CvSchema.safeParse({ experience: [] })
    expect(result.success).toBe(false)
  })

  it('rejects empty identity.name', () => {
    const result = CvSchema.safeParse({ identity: { name: '' } })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('identity.name is required')
  })

  it('rejects non-object input', () => {
    expect(CvSchema.safeParse('string').success).toBe(false)
    expect(CvSchema.safeParse(null).success).toBe(false)
    expect(CvSchema.safeParse([]).success).toBe(false)
  })
})

// ── LayoutImportSchema ────────────────────────────────────────────────────────

describe('LayoutImportSchema', () => {
  const validImport = {
    header: { style: 'stacked' },
    sections: [{ id: 'work', breakable: true }],
  }

  it('accepts a minimal valid layout import', () => {
    const result = LayoutImportSchema.safeParse(validImport)
    expect(result.success).toBe(true)
  })

  it('accepts columns sections', () => {
    const result = LayoutImportSchema.safeParse({
      header: { style: 'split' },
      sections: [
        { type: 'columns', columns: 2, content: [['skills'], ['langs']], breakable: true },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('accepts metadata fields from export (_name, _templateId)', () => {
    const result = LayoutImportSchema.safeParse({
      ...validImport,
      _name: 'My config',
      _templateId: 'default',
      _savedAt: 1234567890,
    })
    expect(result.success).toBe(true)
  })

  it('accepts optional style field', () => {
    const result = LayoutImportSchema.safeParse({
      ...validImport,
      style: { accent: '#ff0000' },
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing header', () => {
    const result = LayoutImportSchema.safeParse({ sections: [] })
    expect(result.success).toBe(false)
  })

  it('rejects invalid header.style value', () => {
    const result = LayoutImportSchema.safeParse({
      header: { style: 'centered' },
      sections: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing sections', () => {
    const result = LayoutImportSchema.safeParse({ header: { style: 'stacked' } })
    expect(result.success).toBe(false)
  })

  it('rejects non-object input', () => {
    expect(LayoutImportSchema.safeParse('string').success).toBe(false)
    expect(LayoutImportSchema.safeParse(null).success).toBe(false)
  })

  // Regression: a hostile/corrupted `columns` value used to sail through
  // unbounded, and every Typst template loops `range(n-cols)` over it —
  // large values hang the compile worker, and this is the one field an
  // import can set that the UI itself never produces.
  it('rejects out-of-range columns counts', () => {
    const base = { header: { style: 'split' as const }, breakable: true, type: 'columns' as const }
    expect(
      LayoutImportSchema.safeParse({
        ...validImport,
        sections: [{ ...base, columns: 1e9, content: [[], []] }],
      }).success,
    ).toBe(false)
    expect(
      LayoutImportSchema.safeParse({
        ...validImport,
        sections: [{ ...base, columns: 0, content: [[], []] }],
      }).success,
    ).toBe(false)
    expect(
      LayoutImportSchema.safeParse({
        ...validImport,
        sections: [{ ...base, columns: 2.5, content: [[], []] }],
      }).success,
    ).toBe(false)
  })

  it('accepts columns within the allowed range', () => {
    const result = LayoutImportSchema.safeParse({
      ...validImport,
      sections: [{ type: 'columns', columns: 4, content: [[], [], [], []], breakable: true }],
    })
    expect(result.success).toBe(true)
  })

  // Regression: sidebar_sections previously bypassed validation entirely —
  // parseLayoutStructure() read it straight off the raw input, so a
  // malformed value crashed the editor on load and again on every reload.
  it('validates sidebar_sections shape', () => {
    expect(
      LayoutImportSchema.safeParse({ ...validImport, sidebar_sections: ['contact'] }).success,
    ).toBe(true)
    expect(
      LayoutImportSchema.safeParse({
        ...validImport,
        sidebar_sections: [{ id: 'contact', breakable: true }],
      }).success,
    ).toBe(true)
    expect(
      LayoutImportSchema.safeParse({ ...validImport, sidebar_sections: 'contact' }).success,
    ).toBe(false)
    expect(LayoutImportSchema.safeParse({ ...validImport, sidebar_sections: [{}] }).success).toBe(
      false,
    )
  })
})

// ── DesignSchema ──────────────────────────────────────────────────────────────

describe('DesignSchema', () => {
  const validDesign = {
    templateId: 'default',
    layoutId: 'default',
    layout: { header: { style: 'stacked' }, sections: [] },
    style: { accent: '#ff0000' },
  }

  it('accepts a minimal valid design', () => {
    const result = DesignSchema.safeParse(validDesign)
    expect(result.success).toBe(true)
  })

  // Regression: qr_url isn't settable anywhere in the app's own Style
  // panel — the only way it arrives here is inside an imported bundle.
  // Trusting it let a shared bundle silently redirect the recipient's PDF
  // QR code to an attacker-controlled URL.
  it('strips qr_url from an imported design, preserving other style fields', () => {
    const result = DesignSchema.safeParse({
      ...validDesign,
      style: { accent: '#ff0000', qr_url: 'https://evil.example/phish' },
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.style).toEqual({ accent: '#ff0000' })
      expect('qr_url' in result.data.style).toBe(false)
    }
  })

  it('leaves style untouched when qr_url is absent', () => {
    const result = DesignSchema.safeParse(validDesign)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.style).toEqual({ accent: '#ff0000' })
  })
})

// ── SectionDefListSchema ───────────────────────────────────────────────────────

describe('SectionDefListSchema', () => {
  // Regression: `_sections` from a CV's JSON was cast with zero validation
  // and re-read on every render of the active CV — a malformed value
  // crashed the layout editor on load and again on every reload.
  it('accepts a valid section list', () => {
    const result = SectionDefListSchema.safeParse([
      { id: 'summary', label: 'Summary', locations: ['main', 'sidebar'] },
    ])
    expect(result.success).toBe(true)
  })

  it('rejects a malformed section list', () => {
    expect(SectionDefListSchema.safeParse('not-an-array').success).toBe(false)
    expect(SectionDefListSchema.safeParse({}).success).toBe(false)
    expect(SectionDefListSchema.safeParse([{ id: 'summary' }]).success).toBe(false)
    expect(
      SectionDefListSchema.safeParse([{ id: 'summary', label: 'Summary', locations: ['top'] }])
        .success,
    ).toBe(false)
  })
})
