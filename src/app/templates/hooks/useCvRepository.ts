'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  clearAllData,
  disablePrivateMode,
  enablePrivateMode,
  getItem,
  isPrivateMode,
  KEYS,
  removeItem,
  setItem,
} from '@/lib/storage'
import type { CvEntry } from '../CvDataModal'
import { CvListSchema } from '../schemas'

export function useCvRepository() {
  const [cvList, setCvList] = useState<CvEntry[]>([])
  const [currentCvId, setCurrentCvId] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [privateMode, setPrivateModeState] = useState(false)

  useEffect(() => {
    setPrivateModeState(isPrivateMode())
    try {
      const stored = getItem(KEYS.cvs)
      if (stored) {
        const result = CvListSchema.safeParse(JSON.parse(stored))
        if (result.success) setCvList(result.data)
      }
    } catch {
      /* ignore */
    }
    try {
      const stored = getItem(KEYS.currentCv)
      if (stored) setCurrentCvId(stored)
    } catch {
      /* ignore */
    }
    setHydrated(true)
  }, [])

  const currentCv = useMemo(
    () => cvList.find((c) => c.id === currentCvId) ?? cvList[0] ?? null,
    [cvList, currentCvId],
  )

  function _saveCvList(list: CvEntry[]) {
    setCvList(list)
    setItem(KEYS.cvs, JSON.stringify(list))
  }

  function selectCv(id: string) {
    setCurrentCvId(id)
    setItem(KEYS.currentCv, id)
  }

  /** Saves or updates a CV entry. Returns true if this is the very first CV added (triggers initial compile). */
  function saveCv(entry: CvEntry): boolean {
    const idx = cvList.findIndex((c) => c.id === entry.id)
    const isNew = idx < 0
    const updated = isNew ? [...cvList, entry] : cvList.map((c) => (c.id === entry.id ? entry : c))
    _saveCvList(updated)
    selectCv(entry.id)
    return isNew && cvList.length === 0
  }

  function deleteCv(id: string) {
    const updated = cvList.filter((c) => c.id !== id)
    _saveCvList(updated)
    if (currentCvId === id) {
      const next = updated[0] ?? null
      if (next) selectCv(next.id)
      else {
        setCurrentCvId(null)
        removeItem(KEYS.currentCv)
      }
    }
  }

  function downloadCv(entry: CvEntry) {
    const blob = new Blob([entry.content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${entry.name}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function togglePrivateMode(enabled: boolean) {
    if (enabled) enablePrivateMode()
    else disablePrivateMode()
    setPrivateModeState(enabled)
  }

  function clearData() {
    clearAllData()
    setCvList([])
    setCurrentCvId(null)
  }

  return {
    cvList,
    currentCv,
    hydrated,
    privateMode,
    selectCv,
    saveCv,
    deleteCv,
    downloadCv,
    togglePrivateMode,
    clearData,
  }
}
