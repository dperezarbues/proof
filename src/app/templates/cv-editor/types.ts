export type ContactItem = {
  type: string
  key: string
  value: string
  /** Preserves any fields on this contact entry the form doesn't know about. */
  _extra?: Record<string, unknown>
}

export type GenericItem = {
  title: string
  subtitle: string
  period: string
  description: string
  highlights: string // one per line
  tags: string // comma-separated
  /** Preserves any fields on this item the form doesn't know about. */
  _extra?: Record<string, unknown>
}

export type SkillGroup = {
  name: string
  entries: string // comma-separated
  /** Preserves any fields on this skill group the form doesn't know about. */
  _extra?: Record<string, unknown>
}

export type CvFormData = {
  identity: {
    name: string
    headline: string
    contact: ContactItem[]
    /** Preserves any identity fields the form doesn't know about (e.g. photo, location). */
    _extra?: Record<string, unknown>
  }
  summary: string
  experience: GenericItem[]
  education: GenericItem[]
  skills: SkillGroup[]
  languages: GenericItem[]
  certifications: GenericItem[]
  side_projects: GenericItem[]
  awards: GenericItem[]
  /** Preserves any top-level fields not handled by the form editor (e.g. core_strengths, leadership). */
  _extra: Record<string, unknown>
}

export const emptyGenericItem = (): GenericItem => ({
  title: '',
  subtitle: '',
  period: '',
  description: '',
  highlights: '',
  tags: '',
})
