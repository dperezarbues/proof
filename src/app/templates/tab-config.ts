import type { Tab } from './types'

// Single source of truth for the editor's 4 top-level tabs — id, order, and
// which `editor` namespace translation key holds the label. Consumed by both
// StepNav (desktop/tablet step nav) and TemplatesGallery's mobile tab bar,
// which previously hand-duplicated this same 4-entry list independently.
export const TAB_CONFIG: {
  id: Tab
  labelKey: 'tabData' | 'tabTemplate' | 'tabLayout' | 'tabStyle'
}[] = [
  { id: 'data', labelKey: 'tabData' },
  { id: 'template', labelKey: 'tabTemplate' },
  { id: 'layout', labelKey: 'tabLayout' },
  { id: 'style', labelKey: 'tabStyle' },
]
