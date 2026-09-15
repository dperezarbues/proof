'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { KEYS } from '@/lib/storage'
import type { CvEntry } from './CvDataModal'
import SupportPrompt from './components/SupportPrompt'
import PdfJsViewer from './PdfJsViewer'

const SUPPORT_URL = process.env.NEXT_PUBLIC_SUPPORT_URL ?? ''

function getSupportPrompted(): boolean {
  try {
    return !!sessionStorage.getItem(KEYS.supportPrompted)
  } catch {
    return false
  }
}

function setSupportPrompted(): void {
  try {
    sessionStorage.setItem(KEYS.supportPrompted, '1')
  } catch {
    /* ignore */
  }
}

type Props = {
  templateName: string
  layoutName: string
  showLayoutSuffix: boolean
  currentPdf: string
  isSample: boolean
  isGenerating: boolean
  currentCv: CvEntry | null
  onReset: () => void
  onGenerate: () => void
  onNewCv: () => void
  onImport: () => void
}

export default function PdfPreview({
  templateName,
  layoutName,
  showLayoutSuffix,
  currentPdf,
  isSample,
  isGenerating,
  currentCv,
  onReset,
  onGenerate,
  onNewCv,
  onImport,
}: Props) {
  const t = useTranslations('pdfPreview')
  const [showSupport, setShowSupport] = useState(false)

  const downloadUrl = currentPdf.split('?')[0]

  function triggerDownload() {
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = ''
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  function handleSupportDismiss() {
    setSupportPrompted()
    setShowSupport(false)
  }

  function handleDownloadClick() {
    if (SUPPORT_URL && !getSupportPrompted()) {
      setShowSupport(true)
      return
    }
    triggerDownload()
  }

  const generatingSpinner = (
    <>
      <div
        className="w-8 h-8 border-[3px] border-t-transparent rounded-full animate-spin"
        style={{ borderColor: 'var(--c-accent)', borderTopColor: 'transparent' }}
      />
      <p className="text-sm font-medium" style={{ color: 'var(--c-ink2)' }}>
        {t('generatingPDF')}
      </p>
      <p className="text-xs" style={{ color: 'var(--c-sub)' }}>
        {t('runningTypst')}
      </p>
    </>
  )

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0">
      <div
        className="px-4 py-2.5 flex items-center justify-between shrink-0"
        style={{ background: 'var(--c-paper)', borderBottom: '1px solid var(--c-line)' }}
      >
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--c-faint)' }}>
          <span className="font-bold" style={{ color: 'var(--c-ink)' }}>
            {templateName}
          </span>
          {showLayoutSuffix && (
            <>
              <span style={{ color: 'var(--c-line)' }}>·</span>
              <span>{layoutName}</span>
            </>
          )}
          {!isSample && (
            <span
              className="text-xs px-1.5 py-0.5 rounded font-mono uppercase"
              style={{ color: 'var(--c-accent)', boxShadow: 'inset 0 0 0 1.2px var(--c-accent)' }}
            >
              {t('preview')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {!isSample && (
            <button
              type="button"
              onClick={onReset}
              className="text-xs"
              style={{ color: 'var(--c-faint)' }}
            >
              {t('reset')}
            </button>
          )}
          {!isSample && (
            <button
              type="button"
              onClick={handleDownloadClick}
              className="text-sm px-3 py-1.5 rounded-[3px] transition-colors"
              style={{ background: 'var(--c-ink)', color: 'var(--c-paper)' }}
            >
              {t('download')}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 relative min-h-0" data-testid="pdf-preview-area">
        {/* First-ever compile for this CV — no real PDF exists yet, so there's
            nothing to dim. Skip mounting the sample PDF entirely rather than
            showing it (even briefly, even under a translucent spinner): a
            solid loading state reads as "building your PDF", not "we lost
            your data and reverted to the placeholder person". */}
        {isGenerating && isSample ? (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3"
            style={{ background: 'var(--c-paper)' }}
            data-testid="first-compile-loading"
          >
            {generatingSpinner}
          </div>
        ) : (
          <>
            <PdfJsViewer src={currentPdf} reserveBottom={!isGenerating && isSample} />

            {isGenerating && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                style={{ background: 'rgba(241,235,223,0.85)' }}
              >
                {generatingSpinner}
              </div>
            )}
          </>
        )}

        {!isGenerating && isSample && (
          <div
            className="absolute bottom-0 inset-x-0 px-4 py-3 flex items-center justify-between"
            style={{ background: 'var(--c-ink)' }}
          >
            <div className="flex items-center gap-2">
              <span
                className="text-xs px-1.5 py-0.5 rounded font-mono uppercase"
                style={{ color: 'var(--c-accent)', boxShadow: 'inset 0 0 0 1.2px var(--c-accent)' }}
              >
                {t('sample')}
              </span>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>
                {currentCv ? t('hitGenerate') : t('addYourCV')}
              </p>
            </div>
            {currentCv ? (
              <button
                type="button"
                onClick={onGenerate}
                className="text-xs px-3 py-1.5 rounded-[3px] transition-colors shrink-0 ml-4"
                style={{ background: 'var(--c-accent)', color: 'var(--c-paper)' }}
              >
                {t('generatePDF')}
              </button>
            ) : (
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <button
                  type="button"
                  onClick={onNewCv}
                  className="text-xs px-3 py-1.5 rounded-[3px] transition-colors"
                  style={{ background: 'var(--c-accent)', color: 'var(--c-paper)' }}
                >
                  {t('newCV')}
                </button>
                <button
                  type="button"
                  onClick={onImport}
                  className="text-xs px-3 py-1.5 rounded-[3px] transition-colors"
                  style={{
                    color: 'white',
                    boxShadow: 'inset 0 0 0 1.3px rgba(255,255,255,0.35)',
                  }}
                >
                  {t('import')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showSupport && (
        <SupportPrompt
          supportUrl={SUPPORT_URL}
          downloadUrl={downloadUrl}
          onDismiss={handleSupportDismiss}
        />
      )}
    </div>
  )
}
