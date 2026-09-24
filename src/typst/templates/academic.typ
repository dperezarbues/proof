#import "../styles.typ": *
#import "../components.typ": *
#import "../sections.typ": data, lang, render-body-sections
#import "../i18n.typ": section-title

#let id = data.identity
#let layout-raw  = sys.inputs.at("layout", default: "default")
#let layout-file = if layout-raw == "editor" { "editor" } else { "academic-" + layout-raw }
#let layout      = json("/src/layouts/" + layout-file + ".json")
#let style       = layout.at("style", default: (:))

// ── Feature flags ─────────────────────────────────────────────────────────────
#let font-family         = if "font_family" in style { style.at("font_family") } else { font-family }
#let show-footer         = style.at("show_footer",         default: show-footer-sys)         == "true"
#let show-qr             = style.at("show_qr",             default: show-qr-sys)             == "true"
#let show-contact-icons  = style.at("show_contact_icons",  default: show-contact-icons-sys)  == "true"
#let show-contact-labels = style.at("show_contact_labels", default: show-contact-labels-sys) == "true"

// ── Page: slightly wider side margins for a formal, centred feel ───────────────
#set page(paper: page-paper, margin: (x: margin-lg * 1.1, y: page-margin-y),
  footer: if show-footer { cv-footer(id.contact) } else { none })
#set text(font: font-family, size: fs-sm, fill: c-body, lang: "en")
#set par(justify: true, leading: par-leading)
#set block(above: block-spacing, below: block-spacing)
#show link: set text(fill: c-link)

// ── Section heading: centred uppercase + full-width rule ───────────────────────
#let academic-section(title, pre: section-pre, post: section-post, id: none) = {
  v(pre)
  bookmark(title)
  if id != none { section-anchor(id) }
  align(center)[
    #text(size: fs-xs, weight: "bold", tracking: tracking-lg * 1.3, fill: c-ink, upper(title))
  ]
  v(sp-xs, weak: true)
  line(length: 100%, stroke: rule-weight + c-rule)
  v(post)
}

// ── Section render functions ───────────────────────────────────────────────────
#let render-summary(pre: section-pre, post: section-post) = [
  #academic-section(section-title("summary", lang), pre: pre, post: post, id: "summary")
  #set par(justify: true)
  #align(center)[
    #block(width: 85%)[
      #set text(size: fs-md, style: "italic")
      #for (i, para) in data.summary.split("\n\n").enumerate() {
        if i > 0 { v(sp-xl) }
        parse-links(para)
      }
    ]
  ]
]

// Experience shown as "Appointments": org first, then title
#let render-experience(pre: section-pre, post: section-post) = [
  #academic-section(section-title("experience", lang), pre: pre, post: post, id: "experience")
  #for (ji, job) in data.experience.enumerate() {
    if ji > 0 { v(sp-md) }
    block(breakable: false)[
      #let subtitle = job.at("subtitle", default: "")
      #let period   = job.at("period",   default: "")
      #bookmark(job.title, level: 2)
      #grid(columns: (1fr, auto), gutter: sp-sm, align: (left + bottom, right + bottom),
        [#text(size: fs-md, weight: "bold", fill: c-ink, subtitle)#if subtitle != "" [, ]#text(size: fs-md, fill: c-ink, job.title)],
        text(size: fs-sm, fill: c-muted, style: "italic", period),
      )
      #let highlights = job.at("highlights", default: ())
      #if highlights.len() > 0 {
        v(sp-2xs)
        text(size: fs-md, fill: c-body)[#parse-links(highlights.first())]
      }
    ]
  }
]

#let render-education(pre: section-pre, post: section-post) = [
  #academic-section(section-title("education", lang), pre: pre, post: post, id: "education")
  #for (i, edu) in data.education.enumerate() {
    if i > 0 { v(sp-md) }
    block(breakable: false)[
      #let subtitle = edu.at("subtitle", default: "")
      #let period   = edu.at("period",   default: "")
      #bookmark(edu.title, level: 2)
      #grid(columns: (1fr, auto), gutter: sp-sm, align: (left + bottom, right + bottom),
        [#text(size: fs-md, weight: "bold", fill: c-ink, edu.title)#if subtitle != "" [, #text(weight: "regular", fill: c-muted, subtitle)]],
        text(size: fs-sm, fill: c-muted, style: "italic", period),
      )
      #let desc = edu.at("description", default: "")
      #if desc != "" { v(sp-2xs); text(size: fs-sm, fill: c-muted)[#parse-links(desc)] }
    ]
  }
]

// Side projects shown as "Selected Work" with numbered citations
#let render-side-projects(pre: section-pre, post: section-post) = [
  #academic-section(section-title("side_projects", lang), pre: pre, post: post, id: "side_projects")
  #for (i, proj) in data.side_projects.enumerate() {
    if i > 0 { v(sp-md) }
    block(breakable: false)[
      #bookmark(proj.title, level: 2)
      #let desc = proj.at("description", default: "")
      #text(size: fs-md, fill: c-body)[
        #str(i + 1). #text(weight: "bold")[#proj.title]#if desc != "" [. #parse-links(desc)]
      ]
    ]
  }
]

#let render-skills(pre: section-pre, post: section-post) = [
  #academic-section(section-title("skills", lang), pre: pre, post: post, id: "skills")
  #set par(justify: false)
  #let groups = data.skills
  #grid(columns: groups.map(_ => 1fr), column-gutter: skills-gutter, ..groups.map(g => [
    #text(size: fs-2xs, weight: "bold", tracking: tracking-sm, fill: c-light)[#upper(g.name)]
    #v(sp-sm, weak: true)
    #text(size: fs-sm, fill: c-body, g.entries.join(" · "))
  ]))
]

#let render-languages(pre: section-pre, post: section-post) = [
  #academic-section(section-title("languages", lang), pre: pre, post: post, id: "languages")
  #set par(justify: false)
  #for (i, lang) in data.languages.enumerate() {
    if i > 0 { [; ] }
    text(weight: "bold", fill: c-ink)[#lang.title]
    [ ]
    text(fill: c-muted)[#lang.at("subtitle", default: "")]
  }
]

#let render-certifications(pre: section-pre, post: section-post) = [
  #academic-section(section-title("certifications", lang), pre: pre, post: post, id: "certifications")
  #for (i, cert) in data.certifications.enumerate() {
    if i > 0 { v(sp-xs) }
    [
      #text(size: fs-sm, weight: "bold", fill: c-ink, cert.title) \
      #text(size: fs-sm, fill: c-muted, cert.at("subtitle", default: ""))
    ]
  }
]

#let render-awards(pre: section-pre, post: section-post) = [
  #academic-section(section-title("awards", lang), pre: pre, post: post, id: "awards")
  #for (i, award) in data.awards.enumerate() {
    if i > 0 { v(sp-md) }
    block(breakable: false)[
      #let subtitle = award.at("subtitle", default: "")
      #bookmark(award.title, level: 2)
      #grid(columns: (1fr, auto), gutter: sp-sm, align: (left + bottom, right + bottom),
        text(size: fs-md, weight: "bold", fill: c-ink, award.title),
        text(size: fs-sm, fill: c-muted, style: "italic", subtitle),
      )
      #let desc = award.at("description", default: "")
      #if desc != "" { v(sp-sm); text(size: fs-md)[#parse-links(desc)] }
    ]
  }
]

// ── Dispatcher ────────────────────────────────────────────────────────────────
#let render-academic(sid, pre: section-pre, post: section-post) = {
  if      sid == "summary"        { render-summary(pre: pre, post: post) }
  else if sid == "experience"     { render-experience(pre: pre, post: post) }
  else if sid == "education"      { render-education(pre: pre, post: post) }
  else if sid == "side_projects"  { render-side-projects(pre: pre, post: post) }
  else if sid == "skills"         { render-skills(pre: pre, post: post) }
  else if sid == "languages"      { render-languages(pre: pre, post: post) }
  else if sid == "certifications" { render-certifications(pre: pre, post: post) }
  else if sid == "awards"         { render-awards(pre: pre, post: post) }
}

// ── Header ────────────────────────────────────────────────────────────────────
#align(center)[
  #text(size: fs-2xl * 1.3, weight: "bold", fill: c-ink, id.name)
  #v(sp-sm)
  #text(size: fs-xl, fill: c-muted, style: "italic", id.headline)
  #v(sp-md)
  #set text(size: fs-sm, fill: c-muted)
  #set par(justify: false)
  #for (ci, entry) in id.contact.enumerate() {
    if ci > 0 [ · ]
    render-contact-entry(entry, show-icons: show-contact-icons, show-labels: show-contact-labels)
  }
  #if show-qr { v(sp-md); qr-block() }
]

// ── Layout ────────────────────────────────────────────────────────────────────
#render-body-sections(layout, render-academic)
