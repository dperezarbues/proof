import fs from 'node:fs'
import path from 'node:path'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Suspense } from 'react'
import { ClientLocaleProvider } from '@/components/ClientLocaleProvider'
import { type Locale, routing } from '@/i18n/routing'
import TemplatesGallery from '../../templates/TemplatesGallery'
import type { StyleParam, Template } from '../../templates/types'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'editor' })
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T
}

// Shape of a style param as it actually appears in templates.json — everything
// StyleParam has except `labelKey`, which doesn't exist in the data; it's computed
// below once we know whether a param came from sharedStyleParams or a specific
// template (see StyleParam's own comment in types.ts for why that distinction matters).
type RawStyleParam = { key: string; group?: string; canonical?: string } & (
  | { type: 'color'; default: string }
  | { type: 'range'; min: number; max: number; step: number; unit: string; default: number }
  | { type: 'select'; options: Array<{ label: string; value: string }>; default: string }
  | { type: 'toggle'; default: string }
  | { type: 'text'; default: string }
)

function withLabelKey(p: RawStyleParam, labelKey: string): StyleParam {
  return { ...p, labelKey } as StyleParam
}

function readLayout(templateId: string, layoutId: string): Record<string, unknown> | null {
  const filename = templateId === 'default' ? layoutId : `${templateId}-${layoutId}`
  try {
    return readJson(path.join(process.cwd(), 'src', 'layouts', `${filename}.json`))
  } catch {
    return null
  }
}

export default async function EditorPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale as Locale)

  const { sharedStyleParams, templates } = readJson<{
    sharedStyleParams: RawStyleParam[]
    templates: (Omit<Template, 'styleParams'> & { styleParams?: RawStyleParam[] })[]
  }>(path.join(process.cwd(), 'src', 'data', 'templates.json'))

  const templatesData: Template[] = templates.map((t) => ({
    ...t,
    styleParams: [
      ...sharedStyleParams.map((p) => withLabelKey(p, `styleParams.shared.${p.key}`)),
      ...(t.styleParams ?? []).map((p) =>
        withLabelKey(p, `templateCatalog.${t.id}.styleParams.${p.key}`),
      ),
    ],
  }))

  const layoutData: Record<string, Record<string, Record<string, unknown>>> = {}
  for (const t of templatesData) {
    layoutData[t.id] = {}
    for (const l of t.layouts) {
      const raw = readLayout(t.id, l.id)
      if (raw) layoutData[t.id][l.id] = raw
    }
  }

  return (
    <ClientLocaleProvider>
      <Suspense>
        <TemplatesGallery templates={templatesData} layoutData={layoutData} />
      </Suspense>
    </ClientLocaleProvider>
  )
}
