import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { GITHUB_REPO } from '@/lib/site-links'
import MarkProof from './MarkProof'

// Shared footer for every marketing/docs page (landing, /for-llms, /terms).
// Same scope rationale as SiteNav — the editor doesn't use this.
export default async function SiteFooter() {
  const t = await getTranslations('footer')
  return (
    <footer
      className="flex flex-col gap-4 md:flex-row items-start md:items-center justify-between px-4 py-6 md:px-8 lg:px-14 md:py-8"
      style={{ borderTop: '1.5px solid var(--c-ink)' }}
    >
      <div className="flex items-center gap-2.5 md:gap-3">
        <MarkProof size={22} />
        <span className="font-mono text-[12px]" style={{ color: 'var(--c-sub)' }}>
          {t('tagline')}
        </span>
      </div>
      <div
        className="flex flex-wrap gap-4 md:gap-6 font-mono text-[12px]"
        style={{ color: 'var(--c-faint)' }}
      >
        <Link href="/for-llms" className="hover:opacity-70 transition-opacity">
          {t('schemaRef')}
        </Link>
        <Link href="/terms" className="hover:opacity-70 transition-opacity">
          {t('privacyTerms')}
        </Link>
        <a
          href={GITHUB_REPO}
          className="hover:opacity-70 transition-opacity"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        {process.env.NEXT_PUBLIC_SUPPORT_URL && (
          <a
            href={process.env.NEXT_PUBLIC_SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-70 transition-opacity"
          >
            {t('support')}
          </a>
        )}
      </div>
    </footer>
  )
}
