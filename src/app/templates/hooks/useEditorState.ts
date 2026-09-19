'use client'

import {
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useState } from 'react'
import { parseLayoutStructure } from '../layout-serializer'
import type { EditorSection, LayoutStructure } from '../types'

export function useEditorState(initialLayout: Record<string, unknown>) {
  const [layout, setLayout] = useState<LayoutStructure>(() => parseLayoutStructure(initialLayout))

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // ── Section mutations ─────────────────────────────────────────────────────────

  function updateSection(key: string, fn: (s: EditorSection) => EditorSection) {
    setLayout((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.key === key ? fn(s) : s)),
    }))
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    setLayout((prev) => {
      const from = prev.sections.findIndex((s) => s.key === String(active.id))
      const to = prev.sections.findIndex((s) => s.key === String(over.id))
      return { ...prev, sections: arrayMove(prev.sections, from, to) }
    })
  }

  function addFullSection(id: string) {
    setLayout((prev) => ({
      ...prev,
      sections: [...prev.sections, { kind: 'full', key: id, id, breakable: true }],
    }))
  }

  function addColumnsGroup() {
    const key = `columns-${crypto.randomUUID()}`
    setLayout((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        { kind: 'columns', key, columns: 2, content: [[], []], breakable: true },
      ],
    }))
  }

  function removeSection(key: string) {
    setLayout((prev) => ({ ...prev, sections: prev.sections.filter((s) => s.key !== key) }))
  }

  function updateColumn(key: string, colIndex: number, cols: string[]) {
    updateSection(key, (s) =>
      s.kind !== 'columns'
        ? s
        : { ...s, content: s.content.map((c, i) => (i === colIndex ? cols : c)) },
    )
  }

  function updateSpacing(key: string, pre: number | undefined, post: number | undefined) {
    updateSection(key, (s) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- destructure to omit optional spacing props
      const { pre_spacing: _p, post_spacing: _po, ...base } = s
      return {
        ...base,
        ...(pre !== undefined && { pre_spacing: pre }),
        ...(post !== undefined && { post_spacing: post }),
      } as EditorSection
    })
  }

  // ── Sidebar mutations ─────────────────────────────────────────────────────────

  function handleSidebarDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    setLayout((prev) => {
      const sbs = prev.sidebarSections ?? []
      const from = sbs.findIndex((s) => s.id === String(active.id))
      const to = sbs.findIndex((s) => s.id === String(over.id))
      return { ...prev, sidebarSections: arrayMove(sbs, from, to) }
    })
  }

  function addSidebarSection(id: string) {
    setLayout((prev) => ({
      ...prev,
      sidebarSections: [...(prev.sidebarSections ?? []), { id, breakable: true }],
    }))
  }

  function removeSidebarSection(id: string) {
    setLayout((prev) => ({
      ...prev,
      sidebarSections: (prev.sidebarSections ?? []).filter((s) => s.id !== id),
    }))
  }

  function toggleSidebarBreakable(id: string) {
    setLayout((prev) => ({
      ...prev,
      sidebarSections: (prev.sidebarSections ?? []).map((s) =>
        s.id === id ? { ...s, breakable: !s.breakable } : s,
      ),
    }))
  }

  function updateSidebarSpacing(id: string, pre: number | undefined, post: number | undefined) {
    setLayout((prev) => ({
      ...prev,
      sidebarSections: (prev.sidebarSections ?? []).map((s) => {
        if (s.id !== id) return s
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- destructure to omit optional spacing props
        const { pre_spacing: _p, post_spacing: _po, ...base } = s
        return {
          ...base,
          ...(pre !== undefined && { pre_spacing: pre }),
          ...(post !== undefined && { post_spacing: post }),
        }
      }),
    }))
  }

  return {
    layout,
    setLayout,
    sensors,
    updateSection,
    handleDragEnd,
    handleSidebarDragEnd,
    addFullSection,
    addColumnsGroup,
    removeSection,
    updateColumn,
    updateSpacing,
    addSidebarSection,
    removeSidebarSection,
    toggleSidebarBreakable,
    updateSidebarSpacing,
  }
}
