import { getTranslations } from 'next-intl/server'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { Link } from '@/i18n/navigation'
import Btn from './Btn'
import MarkProof from './MarkProof'
import MonoLabel from './MonoLabel'

// Shared top nav for every marketing/docs page (landing, /for-llms, /terms).
// The editor is a different app shell (sidebar UI, its own language switcher
// in PdfPreview's top bar) and deliberately doesn't use this.
//
// Editor/Templates/Privacy are anchors on the landing page's own sections
// (ids "editor"/"templates"/"privacy") — linking to "/#id" from any page
// navigates to the landing page and jumps to that section, so the same nav
// works identically regardless of which page it's rendered on.
export default async function SiteNav() {
  const t = await getTranslations('nav')
  return (
    <nav
      className="flex items-center justify-between px-4 py-3 md:px-8 md:py-4 lg:px-14 lg:py-5"
      style={{ borderBottom: '1.5px solid var(--c-ink)' }}
    >
      <Link
        href="/"
        className="flex items-center gap-2 md:gap-3"
        style={{ textDecoration: 'none' }}
      >
        <MarkProof size={26} />
        <span
          className="font-black text-[20px] md:text-[22px] tracking-[-0.02em]"
          style={{ color: 'var(--c-ink)' }}
        >
          Proof
        </span>
        <MonoLabel className="ml-1">Beta</MonoLabel>
      </Link>

      <div className="flex items-center gap-2.5 md:gap-5 lg:gap-8">
        {/* Nav links — hidden on mobile */}
        <Link
          href="/#editor"
          className="hidden md:inline font-semibold text-[13px] lg:text-[14px]"
          style={{ color: 'var(--c-ink2)', textDecoration: 'none', cursor: 'pointer' }}
        >
          {t('editor')}
        </Link>
        <Link
          href="/#templates"
          className="hidden md:inline font-semibold text-[13px] lg:text-[14px]"
          style={{ color: 'var(--c-ink2)', textDecoration: 'none', cursor: 'pointer' }}
        >
          {t('templates')}
        </Link>
        <Link
          href="/#privacy"
          className="hidden md:inline font-semibold text-[13px] lg:text-[14px]"
          style={{ color: 'var(--c-ink2)', textDecoration: 'none', cursor: 'pointer' }}
        >
          {t('privacy')}
        </Link>
        <Link
          href="/for-llms"
          className="hidden md:inline font-semibold text-[13px] lg:text-[14px]"
          style={{ color: 'var(--c-ink2)', textDecoration: 'none', cursor: 'pointer' }}
        >
          {t('schema')}
        </Link>
        <LanguageSwitcher />
        <span className="hidden md:inline">
          <Btn href="/editor" variant="dark">
            {t('openEditor')}
          </Btn>
        </span>
        <span className="md:hidden">
          <Btn href="/editor" variant="dark">
            {t('editorMobile')}
          </Btn>
        </span>
      </div>
    </nav>
  )
}
