#import "../styles.typ": *
#import "../components.typ": *
#import "../sections.typ": *

#let id = data.identity

// ── Layout + style ────────────────────────────────────────────────────────────
#let layout-raw  = sys.inputs.at("layout", default: "default")
#let layout-file = if layout-raw == "editor" { "editor" } else { "sidebar-" + layout-raw }
#let layout      = json("/src/layouts/" + layout-file + ".json")
#let style       = layout.at("style", default: (:))

// ── Sidebar design tokens (overridable via layout.style) ─────────────────────
#let sb-width   = style.at("sidebar_width", default: 6.5) * 1cm
#let sb-pad-x   = 0.65cm
#let sb-pad-y   = 0.8cm
#let main-pad-x = margin-lg
#let main-pad-y = margin-sm

#let sb-bg     = if "sidebar_bg"          in style { rgb(style.sidebar_bg)         } else { rgb("#1e2d3d") }
#let sb-accent = if "sidebar_accent"      in style { rgb(style.sidebar_accent)     } else { rgb("#5b9bd5") }
#let sb-link   = if "sidebar_link_color"  in style { rgb(style.sidebar_link_color) } else { sb-accent }
#let sb-text   = if "sidebar_text"        in style { rgb(style.sidebar_text)       } else { rgb("#bcc8d4") }
#let sb-ink    = if "sidebar_ink"         in style { rgb(style.sidebar_ink)        } else { white }
#let sb-muted  = sb-text.transparentize(35%)

// ── Typography overrides ──────────────────────────────────────────────────────
#let font-family = if "font_family" in style { style.at("font_family") } else { font-family }

// Sidebar font sizes (same scale as main column — sidebar width is narrow enough)
#let sb-fs-xs  = fs-sm
#let sb-fs-2xs = fs-xs

// ── Feature flags ─────────────────────────────────────────────────────────────
#let show-footer         = style.at("show_footer",         default: show-footer-sys)         == "true"
#let show-qr             = style.at("show_qr",             default: show-qr-sys)             == "true"
#let show-contact-icons  = style.at("show_contact_icons",  default: show-contact-icons-sys)  == "true"
#let show-contact-labels = style.at("show_contact_labels", default: show-contact-labels-sys) == "true"
#let sb-bg-height = 100%

// ── Page: zero margin, sidebar background painted on every page ───────────────
#set page(
  paper: page-paper,
  margin: (top: 0pt, left: 0pt, right: 0pt, bottom: if show-footer { footer-height } else { 0pt }),
  footer: if show-footer { cv-footer(id.contact) } else { none },
  background: place(top + left, rect(width: sb-width, height: sb-bg-height, fill: sb-bg)),
)
#set text(font: font-family, size: fs-sm, fill: c-body, lang: "en")
#set par(justify: true, leading: par-leading)
// No global link rule — sb-link applies inside aside only; main column uses c-link.

// ── Sidebar section heading ───────────────────────────────────────────────────
#let sb-section(title, id: none, pre: section-pre, post: section-post) = {
  v(pre)
  bookmark(title)
  if id != none { section-anchor(id) }
  text(size: sb-fs-2xs, weight: "bold", tracking: tracking-lg, fill: sb-accent, upper(title))
  v(section-rule-gap, weak: true)
  line(length: 100%, stroke: rule-weight + sb-accent.transparentize(60%))
  v(post)
}

// ── Per-sidebar-section render functions ──────────────────────────────────────

#let render-sb-contact(pre: section-pre, post: section-post) = [
  #sb-section("Contact", id: "contact", pre: pre, post: post)
  #set text(size: sb-fs-xs, fill: sb-text)
  #for entry in id.contact [
    #render-contact-entry(entry, show-icons: show-contact-icons, show-labels: show-contact-labels, icon-fill: sb-link) \
  ]
]

#let render-sb-skills(pre: section-pre, post: section-post) = [
  #sb-section("Skills", id: "skills", pre: pre, post: post)
  #let dot = " · "
  #for (i, g) in data.skills.enumerate() {
    if i > 0 { v(sp-sm) }
    [
      #text(size: sb-fs-2xs, weight: "bold", fill: sb-accent)[#upper(g.name)] \
      #text(size: sb-fs-2xs, fill: sb-text)[#g.entries.join(dot)]
    ]
  }
]

#let render-sb-languages(pre: section-pre, post: section-post) = [
  #sb-section("Languages", id: "languages", pre: pre, post: post)
  #set text(size: sb-fs-xs)
  #for lang in data.languages [
    #text(weight: "bold", fill: sb-ink)[#lang.title]#h(sp-sm)#text(fill: sb-text)[#lang.at("subtitle", default: "")] \
  ]
]

#let render-sb-certifications(pre: section-pre, post: section-post) = [
  #sb-section("Certifications", id: "certifications", pre: pre, post: post)
  #for (i, cert) in data.certifications.enumerate() {
    if i > 0 { v(sp-xs) }
    [
      #text(size: sb-fs-2xs, fill: sb-ink)[#cert.title] \
      #text(size: sb-fs-2xs, fill: sb-muted)[#cert.at("subtitle", default: "")]
    ]
  }
]

#let render-sb-summary(pre: section-pre, post: section-post) = [
  #sb-section("Summary", id: "summary", pre: pre, post: post)
  #set text(size: sb-fs-xs, fill: sb-text)
  #set par(justify: true)
  #for (i, para) in data.summary.split("\n\n").enumerate() {
    if i > 0 { v(sp-sm) }
    parse-links(para)
  }
]

#let render-sb-education(pre: section-pre, post: section-post) = [
  #sb-section("Education", id: "education", pre: pre, post: post)
  #for (i, edu) in data.education.enumerate() {
    if i > 0 { v(sp-md) }
    block(breakable: false)[
      #let period   = edu.at("period",   default: "")
      #let subtitle = edu.at("subtitle", default: "")
      #grid(
        columns: (1fr, auto),
        gutter: sp-xs,
        text(size: sb-fs-xs, weight: "bold", fill: sb-ink, edu.title),
        text(size: sb-fs-2xs, fill: sb-muted, period),
      )
      #if subtitle != "" {
        v(sp-2xs)
        text(size: sb-fs-2xs, fill: sb-text, subtitle)
      }
    ]
  }
]

#let render-sb-awards(pre: section-pre, post: section-post) = [
  #sb-section("Awards", id: "awards", pre: pre, post: post)
  #for (i, award) in data.awards.enumerate() {
    if i > 0 { v(sp-md) }
    block(breakable: false)[
      #let subtitle = award.at("subtitle", default: "")
      #bookmark(award.title + if subtitle != "" { " · " + subtitle } else { "" }, level: 2)
      #text(size: sb-fs-xs, weight: "bold", fill: sb-ink)[#award.title] \
      #if subtitle != "" { text(size: sb-fs-2xs, fill: sb-muted)[#subtitle] }
      #let desc = award.at("description", default: "")
      #if desc != "" {
        v(sp-2xs)
        text(size: sb-fs-2xs, fill: sb-text)[#parse-links(desc)]
      }
    ]
  }
]

#let render-sb-side-projects(pre: section-pre, post: section-post) = [
  #sb-section("Side Projects", id: "side_projects", pre: pre, post: post)
  #for (i, proj) in data.side_projects.enumerate() {
    if i > 0 { v(sp-md) }
    block(breakable: false)[
      #let subtitle = proj.at("subtitle", default: "")
      #bookmark(proj.title, level: 2)
      #text(size: sb-fs-xs, weight: "bold", fill: sb-ink)[#proj.title]
      #if subtitle != "" { h(sp-sm); text(size: sb-fs-2xs, fill: sb-muted)[#subtitle] }
      #let desc = proj.at("description", default: "")
      #if desc != "" {
        v(sp-2xs)
        text(size: sb-fs-2xs, fill: sb-text)[#parse-links(desc)]
      }
    ]
  }
]

#let render-sb-core-strengths(pre: section-pre, post: section-post) = {
  if "core_strengths" not in data { return }
  [
    #sb-section("Core Strengths", id: "core_strengths", pre: pre, post: post)
    #for s in data.core_strengths [
      #text(size: sb-fs-2xs, fill: sb-text)[– #s] \
    ]
  ]
}

#let render-sb-generic(sid, pre: section-pre, post: section-post) = {
  let sec = data.at(sid, default: none)
  if sec == none { return }
  let label = sid.replace("_", " ")
  sb-section(label, id: sid, pre: pre, post: post)
  if type(sec) == str {
    text(size: sb-fs-xs, fill: sb-text)[#parse-links(sec)]
  } else if type(sec) == array {
    for item in sec {
      if type(item) == str {
        [#text(size: sb-fs-2xs, fill: sb-text)[– #parse-links(item)] \ ]
      } else if type(item) == dictionary {
        let title    = item.at("title",    default: item.at("name", default: ""))
        let subtitle = item.at("subtitle", default: "")
        [#text(size: sb-fs-xs, weight: "bold", fill: sb-ink)[#title] \ ]
        if subtitle != "" { [#text(size: sb-fs-2xs, fill: sb-muted)[#subtitle] \ ] }
        let desc = item.at("description", default: "")
        if desc != "" { [#text(size: sb-fs-2xs, fill: sb-text)[#parse-links(desc)] \ ] }
      }
    }
  } else if type(sec) == dictionary {
    let sub = sec.at("subtitle", default: "")
    if sub != "" { text(size: sb-fs-xs, fill: sb-text)[#parse-links(sub)] }
    if "highlights" in sec {
      v(sp-xs)
      for hl in sec.highlights {
        [#text(size: sb-fs-2xs, fill: sb-text)[– #parse-links(hl)] \ ]
      }
    }
  }
}

#let render-sb-section(sid, pre: section-pre, post: section-post) = {
  if sid == "contact"             { render-sb-contact(pre: pre, post: post) }
  else if sid == "summary"        { render-sb-summary(pre: pre, post: post) }
  else if sid == "education"      { render-sb-education(pre: pre, post: post) }
  else if sid == "awards"         { render-sb-awards(pre: pre, post: post) }
  else if sid == "skills"         { render-sb-skills(pre: pre, post: post) }
  else if sid == "languages"      { render-sb-languages(pre: pre, post: post) }
  else if sid == "certifications" { render-sb-certifications(pre: pre, post: post) }
  else if sid == "side_projects"  { render-sb-side-projects(pre: pre, post: post) }
  else if sid == "core_strengths" { render-sb-core-strengths(pre: pre, post: post) }
  else                            { render-sb-generic(sid, pre: pre, post: post) }
}

// ── Sidebar (header always shown; sections driven by layout.sidebar_sections) ─
#let sb-sections-raw = layout.at("sidebar_sections", default: (
  (id: "contact", breakable: false),
  (id: "skills",  breakable: true),
  (id: "languages", breakable: false),
  (id: "certifications", breakable: true),
))
// Normalise: accept both plain string IDs and {id, breakable, pre_spacing, post_spacing} objects
#let sb-sections = sb-sections-raw.map(s =>
  if type(s) == str { (id: s, breakable: true) } else { s }
)

#let aside = pad(x: sb-pad-x, top: sb-pad-y)[
  #set text(font: font-family)
  #set par(justify: true)
  #show link: set text(fill: sb-link)

  #par(justify: false)[#text(size: fs-2xl, weight: "bold", fill: sb-ink)[#id.name]]
  #v(sp-sm)
  #text(size: sb-fs-xs, fill: sb-text)[#id.headline]

  #for s in sb-sections {
    let pre  = if "pre_spacing"  in s { s.at("pre_spacing")  * 1em } else { section-pre  }
    let post = if "post_spacing" in s { s.at("post_spacing") * 1em } else { section-post }
    block(breakable: s.at("breakable", default: true))[
      #render-sb-section(s.id, pre: pre, post: post)
    ]
  }

  #if show-qr {
    v(sp-xl)
    align(center, qr-block())
  }
]

// ── Main content (layout.sections driven) ─────────────────────────────────────
#let main = pad(x: main-pad-x, top: main-pad-y)[
  #show link: set text(fill: c-link)
  #for section in layout.sections {
    let t    = section.at("type", default: "full")
    let br   = section.at("breakable", default: true)
    let pre  = if "pre_spacing"  in section { section.at("pre_spacing")  * 1em } else { section-pre  }
    let post = if "post_spacing" in section { section.at("post_spacing") * 1em } else { section-post }
    if t == "columns" {
      let n-cols = section.at("columns", default: 2)
      let gutter = if n-cols == 3 { col-gutter-3 } else if n-cols == 4 { col-gutter-4 } else { col-gutter-2 }
      let cells  = section.content.map(sids => [#for sid in sids { render-section(sid, pre: pre, post: post) }])
      block(breakable: br)[
        #grid(columns: range(n-cols).map(_ => 1fr), column-gutter: gutter, ..cells)
      ]
    } else {
      block(breakable: br)[#render-section(section.id, pre: pre, post: post)]
    }
  }
]

// ── Layout ────────────────────────────────────────────────────────────────────
#grid(
  columns: (sb-width, 1fr),
  aside,
  main,
)
