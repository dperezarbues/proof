'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import MarkProof from '@/components/proof/MarkProof'
import { Link } from '@/i18n/navigation'
import { getItem, KEYS, setItem } from '@/lib/storage'
import { initTypstWorker } from '@/lib/typst-compile'
import CvDataModal, { type CvEntry } from './CvDataModal'
import type { EditorTab } from './EditorShell'
import { useCvRepository } from './hooks/useCvRepository'
import OnboardingModal from './OnboardingModal'
import PdfPreview from './PdfPreview'
import type { SectionDef } from './section-defs'
import { DEFAULT_SECTIONS } from './section-defs'
import type { CompileState, Layout, Template } from './types'

const EditorShell = dynamic(() => import('./EditorShell'), { ssr: false })

// ── types ─────────────────────────────────────────────────────────────────────

type Tab = 'data' | 'template' | 'layout' | 'style'

type CvModalState =
  | { mode: 'new' }
  | { mode: 'import'; content: string; name: string }
  | { mode: 'edit'; entry: CvEntry }

// ── atoms ─────────────────────────────────────────────────────────────────────

function MonoTag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="font-mono text-[9.5px] tracking-[0.12em] uppercase"
      style={{ color: 'var(--c-faint)' }}
    >
      {children}
    </span>
  )
}

function AccentTag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="font-mono text-[9.5px] tracking-[0.12em] uppercase"
      style={{ color: 'var(--c-accent)' }}
    >
      {children}
    </span>
  )
}

function SbBtn({
  children,
  variant = 'ghost',
  full,
  onClick,
  disabled,
  title,
  type = 'button',
  ...rest
}: {
  children: React.ReactNode
  variant?: 'primary' | 'dark' | 'ghost'
  full?: boolean
  onClick?: () => void
  disabled?: boolean
  title?: string
  type?: 'button' | 'submit'
  [key: `data-${string}`]: string | undefined
}) {
  const base = `${full ? 'flex w-full' : 'inline-flex'} items-center justify-center gap-1.5 px-3.5 py-2.5 font-bold text-[12px] rounded-[3px] uppercase tracking-[0.03em] whitespace-nowrap transition-opacity disabled:opacity-40`
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--c-accent)', color: '#fff' },
    dark: { background: 'var(--c-ink)', color: 'var(--c-paper)' },
    ghost: { color: 'var(--c-ink2)', boxShadow: 'inset 0 0 0 1.3px var(--c-line)' },
  }
  return (
    <button
      type={type}
      className={base}
      style={variants[variant]}
      onClick={onClick}
      disabled={disabled}
      title={title}
      {...rest}
    >
      {children}
    </button>
  )
}

// ── step nav ──────────────────────────────────────────────────────────────────

function StepNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const t = useTranslations('editor')
  const steps: [Tab, string][] = [
    ['data', t('tabData')],
    ['template', t('tabTemplate')],
    ['layout', t('tabLayout')],
    ['style', t('tabStyle')],
  ]
  return (
    <div
      className="flex"
      style={{ borderBottom: '1px solid var(--c-line)', padding: '0 8px' }}
      role="tablist"
      aria-label="Editor steps"
    >
      {steps.map(([id, label], i) => {
        const on = id === active
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(id)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-3.5 cursor-pointer relative"
            style={{
              marginBottom: -1,
              background: 'none',
              border: 'none',
              borderBottom: on ? '2.5px solid var(--c-accent)' : '2.5px solid transparent',
            }}
          >
            <span
              className="font-mono text-[10.5px]"
              style={{ color: on ? 'var(--c-accent)' : 'var(--c-faint)' }}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <span
              className="font-bold text-[12.5px] uppercase tracking-[0.02em]"
              style={{ color: on ? 'var(--c-ink)' : 'var(--c-sub)' }}
            >
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ── data tab ──────────────────────────────────────────────────────────────────

function DataTab({
  cvList,
  currentCv,
  hydrated,
  importRef,
  onNewCv,
  onImportFile,
  onSelectCv,
  onEditCv,
  onDownloadCv,
  onDeleteCv,
}: {
  cvList: CvEntry[]
  currentCv: CvEntry | null
  hydrated: boolean
  importRef: React.RefObject<HTMLInputElement | null>
  onNewCv: () => void
  onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSelectCv: (id: string) => void
  onEditCv: (e: CvEntry) => void
  onDownloadCv: (e: CvEntry) => void
  onDeleteCv: (id: string) => void
}) {
  const t = useTranslations('editor')
  return (
    <div className="p-4 space-y-4">
      {/* CV list */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <AccentTag>{t('yourCVs')}</AccentTag>
          <div className="flex gap-2">
            <input
              ref={importRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={onImportFile}
            />
            <SbBtn onClick={() => importRef.current?.click()}>{t('import')}</SbBtn>
            <SbBtn variant="dark" onClick={onNewCv} title={t('newCV')} data-testid="new-cv-btn">
              {t('newCV')}
            </SbBtn>
          </div>
        </div>

        {hydrated && cvList.length === 0 ? (
          <p className="text-[12px] py-4 text-center" style={{ color: 'var(--c-faint)' }}>
            {t('noCVsYet')}
          </p>
        ) : (
          <div className="space-y-1">
            {cvList.map((entry) => {
              const active = currentCv?.id === entry.id
              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-1 rounded-[3px] group"
                  style={{
                    background: active ? 'var(--c-accent-soft)' : 'transparent',
                  }}
                >
                  <button
                    type="button"
                    className="flex-1 flex items-center gap-2 px-2.5 py-2 text-left"
                    onClick={() => onSelectCv(entry.id)}
                  >
                    <span
                      className="shrink-0 w-1.5 h-1.5 rounded-full"
                      style={{ background: active ? 'var(--c-accent)' : 'transparent' }}
                    />
                    <span
                      className="flex-1 text-[13px] truncate font-medium"
                      style={{ color: active ? 'var(--c-accent-deep)' : 'var(--c-ink)' }}
                    >
                      {entry.name}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditCv(entry)}
                    title={t('editCVDataTitle')}
                    className="px-1.5 py-2 text-[13px] opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: 'var(--c-sub)' }}
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    onClick={() => onDownloadCv(entry)}
                    title={t('downloadJSON')}
                    className="px-1.5 py-2 text-[13px] opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: 'var(--c-sub)' }}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteCv(entry.id)}
                    title={t('delete')}
                    className="px-1.5 py-2 text-[13px] opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: 'var(--c-sub)' }}
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Schema card */}
      <div
        className="rounded-[4px] p-3.5"
        style={{ background: 'var(--c-card)', boxShadow: 'inset 0 0 0 1px var(--c-line)' }}
      >
        <AccentTag>01</AccentTag>
        <div className="font-bold text-[13px] mt-1 mb-2" style={{ color: 'var(--c-ink)' }}>
          {t('getSchema')}
        </div>
        <div
          className="flex items-center gap-2 rounded-[3px] px-2.5 py-2 mb-2.5"
          style={{ background: 'var(--c-ink)' }}
        >
          <span className="font-mono text-[11px] flex-1" style={{ color: 'rgba(255,255,255,0.8)' }}>
            cv.schema.json
          </span>
          <span className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
            2 KB
          </span>
        </div>
        <div className="flex gap-2">
          <Link
            href="/for-llms"
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 font-bold text-[12px] rounded-[3px] uppercase tracking-wider"
            style={{ background: 'var(--c-ink)', color: 'var(--c-paper)' }}
          >
            {t('download')}
          </Link>
          <a
            href="/llms-full.txt"
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 font-bold text-[12px] rounded-[3px] uppercase tracking-wider"
            style={{ boxShadow: 'inset 0 0 0 1.3px var(--c-line)', color: 'var(--c-ink2)' }}
          >
            llms.txt
          </a>
        </div>
      </div>

      {/* Privacy note */}
      <div className="flex items-center gap-2 px-0.5">
        <span
          className="font-mono text-[10.5px] tracking-[0.02em]"
          style={{ color: 'var(--c-faint)' }}
        >
          {t('processedLocally')}
        </span>
      </div>
    </div>
  )
}

// ── template tab ──────────────────────────────────────────────────────────────

function TemplateTab({
  templates,
  activeTemplate,
  activeLayout,
  onSelectTemplate,
  onSelectLayout,
}: {
  templates: Template[]
  activeTemplate: Template
  activeLayout: Layout
  onSelectTemplate: (t: Template) => void
  onSelectLayout: (l: Layout) => void
}) {
  const t = useTranslations('editor')
  return (
    <div className="p-4">
      <div
        className="font-bold text-[15px] uppercase tracking-[0.01em] mb-1"
        style={{ color: 'var(--c-ink)' }}
      >
        {t('chooseTemplate')}
      </div>
      <p className="text-[12px] mb-4" style={{ color: 'var(--c-sub)' }}>
        {templates.length} {t('templatesMoreOnWay')}
      </p>

      <div className="grid grid-cols-2 gap-3">
        {templates.map((t) => {
          const on = activeTemplate.id === t.id
          return (
            <button
              key={t.id}
              type="button"
              data-testid={`template-btn-${t.id}`}
              onClick={() => onSelectTemplate(t)}
              className="relative rounded-[3px] p-2 text-left transition-shadow"
              style={{
                background: '#fff',
                boxShadow: on ? `0 0 0 2px var(--c-accent)` : 'inset 0 0 0 1px var(--c-line)',
              }}
            >
              {/* Template thumbnail */}
              <div
                className="h-24 mb-2 overflow-hidden relative"
                style={{ background: '#f5f5f5', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)' }}
              >
                <Image
                  src={`/thumbnails/${t.id}.png`}
                  alt={`${t.name} template preview`}
                  fill
                  className="object-cover object-top"
                  sizes="152px"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-[12px]" style={{ color: 'var(--c-ink)' }}>
                  {t.name}
                </span>
                {on && (
                  <span className="text-[18px]" style={{ color: 'var(--c-accent)' }}>
                    ✓
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {activeTemplate.layouts.length > 1 && (
        <div className="mt-5">
          <AccentTag>{t('layoutVariant')}</AccentTag>
          <div className="flex gap-2 mt-2.5">
            {activeTemplate.layouts.map((l) => (
              <button
                key={l.id}
                type="button"
                data-testid={`layout-btn-${l.id}`}
                onClick={() => onSelectLayout(l)}
                className="flex-1 py-2 rounded-[3px] font-bold text-[12px] uppercase tracking-[0.02em] transition-opacity"
                style={{
                  background: activeLayout.id === l.id ? 'var(--c-ink)' : 'transparent',
                  color: activeLayout.id === l.id ? 'var(--c-paper)' : 'var(--c-ink2)',
                  boxShadow: activeLayout.id === l.id ? 'none' : 'inset 0 0 0 1.3px var(--c-line)',
                }}
              >
                {l.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────

export default function TemplatesGallery({
  templates,
  layoutData,
}: {
  templates: Template[]
  layoutData: Record<string, Record<string, Record<string, unknown>>>
}) {
  const t = useTranslations('editor')
  const [activeTab, setActiveTab] = useState<Tab>('data')
  const [activeTemplate, setActiveTemplate] = useState<Template>(templates[0])
  const [activeLayout, setActiveLayout] = useState<Layout>(templates[0].layouts[0])
  const [previewPdf, setPreviewPdf] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateTrigger, setGenerateTrigger] = useState(0)
  const [compileState, setCompileState] = useState<CompileState>('idle')
  const [compileError, setCompileError] = useState<string | null>(null)
  const [mobilePanel, setMobilePanel] = useState(false)
  const previewPdfRef = useRef<string | null>(null)
  const prevFocusRef = useRef<HTMLElement | null>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    previewPdfRef.current = previewPdf
  }, [previewPdf])
  useEffect(() => {
    return () => {
      if (previewPdfRef.current?.startsWith('blob:')) URL.revokeObjectURL(previewPdfRef.current)
    }
  }, [])

  const repo = useCvRepository()
  const { cvList, currentCv, hydrated, privateMode } = repo

  const [cvModal, setCvModal] = useState<CvModalState | null>(null)
  const [showWelcome, setShowWelcome] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!getItem(KEYS.onboarded)) setShowWelcome(true)
    initTypstWorker(templates.map((t) => t.id))
  }, [templates])

  function dismissWelcome() {
    setItem(KEYS.onboarded, '1')
    setShowWelcome(false)
  }

  const activeSections: SectionDef[] = useMemo(() => {
    if (!currentCv) return DEFAULT_SECTIONS
    try {
      const parsed = JSON.parse(currentCv.content) as { _sections?: SectionDef[] }
      return parsed._sections ?? DEFAULT_SECTIONS
    } catch {
      return DEFAULT_SECTIONS
    }
  }, [currentCv])

  const samplePdf = `/samples/${activeTemplate.id}.pdf`
  const isSample = previewPdf === null
  const currentPdf = previewPdf ?? samplePdf
  const activeLayoutData = layoutData[activeTemplate.id]?.[activeLayout.id] ?? null
  const isEditable = activeLayoutData !== null

  function handleSaveCv(entry: CvEntry) {
    const isFirst = repo.saveCv(entry)
    setCvModal(null)
    if (isFirst) setGenerateTrigger((t) => t + 1)
  }

  function handleClearData() {
    if (!confirm(t('clearDataConfirm'))) return
    repo.clearData()
    setPreviewPdf(null)
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const content = ev.target?.result as string
      const name = file.name.replace(/\.json$/i, '')
      setCvModal({ mode: 'import', content, name })
    }
    reader.onerror = () => {
      if (process.env.NODE_ENV === 'development')
        console.warn('[import] FileReader error', reader.error)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function selectTemplate(t: Template) {
    setActiveTemplate(t)
    setActiveLayout(t.layouts[0])
    setPreviewPdf(null)
    if (activeTab === 'layout' || activeTab === 'style') setActiveTab('layout')
  }

  function selectLayout(l: Layout) {
    setActiveLayout(l)
    setPreviewPdf(null)
  }

  const handleCompileInfo = useCallback(
    ({
      compileState: cs,
      error: e,
    }: {
      compileState: CompileState
      compilerReady: boolean
      error: string | null
    }) => {
      setCompileState(cs)
      setCompileError(e)
    },
    [],
  )

  // Map top-level tabs to EditorShell's two panels
  const editorTab: EditorTab = activeTab === 'style' ? 'style' : 'layout'

  const isGenerateDisabled = !currentCv || compileState !== 'idle'

  function openMobileTab(t: Tab) {
    prevFocusRef.current = document.activeElement as HTMLElement
    setActiveTab(t)
    setMobilePanel(true)
  }

  function closeMobilePanel() {
    setMobilePanel(false)
  }

  // Focus the close button when the panel opens; restore focus to the trigger when it closes.
  useEffect(() => {
    if (mobilePanel) {
      closeBtnRef.current?.focus()
    } else {
      prevFocusRef.current?.focus()
    }
  }, [mobilePanel])

  // Dismiss with Escape key.
  useEffect(() => {
    if (!mobilePanel) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobilePanel(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [mobilePanel])

  const generateLabel =
    compileState === 'loading'
      ? t('loading')
      : compileState === 'compiling'
        ? t('compiling')
        : t('generatePDF')

  return (
    <div
      className="flex flex-col md:flex-row h-[100dvh] overflow-hidden"
      style={{ background: 'var(--c-paper)', color: 'var(--c-ink)' }}
    >
      {/* ── Mobile backdrop ───────────────────────────────────────────────── */}
      {mobilePanel && (
        <div
          data-testid="editor-backdrop"
          className="md:hidden fixed inset-0 z-30 bg-black/50"
          onClick={closeMobilePanel}
          aria-hidden
        />
      )}

      {/* ── Sidebar (editor-aside handles responsive CSS) ─────────────────── */}
      <aside
        className="editor-aside"
        data-open={mobilePanel ? 'true' : 'false'}
        style={{ background: 'var(--c-paper)' }}
        {...(mobilePanel && {
          role: 'dialog',
          'aria-modal': true,
          'aria-label': t('editorSettings'),
        })}
      >
        {/* Brand header — desktop/tablet only */}
        <div
          className="hidden md:flex px-4 py-3.5 flex-col gap-3 shrink-0"
          style={{ borderBottom: '1px solid var(--c-line)' }}
        >
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="flex items-center gap-2.5 transition-opacity hover:opacity-70"
            >
              <MarkProof size={26} />
              <span
                className="font-black text-[19px] tracking-[-0.02em]"
                style={{ color: 'var(--c-ink)' }}
              >
                Proof
              </span>
            </Link>
            <div className="flex-1" />
            <MonoTag>{t('beta')}</MonoTag>
          </div>

          {/* CV switcher */}
          <div className="flex gap-2">
            <div
              className="flex-1 flex items-center gap-2 rounded-[3px] px-2.5 py-2"
              style={{ background: 'var(--c-card)', boxShadow: 'inset 0 0 0 1px var(--c-line)' }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: currentCv ? 'var(--c-accent)' : 'var(--c-line)' }}
              />
              <span
                className="flex-1 text-[12.5px] font-semibold truncate"
                style={{ color: 'var(--c-ink)' }}
              >
                {currentCv ? currentCv.name : t('noCVLoaded')}
              </span>
            </div>
            <SbBtn variant="dark" onClick={() => setCvModal({ mode: 'new' })} title="New CV">
              + New
            </SbBtn>
          </div>
        </div>

        {/* Mobile panel header */}
        <div
          className="md:hidden flex items-center justify-between px-4 py-2.5 shrink-0"
          style={{ borderBottom: '1px solid var(--c-line)' }}
        >
          <span
            className="font-mono text-[10px] tracking-[0.14em] uppercase"
            style={{ color: 'var(--c-faint)' }}
          >
            {t('editorSettings')}
          </span>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={closeMobilePanel}
            className="w-7 h-7 flex items-center justify-center text-[17px] rounded-full transition-opacity hover:opacity-70"
            style={{ boxShadow: 'inset 0 0 0 1px var(--c-line)', color: 'var(--c-sub)' }}
            aria-label={t('closePanelAria')}
          >
            ×
          </button>
        </div>

        {/* Step nav */}
        <StepNav active={activeTab} onChange={setActiveTab} />

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {activeTab === 'data' && (
            <DataTab
              cvList={cvList}
              currentCv={currentCv}
              hydrated={hydrated}
              importRef={importRef}
              onNewCv={() => setCvModal({ mode: 'new' })}
              onImportFile={handleImportFile}
              onSelectCv={repo.selectCv}
              onEditCv={(e) => setCvModal({ mode: 'edit', entry: e })}
              onDownloadCv={repo.downloadCv}
              onDeleteCv={repo.deleteCv}
            />
          )}

          {activeTab === 'template' && (
            <TemplateTab
              templates={templates}
              activeTemplate={activeTemplate}
              activeLayout={activeLayout}
              onSelectTemplate={selectTemplate}
              onSelectLayout={selectLayout}
            />
          )}

          {/* EditorShell always mounted to keep compiler alive */}
          <div
            style={{
              display: activeTab === 'layout' || activeTab === 'style' ? undefined : 'none',
            }}
          >
            {isEditable && activeLayoutData ? (
              <EditorShell
                key={`${activeTemplate.id}-${activeLayout.id}`}
                initialLayout={activeLayoutData}
                templateId={activeTemplate.id}
                styleParams={activeTemplate.styleParams ?? []}
                sections={activeSections}
                cvContent={currentCv?.content ?? ''}
                generateTrigger={generateTrigger}
                activeTab={editorTab}
                onPdfChange={(url) =>
                  setPreviewPdf((prev) => {
                    if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
                    setMobilePanel(false) // show the result on mobile
                    return url
                  })
                }
                onGenerating={setIsGenerating}
                onCompileInfo={handleCompileInfo}
              />
            ) : (
              <div className="p-6 text-center" style={{ color: 'var(--c-faint)' }}>
                <p className="font-mono text-[11px] tracking-widest uppercase">
                  {t('noLayoutForTemplate')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions bar */}
        <div
          className="shrink-0 p-3.5 flex flex-col gap-2"
          style={{ borderTop: '1px solid var(--c-line)' }}
        >
          <div className="flex gap-2.5">
            <SbBtn
              variant="primary"
              full
              disabled={isGenerateDisabled}
              onClick={() => setGenerateTrigger((t) => t + 1)}
            >
              {generateLabel}
            </SbBtn>
            {!isSample && (
              <a
                href={currentPdf.split('?')[0]}
                download
                className="inline-flex items-center justify-center px-3.5 py-2.5 rounded-[3px] font-bold text-[12px] transition-opacity hover:opacity-80"
                style={{ boxShadow: 'inset 0 0 0 1.3px var(--c-line)', color: 'var(--c-ink2)' }}
                title="Download PDF"
              >
                ↓
              </a>
            )}
          </div>
          {compileError && (
            <p
              className="font-mono text-[10px] truncate"
              style={{ color: 'var(--c-accent)' }}
              title={compileError}
            >
              ⚠ {compileError}
            </p>
          )}
        </div>

        {/* Footer links — desktop/tablet only */}
        <div
          className="hidden md:flex shrink-0 px-4 py-3 items-center justify-between"
          style={{ borderTop: '1px solid var(--c-line2)' }}
        >
          <Link
            href="/"
            className="font-mono text-[11px] transition-opacity hover:opacity-70"
            style={{ color: 'var(--c-faint)' }}
          >
            {t('home')}
          </Link>
          <div className="flex items-center gap-3">
            {privateMode && (
              <span
                className="font-mono text-[10px] tracking-widest uppercase"
                style={{ color: 'var(--c-accent)' }}
              >
                {t('private')}
              </span>
            )}
            <button
              type="button"
              onClick={handleClearData}
              className="font-mono text-[11px] transition-opacity hover:opacity-70"
              style={{ color: 'var(--c-faint)' }}
            >
              {t('clearData')}
            </button>
            <button
              type="button"
              onClick={() => setShowWelcome(true)}
              title="Help"
              className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] leading-none transition-opacity hover:opacity-70"
              style={{ boxShadow: 'inset 0 0 0 1px var(--c-line)', color: 'var(--c-sub)' }}
            >
              ?
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main area: PDF preview + mobile tab bar ───────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        <PdfPreview
          templateName={activeTemplate.name}
          layoutName={activeLayout.name}
          showLayoutSuffix={activeTemplate.layouts.length > 1}
          currentPdf={currentPdf}
          isSample={isSample}
          isGenerating={isGenerating}
          currentCv={currentCv}
          onReset={() => setPreviewPdf(null)}
          onGenerate={() => setGenerateTrigger((t) => t + 1)}
          onNewCv={() => setCvModal({ mode: 'new' })}
          onImport={() => importRef.current?.click()}
        />

        {/* Mobile bottom tab bar */}
        <div
          data-testid="mobile-tabbar"
          className="md:hidden shrink-0 flex h-14"
          style={{ borderTop: '1px solid var(--c-line)', background: 'var(--c-paper)' }}
        >
          {(
            [
              ['data', t('tabData')],
              ['template', t('tabTemplate')],
              ['layout', t('tabLayout')],
              ['style', t('tabStyle')],
            ] as [Tab, string][]
          ).map(([tab, label], i) => {
            const on = mobilePanel && activeTab === tab
            return (
              <button
                key={tab}
                type="button"
                data-testid={`mobile-tab-${tab}`}
                onClick={() => openMobileTab(tab)}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors"
                style={{ color: on ? 'var(--c-accent)' : 'var(--c-faint)' }}
              >
                <span className="font-mono text-[9px] tracking-wider">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="font-bold text-[10px] uppercase tracking-wide">{label}</span>
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => setGenerateTrigger((t) => t + 1)}
            disabled={isGenerateDisabled}
            className="flex-1 flex items-center justify-center font-bold text-[11px] uppercase tracking-wider disabled:opacity-40"
            style={{ background: 'var(--c-accent)', color: '#fff' }}
          >
            {compileState !== 'idle' ? '…' : t('genPDFMobile')}
          </button>
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      {showWelcome && (
        <OnboardingModal
          privateMode={privateMode}
          onPrivateToggle={repo.togglePrivateMode}
          onDismiss={dismissWelcome}
        />
      )}

      {cvModal && (
        <CvDataModal
          entry={cvModal.mode === 'edit' ? cvModal.entry : undefined}
          initialContent={cvModal.mode === 'import' ? cvModal.content : undefined}
          initialName={cvModal.mode === 'import' ? cvModal.name : undefined}
          onSave={handleSaveCv}
          onCancel={() => setCvModal(null)}
        />
      )}
    </div>
  )
}
