'use client'

import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { serializeForTypst, serializeLayout, usedIds } from '../layout-serializer'
import type { SectionDef } from '../section-defs'
import { loadLayoutOverride, persistLayoutOverride } from '../storage-helpers'
import type { LayoutEditorHandle, Panel, StyleParam } from '../types'
import { useCompiler } from './useCompiler'
import { useEditorState } from './useEditorState'
import { useSavedConfigs } from './useSavedConfigs'
import { useStyleState } from './useStyleState'

export function useLayoutEditor({
  initialLayout,
  templateId,
  styleParams = [],
  sections = [],
  cvContent,
  generateTrigger = 0,
  onPdfChange,
  onGenerating,
}: {
  initialLayout: Record<string, unknown>
  templateId: string
  styleParams?: StyleParam[]
  sections?: SectionDef[]
  cvContent: string
  generateTrigger?: number
  onPdfChange: (url: string) => void
  onGenerating: (v: boolean) => void
}) {
  const t = useTranslations('editor')
  const [activePanel, setActivePanel] = useState<Panel>('layout')
  const [layoutStorageError, setLayoutStorageError] = useState<string | null>(null)

  // Restore any previously persisted layout for this template, falling back to the default
  const [restoredLayout] = useState(() => loadLayoutOverride(templateId) ?? initialLayout)
  const editorState = useEditorState(restoredLayout)
  const styling = useStyleState(initialLayout, styleParams, templateId)

  // Persist layout changes so they survive page refreshes and navigation. Surfaces a failure
  // (e.g. quota exceeded) instead of silently dropping it — the change still applies for this
  // session (editorState.layout already reflects it), it just won't survive a reload.
  useEffect(() => {
    const ok = persistLayoutOverride(
      templateId,
      serializeLayout(editorState.layout) as Record<string, unknown>,
    )
    setLayoutStorageError(ok ? null : t('autosaveError'))
  }, [editorState.layout, templateId, t])

  const compiler = useCompiler({
    templateId,
    cvContent,
    getLayoutData: useCallback(
      () => serializeForTypst(editorState.layout, styling.style),
      [editorState.layout, styling.style],
    ),
    generateTrigger,
    onPdfChange,
    onGenerating,
  })

  const saved = useSavedConfigs({
    templateId,
    styleParams,
    getLayoutSnapshot: useCallback(() => serializeLayout(editorState.layout), [editorState.layout]),
    style: styling.style,
    onLoad: useCallback(
      (layout, style) => {
        editorState.setLayout(layout)
        styling.setStyle(style)
      },
      [editorState, styling],
    ),
    onSaved: useCallback(() => setActivePanel('saved'), []),
  })

  // ── Derived values ────────────────────────────────────────────────────────────

  const allMainIds = useMemo(
    () => sections.filter((s) => s.locations.includes('main')).map((s) => s.id),
    [sections],
  )
  const allSidebarIds = useMemo(
    () => sections.filter((s) => s.locations.includes('sidebar')).map((s) => s.id),
    [sections],
  )
  const labelMap = useMemo(
    () => Object.fromEntries(sections.map((s) => [s.id, s.label])),
    [sections],
  )
  const getLabel = useCallback((id: string) => labelMap[id] ?? id, [labelMap])

  const hasSidebar = editorState.layout.sidebarSections !== undefined
  const sidebarSet = useMemo(
    () => new Set(editorState.layout.sidebarSections?.map((s) => s.id) ?? []),
    [editorState.layout.sidebarSections],
  )
  const usedInMain = useMemo(
    () => usedIds(editorState.layout.sections),
    [editorState.layout.sections],
  )
  const available = useMemo(
    () => allMainIds.filter((id) => !usedInMain.has(id) && !sidebarSet.has(id)),
    [allMainIds, usedInMain, sidebarSet],
  )
  const availableSb = useMemo(
    () => allSidebarIds.filter((id) => !sidebarSet.has(id) && !usedInMain.has(id)),
    [allSidebarIds, sidebarSet, usedInMain],
  )

  // setLayout is intentionally excluded from the editor handle below — layout mutations should go through the named actions, not a raw setter.
  const { setLayout: _setLayout, ...editorActions } = editorState

  return {
    activePanel,
    setActivePanel,
    storageError: layoutStorageError ?? styling.storageError,
    editor: {
      ...editorActions,
      hasSidebar,
      available,
      availableSb,
      getLabel,
    } satisfies LayoutEditorHandle & { getLabel: (id: string) => string },
    style: {
      style: styling.style,
      setStyleValue: styling.setStyleValue,
      resetStyle: styling.resetStyle,
    },
    compiler: {
      compileState: compiler.compileState,
      compilerReady: compiler.compilerReady,
      error: compiler.error,
      generate: compiler.generate,
    },
    saved: {
      saves: saved.saves,
      showSaveModal: saved.showSaveModal,
      setShowSaveModal: saved.setShowSaveModal,
      importRef: saved.importRef,
      mySavesCount: saved.mySavesCount,
      handleSave: saved.handleSave,
      handleLoad: saved.handleLoad,
      handleDelete: saved.handleDelete,
      handleImport: saved.handleImport,
    },
  }
}
