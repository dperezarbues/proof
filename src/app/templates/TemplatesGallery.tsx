'use client'

import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import MarkProof from '@/components/proof/MarkProof'
import { Link } from '@/i18n/navigation'
import { getItem, KEYS, setItem } from '@/lib/storage'
import { initTypstWorker } from '@/lib/typst-compile'
import CvDataModal, { type CvEntry } from './CvDataModal'
import { DataTab } from './components/DataTab'
import { MonoTag, SbBtn } from './components/GalleryAtoms'
import { StepNav } from './components/StepNav'
import { TemplateTab } from './components/TemplateTab'
import { type CvLanguage, getCvLanguage, setCvLanguage } from './cv-language'
import type { EditorTab } from './EditorShell'
import { useCvRepository } from './hooks/useCvRepository'
import OnboardingModal from './OnboardingModal'
import PdfPreview from './PdfPreview'
import type { SectionDef } from './section-defs'
import { DEFAULT_SECTIONS } from './section-defs'
import { loadCurrentTemplate, persistCurrentTemplate } from './storage-helpers'
import { TAB_CONFIG } from './tab-config'
import type { CompileState, Layout, Tab, Template } from './types'

const EditorShell = dynamic(() => import('./EditorShell'), { ssr: false })

type CvModalState =
  | { mode: 'new' }
  | { mode: 'import'; content: string; name: string }
  | { mode: 'edit'; entry: CvEntry }

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

  /** Deep link from the landing gallery: /editor?template=<id>. Read via a lazy
   * initializer rather than an effect so the first paint is already the right
   * template — an effect would flash the default one first. Unknown ids fall back.
   * Takes priority over the persisted "last used" template below — an explicit
   * deep link is a deliberate pick, not something a stale preference should override. */
  const initialTemplateId = useSearchParams().get('template')
  const [activeTemplate, setActiveTemplate] = useState<Template>(() => {
    if (initialTemplateId) {
      return templates.find((tpl) => tpl.id === initialTemplateId) ?? templates[0]
    }
    const persisted = loadCurrentTemplate()
    return templates.find((tpl) => tpl.id === persisted?.templateId) ?? templates[0]
  })
  const [activeLayout, setActiveLayout] = useState<Layout>(() => {
    if (!initialTemplateId) {
      const persisted = loadCurrentTemplate()
      const found =
        persisted?.templateId === activeTemplate.id
          ? activeTemplate.layouts.find((l) => l.id === persisted.layoutId)
          : undefined
      if (found) return found
    }
    return activeTemplate.layouts[0]
  })

  // Remembers the last selected template + layout variant so a fresh visit
  // (no ?template= deep link) returns to it instead of always resetting to
  // Default — that template's own layout/style customization is separately
  // scoped per templateId (see loadLayoutOverride/loadStyleOverrides) and is
  // untouched by this; this only remembers the *pointer*.
  useEffect(() => {
    persistCurrentTemplate(activeTemplate.id, activeLayout.id)
  }, [activeTemplate.id, activeLayout.id])
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

  /** Every previewPdf update must go through here — it's the only place that
   * revokes the outgoing blob URL, so a call site can never forget to. */
  function replacePreviewPdf(next: string | null) {
    if (previewPdfRef.current?.startsWith('blob:')) URL.revokeObjectURL(previewPdfRef.current)
    setPreviewPdf(next)
  }

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

  const cvLanguage = useMemo(
    () => (currentCv ? getCvLanguage(currentCv.content) : 'en'),
    [currentCv],
  )

  function handleSetCvLanguage(lang: CvLanguage) {
    if (!currentCv) return
    repo.saveCv({ ...currentCv, content: setCvLanguage(currentCv.content, lang) })
  }

  const samplePdf = `/samples/${activeTemplate.id}.pdf`
  const isSample = previewPdf === null
  const currentPdf = previewPdf ?? samplePdf
  const activeLayoutData = layoutData[activeTemplate.id]?.[activeLayout.id] ?? null
  const isEditable = activeLayoutData !== null

  function handleSaveCv(entry: CvEntry): boolean {
    const { isFirst, ok } = repo.saveCv(entry)
    if (!ok) return false
    setCvModal(null)
    if (isFirst) setGenerateTrigger((t) => t + 1)
    return true
  }

  function handleDeleteCv(id: string) {
    // deleteCv() never touches previewPdf — without this, deleting the CV
    // currently on screen leaves its rendered PDF (and blob URL) sitting
    // there indefinitely. If another CV becomes active, the normal
    // content-change effect will recompile for it shortly after; if this was
    // the last CV, there's nothing left to recompile, so this is the only
    // thing that clears the now-deleted person's data off the screen.
    const wasActive = currentCv?.id === id
    repo.deleteCv(id)
    if (wasActive) replacePreviewPdf(null)
  }

  function handleClearData() {
    if (!confirm(t('clearDataConfirm'))) return
    repo.clearData()
    replacePreviewPdf(null)
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
    replacePreviewPdf(null)
    if (activeTab === 'layout' || activeTab === 'style') setActiveTab('layout')

    // history.replaceState, not the Next.js router: this component only reads
    // ?template= once, via the lazy initializer above, specifically to avoid
    // the full-subtree remount that resolving a useSearchParams()-consuming
    // Suspense boundary causes on first load of this statically-exported
    // route (see the CV-language investigation this bug turned up). Routing
    // this update through router.replace() would re-enter that same
    // machinery on every template switch instead of only once at load.
    const url = new URL(window.location.href)
    url.searchParams.set('template', t.id)
    window.history.replaceState(null, '', url)
  }

  function selectLayout(l: Layout) {
    setActiveLayout(l)
    replacePreviewPdf(null)
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
            <SbBtn
              variant="dark"
              onClick={() => setCvModal({ mode: 'new' })}
              title={t('newCvTitle')}
            >
              {t('newCV')}
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
              cvLanguage={cvLanguage}
              onNewCv={() => setCvModal({ mode: 'new' })}
              onImportFile={handleImportFile}
              onSelectCv={repo.selectCv}
              onEditCv={(e) => setCvModal({ mode: 'edit', entry: e })}
              onDownloadCv={repo.downloadCv}
              onDeleteCv={handleDeleteCv}
              onSetCvLanguage={handleSetCvLanguage}
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
                layoutId={activeLayout.id}
                styleParams={activeTemplate.styleParams ?? []}
                sections={activeSections}
                cvContent={currentCv?.content ?? ''}
                generateTrigger={generateTrigger}
                activeTab={editorTab}
                onPdfChange={(url) => {
                  replacePreviewPdf(url)
                  setMobilePanel(false) // show the result on mobile
                }}
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
                title={t('downloadPDF')}
                aria-label={t('downloadPDF')}
              >
                ↓
              </a>
            )}
          </div>
          {compileError && (
            <p
              role="alert"
              className="font-mono text-[10px] truncate"
              style={{ color: 'var(--c-error)' }}
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
              title={t('help')}
              aria-label={t('help')}
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
          onReset={() => replacePreviewPdf(null)}
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
          {TAB_CONFIG.map(({ id: tab, labelKey }, i) => {
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
                <span className="font-bold text-[10px] uppercase tracking-wide">{t(labelKey)}</span>
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
          cvCount={cvList.length}
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
