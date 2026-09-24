import type { DragEndEvent, SensorDescriptor } from '@dnd-kit/core'

type StyleParamBase = { key: string; label: string; group?: string; canonical?: string }

export type StyleParam =
  | (StyleParamBase & { type: 'color'; default: string })
  | (StyleParamBase & {
      type: 'range'
      min: number
      max: number
      step: number
      unit: string
      default: number
    })
  | (StyleParamBase & {
      type: 'select'
      options: Array<{ label: string; value: string }>
      default: string
    })
  | (StyleParamBase & { type: 'toggle'; default: string })
  | (StyleParamBase & { type: 'text'; placeholder?: string; default: string })

export type StyleValues = Record<string, string | number>

export type SectionWithSpacing = {
  id: string
  breakable: boolean
  pre_spacing?: number
  post_spacing?: number
}

export type FullSection = SectionWithSpacing & {
  kind: 'full'
  key: string
}
export type ColumnsSection = {
  kind: 'columns'
  key: string
  columns: number
  content: string[][]
  breakable: boolean
  pre_spacing?: number
  post_spacing?: number
}
export type EditorSection = FullSection | ColumnsSection
export type SidebarSection = SectionWithSpacing

export type LayoutStructure = {
  header: { style: 'split' | 'stacked' | 'sidebar' }
  sidebarSections?: SidebarSection[]
  sections: EditorSection[]
}

export type SerializedSection =
  | { id: string; breakable: boolean; pre_spacing?: number; post_spacing?: number }
  | {
      type: 'columns'
      columns: number
      content: string[][]
      breakable: boolean
      pre_spacing?: number
      post_spacing?: number
    }

export type LayoutData = {
  header: { style: 'split' | 'stacked' | 'sidebar' }
  sidebar_sections?: Array<{
    id: string
    breakable: boolean
    pre_spacing?: number
    post_spacing?: number
  }>
  sections: SerializedSection[]
}

export type SavedConfig = {
  id: string
  name: string
  templateId: string
  savedAt: number
  layout: LayoutData
  style: StyleValues
}

export type StyleOverrides = Record<string, string | number>

export type CompileState = 'idle' | 'loading' | 'compiling'

export type Panel = 'layout' | 'style' | 'saved'

/** The layout-mutation surface useLayoutEditor() hands to LayoutPanel — every
 * field here is passed as one grouped `editor` prop rather than flattened,
 * so adding a field means changing this type once instead of three places
 * (the hook's return, the Props type, and the JSX call site). getLabel is
 * deliberately excluded: it's needed by leaf components several levels
 * below LayoutPanel too, so it goes through LabelCtx instead of a prop. */
export type LayoutEditorHandle = {
  layout: LayoutStructure
  sensors: SensorDescriptor<object>[]
  hasSidebar: boolean
  available: string[]
  availableSb: string[]
  handleDragEnd: (e: DragEndEvent) => void
  handleSidebarDragEnd: (e: DragEndEvent) => void
  addFullSection: (id: string) => void
  addColumnsGroup: () => void
  removeSection: (key: string) => void
  updateSection: (key: string, fn: (s: EditorSection) => EditorSection) => void
  updateColumn: (key: string, ci: number, secs: string[]) => void
  updateSpacing: (key: string, pre: number | undefined, post: number | undefined) => void
  addSidebarSection: (id: string) => void
  removeSidebarSection: (id: string) => void
  toggleSidebarBreakable: (id: string) => void
  updateSidebarSpacing: (id: string, pre: number | undefined, post: number | undefined) => void
}

export type Tab = 'data' | 'template' | 'layout' | 'style'

export type Layout = { id: string; name: string; description: string; pdf?: string }
export type Template = {
  id: string
  name: string
  description: string
  layouts: Layout[]
  styleParams?: StyleParam[]
}
