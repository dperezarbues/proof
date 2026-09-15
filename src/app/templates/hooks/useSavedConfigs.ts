'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { KEYS } from '@/lib/storage'
import { parseLayoutStructure, parseStyleValues } from '../layout-serializer'
import { LayoutImportSchema } from '../schemas'
import { loadSaves, mutateSaves } from '../storage-helpers'
import type { LayoutData, LayoutStructure, SavedConfig, StyleParam, StyleValues } from '../types'

export function useSavedConfigs({
  templateId,
  styleParams,
  getLayoutSnapshot,
  style,
  onLoad,
  onSaved,
}: {
  templateId: string
  styleParams: StyleParam[]
  getLayoutSnapshot: () => LayoutData
  style: StyleValues
  onLoad: (layout: LayoutStructure, style: StyleValues) => void
  onSaved: () => void
}) {
  const [saves, setSaves] = useState<SavedConfig[]>(() => loadSaves())
  const [showSaveModal, setShowSaveModal] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)

  const mySavesCount = useMemo(
    () => saves.filter((s) => s.templateId === templateId).length,
    [saves, templateId],
  )

  // localStorage is shared across tabs — resync so another tab's save/delete
  // doesn't leave this tab looking at a saves list that's already stale.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== KEYS.saves) return
      setSaves(loadSaves())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  /** Returns false if the save failed (e.g. storage quota exceeded) so the caller (SaveModal)
   *  can show an error instead of closing as if it had succeeded. Goes through mutateSaves so
   *  the new entry is appended to whatever is CURRENTLY persisted, not this tab's possibly-stale
   *  in-memory `saves` — another tab may have added/removed saved configs since this tab hydrated. */
  function handleSave(name: string): boolean {
    const config: SavedConfig = {
      id: crypto.randomUUID(),
      name,
      templateId,
      savedAt: Date.now(),
      layout: getLayoutSnapshot(),
      style,
    }
    const updated = mutateSaves((current) => [...current, config])
    if (updated === null) return false
    setSaves(updated)
    setShowSaveModal(false)
    onSaved()
    return true
  }

  function handleLoad(config: SavedConfig) {
    const raw = { ...config.layout, style: config.style } as Record<string, unknown>
    onLoad(parseLayoutStructure(raw), parseStyleValues(raw, styleParams))
  }

  function handleDelete(id: string) {
    const updated = mutateSaves((current) => current.filter((s) => s.id !== id))
    if (updated === null) return
    setSaves(updated)
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string)
        const result = LayoutImportSchema.safeParse(json)
        if (!result.success) return
        const raw = result.data as Record<string, unknown>
        onLoad(parseLayoutStructure(raw), parseStyleValues(raw, styleParams))
      } catch {
        /* ignore malformed files */
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return {
    saves,
    showSaveModal,
    setShowSaveModal,
    importRef,
    mySavesCount,
    handleSave,
    handleLoad,
    handleDelete,
    handleImport,
  }
}
