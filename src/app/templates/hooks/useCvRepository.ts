'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  clearAllData,
  disablePrivateMode,
  enablePrivateMode,
  getItem,
  isPrivateMode,
  KEYS,
  mutateStored,
  removeItem,
  setItem,
} from '@/lib/storage'
import type { CvEntry } from '../CvDataModal'
import { CvListSchema } from '../schemas'

function readCvList(): CvEntry[] {
  try {
    const stored = getItem(KEYS.cvs)
    if (!stored) return []
    const result = CvListSchema.safeParse(JSON.parse(stored))
    return result.success ? result.data : []
  } catch {
    return []
  }
}

export function useCvRepository() {
  const [cvList, setCvList] = useState<CvEntry[]>([])
  const [currentCvId, setCurrentCvId] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [privateMode, setPrivateModeState] = useState(false)

  useEffect(() => {
    setPrivateModeState(isPrivateMode())
    setCvList(readCvList())
    try {
      const stored = getItem(KEYS.currentCv)
      if (stored) setCurrentCvId(stored)
    } catch {
      /* ignore */
    }
    setHydrated(true)
  }, [])

  // localStorage is shared across tabs (sessionStorage/private mode is not, so
  // this only fires when it's relevant). Resync so another tab's save/delete
  // doesn't leave this tab looking at a list that's already stale.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== KEYS.cvs) return
      setCvList(readCvList())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const currentCv = useMemo(
    () => cvList.find((c) => c.id === currentCvId) ?? cvList[0] ?? null,
    [cvList, currentCvId],
  )

  function selectCv(id: string) {
    setCurrentCvId(id)
    setItem(KEYS.currentCv, id)
  }

  /** Saves or updates a CV entry. `isFirst` is true if this is the very first CV added (triggers
   *  initial compile); `ok` is false if the write failed (e.g. storage quota exceeded) — callers
   *  on the save path must surface this rather than assuming the save succeeded.
   *  Goes through mutateStored so the mutation is applied to whatever is CURRENTLY persisted —
   *  not this tab's in-memory cvList — since another tab may have saved/deleted CVs since this
   *  tab last hydrated, and writing this tab's stale array back would silently clobber that. */
  function saveCv(entry: CvEntry): { isFirst: boolean; ok: boolean } {
    let isFirst = false
    const next = mutateStored(KEYS.cvs, readCvList, (current) => {
      const idx = current.findIndex((c) => c.id === entry.id)
      const isNew = idx < 0
      isFirst = isNew && current.length === 0
      return isNew ? [...current, entry] : current.map((c) => (c.id === entry.id ? entry : c))
    })
    const ok = next !== null
    // Only reflects the write in React state once it's actually persisted — otherwise a
    // quota-exceeded failure would leave a "phantom" CV in the sidebar that vanishes on reload.
    if (ok) {
      setCvList(next)
      selectCv(entry.id)
    }
    return { isFirst, ok }
  }

  function deleteCv(id: string) {
    const next = mutateStored(KEYS.cvs, readCvList, (current) => current.filter((c) => c.id !== id))
    if (next === null) return
    setCvList(next)
    if (currentCvId === id) {
      const nextCv = next[0] ?? null
      if (nextCv) selectCv(nextCv.id)
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
