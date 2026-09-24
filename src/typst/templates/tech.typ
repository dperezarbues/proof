#import "../styles.typ": *
#import "../components.typ": *
#import "../sections.typ": data, lang, render-body-sections
#import "../i18n.typ": section-title

#let id = data.identity
#let layout-raw  = sys.inputs.at("layout", default: "default")
#let layout-file = if layout-raw == "editor" { "editor" } else { "tech-" + layout-raw }
#let layout      = json("/src/layouts/" + layout-file + ".json")
#let style       = layout.at("style", default: (:))

// ── Template tokens ────────────────────────────────────────────────────────────
#let acc         = if "accent_color" in style { rgb(style.accent_color) } else { rgb("#0e9f6e") }
#let font-family = if "font_family"  in style { style.at("font_family") } else { font-family  }
#let mono-font   = "New Computer Modern Mono"

// ── Feature flags ─────────────────────────────────────────────────────────────
#let show-footer         = style.at("show_footer",         default: show-footer-sys)         == "true"
#let show-qr             = style.at("show_qr",             default: show-qr-sys)             == "true"
#let show-contact-icons  = style.at("show_contact_icons",  default: show-contact-icons-sys)  == "true"
#let show-contact-labels = style.at("show_contact_labels", default: show-contact-labels-sys) == "true"

// ── Page ───────────────────────────────────────────────────────────────────────
#set page(paper: page-paper, margin: (x: page-margin-x, y: page-margin-y),
  footer: if show-footer { cv-footer(id.contact) } else { none })
#set text(font: font-family, size: fs-sm, fill: c-body, lang: "en")
#set par(justify: true, leading: par-leading)
#set block(above: block-spacing, below: block-spacing)
#show link: set text(fill: acc)

// ── Section heading: `// name` in monospace + accent colour ───────────────────
#let tech-section(title, pre: section-pre, post: section-post, id: none) = {
  v(pre)
  bookmark(title)
  if id != none { section-anchor(id) }
  text(font: mono-font, size: fs-xs, fill: acc, "// " + lower(title))
  v(post)
}

// ── Filled (accent) pill for tech stack ───────────────────────────────────────
#let filled-pill(t) = box(
  inset: (x: pill-inset-x, y: pill-inset-y),
  radius: pill-radius,
  fill: acc,
  text(size: fs-2xs, fill: white, t),
)

// ── Tag (mono-style, for flat skills grid) ────────────────────────────────────
#let tech-tag(t) = box(
  inset: (x: 5pt, y: 2.5pt),
  radius: 3pt,
  stroke: rule-weight + c-rule,
  fill: c-pill-bg,
  text(font: mono-font, size: fs-2xs, fill: c-body, t),
)

// ── Section render functions ───────────────────────────────────────────────────
#let render-summary(pre: section-pre, post: section-post) = [
  #tech-section(section-title("summary", lang), pre: pre, post: post, id: "summary")
  #text(size: fs-md)[
    #for (i, para) in data.summary.split("\n\n").enumerate() {
      if i > 0 { v(sp-xl) }
      parse-links(para)
    }
  ]
]

#let render-experience(pre: section-pre, post: section-post) = [
  #tech-section(section-title("experience", lang), pre: pre, post: post, id: "experience")
  #for (ji, job) in data.experience.enumerate() {
    if ji > 0 { v(sp-xl) }
    block(breakable: false)[
      #let subtitle = job.at("subtitle", default: "")
      #let period   = job.at("period",   default: "")
      #bookmark(job.title, level: 2)
      #grid(columns: (1fr, auto), gutter: sp-sm, align: (left + bottom, right + bottom),
        text(size: fs-lg, weight: "bold", fill: c-ink, job.title),
        text(font: mono-font, size: fs-sm, fill: c-muted, period),
      )
      #if subtitle != "" { v(sp-2xs); text(size: fs-sm, fill: acc, subtitle) }
      #let highlights = job.at("highlights", default: ())
      #if highlights.len() > 0 {
        v(sp-sm)
        for (hi, hl) in highlights.enumerate() {
          if hi > 0 { v(sp-2xs) }
          [• #text(size: fs-md)[#parse-links(hl)]]
        }
      }
      #let tags = job.at("tags", default: ())
      #if tags.len() > 0 {
        v(sp-sm)
        for t in tags { filled-pill(t); h(pill-gap) }
      }
    ]
  }
]

// Skills: flat tag grid across all groups
#let render-skills(pre: section-pre, post: section-post) = [
  #tech-section(section-title("skills", lang), pre: pre, post: post, id: "skills")
  #set par(justify: false)
  #let all-entries = data.skills.map(g => g.entries).flatten()
  #for entry in all-entries {
    tech-tag(entry)
    h(3pt)
  }
]

#let render-education(pre: section-pre, post: section-post) = [
  #tech-section(section-title("education", lang), pre: pre, post: post, id: "education")
  #for (i, edu) in data.education.enumerate() {
    if i > 0 { v(sp-md) }
    block(breakable: false)[
      #let subtitle = edu.at("subtitle", default: "")
      #let period   = edu.at("period",   default: "")
      #bookmark(edu.title, level: 2)
      #grid(columns: (1fr, auto), gutter: sp-sm, align: (left + bottom, right + bottom),
        text(size: fs-md, weight: "bold", fill: c-ink, edu.title),
        text(font: mono-font, size: fs-sm, fill: c-muted, period),
      )
      #if subtitle != "" { v(sp-2xs); text(size: fs-sm, fill: c-muted, subtitle) }
    ]
  }
]

#let render-languages(pre: section-pre, post: section-post) = [
  #tech-section(section-title("languages", lang), pre: pre, post: post, id: "languages")
  #set par(justify: false)
  #for (i, lang) in data.languages.enumerate() {
    if i > 0 { h(gap-lg) }
    text(weight: "bold", fill: c-ink)[#lang.title]
    h(sp-xs)
    text(font: mono-font, size: fs-sm, fill: c-muted)[#lang.at("subtitle", default: "")]
  }
]

#let render-certifications(pre: section-pre, post: section-post) = [
  #tech-section(section-title("certifications", lang), pre: pre, post: post, id: "certifications")
  #for (i, cert) in data.certifications.enumerate() {
    if i > 0 { v(sp-xs) }
    [
      #text(size: fs-sm, weight: "bold", fill: c-ink, cert.title) \
      #text(font: mono-font, size: fs-sm, fill: c-muted, cert.at("subtitle", default: ""))
    ]
  }
]

#let render-awards(pre: section-pre, post: section-post) = [
  #tech-section(section-title("awards", lang), pre: pre, post: post, id: "awards")
  #for (i, award) in data.awards.enumerate() {
    if i > 0 { v(sp-md) }
    block(breakable: false)[
      #let subtitle = award.at("subtitle", default: "")
      #bookmark(award.title, level: 2)
      #grid(columns: (1fr, auto), gutter: sp-sm, align: (left + bottom, right + bottom),
        text(size: fs-md, weight: "bold", fill: c-ink, award.title),
        text(font: mono-font, size: fs-sm, fill: c-muted, subtitle),
      )
      #let desc = award.at("description", default: "")
      #if desc != "" { v(sp-sm); text(size: fs-md)[#parse-links(desc)] }
    ]
  }
]

#let render-side-projects(pre: section-pre, post: section-post) = [
  #tech-section(section-title("side_projects", lang), pre: pre, post: post, id: "side_projects")
  #for (i, proj) in data.side_projects.enumerate() {
    if i > 0 { v(sp-xl) }
    block(breakable: false)[
      #let subtitle = proj.at("subtitle", default: "")
      #bookmark(proj.title, level: 2)
      #text(size: fs-lg, weight: "bold", fill: c-ink, proj.title)
      #if subtitle != "" { h(gap-xs); text(font: mono-font, size: fs-xs, fill: acc, subtitle) }
      #let desc = proj.at("description", default: "")
      #if desc != "" { v(sp-sm); text(size: fs-md)[#parse-links(desc)] }
      #let tags = proj.at("tags", default: ())
      #if tags.len() > 0 { v(sp-sm); for t in tags { filled-pill(t); h(pill-gap) } }
    ]
  }
]

// ── Dispatcher ────────────────────────────────────────────────────────────────
#let render-tech(sid, pre: section-pre, post: section-post) = {
  if      sid == "summary"        { render-summary(pre: pre, post: post) }
  else if sid == "experience"     { render-experience(pre: pre, post: post) }
  else if sid == "skills"         { render-skills(pre: pre, post: post) }
  else if sid == "education"      { render-education(pre: pre, post: post) }
  else if sid == "languages"      { render-languages(pre: pre, post: post) }
  else if sid == "certifications" { render-certifications(pre: pre, post: post) }
  else if sid == "awards"         { render-awards(pre: pre, post: post) }
  else if sid == "side_projects"  { render-side-projects(pre: pre, post: post) }
}

// ── Header: left accent bar ────────────────────────────────────────────────────
#let header-content = [
  #grid(
    columns: (4pt, 1fr),
    column-gutter: 12pt,
    box(height: fs-2xl * 1.8, fill: acc),
    [
      #text(size: fs-2xl, weight: "bold", fill: c-ink, id.name)
      #v(sp-xs)
      #text(font: mono-font, size: fs-xl, fill: acc, id.headline)
      #v(sp-md)
      #set text(font: mono-font, size: fs-sm, fill: c-muted)
      #set par(justify: false)
      #for (ci, entry) in id.contact.enumerate() {
        if ci > 0 { h(gap-lg) }
        render-contact-entry(entry, show-icons: show-contact-icons, show-labels: show-contact-labels)
      }
    ],
  )
]

#if show-qr {
  grid(columns: (1fr, qr-size), column-gutter: sp-md,
    align: (left + top, right + top),
    header-content, qr-block())
} else {
  header-content
}

// ── Layout ────────────────────────────────────────────────────────────────────
#render-body-sections(layout, render-tech)
