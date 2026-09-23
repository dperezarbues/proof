import Image from 'next/image'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Btn from '@/components/proof/Btn'
import CropMarks from '@/components/proof/CropMarks'
import MonoLabel from '@/components/proof/MonoLabel'
import RegMark from '@/components/proof/RegMark'
import SiteFooter from '@/components/proof/SiteFooter'
import SiteNav from '@/components/proof/SiteNav'
import { Link } from '@/i18n/navigation'
import { type Locale, routing } from '@/i18n/routing'
import { GITHUB_REPO } from '@/lib/site-links'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

// ── hero ──────────────────────────────────────────────────────────────────────

function CvMockup() {
  return (
    <div className="relative w-full max-w-[320px] sm:max-w-[380px] lg:max-w-[420px]">
      <CropMarks color="var(--c-ink)" gap={-14} len={18} strokeWidth={1.5} />
      <div
        className="overflow-hidden"
        style={{ background: '#fff', boxShadow: '0 24px 60px rgba(0,0,0,0.16)' }}
      >
        <div className="cv-mockup-inner p-6 md:p-8 space-y-4 md:space-y-5 font-sans">
          <div
            className="flex justify-between items-start border-b pb-4"
            style={{ borderColor: 'var(--c-line)' }}
          >
            <div>
              <div
                className="font-black text-[18px] md:text-[22px] tracking-tight"
                style={{ color: 'var(--c-ink)' }}
              >
                Elena Marsh
              </div>
              <div
                className="text-[12px] md:text-[13px] mt-0.5"
                style={{ color: 'var(--c-accent)' }}
              >
                Senior Product Designer
              </div>
            </div>
            <div className="text-right space-y-0.5">
              {['London, UK', 'elenamarsh.design', 'elena@hey.com'].map((c) => (
                <div
                  key={c}
                  className="text-[10px] md:text-[11px]"
                  style={{ color: 'var(--c-faint)', fontFamily: 'var(--f-mono)' }}
                >
                  {c}
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <div
              className="text-[9px] font-bold tracking-[0.15em] uppercase"
              style={{ color: 'var(--c-faint)' }}
            >
              Experience
            </div>
            {[
              { title: 'Senior Product Designer', org: 'Ledger Labs', period: '2021–Present' },
              { title: 'Product Designer', org: 'Northwind', period: '2018–2021' },
            ].map((job) => (
              <div key={job.org}>
                <div className="flex justify-between">
                  <span
                    className="font-bold text-[12px] md:text-[13px]"
                    style={{ color: 'var(--c-ink)' }}
                  >
                    {job.title}
                  </span>
                  <span className="text-[10px] md:text-[11px]" style={{ color: 'var(--c-faint)' }}>
                    {job.period}
                  </span>
                </div>
                <div className="text-[11px] md:text-[12px]" style={{ color: 'var(--c-accent)' }}>
                  {job.org}
                </div>
                <div className="mt-1.5 space-y-0.5">
                  <div className="text-[10px] md:text-[11px]" style={{ color: 'var(--c-sub)' }}>
                    • Led onboarding redesign, lifting activation 34%.
                  </div>
                  <div className="text-[10px] md:text-[11px]" style={{ color: 'var(--c-sub)' }}>
                    • Built the company design system, adopted by 40+ engineers.
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div
        className="absolute top-4 -right-4 md:top-5 md:-right-6 text-[10px] md:text-[11px] font-mono px-2.5 py-1.5 rounded-[3px] tracking-[0.1em]"
        style={{ background: 'var(--c-ink)', color: 'var(--c-paper)' }}
        aria-hidden
      >
        cv.json → PDF · 38ms
      </div>
    </div>
  )
}

async function PHero() {
  const t = await getTranslations('hero')
  return (
    <section className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-14 items-center px-4 py-10 md:px-8 md:py-12 lg:px-14 lg:py-16">
      <div>
        <MonoLabel style={{ color: 'var(--c-accent)' }}>{t('tagline')}</MonoLabel>

        <h1
          className="font-black text-[44px] sm:text-[56px] lg:text-[72px] leading-[0.95] tracking-[-0.03em] uppercase mt-4 lg:mt-5"
          style={{ color: 'var(--c-ink)' }}
        >
          {t('h1Line1')}
          <br />
          {t('h1Line2')}
          <br />
          {t('h1Line3')} <span style={{ color: 'var(--c-accent)' }}>{t('h1AI')}</span>
        </h1>

        <p
          className="text-[16px] md:text-[18px] leading-[1.55] mt-5 mb-7 lg:mb-8 max-w-full lg:max-w-[460px]"
          style={{ color: 'var(--c-sub)' }}
        >
          {t('body')}
        </p>

        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <Btn href="/editor" variant="primary" size="lg">
            {t('openEditor')}
          </Btn>
          <Btn href="/llms-full.txt" download variant="ghost" size="lg">
            {t('downloadSchema')}
          </Btn>
        </div>

        <MonoLabel className="block mt-6 lg:mt-7">{t('badge')}</MonoLabel>
      </div>

      <div className="flex justify-center mt-4 lg:mt-0">
        <CvMockup />
      </div>
    </section>
  )
}

// ── AI band ───────────────────────────────────────────────────────────────────

const SCHEMA_SNIPPET = `{
  "$schema": "https://proof.cv/cv.schema.json",
  "identity": {
    "name": "Elena Marsh",
    "headline": "Senior Product Designer"
  },
  "experience": [{
    "title": "Senior Product Designer",
    "subtitle": "Ledger Labs",
    "period": "2021–Present",
    "highlights": [
      "Led onboarding redesign, lifting activation 34%."
    ]
  }],
  "skills": [{ "name": "Design",
    "entries": ["Figma", "Research", "Systems"] }]
}`

const AI_TOOLS = ['ChatGPT', 'Claude', 'Gemini', 'Copilot', 'Llama', '+ any']

async function PAiBand() {
  const t = await getTranslations('aiBand')
  const steps = t.raw('steps') as { title: string; body: string }[]

  return (
    <section
      className="px-4 py-10 md:px-8 md:py-12 lg:px-14 lg:py-16"
      style={{ background: 'var(--c-ink)', color: '#fff' }}
    >
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-end mb-6 md:mb-10">
        <div>
          <MonoLabel style={{ color: 'var(--c-accent)' }}>{t('badge')}</MonoLabel>
          <h2 className="font-black text-[38px] md:text-[44px] lg:text-[52px] tracking-[-0.03em] leading-none uppercase mt-3">
            {t('h2Line1')}
            <br />
            {t('h2Line2')}
          </h2>
        </div>
        <p
          className="max-w-full md:max-w-[340px] text-[15px] md:text-[16px] leading-[1.6] md:mb-1"
          style={{ color: 'rgba(255,255,255,0.6)' }}
        >
          {t('body')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-11 items-start">
        <div>
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="flex gap-4 md:gap-5 py-4 md:py-5"
              style={{ borderTop: '1px solid rgba(255,255,255,0.14)' }}
            >
              <span
                className="font-black text-[26px] md:text-[30px] min-w-[44px] md:min-w-[48px]"
                style={{ color: 'var(--c-accent)' }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <div className="font-bold text-[17px] md:text-[19px]">{s.title}</div>
                <div
                  className="text-[13.5px] md:text-[14.5px] leading-[1.55] mt-1.5"
                  style={{ color: 'rgba(255,255,255,0.6)' }}
                >
                  {s.body}
                </div>
              </div>
            </div>
          ))}

          <div className="mt-5 md:mt-6">
            <MonoLabel style={{ color: 'rgba(255,255,255,0.5)' }}>{t('worksWith')}</MonoLabel>
            <div className="flex flex-wrap gap-2 md:gap-2.5 mt-3">
              {AI_TOOLS.map((x) => (
                <span
                  key={x}
                  className="font-mono text-[12px] px-2.5 md:px-3 py-1.5 rounded-[3px] text-white"
                  style={{ boxShadow: 'inset 0 0 0 1.2px rgba(255,255,255,0.25)' }}
                >
                  {x}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div
          className="rounded-[6px] overflow-hidden"
          style={{
            background: '#0E0B08',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)',
          }}
        >
          <div
            className="flex items-center gap-2.5 px-4 py-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
          >
            <RegMark size={15} color="var(--c-accent)" />
            <span
              className="font-mono text-[11px] md:text-[12px]"
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              cv.schema.json
            </span>
            <div className="flex-1" />
            <MonoLabel style={{ color: 'rgba(255,255,255,0.4)' }}>{t('openFormat')}</MonoLabel>
          </div>
          <pre
            className="font-mono text-[11px] md:text-[12px] leading-[1.65] p-4 md:p-5 overflow-x-auto"
            style={{ color: 'rgba(255,255,255,0.55)', margin: 0 }}
          >
            {SCHEMA_SNIPPET}
          </pre>
          <div className="px-4 pb-4 md:px-5 md:pb-5 flex gap-2">
            <a
              href="/llms-full.txt"
              download
              className="flex-1 flex items-center justify-center py-3 font-bold text-[12px] md:text-[13px] uppercase tracking-wider rounded-[3px] text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--c-accent)' }}
            >
              {t('downloadSchema')}
            </a>
            <Link
              href="/for-llms"
              className="flex-1 flex items-center justify-center py-3 font-bold text-[12px] md:text-[13px] uppercase tracking-wider rounded-[3px] text-white transition-opacity hover:opacity-90"
              style={{ boxShadow: 'inset 0 0 0 1.3px rgba(255,255,255,0.25)' }}
            >
              {t('viewDocs')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── make it yours ─────────────────────────────────────────────────────────────

async function PMakeYours() {
  const t = await getTranslations('makeYours')
  const features = t.raw('features') as { title: string; body: string }[]

  return (
    <section
      id="editor"
      className="px-4 py-10 md:px-8 md:py-12 lg:px-14 lg:py-16"
      style={{ borderTop: '1px solid var(--c-line)' }}
    >
      <MonoLabel>{t('badge')}</MonoLabel>

      <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-8 lg:gap-12 items-center mt-6">
        <div>
          <h2
            className="font-black text-[34px] md:text-[40px] lg:text-[44px] tracking-[-0.02em] leading-[1.02] uppercase"
            style={{ color: 'var(--c-ink)' }}
          >
            {t('h2Line1')}
            <br />
            {t('h2Line2')}
          </h2>
          <p
            className="text-[15px] md:text-[16.5px] leading-[1.6] mt-4 mb-6 md:mb-7 max-w-full lg:max-w-[400px]"
            style={{ color: 'var(--c-sub)' }}
          >
            {t('body')}
          </p>
          <div>
            {features.map((f) => (
              <div
                key={f.title}
                className="flex gap-3 md:gap-3.5 py-3 md:py-3.5"
                style={{ borderTop: '1px solid var(--c-line)' }}
              >
                <RegMark size={18} color="var(--c-accent)" />
                <div>
                  <div
                    className="font-bold text-[14.5px] md:text-[15.5px]"
                    style={{ color: 'var(--c-ink)' }}
                  >
                    {f.title}
                  </div>
                  <div className="text-[13px] mt-0.5" style={{ color: 'var(--c-sub)' }}>
                    {f.body}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 md:mt-7">
            <Btn href="/editor" variant="primary" size="lg">
              {t('openEditor')}
            </Btn>
          </div>
        </div>

        {/* Editor teaser frame */}
        <div className="relative">
          <CropMarks color="var(--c-ink)" gap={-12} len={16} />
          <div
            className="rounded-[5px] overflow-hidden flex h-[240px] sm:h-[300px] lg:h-[360px]"
            style={{
              background: 'var(--c-card)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.14)',
            }}
          >
            <div
              className="w-28 md:w-36 py-4 px-3 md:px-3.5 shrink-0"
              style={{ background: 'var(--c-ink)' }}
            >
              {['01 Data', '02 Template', '03 Layout', '04 Style'].map((s, i) => (
                <div
                  key={s}
                  className="font-mono text-[10.5px] md:text-[11.5px] py-2 md:py-2.5 tracking-[0.04em]"
                  style={{ color: i === 3 ? 'var(--c-accent)' : 'rgba(255,255,255,0.5)' }}
                >
                  {s}
                </div>
              ))}
            </div>
            <div
              className="flex-1 p-3 md:p-5 overflow-hidden"
              style={{ background: 'var(--c-paper-deep)' }}
            >
              <div
                className="h-full overflow-hidden"
                style={{ background: '#fff', boxShadow: '0 4px 18px rgba(0,0,0,0.12)' }}
              >
                <div className="p-4 md:p-6 space-y-3 scale-75 origin-top-left">
                  <div className="font-black text-lg" style={{ color: 'var(--c-ink)' }}>
                    Elena Marsh
                  </div>
                  <div
                    className="text-xs border-b pb-2"
                    style={{ color: 'var(--c-accent)', borderColor: 'var(--c-line)' }}
                  >
                    Senior Product Designer
                  </div>
                  <div className="space-y-1.5">
                    {['Experience', 'Skills', 'Education'].map((s) => (
                      <div
                        key={s}
                        className="h-2 rounded-full w-3/4"
                        style={{ background: 'var(--c-line)' }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── templates ─────────────────────────────────────────────────────────────────

const TEMPLATES = [
  { id: 'default', name: 'Default' },
  { id: 'sidebar', name: 'Sidebar' },
  { id: 'modern', name: 'Modern' },
  { id: 'minimal', name: 'Minimal' },
  { id: 'banner', name: 'Banner' },
  { id: 'timeline', name: 'Timeline' },
  { id: 'academic', name: 'Academic' },
  { id: 'tech', name: 'Tech' },
  { id: 'editorial', name: 'Editorial' },
  { id: 'compact', name: 'Compact' },
]

async function PTemplates() {
  const t = await getTranslations('templates')
  return (
    <section
      id="templates"
      className="px-4 py-10 md:px-8 md:py-12 lg:px-14 lg:py-16"
      style={{ borderTop: '1px solid var(--c-line)', background: 'var(--c-paper-deep)' }}
    >
      <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-end mb-5 md:mb-7">
        <div>
          <MonoLabel>{t('badge')}</MonoLabel>
          <h2
            className="font-black text-[26px] md:text-[30px] lg:text-[34px] tracking-[-0.02em] uppercase mt-2"
            style={{ color: 'var(--c-ink)' }}
          >
            {t('title')}
          </h2>
        </div>
        <Link
          href="/editor"
          className="font-bold text-[13px] uppercase tracking-wider px-4 py-2.5 md:px-5 md:py-3 rounded-[3px] transition-opacity hover:opacity-80 self-start md:self-auto"
          style={{ boxShadow: 'inset 0 0 0 1.5px var(--c-ink)', color: 'var(--c-ink)' }}
        >
          {t('browseAll')}
        </Link>
      </div>

      <div
        data-testid="template-grid"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 lg:gap-4"
      >
        {TEMPLATES.map((tmpl, i) => (
          <Link
            key={tmpl.id}
            href={{ pathname: '/editor', query: { template: tmpl.id } }}
            className="group relative rounded-[3px] p-2 md:p-3 transition-shadow"
            style={{ background: '#fff', boxShadow: 'inset 0 0 0 1px var(--c-line)' }}
          >
            <div
              className="h-28 md:h-32 lg:h-36 overflow-hidden mb-2 md:mb-2.5 relative"
              style={{ background: '#f5f5f5', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)' }}
            >
              <Image
                src={`/thumbnails/${tmpl.id}.png`}
                alt={`${tmpl.name} template preview`}
                fill
                className="object-cover object-top"
                sizes="(max-width: 640px) 45vw, (max-width: 768px) 30vw, (max-width: 1024px) 22vw, 200px"
              />
            </div>
            <div className="flex justify-between items-center">
              <span
                className="font-bold text-[12px] md:text-[14px]"
                style={{ color: 'var(--c-ink)' }}
              >
                {tmpl.name}
              </span>
              {i === 0 && <MonoLabel style={{ color: 'var(--c-accent)' }}>Default</MonoLabel>}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

// ── privacy ───────────────────────────────────────────────────────────────────

async function PPrivacy() {
  const t = await getTranslations('privacy')
  const chips = t.raw('chips') as string[]

  return (
    <section
      id="privacy"
      className="px-4 py-12 md:px-8 md:py-16 lg:px-14 lg:py-20"
      style={{ borderTop: '1px solid var(--c-line)' }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
        <h2
          className="font-black text-[44px] md:text-[50px] lg:text-[56px] tracking-[-0.03em] leading-[0.98] uppercase"
          style={{ color: 'var(--c-ink)', overflowWrap: 'break-word', hyphens: 'auto' }}
        >
          {t('h2Line1')}
          <br />
          <span style={{ color: 'var(--c-accent)' }}>{t('h2Line2')}</span>
        </h2>
        <div>
          <p className="text-[15px] md:text-[17px] leading-[1.6]" style={{ color: 'var(--c-sub)' }}>
            {t('body')}
          </p>
          <div className="flex flex-wrap gap-2 md:gap-2.5 mt-5 md:mt-6">
            {chips.map((x) => (
              <span
                key={x}
                className="font-bold text-[12px] md:text-[12.5px] px-3 md:px-3.5 py-1.5 rounded-[3px]"
                style={{
                  background: 'var(--c-card)',
                  boxShadow: 'inset 0 0 0 1px var(--c-line)',
                  color: 'var(--c-ink2)',
                }}
              >
                {x}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── open source ───────────────────────────────────────────────────────────────

type OsRowProps = {
  href: string
  title: string
  sub: string
  accent?: boolean
  icon: React.ReactNode
}

function OsRow({ href, title, sub, accent, icon }: OsRowProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 md:gap-4 px-3 py-3.5 md:px-4 md:py-4 rounded-[4px] transition-opacity hover:opacity-85"
      style={{
        background: accent ? 'var(--c-accent)' : 'var(--c-card)',
        boxShadow: accent ? 'none' : 'inset 0 0 0 1px var(--c-line)',
        textDecoration: 'none',
      }}
    >
      <div style={{ color: accent ? '#fff' : 'var(--c-ink)' }}>{icon}</div>
      <div className="flex-1">
        <div
          className="font-bold text-[13.5px] md:text-[15px] uppercase tracking-[0.01em]"
          style={{ color: accent ? '#fff' : 'var(--c-ink)' }}
        >
          {title}
        </div>
        <div
          className="text-[12px] md:text-[12.5px] mt-0.5"
          style={{ color: accent ? 'rgba(255,255,255,0.85)' : 'var(--c-sub)' }}
        >
          {sub}
        </div>
      </div>
      <span
        className="font-black text-[16px] md:text-[18px]"
        style={{ color: accent ? '#fff' : 'var(--c-faint)' }}
      >
        →
      </span>
    </a>
  )
}

function ForkIcon() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <title>Fork</title>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="18" cy="7" r="2.5" />
      <path d="M18 9.5c0 4-12 1-12 6M6 8.5v7" />
    </svg>
  )
}
function ChatIcon() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <title>Chat</title>
      <path d="M4 5h16v11H9l-4 3z" />
      <path d="M8 9h8M8 12.5h5" />
    </svg>
  )
}
function HeartIcon({ filled }: { filled?: boolean }) {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <title>Heart</title>
      <path d="M12 20s-7-4.6-7-9.5A3.5 3.5 0 0 1 12 8a3.5 3.5 0 0 1 7 2.5C19 15.4 12 20 12 20z" />
    </svg>
  )
}

async function POpenSource() {
  const t = await getTranslations('openSource')
  return (
    <section
      className="px-4 py-10 md:px-8 md:py-12 lg:px-14 lg:py-16"
      style={{ borderTop: '1px solid var(--c-line)', background: 'var(--c-paper-deep)' }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 items-center">
        <div>
          <MonoLabel style={{ color: 'var(--c-accent)' }}>{t('badge')}</MonoLabel>
          <h2
            className="font-black text-[34px] md:text-[40px] lg:text-[48px] tracking-[-0.03em] leading-[0.98] uppercase mt-4"
            style={{ color: 'var(--c-ink)' }}
          >
            {t('h2Line1')}
            <br />
            {t('h2Line2')} <span style={{ color: 'var(--c-accent)' }}>{t('h2Line3')}</span>
          </h2>
          <p
            className="text-[15px] md:text-[16.5px] leading-[1.6] mt-4 md:mt-5 max-w-full md:max-w-[420px]"
            style={{ color: 'var(--c-sub)' }}
          >
            {t('body')}
          </p>
        </div>
        <div className="flex flex-col gap-2.5 md:gap-3">
          <OsRow href={GITHUB_REPO} title={t('forkTitle')} sub={t('forkSub')} icon={<ForkIcon />} />
          <OsRow
            href={`${GITHUB_REPO}/issues/new`}
            title={t('requestTitle')}
            sub={t('requestSub')}
            icon={<ChatIcon />}
          />
          <OsRow
            href={process.env.NEXT_PUBLIC_SUPPORT_URL ?? GITHUB_REPO}
            title={t('supportTitle')}
            sub={t('supportSub')}
            accent
            icon={<HeartIcon filled />}
          />
        </div>
      </div>
    </section>
  )
}

// ── CTA ───────────────────────────────────────────────────────────────────────

async function PCta() {
  const t = await getTranslations('cta')
  return (
    <section
      className="px-4 py-8 md:px-8 md:py-10 lg:px-14 lg:py-14"
      style={{ borderTop: '1px solid var(--c-line)' }}
    >
      <div
        className="relative rounded-[6px] px-6 py-8 md:px-10 md:py-10 lg:px-12 lg:py-14 overflow-hidden flex flex-col gap-6 md:flex-row md:justify-between md:items-center md:gap-10"
        style={{ background: 'var(--c-accent)', color: '#fff' }}
      >
        <CropMarks color="rgba(255,255,255,0.4)" gap={12} len={14} />
        <div>
          <h2 className="font-black text-[32px] md:text-[38px] lg:text-[44px] tracking-[-0.02em] uppercase leading-none">
            {t('h2')}
          </h2>
          <p
            className="text-[15px] md:text-[16px] mt-3"
            style={{ color: 'rgba(255,255,255,0.85)' }}
          >
            {t('body')}
          </p>
        </div>
        <Link
          href="/editor"
          className="font-bold text-[14px] md:text-[15px] px-6 py-3.5 md:px-7 md:py-4 rounded-[3px] uppercase tracking-wider text-center whitespace-nowrap transition-opacity hover:opacity-90 shrink-0"
          style={{ background: '#fff', color: 'var(--c-ink)' }}
        >
          {t('button')}
        </Link>
      </div>
    </section>
  )
}

// ── page ──────────────────────────────────────────────────────────────────────

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale as Locale)

  return (
    <div className="min-h-screen" style={{ background: 'var(--c-paper)', color: 'var(--c-ink)' }}>
      <SiteNav />
      <PHero />
      <PAiBand />
      <PMakeYours />
      <PTemplates />
      <PPrivacy />
      <POpenSource />
      <PCta />
      <SiteFooter />
    </div>
  )
}
