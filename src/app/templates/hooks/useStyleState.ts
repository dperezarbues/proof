'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { parseStyleValues } from '../layout-serializer'
import { clearStyleOverrides, loadStyleOverrides, persistStyleOverride } from '../storage-helpers'
import type { StyleParam, StyleValues } from '../types'

export function useStyleState(
  initialLayout: Record<string, unknown>,
  styleParams: StyleParam[],
  templateId: string,
) {
  const t = useTranslations('editor')
  const [style, setStyle] = useState<StyleValues>(() =>
    parseStyleValues(initialLayout, styleParams, loadStyleOverrides(templateId)),
  )
  const [storageError, setStorageError] = useState<string | null>(null)

  function setStyleValue(key: string, value: string | number) {
    setStyle((prev) => ({ ...prev, [key]: value }))
    const param = styleParams.find((p) => p.key === key)
    const ok = persistStyleOverride(templateId, param?.canonical ?? key, value)
    setStorageError(ok ? null : t('autosaveError'))
  }

  function resetStyle() {
    const defaults: StyleValues = {}
    for (const p of styleParams) defaults[p.key] = p.default
    setStyle(defaults)
    const ok = clearStyleOverrides(
      templateId,
      styleParams.map((p) => p.canonical ?? p.key),
    )
    setStorageError(ok ? null : t('autosaveError'))
  }

  return { style, setStyle, setStyleValue, resetStyle, storageError }
}
