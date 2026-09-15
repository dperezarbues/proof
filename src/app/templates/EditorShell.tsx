'use client'

import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import LayoutPanel from './components/LayoutPanel'
import { SavedList, SaveModal } from './components/SavedConfigs'
import StylePanel from './components/StylePanel'
import { LabelCtx } from './contexts'
import { useLayoutEditor } from './hooks/useLayoutEditor'
import type { SectionDef } from './section-defs'
import type { CompileState, StyleParam } from './types'

export type EditorTab = 'layout' | 'style'

type CompileInfo = { compileState: CompileState; compilerReady: boolean; error: string | null }

type Props = {
  initialLayout: Record<string, unknown>
  templateId: string
  styleParams?: StyleParam[]
  sections?: SectionDef[]
  cvContent: string
  generateTrigger?: number
  activeTab: EditorTab
  onPdfChange: (url: string) => void
  onGenerating: (v: boolean) => void
  onCompileInfo: (info: CompileInfo) => void
}

export default function EditorShell({
  initialLayout,
  templateId,
  styleParams = [],
  sections,
  cvContent,
  generateTrigger = 0,
  activeTab,
  onPdfChange,
  onGenerating,
  onCompileInfo,
}: Props) {
  const t = useTranslations('editor')
  const { editor, style, compiler, saved, storageError } = useLayoutEditor({
    initialLayout,
    templateId,
    styleParams,
    sections,
    cvContent,
    generateTrigger,
    onPdfChange,
    onGenerating,
  })

  // Bubble compile info up so the parent can drive the Generate button state
  useEffect(() => {
    onCompileInfo({
      compileState: compiler.compileState,
      compilerReady: compiler.compilerReady,
      error: compiler.error,
    })
  }, [compiler.compileState, compiler.compilerReady, compiler.error, onCompileInfo])

  return (
    <LabelCtx.Provider value={editor.getLabel}>
      {saved.showSaveModal && (
        <SaveModal onSave={saved.handleSave} onCancel={() => saved.setShowSaveModal(false)} />
      )}

      {storageError && (
        <p
          className="text-[11px] px-4 pt-2"
          style={{ color: 'var(--c-accent)' }}
          data-testid="autosave-error"
        >
          ⚠ {storageError}
        </p>
      )}

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'layout' && (
          <div className="p-4">
            <LayoutPanel editor={editor} />

            {saved.mySavesCount > 0 && (
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--c-line)' }}>
                <div
                  className="font-mono text-[9.5px] tracking-[0.12em] uppercase mb-3"
                  style={{ color: 'var(--c-accent)' }}
                >
                  {t('savedLayouts')}
                </div>
                <SavedList
                  saves={saved.saves}
                  templateId={templateId}
                  onLoad={saved.handleLoad}
                  onDelete={saved.handleDelete}
                />
              </div>
            )}

            <div className="mt-3 pt-3 flex gap-2" style={{ borderTop: '1px solid var(--c-line)' }}>
              <input
                ref={saved.importRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={saved.handleImport}
                data-testid="layout-import-input"
              />
              <button
                type="button"
                onClick={() => saved.setShowSaveModal(true)}
                className="text-[11px] px-2.5 py-1 rounded-[3px] transition-opacity hover:opacity-70"
                style={{ color: 'var(--c-ink2)', boxShadow: 'inset 0 0 0 1.3px var(--c-line)' }}
                data-testid="save-layout-as-btn"
              >
                {t('saveLayoutAs')}
              </button>
              <button
                type="button"
                onClick={() => saved.importRef.current?.click()}
                className="text-[11px] px-2.5 py-1 rounded-[3px] transition-opacity hover:opacity-70"
                style={{ color: 'var(--c-ink2)', boxShadow: 'inset 0 0 0 1.3px var(--c-line)' }}
              >
                Import ↑
              </button>
            </div>
          </div>
        )}

        {activeTab === 'style' && styleParams.length > 0 && (
          <div className="p-4">
            <StylePanel
              styleParams={styleParams}
              style={style.style}
              setStyleValue={style.setStyleValue}
              resetStyle={style.resetStyle}
            />
          </div>
        )}

        {activeTab === 'style' && styleParams.length === 0 && (
          <div className="p-6 text-center" style={{ color: 'var(--c-faint)' }}>
            <p className="font-mono text-[11px] tracking-widest uppercase">{t('noStyleParams')}</p>
          </div>
        )}
      </div>
    </LabelCtx.Provider>
  )
}
