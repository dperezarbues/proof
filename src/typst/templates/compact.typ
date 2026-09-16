#import "../styles.typ": *
#import "../components.typ": *
#import "../sections.typ": data

#let id = data.identity
#let layout-raw  = sys.inputs.at("layout", default: "default")
#let layout-file = if layout-raw == "editor" { "editor" } else { "compact-" + layout-raw }
#let layout      = json("/src/layouts/" + layout-file + ".json")
#let style       = layout.at("style", default: (:))

// ── Template tokens ────────────────────────────────────────────────────────────
#let acc         = if "accent_color" in style { rgb(style.accent_color) } else { rgb("#334155") }
#let font-family = if "font_family"  in style { style.at("font_family") } else { font-family  }

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
#show link: set text(fill: c-link)

// ── Section heading: plain uppercase, no rule ─────────────────────────────────
#let compact-section(title, pre: section-pre, post: section-post, id: none) = {
  v(pre)
  bookmark(title)
  if id != none { section-anchor(id) }
  text(size: fs-xs, weight: "bold", tracking: tracking-lg, fill: acc, upper(title))
  v(post)
}

// ── Section render functions ───────────────────────────────────────────────────
#let render-summary(pre: section-pre, post: section-post) = [
  #v(sp-md)
  #text(size: fs-md)[
    #for (i, para) in data.summary.split("\n\n").enumerate() {
      if i > 0 { v(sp-xl) }
      parse-links(para)
    }
  ]
  #v(sp-md)
]

#let render-experience(pre: section-pre, post: section-post) = [
  #compact-section("Experience", pre: pre, post: post, id: "experience")
  #for (ji, job) in data.experience.enumerate() {
    if ji > 0 { v(sp-xl) }
    block(breakable: false)[
      #let subtitle = job.at("subtitle", default: "")
      #let period   = job.at("period",   default: "")
      #bookmark(job.title, level: 2)
      #grid(columns: (1fr, auto), gutter: sp-sm, align: (left + bottom, right + bottom),
        text(size: fs-lg, weight: "bold", fill: c-ink, job.title),
        text(size: fs-sm, fill: c-muted, period),
      )
      #if subtitle != "" { v(sp-2xs); text(size: fs-sm, fill: c-muted, subtitle) }
      #let highlights = job.at("highlights", default: ())
      #let shown = if highlights.len() > 2 { highlights.slice(0, 2) } else { highlights }
      #if shown.len() > 0 {
        v(sp-sm)
        for (hi, hl) in shown.enumerate() {
          if hi > 0 { v(sp-2xs) }
          [• #text(size: fs-md)[#parse-links(hl)]]
        }
      }
    ]
  }
]

#let render-skills(pre: section-pre, post: section-post) = [
  #compact-section("Skills", pre: pre, post: post, id: "skills")
  #for (i, g) in data.skills.enumerate() {
    if i > 0 { v(sp-sm) }
    [
      #text(size: fs-2xs, weight: "bold", tracking: tracking-sm, fill: c-light, upper(g.name)) \
      #text(size: fs-sm, fill: c-body, g.entries.join(" · "))
    ]
  }
]

#let render-education(pre: section-pre, post: section-post) = [
  #compact-section("Education", pre: pre, post: post, id: "education")
  #for (i, edu) in data.education.enumerate() {
    if i > 0 { v(sp-sm) }
    block(breakable: false)[
      #let subtitle = edu.at("subtitle", default: "")
      #let period   = edu.at("period",   default: "")
      #bookmark(edu.title, level: 2)
      #text(size: fs-md, weight: "bold", fill: c-ink, edu.title) \
      #text(size: fs-sm, fill: c-muted,
        subtitle + if period != "" { " · " + period } else { "" })
    ]
  }
]

#let render-languages(pre: section-pre, post: section-post) = [
  #compact-section("Languages", pre: pre, post: post, id: "languages")
  #set par(justify: false)
  #for lang in data.languages [
    #grid(columns: (1fr, auto),
      text(size: fs-sm, fill: c-body, lang.title),
      text(size: fs-sm, fill: c-muted, lang.at("subtitle", default: "")))
  ]
]

#let render-certifications(pre: section-pre, post: section-post) = [
  #compact-section("Certifications", pre: pre, post: post, id: "certifications")
  #for (i, cert) in data.certifications.enumerate() {
    if i > 0 { v(sp-xs) }
    [
      #text(size: fs-sm, weight: "bold", fill: c-ink, cert.title) \
      #text(size: fs-sm, fill: c-muted, cert.at("subtitle", default: ""))
    ]
  }
]

#let render-awards(pre: section-pre, post: section-post) = [
  #compact-section("Awards", pre: pre, post: post, id: "awards")
  #for (i, award) in data.awards.enumerate() {
    if i > 0 { v(sp-md) }
    block(breakable: false)[
      #let subtitle = award.at("subtitle", default: "")
      #bookmark(award.title, level: 2)
      #text(size: fs-md, weight: "bold", fill: c-ink, award.title)
      #if subtitle != "" [ · #text(fill: c-muted, subtitle)]
      #let desc = award.at("description", default: "")
      #if desc != "" { v(sp-2xs); text(size: fs-sm, fill: c-body)[#parse-links(desc)] }
    ]
  }
]

#let render-side-projects(pre: section-pre, post: section-post) = [
  #compact-section("Projects", pre: pre, post: post, id: "side_projects")
  #for (i, proj) in data.side_projects.enumerate() {
    if i > 0 { v(sp-md) }
    block(breakable: false)[
      #bookmark(proj.title, level: 2)
      #text(size: fs-md, weight: "bold", fill: c-ink, proj.title)
      #let subtitle = proj.at("subtitle", default: "")
      #if subtitle != "" { h(gap-xs); text(size: fs-xs, fill: c-muted, subtitle) }
      #let desc = proj.at("description", default: "")
      #if desc != "" { v(sp-2xs); text(size: fs-sm, fill: c-body)[#parse-links(desc)] }
    ]
  }
]

// ── Dispatcher ────────────────────────────────────────────────────────────────
#let render-compact(sid, pre: section-pre, post: section-post) = {
  if      sid == "summary"       { render-summary(pre: pre, post: post) }
  else if sid == "experience"    { render-experience(pre: pre, post: post) }
  else if sid == "skills"        { render-skills(pre: pre, post: post) }
  else if sid == "education"     { render-education(pre: pre, post: post) }
  else if sid == "languages"     { render-languages(pre: pre, post: post) }
  else if sid == "certifications"{ render-certifications(pre: pre, post: post) }
  else if sid == "awards"        { render-awards(pre: pre, post: post) }
  else if sid == "side_projects" { render-side-projects(pre: pre, post: post) }
}

// ── Header ────────────────────────────────────────────────────────────────────
// One contact entry per line, not joined onto a single row: this sits in an
// `auto`-width grid column next to the name/headline's `1fr` column below, and
// an `auto` column sizes itself to its content's natural (unwrapped) width —
// joining every entry with " · " made that width grow with the contact count,
// squeezing the name/headline column down to near-nothing once someone had
// more than 3-4 contact methods. Stacking one-per-line bounds the column to
// the single longest entry instead, matching the same adjacent-auto-column
// pattern default.typ already uses safely.
#let contact-row = [
  #set par(justify: false)
  #set text(size: fs-sm, fill: c-muted)
  #for entry in id.contact [
    #render-contact-entry(entry, show-icons: show-contact-icons, show-labels: show-contact-labels) \
  ]
]

#if show-qr {
  grid(columns: (1fr, auto, qr-size), column-gutter: sp-md,
    align: (left + bottom, right + bottom, right + top),
    [
      #text(size: fs-2xl, weight: "bold", fill: c-ink, id.name)
      #h(sp-xl)
      #text(size: fs-xl, fill: c-muted, id.headline)
    ],
    contact-row,
    qr-block(),
  )
} else {
  grid(columns: (1fr, auto), align: (left + bottom, right + bottom),
    [
      #text(size: fs-2xl, weight: "bold", fill: c-ink, id.name)
      #h(sp-xl)
      #text(size: fs-xl, fill: c-muted, id.headline)
    ],
    contact-row,
  )
}
#v(sp-xs)
#line(length: 100%, stroke: 1.5pt + c-ink)

// ── Layout ────────────────────────────────────────────────────────────────────
#for section in layout.sections {
  let t    = section.at("type", default: "full")
  let br   = section.at("breakable", default: true)
  let pre  = if "pre_spacing"  in section { section.at("pre_spacing")  * 1em } else { section-pre }
  let post = if "post_spacing" in section { section.at("post_spacing") * 1em } else { section-post }

  if t == "columns" {
    let n-cols    = section.at("columns", default: 2)
    let gutter    = if n-cols == 3 { col-gutter-3 } else if n-cols == 4 { col-gutter-4 } else { col-gutter-2 }
    let col-widths = if n-cols == 2 { (1.5fr, 1fr) } else { range(n-cols).map(_ => 1fr) }
    let cells     = section.content.map(sids => [#for sid in sids { render-compact(sid, pre: pre, post: post) }])
    block(breakable: br)[
      #grid(columns: col-widths, column-gutter: gutter, ..cells)
    ]
  } else {
    block(breakable: br)[#render-compact(section.id, pre: pre, post: post)]
  }
}
