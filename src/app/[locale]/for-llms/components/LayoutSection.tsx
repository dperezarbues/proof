import { Code, Field, type ForLlmsT, Section, SectionLabel } from './shared'

export function LayoutSection({ t }: { t: ForLlmsT }) {
  return (
    <Section id="layout" title={t('section3.heading')}>
      <p style={{ fontSize: 13, color: 'var(--c-sub)', marginBottom: '1.25rem' }}>
        {t('section3.intro')}
      </p>

      <SectionLabel>{t('section3.topLevelFields')}</SectionLabel>
      <div>
        <Field name="header" type="object" req desc={t('section3.fields.header')} />
        <Field name="sections" type="array" req desc={t('section3.fields.sections')} />
        <Field name="sidebar_sections" type="array" desc={t('section3.fields.sidebar_sections')} />
        <Field name="style" type="object" desc={t('section3.fields.style')} />
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <SectionLabel>{t('section3.sectionEntryFull')}</SectionLabel>
      </div>
      <Code>{`{ "id": "experience", "breakable": true, "pre_spacing": 0.5, "post_spacing": 0.2 }`}</Code>
      <div style={{ marginTop: '0.75rem' }}>
        <Field name="id" type="string" req desc={t('section3.fieldsEntry.id')} />
        <Field name="breakable" type="boolean" desc={t('section3.fieldsEntry.breakable')} />
        <Field name="pre_spacing" type="number (em)" desc={t('section3.fieldsEntry.pre_spacing')} />
        <Field
          name="post_spacing"
          type="number (em)"
          desc={t('section3.fieldsEntry.post_spacing')}
        />
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <SectionLabel>{t('section3.sectionEntryColumns')}</SectionLabel>
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
        <Field name="type" type='"columns"' req desc={t('section3.fieldsColumns.type')} />
        <Field name="columns" type="2 | 3 | 4" desc={t('section3.fieldsColumns.columns')} />
        <Field name="content" type="string[][]" req desc={t('section3.fieldsColumns.content')} />
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <SectionLabel>{t('section3.completeExamples')}</SectionLabel>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <p style={{ fontSize: 12, color: 'var(--c-faint)', marginBottom: 8 }}>
            {t('section3.exampleDefaultMinimal')}
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
            {t('section3.exampleSidebar')}
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
