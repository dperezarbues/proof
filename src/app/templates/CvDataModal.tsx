'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import MarkProof from '@/components/proof/MarkProof'
import cvStarter from '@/data/cv.starter.json'
import { CvEditor } from './cv-editor/CvEditor'
import { cvFormToJson, initFormData, jsonToCvForm } from './cv-editor/serialise'
import type { CvFormData } from './cv-editor/types'
import { useModalDialogA11y } from './hooks/useModalDialogA11y'
import { CvSchema } from './schemas'

export interface CvEntry {
  id: string
  name: string
  content: string // raw JSON string
  updatedAt: number
}

interface Props {
  entry?: CvEntry // undefined = new
  initialContent?: string // for import mode
  initialName?: string // suggested name for import
  /** Returns false if the save failed (e.g. storage quota exceeded) — the modal stays open and
   *  shows an error instead of closing as if the save had succeeded. */
  onSave: (entry: CvEntry) => boolean
  onCancel: () => void
}

const CV_TEMPLATE = JSON.stringify(cvStarter, null, 2)

type Mode = 'editor' | 'json'

function getInitialState(content: string): { mode: Mode; formData: CvFormData } {
  const parsed = initFormData(content)
  if (parsed) return { mode: 'editor', formData: parsed }
  return {
    mode: 'json',
    formData: jsonToCvForm(JSON.parse(CV_TEMPLATE) as Record<string, unknown>),
  }
}

export default function CvDataModal({
  entry,
  initialContent,
  initialName,
  onSave,
  onCancel,
}: Props) {
  const t = useTranslations('cvModal')
  const defaultContent = entry?.content ?? initialContent ?? CV_TEMPLATE
  const defaultName = entry?.name ?? initialName ?? ''

  const initial = getInitialState(defaultContent)

  const [name, setName] = useState(defaultName)
  const [mode, setMode] = useState<Mode>(initial.mode)
  const [formData, setFormData] = useState<CvFormData>(initial.formData)
  const [jsonContent, setJsonContent] = useState(defaultContent)
  const [error, setError] = useState<string | null>(null)
  const dialogRef = useModalDialogA11y(onCancel)

  function switchToJson() {
    const json = cvFormToJson(formData)
    setJsonContent(JSON.stringify(json, null, 2))
    setMode('json')
    setError(null)
  }

  function switchToEditor() {
    try {
      const raw = JSON.parse(jsonContent) as Record<string, unknown>
      setFormData(jsonToCvForm(raw))
      setMode('editor')
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('invalidJson'))
    }
  }

  function handleFormat() {
    try {
      setJsonContent(JSON.stringify(JSON.parse(jsonContent), null, 2))
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('invalidJson'))
    }
  }

  function handleSave() {
    if (!name.trim()) {
      setError(t('nameRequired'))
      return
    }

    let content: string
    if (mode === 'editor') {
      const json = cvFormToJson(formData)
      const result = CvSchema.safeParse(json)
      if (!result.success) {
        setError(result.error.issues[0]?.message ?? t('invalidCvStructure'))
        return
      }
      content = JSON.stringify(json)
    } else {
      let parsed: unknown
      try {
        parsed = JSON.parse(jsonContent)
      } catch (e) {
        setError(e instanceof Error ? e.message : t('invalidJson'))
        return
      }
      const result = CvSchema.safeParse(parsed)
      if (!result.success) {
        setError(result.error.issues[0]?.message ?? t('invalidCvStructure'))
        return
      }
      content = jsonContent
    }

    const ok = onSave({
      id: entry?.id ?? crypto.randomUUID(),
      name: name.trim(),
      content,
      updatedAt: Date.now(),
    })
    if (!ok) setError(t('saveStorageError'))
  }

  return (
    <div className="fixed inset-0 z-50 flex sm:items-center sm:justify-center bg-black/60">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cv-modal-title"
        tabIndex={-1}
        className="flex flex-col w-full sm:max-w-[672px] sm:mx-4 sm:rounded-[6px]"
        style={{
          background: 'var(--c-paper)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.4)',
          height: '100dvh',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.875rem 1.25rem',
            borderBottom: '1px solid var(--c-line)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MarkProof size={26} />
            <h2
              id="cv-modal-title"
              style={{
                fontFamily: 'var(--f-display)',
                fontWeight: 900,
                fontSize: 13,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--c-ink)',
              }}
            >
              {entry ? t('titleEdit') : t('titleNew')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 20,
              lineHeight: 1,
              color: 'var(--c-faint)',
              cursor: 'pointer',
              padding: '2px 4px',
            }}
            aria-label={t('close')}
          >
            ×
          </button>
        </div>

        {/* Name + mode tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '0.625rem 1.25rem',
            borderBottom: '1px solid var(--c-line2)',
            flexShrink: 0,
          }}
        >
          <label
            htmlFor="cv-name"
            style={{
              fontFamily: 'var(--f-mono)',
              fontSize: 10,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--c-sub)',
              flexShrink: 0,
            }}
          >
            {t('nameLabel')}
          </label>
          <input
            id="cv-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('namePlaceholder')}
            style={{
              flex: 1,
              fontSize: 13,
              border: '1px solid var(--c-line)',
              borderRadius: 4,
              padding: '6px 12px',
              outline: 'none',
              background: 'var(--c-card)',
              color: 'var(--c-ink)',
            }}
          />
          {/* Mode tab pills */}
          <div
            style={{
              display: 'flex',
              borderRadius: 4,
              border: '1px solid var(--c-line)',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={() => mode === 'json' && switchToEditor()}
              style={{
                fontFamily: 'var(--f-mono)',
                fontSize: 11,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '5px 12px',
                border: 'none',
                cursor: 'pointer',
                background: mode === 'editor' ? 'var(--c-ink)' : 'transparent',
                color: mode === 'editor' ? 'var(--c-paper)' : 'var(--c-sub)',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {t('editorTab')}
            </button>
            <button
              type="button"
              onClick={() => mode === 'editor' && switchToJson()}
              style={{
                fontFamily: 'var(--f-mono)',
                fontSize: 11,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '5px 12px',
                border: 'none',
                cursor: 'pointer',
                background: mode === 'json' ? 'var(--c-ink)' : 'transparent',
                color: mode === 'json' ? 'var(--c-paper)' : 'var(--c-sub)',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {t('jsonTab')}
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {mode === 'editor' ? (
            <CvEditor data={formData} onChange={setFormData} />
          ) : (
            <div
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                padding: '0.75rem 1.25rem',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleFormat}
                  style={{
                    fontFamily: 'var(--f-mono)',
                    fontSize: 10,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    background: 'var(--c-paper-deep)',
                    color: 'var(--c-sub)',
                    border: '1px solid var(--c-line)',
                    borderRadius: 3,
                    padding: '4px 12px',
                    cursor: 'pointer',
                  }}
                >
                  {t('format')}
                </button>
              </div>
              <textarea
                value={jsonContent}
                onChange={(e) => {
                  setJsonContent(e.target.value)
                  setError(null)
                }}
                aria-label={t('jsonTextareaLabel')}
                spellCheck={false}
                style={{
                  flex: 1,
                  fontFamily: 'var(--f-mono)',
                  fontSize: 11,
                  border: '1px solid var(--c-line)',
                  borderRadius: 4,
                  padding: 12,
                  resize: 'none',
                  outline: 'none',
                  background: '#0E0B08',
                  color: 'rgba(255,255,255,0.8)',
                  minHeight: 0,
                  lineHeight: 1.65,
                }}
              />
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <p
            role="alert"
            style={{
              padding: '0 1.25rem 4px',
              fontSize: 12,
              color: 'var(--c-error)',
              flexShrink: 0,
            }}
          >
            {error}
          </p>
        )}

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.875rem 1.25rem',
            borderTop: '1px solid var(--c-line)',
            flexShrink: 0,
            background: 'var(--c-paper-deep)',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--f-mono)',
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--c-faint)',
            }}
          >
            {t('dataStays')}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                fontSize: 12,
                fontFamily: 'var(--f-display)',
                fontWeight: 600,
                color: 'var(--c-sub)',
                background: 'transparent',
                border: '1px solid var(--c-line)',
                borderRadius: 3,
                padding: '6px 16px',
                cursor: 'pointer',
              }}
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={handleSave}
              style={{
                fontSize: 12,
                fontFamily: 'var(--f-display)',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: '#fff',
                background: 'var(--c-accent)',
                border: 'none',
                borderRadius: 3,
                padding: '6px 16px',
                cursor: 'pointer',
              }}
            >
              {t('save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
