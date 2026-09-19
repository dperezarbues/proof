#import "../styles.typ": *
#import "../components.typ": *
// Import data only — we render everything ourselves for full style control
#import "../sections.typ": data, lang
#import "../i18n.typ": section-title

#let id = data.identity

// ── Layout + style ────────────────────────────────────────────────────────────
#let layout-raw  = sys.inputs.at("layout", default: "default")
#let layout-file = if layout-raw == "editor" { "editor" } else { "minimal-" + layout-raw }
#let layout      = json("/src/layouts/" + layout-file + ".json")
#let style       = layout.at("style", default: (:))

// ── Feature flags ─────────────────────────────────────────────────────────────
#let show-footer         = style.at("show_footer",         default: show-footer-sys)         == "true"
#let show-qr             = style.at("show_qr",             default: show-qr-sys)             == "true"
#let show-contact-icons  = style.at("show_contact_icons",  default: show-contact-icons-sys)  == "true"
#let show-contact-labels = style.at("show_contact_labels", default: show-contact-labels-sys) == "true"

// ── Page & typography — generous margins, spacious feel ───────────────────────
#set page(
  paper: page-paper,
  margin: (x: margin-lg * 1.2, y: margin-sm * 1.3),
  footer: if show-footer { cv-footer(id.contact) } else { none },
)
#set text(font: font-family, size: fs-sm, fill: c-body, lang: "en")
#set par(justify: true, leading: par-leading * 1.1)
#show link: set text(fill: c-body)  // links inherit body color — no blue

// ── Section heading: label + spacing only, no rule ────────────────────────────
#let section(title, pre: sp-unit * 2.2, post: sp-lg, id: none) = {
  v(pre)
  bookmark(title)
  if id != none { section-anchor(id) }
  text(size: fs-xs, weight: "bold", tracking: tracking-lg * 1.8, fill: c-light, upper(title))
  v(post)
}

// ── Per-section render functions ──────────────────────────────────────────────

#let render-summary(pre: sp-unit * 2.2, post: sp-lg) = [
  #section(section-title("summary", lang), pre: pre, post: post, id: "summary")
  #set text(size: fs-md, fill: c-body)
  #set par(justify: true)
  #for (i, para) in data.summary.split("\n\n").enumerate() {
    if i > 0 { v(sp-xl) }
    parse-links(para)
  }
]

#let render-experience(pre: sp-unit * 2.2, post: sp-lg) = [
  #section(section-title("experience", lang), pre: pre, post: post)
  #set text(size: fs-md, fill: c-body)
  #set par(justify: true)
  #for (ji, job) in data.experience.enumerate() {
    if ji > 0 { v(sp-2xl) }
    block(breakable: false)[
      #let subtitle = job.at("subtitle", default: "")
      #let period   = job.at("period",   default: "")
      #bookmark(job.title + if subtitle != "" { " · " + subtitle } else { "" } + if period != "" { " · " + period } else { "" }, level: 2)
      #grid(
        columns: (1fr, auto),
        gutter: sp-sm,
        text(size: fs-lg, weight: "bold", fill: c-ink, job.title),
        text(size: fs-xs, fill: c-light, period),
      )
      #if subtitle != "" {
        v(sp-xs)
        text(size: fs-sm, fill: c-muted, subtitle)
      }
      #let highlights = job.at("highlights", default: ())
      #if highlights.len() > 0 {
        v(sp-md)
        for (hi, hl) in highlights.enumerate() {
          if hi > 0 { v(sp-xs) }
          [#text(size: fs-xs, fill: c-light)[–]#h(sp-sm)#text(size: fs-md)[#parse-links(hl)]]
        }
      }
    ]
  }
]

#let render-awards(pre: sp-unit * 2.2, post: sp-lg) = [
  #section(section-title("awards", lang), pre: pre, post: post)
  #set text(size: fs-md, fill: c-body)
  #for (i, award) in data.awards.enumerate() {
    if i > 0 { v(sp-xl) }
    block(breakable: false)[
      #let subtitle = award.at("subtitle", default: "")
      #bookmark(award.title + if subtitle != "" { " · " + subtitle } else { "" }, level: 2)
      #grid(
        columns: (1fr, auto),
        gutter: sp-sm,
        text(size: fs-lg, weight: "bold", fill: c-ink, award.title),
        text(size: fs-xs, fill: c-light, subtitle),
      )
      #let desc = award.at("description", default: "")
      #if desc != "" {
        v(sp-sm)
        text(size: fs-md)[#parse-links(desc)]
      }
    ]
  }
]

#let render-skills(pre: sp-unit * 2.2, post: sp-lg) = [
  #section(section-title("skills", lang), pre: pre, post: post)
  #let dot = "\u{00a0}· "
  #set par(justify: false)
  #let groups = data.skills
  #grid(
    columns: groups.map(_ => 1fr),
    column-gutter: skills-gutter,
    ..groups.map(g => [
      #text(size: fs-2xs, weight: "bold", tracking: skills-label-tracking, fill: c-light)[#upper(g.name)]
      #v(sp-sm, weak: true)
      #text(size: fs-sm, fill: c-body, g.entries.join(dot))
    ])
  )
]

#let render-side-projects(pre: sp-unit * 2.2, post: sp-lg) = [
  #section(section-title("side_projects", lang), pre: pre, post: post)
  #set text(size: fs-md, fill: c-body)
  #set par(justify: true)
  #for (i, proj) in data.side_projects.enumerate() {
    if i > 0 { v(sp-xl) }
    block(breakable: false)[
      #let subtitle = proj.at("subtitle", default: "")
      #bookmark(proj.title, level: 2)
      #text(size: fs-lg, weight: "bold", fill: c-ink, proj.title)
      #if subtitle != "" { h(gap-xs); text(size: fs-xs, fill: c-light, subtitle) }
      #let desc = proj.at("description", default: "")
      #if desc != "" {
        v(sp-sm)
        text(size: fs-md)[#parse-links(desc)]
      }
    ]
  }
]

#let render-education(pre: sp-unit * 2.2, post: sp-lg) = [
  #section(section-title("education", lang), pre: pre, post: post)
  #set text(size: fs-md, fill: c-body)
  #for (i, edu) in data.education.enumerate() {
    if i > 0 { v(sp-xl) }
    block(breakable: false)[
      #let period   = edu.at("period",   default: "")
      #let subtitle = edu.at("subtitle", default: "")
      #bookmark(edu.title + if period != "" { " · " + period } else { "" }, level: 2)
      #grid(
        columns: (1fr, auto),
        gutter: sp-sm,
        text(size: fs-lg, weight: "bold", fill: c-ink, edu.title),
        text(size: fs-xs, fill: c-light, period),
      )
      #if subtitle != "" {
        v(sp-xs)
        text(size: fs-md, subtitle)
      }
    ]
  }
]

#let render-certifications(pre: sp-unit * 2.2, post: sp-lg) = [
  #section(section-title("certifications", lang), pre: pre, post: post)
  #set text(size: fs-md, fill: c-body)
  #for (i, cert) in data.certifications.enumerate() {
    if i > 0 { v(sp-sm) }
    block(breakable: false)[
      #let tags    = cert.at("tags", default: ())
      #let expired = "expired" in tags
      #text(size: fs-sm, fill: if expired { c-light } else { c-body }, cert.title) \
      #text(size: fs-xs, fill: c-light)[#cert.at("subtitle", default: "")#if expired [ · exp.]]
    ]
  }
]

#let render-languages(pre: sp-unit * 2.2, post: sp-lg) = [
  #section(section-title("languages", lang), pre: pre, post: post)
  #set text(size: fs-md, fill: c-body)
  #for lang in data.languages [
    #text(size: fs-md)[*#lang.title* ]#text(size: fs-sm, fill: c-muted, lang.at("subtitle", default: ""))#linebreak()
  ]
]

// ── Core Strengths ────────────────────────────────────────────────────────────
#let render-core-strengths(pre: sp-unit * 2.2, post: sp-lg) = {
  if "core_strengths" not in data { return }
  [
    #section(section-title("core_strengths", lang), pre: pre, post: post)
    #set par(justify: false)
    #set text(hyphenate: false)
    #for s in data.core_strengths { pill(s); h(pill-gap) }
  ]
}

// ── Leadership Profile ────────────────────────────────────────────────────────
#let render-leadership-profile(pre: sp-unit * 2.2, post: sp-lg) = {
  if "leadership_profile" not in data { return }
  [
    #section(section-title("leadership_profile", lang), pre: pre, post: post)
    #let lp  = data.leadership_profile
    #let sub = lp.at("subtitle", default: "")
    #if sub != "" {
      text(size: fs-sm, fill: c-muted, sub)
      v(sp-md)
    }
    #let highlights = lp.at("highlights", default: ())
    #for (i, hl) in highlights.enumerate() {
      if i > 0 { v(sp-xs) }
      [#text(size: fs-xs, fill: c-light)[–]#h(sp-sm)#text(size: fs-md)[#parse-links(hl)]]
    }
  ]
}

// ── Generic fallback ──────────────────────────────────────────────────────────
#let render-generic-minimal(id, pre: sp-unit * 2.2, post: sp-lg) = {
  let sec = data.at(id, default: none)
  if sec == none { return }
  let label = id.replace("_", " ")
  section(label, pre: pre, post: post, id: id)
  if type(sec) == str {
    text(size: fs-md)[#parse-links(sec)]
  } else if type(sec) == array {
    for (i, item) in sec.enumerate() {
      if i > 0 { v(sp-xs) }
      if type(item) == str {
        [#text(size: fs-xs, fill: c-light)[–]#h(sp-sm)#text(size: fs-md)[#parse-links(item)]]
      } else if type(item) == dictionary {
        let title    = item.at("title",    default: item.at("name", default: ""))
        let subtitle = item.at("subtitle", default: "")
        let period   = item.at("period",   default: "")
        if title != "" {
          grid(
            columns: (1fr, auto),
            gutter: sp-sm,
            text(size: fs-lg, weight: "bold", fill: c-ink, title),
            text(size: fs-xs, fill: c-light, period),
          )
          if subtitle != "" { v(sp-xs); text(size: fs-sm, fill: c-muted, subtitle) }
          v(sp-xs)
        }
        if "highlights" in item {
          for (hi, hl) in item.highlights.enumerate() {
            if hi > 0 { v(sp-xs) }
            [#text(size: fs-xs, fill: c-light)[–]#h(sp-sm)#text(size: fs-md)[#parse-links(hl)]]
          }
        }
      }
    }
  } else if type(sec) == dictionary {
    if "highlights" in sec {
      for (i, hl) in sec.highlights.enumerate() {
        if i > 0 { v(sp-xs) }
        [#text(size: fs-xs, fill: c-light)[–]#h(sp-sm)#text(size: fs-md)[#parse-links(hl)]]
      }
    }
  }
}

// ── Section dispatcher ────────────────────────────────────────────────────────

#let render-minimal(id, pre: sp-unit * 2.2, post: sp-lg) = {
  if id == "summary"                 { render-summary(pre: pre, post: post) }
  else if id == "experience"         { render-experience(pre: pre, post: post) }
  else if id == "awards"             { render-awards(pre: pre, post: post) }
  else if id == "skills"             { render-skills(pre: pre, post: post) }
  else if id == "side_projects"      { render-side-projects(pre: pre, post: post) }
  else if id == "education"          { render-education(pre: pre, post: post) }
  else if id == "certifications"     { render-certifications(pre: pre, post: post) }
  else if id == "languages"          { render-languages(pre: pre, post: post) }
  else if id == "core_strengths"     { render-core-strengths(pre: pre, post: post) }
  else if id == "leadership_profile" { render-leadership-profile(pre: pre, post: post) }
  else                               { render-generic-minimal(id, pre: pre, post: post) }
}

// ── Header ────────────────────────────────────────────────────────────────────
#let minimal-header-left = [
  #text(size: fs-2xl, weight: "bold", fill: c-ink, id.name)
  #v(sp-sm)
  #line(length: 100%, stroke: tracking-xs + c-rule)
  #v(sp-md)
  #text(size: fs-md, fill: c-muted, id.headline)
  #v(sp-sm)
  #set text(size: fs-xs, fill: c-light)
  #set par(justify: false)
  #for (ci, entry) in id.contact.enumerate() {
    if ci > 0 { h(gap-lg) }
    render-contact-entry(entry, show-icons: show-contact-icons, show-labels: show-contact-labels)
  }
]

#if show-qr {
  grid(
    columns: (1fr, qr-size),
    column-gutter: sp-md,
    align: (left + top, right + top),
    minimal-header-left,
    qr-block(),
  )
} else {
  minimal-header-left
}

// ── Body sections (layout-driven) ─────────────────────────────────────────────
#for section in layout.sections {
  let t    = section.at("type", default: "full")
  let br   = section.at("breakable", default: true)
  let pre  = if "pre_spacing"  in section { section.at("pre_spacing")  * 1em } else { sp-unit * 2.2 }
  let post = if "post_spacing" in section { section.at("post_spacing") * 1em } else { sp-lg }
  if t == "columns" {
    let n-cols = section.at("columns", default: 2)
    let gutter = if n-cols == 3 { col-gutter-3 } else if n-cols == 4 { col-gutter-4 } else { col-gutter-2 }
    let cells  = section.content.map(sids => [#for sid in sids { render-minimal(sid, pre: pre, post: post) }])
    block(breakable: br)[
      #grid(columns: range(n-cols).map(_ => 1fr), column-gutter: gutter, ..cells)
    ]
  } else {
    block(breakable: br)[#render-minimal(section.id, pre: pre, post: post)]
  }
}
