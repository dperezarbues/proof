#import "../styles.typ": *
#import "../components.typ": *
#import "../sections.typ": data, lang
#import "../i18n.typ": section-title

#let id = data.identity
#let layout-raw  = sys.inputs.at("layout", default: "default")
#let layout-file = if layout-raw == "editor" { "editor" } else { "timeline-" + layout-raw }
#let layout      = json("/src/layouts/" + layout-file + ".json")
#let style       = layout.at("style", default: (:))

// ── Template tokens ────────────────────────────────────────────────────────────
#let acc         = if "accent_color" in style { rgb(style.accent_color) } else { rgb("#0f766e") }
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
#show link: set text(fill: acc)

// ── Section heading: accent-coloured text + subtle rule ───────────────────────
#let timeline-section(title, pre: section-pre, post: section-post, id: none) = {
  v(pre)
  bookmark(title)
  if id != none { section-anchor(id) }
  text(size: fs-xs, weight: "bold", tracking: section-tracking, fill: acc, upper(title))
  v(section-rule-gap, weak: true)
  line(length: 100%, stroke: rule-weight + c-rule)
  v(post)
}

// ── Timeline dot ──────────────────────────────────────────────────────────────
#let tl-dot = box(width: 8pt, height: 8pt, radius: 4pt, stroke: 1.5pt + acc, fill: white)
#let tl-col-w = 12pt
#let tl-gutter = 6pt

// ── Section render functions ───────────────────────────────────────────────────
#let render-summary(pre: section-pre, post: section-post) = [
  #timeline-section(section-title("summary", lang), pre: pre, post: post, id: "summary")
  #text(size: fs-md)[
    #for (i, para) in data.summary.split("\n\n").enumerate() {
      if i > 0 { v(sp-xl) }
      parse-links(para)
    }
  ]
]

#let render-experience(pre: section-pre, post: section-post) = [
  #timeline-section(section-title("experience", lang), pre: pre, post: post, id: "experience")
  #for (ji, job) in data.experience.enumerate() {
    if ji > 0 { v(sp-xl) }
    block(breakable: false)[
      #grid(
        columns: (tl-col-w, 1fr),
        column-gutter: tl-gutter,
        align: (top, top),
        [#v(1pt)#align(center)[#tl-dot]],
        [
          #let subtitle = job.at("subtitle", default: "")
          #let period   = job.at("period",   default: "")
          #bookmark(job.title, level: 2)
          #grid(columns: (1fr, auto), gutter: sp-sm, align: (left + bottom, right + bottom),
            text(size: fs-lg, weight: "bold", fill: c-ink, job.title),
            text(size: fs-sm, weight: "bold", fill: acc, period),
          )
          #if subtitle != "" { v(sp-2xs); text(size: fs-sm, fill: c-muted, subtitle) }
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
            for t in tags { pill(t); h(pill-gap) }
          }
        ]
      )
    ]
  }
]

#let render-skills(pre: section-pre, post: section-post) = [
  #timeline-section(section-title("skills", lang), pre: pre, post: post, id: "skills")
  #for (i, g) in data.skills.enumerate() {
    if i > 0 { v(sp-sm) }
    [
      #text(size: fs-2xs, weight: "bold", tracking: tracking-sm, fill: c-light, upper(g.name)) \
      #text(size: fs-sm, fill: c-body, g.entries.join(" · "))
    ]
  }
]

#let render-education(pre: section-pre, post: section-post) = [
  #timeline-section(section-title("education", lang), pre: pre, post: post, id: "education")
  #for (i, edu) in data.education.enumerate() {
    if i > 0 { v(sp-md) }
    block(breakable: false)[
      #let subtitle = edu.at("subtitle", default: "")
      #let period   = edu.at("period",   default: "")
      #bookmark(edu.title, level: 2)
      #grid(columns: (1fr, auto), gutter: sp-sm, align: (left + bottom, right + bottom),
        text(size: fs-md, weight: "bold", fill: c-ink, edu.title),
        text(size: fs-sm, fill: c-muted, period),
      )
      #if subtitle != "" { v(sp-2xs); text(size: fs-sm, fill: c-muted, subtitle) }
    ]
  }
]

#let render-languages(pre: section-pre, post: section-post) = [
  #timeline-section(section-title("languages", lang), pre: pre, post: post, id: "languages")
  #for lang in data.languages [
    #text(weight: "bold", fill: c-ink)[#lang.title]#h(sp-sm)#text(fill: c-muted)[#lang.at("subtitle", default: "")] \
  ]
]

#let render-certifications(pre: section-pre, post: section-post) = [
  #timeline-section(section-title("certifications", lang), pre: pre, post: post, id: "certifications")
  #for (i, cert) in data.certifications.enumerate() {
    if i > 0 { v(sp-xs) }
    [
      #text(size: fs-sm, weight: "bold", fill: c-ink, cert.title) \
      #text(size: fs-sm, fill: c-muted, cert.at("subtitle", default: ""))
    ]
  }
]

#let render-awards(pre: section-pre, post: section-post) = [
  #timeline-section(section-title("awards", lang), pre: pre, post: post, id: "awards")
  #for (i, award) in data.awards.enumerate() {
    if i > 0 { v(sp-md) }
    block(breakable: false)[
      #let subtitle = award.at("subtitle", default: "")
      #bookmark(award.title, level: 2)
      #grid(columns: (1fr, auto), gutter: sp-sm, align: (left + bottom, right + bottom),
        text(size: fs-md, weight: "bold", fill: c-ink, award.title),
        text(size: fs-sm, fill: c-muted, subtitle),
      )
      #let desc = award.at("description", default: "")
      #if desc != "" { v(sp-sm); text(size: fs-md)[#parse-links(desc)] }
    ]
  }
]

#let render-side-projects(pre: section-pre, post: section-post) = [
  #timeline-section(section-title("side_projects", lang), pre: pre, post: post, id: "side_projects")
  #for (i, proj) in data.side_projects.enumerate() {
    if i > 0 { v(sp-xl) }
    block(breakable: false)[
      #let subtitle = proj.at("subtitle", default: "")
      #bookmark(proj.title, level: 2)
      #text(size: fs-lg, weight: "bold", fill: c-ink, proj.title)
      #if subtitle != "" { h(gap-xs); text(size: fs-xs, fill: c-muted, subtitle) }
      #let desc = proj.at("description", default: "")
      #if desc != "" { v(sp-sm); text(size: fs-md)[#parse-links(desc)] }
      #let tags = proj.at("tags", default: ())
      #if tags.len() > 0 { v(sp-sm); for t in tags { pill(t); h(pill-gap) } }
    ]
  }
]

// ── Dispatcher ────────────────────────────────────────────────────────────────
#let render-timeline(sid, pre: section-pre, post: section-post) = {
  if      sid == "summary"        { render-summary(pre: pre, post: post) }
  else if sid == "experience"     { render-experience(pre: pre, post: post) }
  else if sid == "skills"         { render-skills(pre: pre, post: post) }
  else if sid == "education"      { render-education(pre: pre, post: post) }
  else if sid == "languages"      { render-languages(pre: pre, post: post) }
  else if sid == "certifications" { render-certifications(pre: pre, post: post) }
  else if sid == "awards"         { render-awards(pre: pre, post: post) }
  else if sid == "side_projects"  { render-side-projects(pre: pre, post: post) }
}

// ── Header ────────────────────────────────────────────────────────────────────
#let header-body = [
  #text(size: fs-2xl, weight: "bold", fill: c-ink, id.name)
  #v(sp-xs)
  #text(size: fs-xl, weight: "bold", fill: acc, id.headline)
  #v(sp-md)
  #set text(size: fs-sm, fill: c-muted)
  #set par(justify: false)
  #for (ci, entry) in id.contact.enumerate() {
    if ci > 0 { h(gap-lg) }
    render-contact-entry(entry, show-icons: show-contact-icons, show-labels: show-contact-labels)
  }
]

#if show-qr {
  grid(columns: (1fr, qr-size), column-gutter: sp-md,
    align: (left + top, right + top),
    header-body, qr-block())
} else {
  header-body
}

// ── Layout ────────────────────────────────────────────────────────────────────
#for section in layout.sections {
  let t    = section.at("type", default: "full")
  let br   = section.at("breakable", default: true)
  let pre  = if "pre_spacing"  in section { section.at("pre_spacing")  * 1em } else { section-pre }
  let post = if "post_spacing" in section { section.at("post_spacing") * 1em } else { section-post }
  if t == "columns" {
    let n-cols = section.at("columns", default: 2)
    let gutter = if n-cols == 3 { col-gutter-3 } else if n-cols == 4 { col-gutter-4 } else { col-gutter-2 }
    let cells  = section.content.map(sids => [#for sid in sids { render-timeline(sid, pre: pre, post: post) }])
    block(breakable: br)[
      #grid(columns: range(n-cols).map(_ => 1fr), column-gutter: gutter, ..cells)
    ]
  } else {
    block(breakable: br)[#render-timeline(section.id, pre: pre, post: post)]
  }
}
