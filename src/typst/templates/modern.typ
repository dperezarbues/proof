#import "../styles.typ": *
#import "../components.typ": *
#import "../sections.typ": *
#import "../i18n.typ": section-title

#let id = data.identity

// ── Layout + style overrides ──────────────────────────────────────────────────
#let layout-raw  = sys.inputs.at("layout", default: "default")
#let layout-file = if layout-raw == "editor" { "editor" } else { "modern-" + layout-raw }
#let layout      = json("/src/layouts/" + layout-file + ".json")
#let style       = layout.at("style", default: (:))

// ── Modern-specific tokens (overridable via layout.style) ─────────────────────
// White-background, keyline-topped template — no header-bg token by design.
#let accent       = if "accent_color" in style { rgb(style.accent_color) } else { rgb("#3b82f6") }
#let font-family  = if "font_family"  in style { style.at("font_family") } else { font-family  }

// ── Feature flags ─────────────────────────────────────────────────────────────
#let show-footer         = style.at("show_footer",         default: show-footer-sys)         == "true"
#let show-qr             = style.at("show_qr",             default: show-qr-sys)             == "true"
#let show-contact-icons  = style.at("show_contact_icons",  default: show-contact-icons-sys)  == "true"
#let show-contact-labels = style.at("show_contact_labels", default: show-contact-labels-sys) == "true"

// ── Page: normal margins — accent keyline at top via header ───────────────────
#set page(
  paper: page-paper,
  margin: (x: page-margin-x, top: 0pt, bottom: if show-footer { footer-height } else { page-margin-y }),
  footer: if show-footer { cv-footer(id.contact) } else { none },
  header: block(width: 100%, height: 4pt, fill: accent, spacing: 0pt),
  header-ascent: 0pt,
)
#set text(font: font-family, size: fs-sm, fill: c-body, lang: "en")
#set par(justify: true, leading: par-leading)
#set block(above: block-spacing, below: block-spacing)
#show link: set text(fill: accent)

// ── Section heading: accent bar + uppercase text ──────────────────────────────
#let modern-section(title, pre: section-pre, post: section-post, id: none) = {
  v(pre)
  bookmark(title)
  if id != none { section-anchor(id) }
  grid(
    columns: (6pt, auto),
    column-gutter: 5pt,
    align: horizon,
    box(width: 6pt, height: 2.5pt, fill: accent),
    text(size: fs-xs, weight: "bold", tracking: section-tracking, fill: c-ink, upper(title)),
  )
  v(post)
}

// ── Filled pill (accent background) ───────────────────────────────────────────
#let filled-pill(t) = box(
  inset: (x: pill-inset-x, y: pill-inset-y),
  radius: pill-radius,
  fill: accent,
  text(size: fs-2xs, fill: white, t),
)

// ── Dispatcher ────────────────────────────────────────────────────────────────
#let render-modern(sid, pre: section-pre, post: section-post) = {
  if      sid == "summary"        { flat-render-summary(modern-section, pre: pre, post: post) }
  else if sid == "experience"     { flat-render-experience(modern-section, filled-pill, pre: pre, post: post) }
  else if sid == "skills"         { flat-render-skills(modern-section, pre: pre, post: post) }
  else if sid == "education"      { flat-render-education(modern-section, pre: pre, post: post) }
  else if sid == "languages"      { flat-render-languages(modern-section, pre: pre, post: post) }
  else if sid == "certifications" { flat-render-certifications(modern-section, pre: pre, post: post) }
  else if sid == "awards"         { flat-render-awards(modern-section, pre: pre, post: post) }
  else if sid == "side_projects"  { flat-render-side-projects(modern-section, filled-pill, pre: pre, post: post) }
}

// ── Header: two-tone name, contact right-aligned ──────────────────────────────
#let name-parts = id.name.split(" ")
#let first-name = name-parts.first()
#let last-name  = name-parts.slice(1).join(" ")

#pad(x: page-margin-x, top: margin-sm)[
  #if show-qr {
    grid(
      columns: (1fr, auto, qr-size),
      column-gutter: sp-md,
      align: (left + bottom, right + top, right + top),
      [
        #text(size: fs-2xl * 1.15, weight: "extrabold", fill: c-ink, first-name)
        #text(size: fs-2xl * 1.15, weight: "extrabold", fill: accent, [ #last-name])
        #v(sp-xs)
        #text(size: fs-xl, fill: c-muted, weight: "semibold", id.headline)
      ],
      [
        #set align(right)
        #set par(justify: false)
        #for entry in id.contact [
          #render-contact-entry(entry, show-icons: show-contact-icons, show-labels: show-contact-labels, icon-fill: accent) \
        ]
      ],
      qr-block(),
    )
  } else {
    grid(
      columns: (1fr, auto),
      align: (left + bottom, right + top),
      [
        #text(size: fs-2xl * 1.15, weight: "extrabold", fill: c-ink, first-name)
        #text(size: fs-2xl * 1.15, weight: "extrabold", fill: accent, [ #last-name])
        #v(sp-xs)
        #text(size: fs-xl, fill: c-muted, weight: "semibold", id.headline)
      ],
      [
        #set align(right)
        #set par(justify: false)
        #for entry in id.contact [
          #render-contact-entry(entry, show-icons: show-contact-icons, show-labels: show-contact-labels, icon-fill: accent) \
        ]
      ],
    )
  }
]

// ── Body sections (layout-driven) ─────────────────────────────────────────────
#pad(x: page-margin-x, top: margin-sm * 0.3)[
  #render-body-sections(layout, render-modern)
]
