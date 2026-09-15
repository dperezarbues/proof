'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { CvEntry } from '../CvDataModal'
import { CV_LANGUAGES, type CvLanguage } from '../cv-language'
import { AccentTag, MonoTag, SbBtn } from './GalleryAtoms'

export function DataTab({
  cvList,
  currentCv,
  hydrated,
  importRef,
  cvLanguage,
  onNewCv,
  onImportFile,
  onSelectCv,
  onEditCv,
  onDownloadCv,
  onDeleteCv,
  onSetCvLanguage,
}: {
  cvList: CvEntry[]
  currentCv: CvEntry | null
  hydrated: boolean
  importRef: React.RefObject<HTMLInputElement | null>
  cvLanguage: CvLanguage
  onNewCv: () => void
  onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSelectCv: (id: string) => void
  onEditCv: (e: CvEntry) => void
  onDownloadCv: (e: CvEntry) => void
  onDeleteCv: (id: string) => void
  onSetCvLanguage: (lang: CvLanguage) => void
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

      {/* CV language */}
      {currentCv && (
        <div
          className="rounded-[4px] p-3.5"
          style={{ background: 'var(--c-card)', boxShadow: 'inset 0 0 0 1px var(--c-line)' }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span aria-hidden style={{ color: 'var(--c-ink2)' }}>
                ⊕
              </span>
              <span className="font-bold text-[13px]" style={{ color: 'var(--c-ink)' }}>
                {t('cvLanguage')}
              </span>
            </div>
            <MonoTag>{t('thisCv')}</MonoTag>
          </div>
          <p className="text-[12px] mb-2.5" style={{ color: 'var(--c-sub)' }}>
            {t('cvLanguageHint')}
          </p>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t('cvLanguage')}>
            {CV_LANGUAGES.map(({ code, nativeName }) => (
              <SbBtn
                key={code}
                variant={cvLanguage === code ? 'primary' : 'ghost'}
                onClick={() => onSetCvLanguage(code)}
                data-testid={`cv-language-${code}`}
                role="radio"
                aria-checked={cvLanguage === code}
              >
                {nativeName}
              </SbBtn>
            ))}
          </div>
        </div>
      )}

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
