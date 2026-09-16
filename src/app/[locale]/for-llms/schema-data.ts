import templatesData from '@/data/templates.json'

type StyleParam = {
  key: string
  type: 'select' | 'range' | 'color' | 'toggle' | 'text'
  options?: { label: string; value: string }[]
  min?: number
  max?: number
  unit?: string
  default: string | number
}

type TemplateData = {
  id: string
  styleParams: StyleParam[]
}

const templates = templatesData.templates as TemplateData[]
const sharedParams = templatesData.sharedStyleParams as StyleParam[]

function rangeLabel(p: StyleParam): string {
  switch (p.type) {
    case 'select':
      return (p.options ?? []).map((o) => o.label).join(', ')
    case 'range':
      return `${p.min} – ${p.max}${p.unit ? ` ${p.unit}` : ''}`
    case 'color':
      return 'any hex'
    case 'toggle':
      return '"true" | "false"'
    case 'text':
      return 'any URL'
  }
}

function defaultLabel(p: StyleParam): string {
  return p.type === 'toggle' || p.type === 'text' ? `"${p.default}"` : String(p.default)
}

function findParam(templateId: string, key: string): StyleParam | undefined {
  return templates.find((t) => t.id === templateId)?.styleParams.find((p) => p.key === key)
}

// section_pre/section_post aren't in sharedStyleParams — every template
// declares them individually — but 9 of the 10 use an identical range
// (sidebar widens both; see SECTION_SPACING_IS_UNIFORM below, checked by a
// test so this table can't silently go stale if that ever stops being true).
const REFERENCE_TEMPLATE_ID = 'default'
const sectionSpacingParams = ['section_pre', 'section_post']
  .map((key) => findParam(REFERENCE_TEMPLATE_ID, key))
  .filter((p): p is StyleParam => !!p)

export const SECTION_SPACING_IS_UNIFORM = templates
  .filter((t) => t.id !== 'sidebar')
  .every((t) =>
    sectionSpacingParams.every((ref) => {
      const p = t.styleParams.find((x) => x.key === ref.key)
      return p && p.min === ref.min && p.max === ref.max && p.default === ref.default
    }),
  )

// Section 4 "Common — all templates" table — derived from the shared style
// params every template's editor UI is built from, plus section_pre/post
// (see above), so this table can't drift from what the app actually offers.
export const commonStyleRows = [...sharedParams, ...sectionSpacingParams].map((p) => ({
  key: p.key,
  type: p.type === 'range' ? 'number' : p.type,
  range: rangeLabel(p),
  default: defaultLabel(p),
}))

// Section 4 accent_color / headline_size / section_rule_gap summary table.
export const accentColorRows = templates.map((t) => {
  const accent = t.styleParams.find((p) => p.key === 'accent_color')
  return {
    id: t.id,
    accentDefault: accent ? String(accent.default) : '—',
    headlineSize: t.styleParams.some((p) => p.key === 'headline_size') ? 'yes' : '—',
    sectionRuleGap: t.styleParams.some((p) => p.key === 'section_rule_gap') ? 'yes' : '—',
  }
})

// Section 4 banner-specific table.
export const bannerRows = (() => {
  const headerBg = findParam('banner', 'header_bg')
  return headerBg ? [{ key: 'header_bg', default: String(headerBg.default) }] : []
})()

// Section 4 sidebar-specific table — fixed display order, populated from
// whichever of these keys the sidebar template actually declares.
const SIDEBAR_KEY_ORDER = [
  'sidebar_bg',
  'sidebar_accent',
  'sidebar_link_color',
  'sidebar_text',
  'sidebar_ink',
  'sidebar_width',
  'accent_color',
] as const

export const sidebarRows = SIDEBAR_KEY_ORDER.map((key) => findParam('sidebar', key))
  .filter((p): p is StyleParam => !!p)
  .map((p) => ({ key: p.key, default: String(p.default) }))

// Exposed so a test can check the sidebarNote translation's hardcoded numbers
// (0.2–1.5em / 0.05–0.8em) still match the real widened ranges.
export const sidebarSectionSpacing = {
  pre: findParam('sidebar', 'section_pre'),
  post: findParam('sidebar', 'section_post'),
}
