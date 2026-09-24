export type SectionDef = {
  id: string
  label: string
  locations: ('main' | 'sidebar')[]
}

export const DEFAULT_SECTIONS: SectionDef[] = [
  { id: 'contact', label: 'Contact', locations: ['sidebar'] },
  { id: 'summary', label: 'Summary', locations: ['main', 'sidebar'] },
  { id: 'experience', label: 'Experience', locations: ['main'] },
  { id: 'awards', label: 'Awards', locations: ['main', 'sidebar'] },
  { id: 'skills', label: 'Skills', locations: ['main', 'sidebar'] },
  { id: 'education', label: 'Education', locations: ['main', 'sidebar'] },
  { id: 'languages', label: 'Languages', locations: ['main', 'sidebar'] },
  { id: 'certifications', label: 'Certifications', locations: ['main', 'sidebar'] },
  { id: 'side_projects', label: 'Side Projects', locations: ['main', 'sidebar'] },
]

/**
 * Maps each default section's id to its `cvEditor` translation key, so the
 * Layout tab can show the same localized names the Data tab already shows
 * (the ids and keys don't share a naming convention — `side_projects` vs.
 * `sideProjects` — hence a lookup instead of deriving one from the other).
 * Only applies to DEFAULT_SECTIONS itself: a section id/label coming from a
 * user's own CV JSON (the `_sections` override) is their real data and must
 * always render verbatim, even if it happens to reuse one of these ids.
 */
export const DEFAULT_SECTION_LABEL_KEYS: Record<string, string> = {
  contact: 'contact',
  summary: 'summary',
  experience: 'experience',
  awards: 'awards',
  skills: 'skills',
  education: 'education',
  languages: 'languages',
  certifications: 'certifications',
  side_projects: 'sideProjects',
}
