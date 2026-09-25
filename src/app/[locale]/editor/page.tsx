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
    sharedStyleParams: StyleParam[]
    templates: Template[]
  }>(path.join(process.cwd(), 'src', 'data', 'templates.json'))

  const templatesData: Template[] = templates.map((t) => ({
    ...t,
    styleParams: [...sharedStyleParams, ...(t.styleParams ?? [])],
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
