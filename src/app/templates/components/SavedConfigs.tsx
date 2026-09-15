'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { downloadJson } from '../browser-utils'
import type { SavedConfig } from '../types'
import { SbBtn } from './GalleryAtoms'

export function SaveModal({
  onSave,
  onCancel,
}: {
  /** Returns false if the save failed (e.g. storage quota exceeded) — the modal stays open and
   *  shows an error instead of closing as if it had succeeded. */
  onSave: (name: string) => boolean
  onCancel: () => void
}) {
  const t = useTranslations('editor')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  function trySave() {
    if (!name.trim()) return
    if (!onSave(name.trim())) {
      setError(t('layoutPresetError'))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-preset-title"
        className="w-full max-w-[320px] mx-4 rounded-[6px] p-5"
        style={{ background: 'var(--c-paper)', boxShadow: '0 40px 100px rgba(0,0,0,0.4)' }}
      >
        <p
          id="save-preset-title"
          className="mb-1"
          style={{
            fontFamily: 'var(--f-display)',
            fontWeight: 700,
            fontSize: 13,
            color: 'var(--c-ink)',
          }}
        >
          {t('layoutPresetTitle')}
        </p>
        <p className="text-[12px] mb-3" style={{ color: 'var(--c-sub)' }}>
          {t('layoutPresetHint')}
        </p>
        <input
          // biome-ignore lint/a11y/noAutofocus: modal dialog — autofocus name field is the expected UX
          autoFocus
          type="text"
          placeholder={t('layoutPresetPlaceholder')}
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') trySave()
          }}
          className="w-full mb-3"
          style={{
            fontSize: 13,
            border: '1px solid var(--c-line)',
            borderRadius: 4,
            padding: '6px 12px',
            outline: 'none',
            background: 'var(--c-card)',
            color: 'var(--c-ink)',
          }}
        />
        {error && (
          <p className="text-[12px] mb-3" style={{ color: 'var(--c-accent)' }}>
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <SbBtn full onClick={onCancel}>
            {t('layoutPresetCancel')}
          </SbBtn>
          <SbBtn full variant="primary" onClick={trySave} disabled={!name.trim()}>
            {t('layoutPresetSave')}
          </SbBtn>
        </div>
      </div>
    </div>
  )
}

export function SavedList({
  saves,
  templateId,
  onLoad,
  onDelete,
}: {
  saves: SavedConfig[]
  templateId: string
  onLoad: (c: SavedConfig) => void
  onDelete: (id: string) => void
}) {
  const t = useTranslations('editor')
  const locale = useLocale()
  const mine = saves.filter((s) => s.templateId === templateId)
  if (mine.length === 0)
    return (
      <p className="text-[12px] italic" style={{ color: 'var(--c-faint)' }}>
        {t('noLayoutPresets')}
      </p>
    )

  return (
    <div className="space-y-1.5">
      {mine.map((c) => (
        <div
          key={c.id}
          className="flex items-center gap-1.5 px-2.5 py-2 rounded-[3px] group"
          style={{ background: 'var(--c-card)', boxShadow: 'inset 0 0 0 1px var(--c-line)' }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium truncate" style={{ color: 'var(--c-ink)' }}>
              {c.name}
            </p>
            <p className="text-[11px]" style={{ color: 'var(--c-faint)' }}>
              {new Date(c.savedAt).toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onLoad(c)}
            className="px-1.5 py-1 text-[13px] transition-opacity hover:opacity-70"
            style={{ color: 'var(--c-sub)' }}
            title={t('loadPreset')}
          >
            ↩
          </button>
          <button
            type="button"
            onClick={() =>
              downloadJson(
                {
                  _name: c.name,
                  _templateId: c.templateId,
                  _savedAt: c.savedAt,
                  ...(c.layout as object),
                  ...(Object.keys(c.style).length > 0 && { style: c.style }),
                },
                `${c.templateId}-${c.name.toLowerCase().replace(/\s+/g, '-')}.json`,
              )
            }
            className="px-1.5 py-1 text-[13px] opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: 'var(--c-sub)' }}
            title={t('downloadPreset')}
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => onDelete(c.id)}
            className="px-1.5 py-1 text-[13px] opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: 'var(--c-sub)' }}
            title={t('delete')}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
