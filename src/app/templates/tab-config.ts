import type { Tab } from './types'

// Single source of truth for the editor's 4 top-level tabs — id, order, and
// which `editor` namespace translation key holds the label. Consumed by both
// StepNav (desktop/tablet step nav) and TemplatesGallery's mobile tab bar —
// keep it that way rather than letting either hand-duplicate this list.
export const TAB_CONFIG: {
  id: Tab
  labelKey: 'tabData' | 'tabTemplate' | 'tabLayout' | 'tabStyle'
}[] = [
  { id: 'data', labelKey: 'tabData' },
  { id: 'template', labelKey: 'tabTemplate' },
  { id: 'layout', labelKey: 'tabLayout' },
  { id: 'style', labelKey: 'tabStyle' },
]
