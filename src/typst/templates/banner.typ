#import "../styles.typ": *
#import "../components.typ": *
#import "../sections.typ": data, lang, render-body-sections, flat-render-summary, flat-render-experience, flat-render-skills, flat-render-education, flat-render-languages, flat-render-certifications, flat-render-awards, flat-render-side-projects
#import "../i18n.typ": section-title

#let id = data.identity
#let layout-raw  = sys.inputs.at("layout", default: "default")
#let layout-file = if layout-raw == "editor" { "editor" } else { "banner-" + layout-raw }
#let layout      = json("/src/layouts/" + layout-file + ".json")
#let style       = layout.at("style", default: (:))

// ── Template tokens ────────────────────────────────────────────────────────────
#let header-bg   = if "header_bg"    in style { rgb(style.header_bg)    } else { rgb("#243b53") }
#let acc         = if "accent_color" in style { rgb(style.accent_color) } else { rgb("#2bb0a4") }
#let font-family = if "font_family"  in style { style.at("font_family") } else { font-family  }

// ── Feature flags ─────────────────────────────────────────────────────────────
#let show-footer         = style.at("show_footer",         default: show-footer-sys)         == "true"
#let show-qr             = style.at("show_qr",             default: show-qr-sys)             == "true"
#let show-contact-icons  = style.at("show_contact_icons",  default: show-contact-icons-sys)  == "true"
#let show-contact-labels = style.at("show_contact_labels", default: show-contact-labels-sys) == "true"

// ── Page: zero top margin — header band reaches the edge ──────────────────────
#set page(paper: page-paper,
  margin: (top: 0pt, left: 0pt, right: 0pt, bottom: if show-footer { footer-height } else { 0pt }),
  footer: if show-footer { cv-footer(id.contact) } else { none })
#set text(font: font-family, size: fs-sm, fill: c-body, lang: "en")
#set par(justify: true, leading: par-leading)
#set block(above: block-spacing, below: block-spacing)
#show link: set text(fill: acc)

// ── Section heading: accent bar + uppercase text ───────────────────────────────
#let banner-section(title, pre: section-pre, post: section-post, id: none) = {
  v(pre)
  bookmark(title)
  if id != none { section-anchor(id) }
  grid(
    columns: (6pt, auto),
    column-gutter: 5pt,
    align: horizon,
    box(width: 6pt, height: 2.5pt, fill: acc),
    text(size: fs-xs, weight: "bold", tracking: section-tracking, fill: c-ink, upper(title)),
  )
  v(post)
}

// ── Filled pill (accent background) ───────────────────────────────────────────
#let filled-pill(t) = box(
  inset: (x: pill-inset-x, y: pill-inset-y),
  radius: pill-radius,
  fill: acc,
  text(size: fs-2xs, fill: white, t),
)

// ── Dispatcher ────────────────────────────────────────────────────────────────
#let render-banner(sid, pre: section-pre, post: section-post) = {
  if      sid == "summary"        { flat-render-summary(banner-section, pre: pre, post: post) }
  else if sid == "experience"     { flat-render-experience(banner-section, filled-pill, pre: pre, post: post) }
  else if sid == "skills"         { flat-render-skills(banner-section, pre: pre, post: post) }
  else if sid == "education"      { flat-render-education(banner-section, pre: pre, post: post) }
  else if sid == "languages"      { flat-render-languages(banner-section, pre: pre, post: post) }
  else if sid == "certifications" { flat-render-certifications(banner-section, pre: pre, post: post) }
  else if sid == "awards"         { flat-render-awards(banner-section, pre: pre, post: post) }
  else if sid == "side_projects"  { flat-render-side-projects(banner-section, filled-pill, pre: pre, post: post) }
}

// ── Header band ───────────────────────────────────────────────────────────────
#block(width: 100%, fill: header-bg,
  inset: (x: page-margin-x, top: 0.9cm, bottom: 0.75cm), breakable: false)[
  #if show-qr {
    grid(columns: (1fr, qr-size), column-gutter: sp-md, align: (left + horizon, right + top),
      [
        #text(size: fs-2xl, weight: "bold", fill: white, id.name)
        #v(sp-xs)
        #text(size: fs-xl, fill: acc, id.headline)
        #v(sp-md)
        #set text(size: fs-sm, fill: white.transparentize(15%))
        #set par(justify: false)
        #for (ci, entry) in id.contact.enumerate() {
          if ci > 0 { h(gap-lg) }
          render-contact-entry(entry, show-icons: show-contact-icons, show-labels: show-contact-labels)
        }
      ],
      qr-block(),
    )
  } else {
    text(size: fs-2xl, weight: "bold", fill: white, id.name)
    v(sp-xs)
    text(size: fs-xl, fill: acc, id.headline)
    v(sp-md)
    set text(size: fs-sm, fill: white.transparentize(15%))
    set par(justify: false)
    for (ci, entry) in id.contact.enumerate() {
      if ci > 0 { h(gap-lg) }
      render-contact-entry(entry, show-icons: show-contact-icons, show-labels: show-contact-labels)
    }
  }
]

// ── Body sections (layout-driven) ─────────────────────────────────────────────
#pad(x: page-margin-x, top: margin-xs)[
  #render-body-sections(layout, render-banner)
]
