import { describe, expect, it } from 'vitest'
import { cvFormToJson, initFormData, jsonToCvForm } from '../serialise'
import type { CvFormData } from '../types'

// ── initFormData ──────────────────────────────────────────────────────────────

describe('initFormData', () => {
  it('returns null for invalid JSON', () => {
    expect(initFormData('not json')).toBeNull()
    expect(initFormData('')).toBeNull()
    expect(initFormData('{')).toBeNull()
  })

  it('returns parsed form data for valid JSON', () => {
    const result = initFormData(JSON.stringify({ identity: { name: 'Alice' } }))
    expect(result).not.toBeNull()
    expect(result?.identity.name).toBe('Alice')
  })
})

// ── jsonToCvForm ──────────────────────────────────────────────────────────────

describe('jsonToCvForm', () => {
  it('parses identity fields', () => {
    const form = jsonToCvForm({
      identity: {
        name: 'Alice',
        headline: 'Engineer',
        contact: [{ type: 'email', key: '', value: 'a@b.com' }],
      },
    })
    expect(form.identity.name).toBe('Alice')
    expect(form.identity.headline).toBe('Engineer')
    expect(form.identity.contact).toHaveLength(1)
    expect(form.identity.contact[0].value).toBe('a@b.com')
  })

  it('defaults missing fields to empty strings / empty arrays', () => {
    const form = jsonToCvForm({})
    expect(form.identity.name).toBe('')
    expect(form.identity.headline).toBe('')
    expect(form.identity.contact).toEqual([])
    expect(form.summary).toBe('')
    expect(form.experience).toEqual([])
    expect(form.skills).toEqual([])
  })

  it('parses highlights as newline-joined string', () => {
    const form = jsonToCvForm({
      experience: [{ title: 'Dev', highlights: ['Led team', 'Shipped v2'] }],
    })
    expect(form.experience[0].highlights).toBe('Led team\nShipped v2')
  })

  it('parses tags as comma-joined string', () => {
    const form = jsonToCvForm({
      experience: [{ title: 'Dev', tags: ['TypeScript', 'React'] }],
    })
    expect(form.experience[0].tags).toBe('TypeScript, React')
  })

  it('parses skills groups', () => {
    const form = jsonToCvForm({
      skills: [{ name: 'Languages', entries: ['TS', 'Go'] }],
    })
    expect(form.skills[0].name).toBe('Languages')
    expect(form.skills[0].entries).toBe('TS, Go')
  })
})

// ── parseLanguages — legacy key fallback ──────────────────────────────────────

describe('jsonToCvForm — parseLanguages', () => {
  it('parses modern title/subtitle keys', () => {
    const form = jsonToCvForm({
      languages: [{ title: 'Spanish', subtitle: 'B2' }],
    })
    expect(form.languages[0].title).toBe('Spanish')
    expect(form.languages[0].subtitle).toBe('B2')
  })

  it('falls back to legacy language/level keys', () => {
    const form = jsonToCvForm({
      languages: [{ language: 'French', level: 'C1' }],
    })
    expect(form.languages[0].title).toBe('French')
    expect(form.languages[0].subtitle).toBe('C1')
  })

  it('prefers title over legacy language key', () => {
    const form = jsonToCvForm({
      languages: [{ title: 'German', language: 'Deutsch', level: 'Native' }],
    })
    expect(form.languages[0].title).toBe('German')
  })
})

// ── cvFormToJson ──────────────────────────────────────────────────────────────

describe('cvFormToJson', () => {
  const emptyForm: CvFormData = {
    identity: { name: 'Alice', headline: '', contact: [] },
    summary: '',
    experience: [],
    education: [],
    skills: [],
    languages: [],
    certifications: [],
    side_projects: [],
    awards: [],
    _extra: {},
  }

  it('omits empty summary', () => {
    const json = cvFormToJson(emptyForm)
    expect(json.summary).toBeUndefined()
  })

  it('includes non-empty summary', () => {
    const json = cvFormToJson({ ...emptyForm, summary: 'A strong profile.' })
    expect(json.summary).toBe('A strong profile.')
  })

  it('omits contact entries with empty value', () => {
    const json = cvFormToJson({
      ...emptyForm,
      identity: {
        ...emptyForm.identity,
        contact: [
          { type: 'email', key: '', value: 'a@b.com' },
          { type: 'phone', key: '', value: '' },
        ],
      },
    })
    expect((json.identity as { contact: unknown[] }).contact).toHaveLength(1)
  })

  it('omits generic items where all fields are empty', () => {
    const json = cvFormToJson({
      ...emptyForm,
      experience: [
        { title: '', subtitle: '', period: '', description: '', highlights: '', tags: '' },
      ],
    })
    expect(json.experience).toBeUndefined()
  })

  it('includes generic items that have at least one field', () => {
    const json = cvFormToJson({
      ...emptyForm,
      experience: [
        { title: 'Dev', subtitle: '', period: '', description: '', highlights: '', tags: '' },
      ],
    })
    expect(Array.isArray(json.experience)).toBe(true)
  })

  it('serializes highlights back to an array', () => {
    const json = cvFormToJson({
      ...emptyForm,
      experience: [
        {
          title: 'Dev',
          subtitle: '',
          period: '',
          description: '',
          highlights: 'Point A\nPoint B',
          tags: '',
        },
      ],
    })
    expect((json.experience as Array<{ highlights: string[] }>)[0].highlights).toEqual([
      'Point A',
      'Point B',
    ])
  })
})

// ── round-trip fidelity ───────────────────────────────────────────────────────

describe('round-trip fidelity', () => {
  const rawCv = {
    identity: {
      name: 'Bob',
      headline: 'Full-Stack',
      contact: [
        { type: 'email', key: '', value: 'bob@example.com' },
        { type: 'linkedin', key: '', value: 'linkedin.com/in/bob' },
      ],
    },
    summary: 'Senior engineer.',
    experience: [
      {
        title: 'Lead Dev',
        subtitle: 'Acme',
        period: '2020–now',
        description: 'Led things.',
        highlights: ['Built X', 'Shipped Y'],
        tags: ['TypeScript', 'React'],
      },
    ],
    languages: [{ title: 'English', subtitle: 'Native' }],
    skills: [{ name: 'Frontend', entries: ['React', 'CSS'] }],
  }

  it('preserves unknown top-level fields through the round-trip', () => {
    const raw = {
      identity: { name: 'Test' },
      core_strengths: ['Leadership', 'Communication'],
      leadership: [{ title: 'VP Eng', subtitle: 'Acme' }],
    }
    const form = jsonToCvForm(raw)
    expect(form._extra.core_strengths).toEqual(['Leadership', 'Communication'])
    expect(form._extra.leadership).toEqual([{ title: 'VP Eng', subtitle: 'Acme' }])
    const back = cvFormToJson(form)
    expect(back.core_strengths).toEqual(['Leadership', 'Communication'])
    expect(back.leadership).toEqual([{ title: 'VP Eng', subtitle: 'Acme' }])
  })

  it('cvFormToJson(jsonToCvForm(raw)) preserves all fields', () => {
    const form = jsonToCvForm(rawCv)
    const back = cvFormToJson(form)

    const id = back.identity as typeof rawCv.identity
    expect(id.name).toBe('Bob')
    expect(id.headline).toBe('Full-Stack')
    expect(id.contact).toHaveLength(2)

    expect(back.summary).toBe('Senior engineer.')

    const exp = (back.experience as typeof rawCv.experience)[0]
    expect(exp.title).toBe('Lead Dev')
    expect(exp.highlights).toEqual(['Built X', 'Shipped Y'])
    expect(exp.tags).toEqual(['TypeScript', 'React'])

    const langs = back.languages as Array<{ title: string; subtitle: string }>
    expect(langs[0].title).toBe('English')

    const skills = back.skills as typeof rawCv.skills
    expect(skills[0].entries).toEqual(['React', 'CSS'])
  })
})

// ── nested unknown-field preservation ──────────────────────────────────────────
//
// The top-level _extra bucket only covers unknown top-level keys (e.g. core_strengths).
// A field nested INSIDE a known section — e.g. `location` on an experience entry,
// `photo` on identity, `id` on a contact — used to be silently dropped the moment a
// CV round-tripped through the visual editor, because parseItem/parseSkills/etc only
// ever read the handful of fields the form UI knows how to render.
describe('nested unknown-field preservation', () => {
  it('preserves unknown fields on a generic item (experience/education/etc.)', () => {
    const raw = {
      experience: [
        {
          title: 'Staff Engineer',
          location: 'Remote',
          company_url: 'https://acme.example',
          id: 'exp-1',
        },
      ],
    }
    const form = jsonToCvForm(raw)
    expect(form.experience[0]._extra).toEqual({
      location: 'Remote',
      company_url: 'https://acme.example',
      id: 'exp-1',
    })
    const back = cvFormToJson(form)
    const exp = (back.experience as Record<string, unknown>[])[0]
    expect(exp.location).toBe('Remote')
    expect(exp.company_url).toBe('https://acme.example')
    expect(exp.id).toBe('exp-1')
    expect(exp.title).toBe('Staff Engineer')
  })

  it('preserves unknown fields on identity', () => {
    const raw = { identity: { name: 'Alice', photo: 'photo.jpg', pronouns: 'she/her' } }
    const form = jsonToCvForm(raw)
    expect(form.identity._extra).toEqual({ photo: 'photo.jpg', pronouns: 'she/her' })
    const back = cvFormToJson(form)
    const id = back.identity as Record<string, unknown>
    expect(id.photo).toBe('photo.jpg')
    expect(id.pronouns).toBe('she/her')
  })

  it('preserves unknown fields on a contact entry', () => {
    const raw = {
      identity: {
        name: 'Alice',
        contact: [{ type: 'email', value: 'a@b.com', verified: true }],
      },
    }
    const form = jsonToCvForm(raw)
    expect(form.identity.contact[0]._extra).toEqual({ verified: true })
    const back = cvFormToJson(form)
    const contact = (back.identity as { contact: Record<string, unknown>[] }).contact
    expect(contact[0].verified).toBe(true)
  })

  it('preserves unknown fields on a skills group', () => {
    const raw = { skills: [{ name: 'Frontend', entries: ['React'], icon: 'code' }] }
    const form = jsonToCvForm(raw)
    expect(form.skills[0]._extra).toEqual({ icon: 'code' })
    const back = cvFormToJson(form)
    const skills = back.skills as Record<string, unknown>[]
    expect(skills[0].icon).toBe('code')
  })

  it('preserves unknown fields on a language entry', () => {
    const raw = { languages: [{ title: 'French', subtitle: 'C1', cefr_verified: true }] }
    const form = jsonToCvForm(raw)
    expect(form.languages[0]._extra).toEqual({ cefr_verified: true })
    const back = cvFormToJson(form)
    const langs = back.languages as Record<string, unknown>[]
    expect(langs[0].cefr_verified).toBe(true)
  })
})
