import { Code, Field, type ForLlmsT, Section, SectionLabel } from './shared'

export function LayoutSection({ t }: { t: ForLlmsT }) {
  return (
    <Section id="layout" title={t('layout.heading')}>
      <p style={{ fontSize: 13, color: 'var(--c-sub)', marginBottom: '1.25rem' }}>
        {t('layout.intro')}
      </p>

      <SectionLabel>{t('layout.topLevelFields')}</SectionLabel>
      <div>
        <Field name="header" type="object" req desc={t('layout.fields.header')} />
        <Field name="sections" type="array" req desc={t('layout.fields.sections')} />
        <Field name="sidebar_sections" type="array" desc={t('layout.fields.sidebar_sections')} />
        <Field name="style" type="object" desc={t('layout.fields.style')} />
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <SectionLabel>{t('layout.sectionEntryFull')}</SectionLabel>
      </div>
      <Code>{`{ "id": "experience", "breakable": true, "pre_spacing": 0.5, "post_spacing": 0.2 }`}</Code>
      <div style={{ marginTop: '0.75rem' }}>
        <Field name="id" type="string" req desc={t('layout.fieldsEntry.id')} />
        <Field name="breakable" type="boolean" desc={t('layout.fieldsEntry.breakable')} />
        <Field name="pre_spacing" type="number (em)" desc={t('layout.fieldsEntry.pre_spacing')} />
        <Field name="post_spacing" type="number (em)" desc={t('layout.fieldsEntry.post_spacing')} />
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <SectionLabel>{t('layout.sectionEntryColumns')}</SectionLabel>
      </div>
      <Code>{`{
  "type": "columns",
  "columns": 2,
  "breakable": true,
  "content": [
    ["education", "languages"],
    ["certifications"]
  ]
}`}</Code>
      <div style={{ marginTop: '0.75rem' }}>
        <Field name="type" type='"columns"' req desc={t('layout.fieldsColumns.type')} />
        <Field name="columns" type="number" desc={t('layout.fieldsColumns.columns')} />
        <Field name="content" type="string[][]" req desc={t('layout.fieldsColumns.content')} />
      </div>
      <p style={{ fontSize: 12, color: 'var(--c-faint)', marginTop: '0.75rem' }}>
        {t('layout.columnsNote')}
      </p>

      <div style={{ marginTop: '1.5rem' }}>
        <SectionLabel>{t('layout.completeExamples')}</SectionLabel>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <p style={{ fontSize: 12, color: 'var(--c-faint)', marginBottom: 8 }}>
            {t('layout.exampleDefaultMinimal')}
          </p>
          <Code>{`{
  "header": { "style": "split" },
  "sections": [
    { "id": "summary",      "breakable": true  },
    { "id": "experience",   "breakable": true  },
    { "id": "skills",       "breakable": false },
    {
      "type": "columns",
      "columns": 2,
      "breakable": true,
      "content": [
        ["education", "languages"],
        ["certifications"]
      ]
    }
  ]
}`}</Code>
        </div>
        <div>
          <p style={{ fontSize: 12, color: 'var(--c-faint)', marginBottom: 8 }}>
            {t('layout.exampleSidebar')}
          </p>
          <Code>{`{
  "header": { "style": "sidebar" },
  "sidebar_sections": [
    { "id": "contact",        "breakable": false },
    { "id": "skills",         "breakable": true  },
    { "id": "languages",      "breakable": false },
    { "id": "certifications", "breakable": true  }
  ],
  "sections": [
    { "id": "summary",    "breakable": true },
    { "id": "experience", "breakable": true },
    { "id": "education",  "breakable": false }
  ]
}`}</Code>
        </div>
      </div>
    </Section>
  )
}
