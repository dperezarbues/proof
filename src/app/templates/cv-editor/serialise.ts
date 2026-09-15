import type { ContactItem, CvFormData, GenericItem, SkillGroup } from './types'

const toLines = (arr: unknown): string =>
  Array.isArray(arr) ? (arr as string[]).filter(Boolean).join('\n') : ''

const fromLines = (s: string): string[] =>
  s
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

const toCommas = (arr: unknown): string =>
  Array.isArray(arr) ? (arr as string[]).filter(Boolean).join(', ') : ''

const fromCommas = (s: string): string[] =>
  s
    .split(',')
    .map((l) => l.trim())
    .filter(Boolean)

function extraKeys(raw: Record<string, unknown>, known: Set<string>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(raw)) {
    if (!known.has(k)) out[k] = v
  }
  return out
}

const GENERIC_ITEM_KEYS = new Set([
  'title',
  'subtitle',
  'period',
  'description',
  'highlights',
  'tags',
])
const CONTACT_KEYS = new Set(['type', 'key', 'value'])
const SKILL_GROUP_KEYS = new Set(['name', 'entries'])
const LANGUAGE_KEYS = new Set(['title', 'language', 'subtitle', 'level'])
const IDENTITY_KEYS = new Set(['name', 'headline', 'contact'])

function parseItem(raw: Record<string, unknown>): GenericItem {
  return {
    title: String(raw.title ?? ''),
    subtitle: String(raw.subtitle ?? ''),
    period: String(raw.period ?? ''),
    description: String(raw.description ?? ''),
    highlights: toLines(raw.highlights),
    tags: toCommas(raw.tags),
    _extra: extraKeys(raw, GENERIC_ITEM_KEYS),
  }
}

function serializeItem(item: GenericItem): Record<string, unknown> {
  const out: Record<string, unknown> = { ...item._extra }
  if (item.title) out.title = item.title
  if (item.subtitle) out.subtitle = item.subtitle
  if (item.period) out.period = item.period
  if (item.description) out.description = item.description
  const hl = fromLines(item.highlights)
  if (hl.length) out.highlights = hl
  const tags = fromCommas(item.tags)
  if (tags.length) out.tags = tags
  return out
}

function parseItems(arr: unknown): GenericItem[] {
  return Array.isArray(arr) ? (arr as Record<string, unknown>[]).map(parseItem) : []
}

function parseSkills(arr: unknown): SkillGroup[] {
  if (!Array.isArray(arr)) return []
  return (arr as Record<string, unknown>[]).map((g) => ({
    name: String(g.name ?? ''),
    entries: toCommas(g.entries),
    _extra: extraKeys(g, SKILL_GROUP_KEYS),
  }))
}

function parseLanguages(arr: unknown): GenericItem[] {
  if (!Array.isArray(arr)) return []
  return (arr as Record<string, unknown>[]).map((l) => ({
    title: String(l.title ?? l.language ?? ''),
    subtitle: String(l.subtitle ?? l.level ?? ''),
    period: '',
    description: '',
    highlights: '',
    tags: '',
    _extra: extraKeys(l, LANGUAGE_KEYS),
  }))
}

const KNOWN_CV_KEYS = new Set([
  'identity',
  'summary',
  'experience',
  'education',
  'skills',
  'languages',
  'certifications',
  'side_projects',
  'awards',
])

export function jsonToCvForm(raw: Record<string, unknown>): CvFormData {
  const identity = (raw.identity ?? {}) as Record<string, unknown>

  let contact: ContactItem[] = []
  if (Array.isArray(identity.contact)) {
    contact = (identity.contact as Record<string, unknown>[]).map((c) => ({
      type: String(c.type ?? 'web'),
      key: String(c.key ?? ''),
      value: String(c.value ?? ''),
      _extra: extraKeys(c, CONTACT_KEYS),
    }))
  }

  const _extra: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(raw)) {
    if (!KNOWN_CV_KEYS.has(k)) _extra[k] = v
  }

  return {
    identity: {
      name: String(identity.name ?? ''),
      headline: String(identity.headline ?? ''),
      contact,
      _extra: extraKeys(identity, IDENTITY_KEYS),
    },
    summary: String(raw.summary ?? ''),
    experience: parseItems(raw.experience),
    education: parseItems(raw.education),
    skills: parseSkills(raw.skills),
    languages: parseLanguages(raw.languages),
    certifications: parseItems(raw.certifications),
    side_projects: parseItems(raw.side_projects),
    awards: parseItems(raw.awards),
    _extra,
  }
}

export function cvFormToJson(form: CvFormData): Record<string, unknown> {
  const result: Record<string, unknown> = {
    ...form._extra,
    identity: {
      ...form.identity._extra,
      name: form.identity.name,
      headline: form.identity.headline,
      contact: form.identity.contact
        .filter((c) => c.value.trim())
        .map((c) => ({ ...c._extra, type: c.type, key: c.key, value: c.value })),
    },
  }

  if (form.summary.trim()) result.summary = form.summary.trim()

  const ser = (items: GenericItem[]) =>
    items.map(serializeItem).filter((i) => Object.keys(i).length > 0)

  const addIfNonEmpty = (key: string, items: unknown[]) => {
    if (items.length) result[key] = items
  }

  addIfNonEmpty('experience', ser(form.experience))
  addIfNonEmpty('education', ser(form.education))
  addIfNonEmpty(
    'skills',
    form.skills
      .filter((g) => g.name)
      .map((g) => ({ ...g._extra, name: g.name, entries: fromCommas(g.entries) })),
  )
  addIfNonEmpty(
    'languages',
    form.languages
      .filter((l) => l.title)
      .map((l) => ({ ...l._extra, title: l.title, subtitle: l.subtitle })),
  )
  addIfNonEmpty('certifications', ser(form.certifications))
  addIfNonEmpty('side_projects', ser(form.side_projects))
  addIfNonEmpty('awards', ser(form.awards))

  return result
}

export function initFormData(content: string): CvFormData | null {
  try {
    return jsonToCvForm(JSON.parse(content) as Record<string, unknown>)
  } catch {
    return null
  }
}
