import { Code, type ForLlmsT, InlineCode, Section, SectionLabel } from './shared'

const CONTACT_TYPES = [
  'email',
  'phone',
  'location',
  'linkedin',
  'github',
  'medium',
  'facebook',
  'web',
] as const

export function CvJsonSection({ t }: { t: ForLlmsT }) {
  return (
    <Section id="cv-json" title={t('section1.heading')}>
      <p style={{ fontSize: 13, color: 'var(--c-sub)', marginBottom: '1.25rem' }}>
        {t.rich('section1.intro', { code: (chunks) => <InlineCode>{chunks}</InlineCode> })}
      </p>

      <Code>{`{
  "identity": {
    "name": "Ada Lovelace",
    "headline": "Software Engineer & Mathematician",
    "contact": [
      { "type": "email",    "value": "ada@example.com",               "key": "Email"    },
      { "type": "phone",    "value": "+44 7000 000000",               "key": "Phone"    },
      { "type": "location", "value": "London, UK",                    "key": "Location" },
      { "type": "linkedin", "value": "linkedin.com/in/adalovelace",   "key": "LinkedIn" },
      { "type": "github",   "value": "github.com/ada",                "key": "GitHub"   },
      { "type": "web",      "value": "adalovelace.io",                "key": "Website"  }
    ]
  },

  "summary": "First paragraph of your summary.\\n\\nSecond paragraph (blank line = new paragraph).",

  "experience": [
    {
      "title":      "Principal Engineer",
      "subtitle":   "Acme Corp · London",
      "period":     "2021 – Present",
      "highlights": [
        "Led migration of monolith to microservices, reducing p99 latency by 40%.",
        "Built internal platform adopted by 5 teams; see [case study](https://example.com)."
      ],
      "tags": ["Go", "Kubernetes", "PostgreSQL"]
    }
  ],

  "education": [
    {
      "title":       "University of Cambridge",
      "subtitle":    "MA · Mathematics",
      "period":      "2015 – 2019",
      "description": "Optional notes, thesis title, honours, etc."
    }
  ],

  "skills": [
    { "name": "Languages & Frameworks", "entries": ["Go", "TypeScript", "React", "Python"] },
    { "name": "Cloud & Infrastructure",  "entries": ["AWS", "GCP", "Kubernetes", "Terraform"] },
    { "name": "Methodologies",           "entries": ["DDD", "TDD", "Event Sourcing"] }
  ],

  "languages": [
    { "title": "English", "subtitle": "Native" },
    { "title": "Spanish", "subtitle": "Professional working proficiency" }
  ],

  "certifications": [
    {
      "title":    "AWS Solutions Architect – Professional",
      "subtitle": "Amazon Web Services · 2023",
      "tags":     []
    },
    {
      "title":    "CKA: Certified Kubernetes Administrator",
      "subtitle": "CNCF · 2021",
      "tags":     ["expired"]
    }
  ],

  "awards": [
    {
      "title":       "Best Paper Award",
      "subtitle":    "IEEE Conference on Software Engineering · 2022",
      "description": "Optional description. Supports [links](https://example.com)."
    }
  ],

  "side_projects": [
    {
      "title":       "typst-cv",
      "subtitle":    "open source",
      "description": "A Typst template library for CVs. [GitHub](https://github.com/example/typst-cv).",
      "tags":        ["Typst", "Open Source"]
    }
  ]
}`}</Code>

      <div style={{ marginTop: '1.5rem' }}>
        <SectionLabel>{t('section1.contactHeading')}</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CONTACT_TYPES.map((ct) => (
            <div
              key={ct}
              style={{
                background: 'var(--c-card)',
                borderRadius: 4,
                padding: '8px 12px',
                border: '1px solid var(--c-line)',
              }}
            >
              <code
                style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--c-accent-deep)' }}
              >
                {ct}
              </code>
              <p style={{ fontSize: 11, color: 'var(--c-faint)', marginTop: 2 }}>
                {t(`section1.contactTypes.${ct}`)}
              </p>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: 'var(--c-faint)', marginTop: 12 }}>
          {t('section1.contactNote')}
        </p>
      </div>
    </Section>
  )
}
