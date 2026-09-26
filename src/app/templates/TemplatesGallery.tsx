'use client'

import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import MarkProof from '@/components/proof/MarkProof'
import { Link } from '@/i18n/navigation'
import { getItem, hasStorageChoice, KEYS, markStorageChoiceMade, setItem } from '@/lib/storage'
import { initTypstWorker } from '@/lib/typst-compile'
import CvDataModal, { type CvEntry } from './CvDataModal'
import { DataTab } from './components/DataTab'
import { MonoTag, SbBtn } from './components/GalleryAtoms'
import { StepNav } from './components/StepNav'
import { TemplateTab } from './components/TemplateTab'
import { type CvLanguage, getCvLanguage, setCvLanguage } from './cv-language'
import type { EditorTab } from './EditorShell'
import { useCvRepository } from './hooks/useCvRepository'
import { parseStyleValues } from './layout-serializer'
import OnboardingModal from './OnboardingModal'
import PdfPreview from './PdfPreview'
import SharedComputerPrompt from './SharedComputerPrompt'
import { type Design, ExportBundleSchema, SectionDefListSchema } from './schemas'
import type { SectionDef } from './section-defs'
import { DEFAULT_SECTION_LABEL_KEYS, DEFAULT_SECTIONS } from './section-defs'
import {
  loadCurrentTemplate,
  loadLayoutOverride,
  loadStyleOverrides,
  persistCurrentTemplate,
  persistLayoutOverride,
  persistStyleOverrides,
} from './storage-helpers'
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
  const tSection = useTranslations('cvEditor')
  const tCatalog = useTranslations('templateCatalog')
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
  const [showSharedComputerPrompt, setShowSharedComputerPrompt] = useState(false)
  // Holds whichever of requestNewCv/requestImport got deferred behind the shared-computer
  // prompt, so it can run once the user answers — a ref rather than state since it stores a
  // function (React would otherwise try to call it as a state updater).
  const pendingStorageActionRef = useRef<(() => void) | null>(null)
  const importRef = useRef<HTMLInputElement>(null)
  // Design (template+layout+style) extracted from an in-progress bundle
  // import, applied once the CV part is actually saved — see handleSaveCv.
  const [pendingImportDesign, setPendingImportDesign] = useState<Design | null>(null)
  // Bumped on every applyImportedDesign call so EditorShell's key always
  // changes, even when the imported design targets the template/layout
  // that's already active — see applyImportedDesign for why that case needs it.
  const [designImportNonce, setDesignImportNonce] = useState(0)
  const [designImportError, setDesignImportError] = useState<string | null>(null)

  useEffect(() => {
    if (!getItem(KEYS.onboarded)) setShowWelcome(true)
    initTypstWorker(templates.map((t) => t.id))
  }, [templates])

  function dismissWelcome() {
    setItem(KEYS.onboarded, '1')
    markStorageChoiceMade() // onboarding's own shared-computer checkbox already asked this
    setShowWelcome(false)
  }

  /** Gates New-CV/Import behind the shared-computer question the first time a tab is
   *  about to persist CV data without ever having been asked — e.g. a returning visitor
   *  whose browser already has `proof-onboarded` set from an earlier tab, so the
   *  one-time onboarding modal (which asks the same question) won't show again for this
   *  tab. Returns true if the action was deferred (caller must not proceed yet). */
  function guardStorageChoice(action: () => void): boolean {
    if (showWelcome || hasStorageChoice()) return false
    pendingStorageActionRef.current = action
    setShowSharedComputerPrompt(true)
    return true
  }

  function requestNewCv() {
    if (guardStorageChoice(requestNewCv)) return
    setCvModal({ mode: 'new' })
  }

  function requestImport() {
    if (guardStorageChoice(requestImport)) return
    importRef.current?.click()
  }

  function handleSharedComputerChoice(shared: boolean) {
    repo.togglePrivateMode(shared)
    markStorageChoiceMade()
    setShowSharedComputerPrompt(false)
    const pending = pendingStorageActionRef.current
    pendingStorageActionRef.current = null
    pending?.()
  }

  // Localized DEFAULT_SECTIONS — the Data tab already shows these labels
  // translated via the cvEditor namespace; the Layout tab was showing the
  // raw English labels baked into DEFAULT_SECTIONS instead. Only applies to
  // the app's own defaults: a section id/label from a user's own CV JSON
  // (the `_sections` override below) is their real data and must always
  // render verbatim, so it's deliberately left untouched by this.
  const translatedDefaultSections: SectionDef[] = useMemo(
    () =>
      DEFAULT_SECTIONS.map((s) => ({
        ...s,
        label: tSection(DEFAULT_SECTION_LABEL_KEYS[s.id] ?? s.id),
      })),
    [tSection],
  )

  const activeSections: SectionDef[] = useMemo(() => {
    if (!currentCv) return translatedDefaultSections
    try {
      const parsed = JSON.parse(currentCv.content) as { _sections?: unknown }
      if (parsed._sections === undefined) return translatedDefaultSections
      // This re-parses on every load of the active CV, so a malformed
      // `_sections` (e.g. from an imported bundle) must never reach the
      // layout editor unchecked — an unvalidated cast here used to crash on
      // load and re-crash on every subsequent reload, with no recovery.
      const result = SectionDefListSchema.safeParse(parsed._sections)
      return result.success ? result.data : translatedDefaultSections
    } catch {
      return translatedDefaultSections
    }
  }, [currentCv, translatedDefaultSections])

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
    if (pendingImportDesign) {
      applyImportedDesign(pendingImportDesign)
      setPendingImportDesign(null)
    }
    return true
  }

  /** Restores the template/layout/style captured in a bundle import. Design is
   *  global (not per-CV, see the earlier discussion on why), so this just
   *  becomes the new current design — same effect as loading a saved preset,
   *  just arriving via a full CV+design file instead of a named preset. */
  function applyImportedDesign(design: Design) {
    const matchedTemplate = templates.find((tpl) => tpl.id === design.templateId)
    if (!matchedTemplate) return // e.g. exported from a template that no longer exists
    const matchedLayout =
      matchedTemplate.layouts.find((l) => l.id === design.layoutId) ?? matchedTemplate.layouts[0]

    // Each of these can fail under storage-quota pressure. A failed write
    // doesn't stop the import from looking like it worked — the UI updates
    // below regardless, since this render's own state already reflects it —
    // so ignoring the result here would silently revert to the old design
    // on the next reload with no explanation.
    const layoutOk = persistLayoutOverride(design.templateId, matchedLayout.id, design.layout)
    const styleOk = persistStyleOverrides(design.templateId, design.style)
    const templateOk = persistCurrentTemplate(design.templateId, matchedLayout.id)
    setDesignImportError(layoutOk && styleOk && templateOk ? null : t('autosaveError'))

    setActiveTemplate(matchedTemplate)
    setActiveLayout(matchedLayout)
    replacePreviewPdf(null)
    // setActiveTemplate/setActiveLayout above are no-ops (same object
    // references) when the import targets the template/layout that's
    // ALREADY active — EditorShell wouldn't remount from those alone, so the
    // overrides just persisted above would sit unread by the still-live
    // useLayoutEditor/useStyleState instance. This forces the remount
    // regardless, the same way a genuine template switch already does.
    setDesignImportNonce((n) => n + 1)
    syncTemplateUrlParam(matchedTemplate.id)
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
      const raw = ev.target?.result as string
      const name = file.name.replace(/\.json$/i, '')

      // A combined export wraps the CV under a `cv` key alongside an
      // optional `design`; a bare CV file has `identity` at the top level
      // instead. Only the former needs splitting before it reaches the
      // modal, which only ever knows how to review/save plain CV JSON — for
      // anything else (bare CV, malformed JSON, a bundle that fails to
      // validate) `content` stays exactly what was read, and the modal's
      // own parsing/validation reports it.
      let content = raw
      setPendingImportDesign(null)
      try {
        const parsed: unknown = JSON.parse(raw)
        if (parsed && typeof parsed === 'object' && 'cv' in parsed) {
          const result = ExportBundleSchema.safeParse(parsed)
          if (result.success) {
            content = JSON.stringify(result.data.cv)
            setPendingImportDesign(result.data.design ?? null)
          }
        }
      } catch {
        // malformed JSON — let the modal report it, as before
      }

      setCvModal({ mode: 'import', content, name })
    }
    reader.onerror = () => {
      if (process.env.NODE_ENV === 'development')
        console.warn('[import] FileReader error', reader.error)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  /** Bundles the CV with the currently active template/layout/style so a
   *  single downloaded file can fully recreate what's on screen — otherwise
   *  the app's only backup story ("download the JSON periodically", see
   *  /terms) silently drops all presentation customization. Only meaningful
   *  for the currently active CV: design is global, not per-entry (see the
   *  earlier discussion), so there's no "this other saved CV's design" to
   *  attach — downloading a different row falls back to data-only, as before. */
  function downloadCvWithDesign(entry: CvEntry) {
    if (entry.id !== currentCv?.id || !activeLayoutData) {
      repo.downloadCv(entry)
      return
    }
    const layout = (loadLayoutOverride(activeTemplate.id, activeLayout.id) ??
      activeLayoutData) as Design['layout']
    const style = parseStyleValues(
      activeLayoutData,
      activeTemplate.styleParams ?? [],
      loadStyleOverrides(activeTemplate.id),
    )
    const design: Design = {
      templateId: activeTemplate.id,
      layoutId: activeLayout.id,
      layout,
      style,
    }
    const bundle = { cv: JSON.parse(entry.content), design }
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${entry.name}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // history.replaceState, not the Next.js router: this component only reads
  // ?template= once, via the lazy initializer above, specifically to avoid
  // the full-subtree remount that resolving a useSearchParams()-consuming
  // Suspense boundary causes on first load of this statically-exported
  // route (see the CV-language investigation this bug turned up). Routing
  // this update through router.replace() would re-enter that same
  // machinery on every template switch instead of only once at load.
  function syncTemplateUrlParam(id: string) {
    const url = new URL(window.location.href)
    url.searchParams.set('template', id)
    window.history.replaceState(null, '', url)
  }

  function selectTemplate(t: Template) {
    setActiveTemplate(t)
    setActiveLayout(t.layouts[0])
    replacePreviewPdf(null)
    if (activeTab === 'layout' || activeTab === 'style') setActiveTab('layout')
    syncTemplateUrlParam(t.id)
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
            <SbBtn variant="dark" onClick={requestNewCv} title={t('newCvTitle')}>
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

        {designImportError && (
          <p
            role="alert"
            className="text-[11px] px-4 pt-2"
            style={{ color: 'var(--c-error)' }}
            data-testid="design-import-error"
          >
            ⚠ {designImportError}
          </p>
        )}

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {activeTab === 'data' && (
            <DataTab
              cvList={cvList}
              currentCv={currentCv}
              hydrated={hydrated}
              importRef={importRef}
              cvLanguage={cvLanguage}
              onNewCv={requestNewCv}
              onRequestImport={requestImport}
              onImportFile={handleImportFile}
              onSelectCv={repo.selectCv}
              onEditCv={(e) => setCvModal({ mode: 'edit', entry: e })}
              onDownloadCv={downloadCvWithDesign}
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
                key={`${activeTemplate.id}-${activeLayout.id}-${designImportNonce}`}
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
            style={{ color: 'var(--c-sub)' }}
          >
            {t('home')}
          </Link>
          <div className="flex items-center gap-3">
            {privateMode && (
              <span
                className="font-mono text-[10px] tracking-widest uppercase"
                style={{ color: 'var(--c-accent-text)' }}
              >
                {t('private')}
              </span>
            )}
            <button
              type="button"
              onClick={handleClearData}
              className="font-mono text-[11px] transition-opacity hover:opacity-70"
              style={{ color: 'var(--c-sub)' }}
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
          templateName={tCatalog(`${activeTemplate.id}.name`)}
          layoutName={tCatalog(`${activeTemplate.id}.layouts.${activeLayout.id}`)}
          showLayoutSuffix={activeTemplate.layouts.length > 1}
          currentPdf={currentPdf}
          isSample={isSample}
          isGenerating={isGenerating}
          currentCv={currentCv}
          onReset={() => replacePreviewPdf(null)}
          onGenerate={() => setGenerateTrigger((t) => t + 1)}
          onNewCv={requestNewCv}
          onImport={requestImport}
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
                style={{ color: on ? 'var(--c-accent-text)' : 'var(--c-sub)' }}
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

      {showSharedComputerPrompt && <SharedComputerPrompt onChoose={handleSharedComputerChoice} />}

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
