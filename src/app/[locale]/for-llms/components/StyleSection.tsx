import { accentColorRows, bannerRows, commonStyleRows, sidebarRows } from '../schema-data'
import { Code, type ForLlmsT, InlineCode, Section, SectionLabel, Tag } from './shared'

const TABLE_HEAD = {
  fontFamily: 'var(--f-mono)',
  fontSize: 10,
  letterSpacing: '0.16em',
  textTransform: 'uppercase' as const,
  color: 'var(--c-faint)',
  textAlign: 'left' as const,
}

export function StyleSection({ t }: { t: ForLlmsT }) {
  const richCode = { code: (chunks: React.ReactNode) => <InlineCode>{chunks}</InlineCode> }

  return (
    <Section id="style" title={t('style.heading')}>
      <p style={{ fontSize: 13, color: 'var(--c-sub)', marginBottom: '1.25rem' }}>
        {t.rich('style.intro', richCode)}
      </p>

      <SectionLabel>{t('style.commonHeading')}</SectionLabel>
      <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={TABLE_HEAD}>
              <th style={{ paddingBottom: 8, paddingRight: 16, fontWeight: 600 }}>
                {t('style.tableKey')}
              </th>
              <th style={{ paddingBottom: 8, paddingRight: 16, fontWeight: 600 }}>
                {t('style.tableType')}
              </th>
              <th style={{ paddingBottom: 8, paddingRight: 16, fontWeight: 600 }}>
                {t('style.tableRange')}
              </th>
              <th style={{ paddingBottom: 8, fontWeight: 600 }}>{t('style.tableDefault')}</th>
            </tr>
          </thead>
          <tbody style={{ fontFamily: 'var(--f-mono)' }}>
            {commonStyleRows.map((row) => (
              <tr
                key={row.key}
                style={{ borderTop: '1px solid var(--c-line2)', color: 'var(--c-ink2)' }}
              >
                <td style={{ padding: '6px 16px 6px 0', color: 'var(--c-accent-deep)' }}>
                  {row.key}
                </td>
                <td style={{ padding: '6px 16px 6px 0', color: 'var(--c-sub)' }}>{row.type}</td>
                <td
                  style={{
                    padding: '6px 16px 6px 0',
                    color: 'var(--c-sub)',
                    fontFamily: 'var(--f-display)',
                    fontSize: 11,
                  }}
                >
                  {row.range}
                </td>
                <td style={{ padding: '6px 0', color: 'var(--c-sub)' }}>{row.default}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: '-1rem', marginBottom: '1.5rem' }}>
        {(['sizesNote', 'colorsNote', 'extrasNote', 'commonNote'] as const).map((key) => (
          <p key={key} style={{ fontSize: 12, color: 'var(--c-faint)', marginBottom: '0.75rem' }}>
            {t(`style.${key}`)}
          </p>
        ))}
      </div>

      <SectionLabel>{t('style.accentHeading')}</SectionLabel>
      <p style={{ fontSize: 12, color: 'var(--c-sub)', marginBottom: '0.75rem' }}>
        {t.rich('style.accentIntro', richCode)}
      </p>
      <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={TABLE_HEAD}>
              <th style={{ paddingBottom: 8, paddingRight: 16, fontWeight: 600 }}>
                {t('style.tableTemplate')}
              </th>
              <th style={{ paddingBottom: 8, paddingRight: 16, fontWeight: 600 }}>
                {t('style.tableAccentDefault')}
              </th>
              <th style={{ paddingBottom: 8, paddingRight: 16, fontWeight: 600 }}>headline_size</th>
              <th style={{ paddingBottom: 8, fontWeight: 600 }}>section_rule_gap</th>
            </tr>
          </thead>
          <tbody style={{ fontFamily: 'var(--f-mono)' }}>
            {accentColorRows.map((row) => (
              <tr
                key={row.id}
                style={{ borderTop: '1px solid var(--c-line2)', color: 'var(--c-ink2)' }}
              >
                <td style={{ padding: '6px 16px 6px 0', color: 'var(--c-accent-deep)' }}>
                  {row.id}
                </td>
                <td style={{ padding: '6px 16px 6px 0' }}>{row.accentDefault}</td>
                <td style={{ padding: '6px 16px 6px 0', color: 'var(--c-sub)' }}>
                  {row.headlineSize}
                </td>
                <td style={{ padding: '6px 0', color: 'var(--c-sub)' }}>{row.sectionRuleGap}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
        <SectionLabel>{t('style.bannerHeading')}</SectionLabel>
        <Tag color="green">banner</Tag>
      </div>
      <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={TABLE_HEAD}>
              <th style={{ paddingBottom: 8, paddingRight: 16, fontWeight: 600 }}>
                {t('style.tableKey')}
              </th>
              <th style={{ paddingBottom: 8, paddingRight: 16, fontWeight: 600 }}>
                {t('style.tableDefault')}
              </th>
              <th style={{ paddingBottom: 8, fontWeight: 600 }}>{t('style.tablePurpose')}</th>
            </tr>
          </thead>
          <tbody style={{ fontFamily: 'var(--f-mono)' }}>
            {bannerRows.map((row) => (
              <tr
                key={row.key}
                style={{ borderTop: '1px solid var(--c-line2)', color: 'var(--c-ink2)' }}
              >
                <td style={{ padding: '6px 16px 6px 0', color: 'var(--c-accent-deep)' }}>
                  {row.key}
                </td>
                <td style={{ padding: '6px 16px 6px 0' }}>{row.default}</td>
                <td
                  style={{
                    padding: '6px 0',
                    fontFamily: 'var(--f-display)',
                    fontSize: 11,
                    color: 'var(--c-sub)',
                  }}
                >
                  {t(`style.bannerPurpose.${row.key}`)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
        <SectionLabel>{t('style.sidebarHeading')}</SectionLabel>
        <Tag>sidebar</Tag>
      </div>
      <p style={{ fontSize: 12, color: 'var(--c-sub)', marginBottom: '0.75rem' }}>
        {t('style.sidebarNote')}
      </p>
      <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={TABLE_HEAD}>
              <th style={{ paddingBottom: 8, paddingRight: 16, fontWeight: 600 }}>
                {t('style.tableKey')}
              </th>
              <th style={{ paddingBottom: 8, paddingRight: 16, fontWeight: 600 }}>
                {t('style.tableDefault')}
              </th>
              <th style={{ paddingBottom: 8, fontWeight: 600 }}>{t('style.tablePurpose')}</th>
            </tr>
          </thead>
          <tbody style={{ fontFamily: 'var(--f-mono)' }}>
            {sidebarRows.map((row) => (
              <tr
                key={row.key}
                style={{ borderTop: '1px solid var(--c-line2)', color: 'var(--c-ink2)' }}
              >
                <td style={{ padding: '6px 16px 6px 0', color: 'var(--c-accent-deep)' }}>
                  {row.key}
                </td>
                <td style={{ padding: '6px 16px 6px 0' }}>{row.default}</td>
                <td
                  style={{
                    padding: '6px 0',
                    fontFamily: 'var(--f-display)',
                    fontSize: 11,
                    color: 'var(--c-sub)',
                  }}
                >
                  {t(`style.sidebarPurpose.${row.key}`)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <SectionLabel>{t('style.exampleHeading')}</SectionLabel>
      </div>
      <p style={{ fontSize: 12, color: 'var(--c-sub)', marginBottom: '0.75rem' }}>
        {t.rich('style.exampleNote', richCode)}
      </p>
      <Code>{`{
  "header": { "style": "split" },
  "style": {
    "font_family":    "Lato",
    "header_bg":      "#0f172a",
    "accent_color":   "#f59e0b",
    "headline_size":  11,
    "body_size":      9.0,
    "line_height":    0.75,
    "show_footer":    "true",
    "show_contact_icons": "true"
  },
  "sections": [
    { "id": "summary",    "breakable": true },
    { "id": "experience", "breakable": true }
  ]
}`}</Code>
    </Section>
  )
}
