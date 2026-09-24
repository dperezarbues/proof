#import "styles.typ": *
#import "components.typ": *
#import "i18n.typ": section-title

#let data = normalize-cv(json(sys.inputs.at("cv_file", default: "/src/data/cv.json")))
#let lang = data.at("_cv_language", default: "en")

// ── Shared layout-section dispatcher ────────────────────────────────────────────
// Walks layout.sections (full-width or column groups) and renders each id
// through render-fn. Shared by templates whose dispatch loop is otherwise
// identical (academic, banner, editorial, modern, sidebar, tech, timeline).
// minimal, compact, and default keep their own copies — they differ in real
// ways (minimal's spacing defaults, compact's asymmetric 2-column width,
// default's gutter_cm override), not just cosmetically.
#let render-body-sections(layout, render-fn, default-pre: section-pre, default-post: section-post) = {
  for section in layout.sections {
    let t    = section.at("type", default: "full")
    let br   = section.at("breakable", default: true)
    let pre  = if "pre_spacing"  in section { section.at("pre_spacing")  * 1em } else { default-pre }
    let post = if "post_spacing" in section { section.at("post_spacing") * 1em } else { default-post }
    if t == "columns" {
      let n-cols = section.at("columns", default: 2)
      let gutter = if n-cols == 3 { col-gutter-3 } else if n-cols == 4 { col-gutter-4 } else { col-gutter-2 }
      let cells  = section.content.map(sids => [#for sid in sids { render-fn(sid, pre: pre, post: post) }])
      block(breakable: br)[
        #grid(columns: range(n-cols).map(_ => 1fr), column-gutter: gutter, ..cells)
      ]
    } else {
      block(breakable: br)[#render-fn(section.id, pre: pre, post: post)]
    }
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
#let render-summary(pre: section-pre, post: section-post) = [
  #cv-section(section-title("summary", lang), pre: pre, post: post, id: "summary")
  #for (i, para) in data.summary.split("\n\n").enumerate() {
    if i > 0 { v(sp-xl) }
    text(size: fs-md)[#parse-links(para)]
  }
]

// ── Experience ────────────────────────────────────────────────────────────────
#let render-experience(pre: section-pre, post: section-post) = [
  #cv-section(section-title("experience", lang), pre: pre, post: post, id: "experience")
  #for (ji, job) in data.experience.enumerate() {
    if ji > 0 { v(sp-xl) }
    block(breakable: false)[
      #let subtitle = job.at("subtitle", default: "")
      #let period   = job.at("period",   default: "")
      #bookmark(job.title + if subtitle != "" { " · " + subtitle } else { "" } + if period != "" { " · " + period } else { "" }, level: 2)
      #grid(
        columns: (1fr, auto),
        gutter: sp-sm,
        align: (left + bottom, right + bottom),
        text(size: fs-lg, weight: "bold", fill: c-ink, job.title),
        text(size: fs-sm, fill: c-muted, period),
      )
      #if subtitle != "" {
        v(sp-sm)
        text(size: fs-sm, fill: c-muted, subtitle)
      }
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
  }
]

// ── Awards ────────────────────────────────────────────────────────────────────
#let render-awards(pre: section-pre, post: section-post) = [
  #cv-section(section-title("awards", lang), pre: pre, post: post, id: "awards")
  #for (i, award) in data.awards.enumerate() {
    if i > 0 { v(sp-md) }
    block(breakable: false)[
      #let subtitle = award.at("subtitle", default: "")
      #bookmark(award.title + if subtitle != "" { " · " + subtitle } else { "" }, level: 2)
      #grid(
        columns: (1fr, auto),
        gutter: sp-sm,
        align: (left + bottom, right + bottom),
        text(size: fs-lg, weight: "bold", fill: c-ink, award.title),
        text(size: fs-sm, fill: c-muted, subtitle),
      )
      #let desc = award.at("description", default: "")
      #if desc != "" {
        v(sp-sm)
        text(size: fs-md)[#parse-links(desc)]
      }
    ]
  }
]

// ── Skills ────────────────────────────────────────────────────────────────────
#let render-skills(pre: section-pre, post: section-post) = [
  #cv-section(section-title("skills", lang), pre: pre, post: post, id: "skills")
  #set par(justify: false)
  #set text(hyphenate: false)
  #let dot    = "\u{00a0}· "
  #let groups = data.skills
  #grid(
    columns: groups.map(_ => 1fr),
    column-gutter: skills-gutter,
    ..groups.map(g => [
      #text(size: fs-2xs, weight: "bold", tracking: skills-label-tracking, fill: c-light, upper(g.name))
      #v(sp-sm, weak: true)
      #text(size: fs-sm, fill: c-body, g.entries.join(dot))
    ])
  )
]

// ── Education ─────────────────────────────────────────────────────────────────
#let render-education(pre: section-pre, post: section-post) = [
  #cv-section(section-title("education", lang), pre: pre, post: post, id: "education")
  #for (i, edu) in data.education.enumerate() {
    if i > 0 { v(sp-md) }
    block(breakable: false)[
      #let period   = edu.at("period",   default: "")
      #let subtitle = edu.at("subtitle", default: "")
      #let desc     = edu.at("description", default: "")
      #bookmark(edu.title + if period != "" { " · " + period } else { "" }, level: 2)
      #grid(
        columns: (1fr, auto),
        gutter: sp-sm,
        align: (left + bottom, right + bottom),
        text(size: fs-lg, weight: "bold", fill: c-ink, edu.title),
        text(size: fs-sm, fill: c-muted, period),
      )
      #if subtitle != "" {
        v(sp-sm, weak: true)
        text(size: fs-md, subtitle)
      }
      #if desc != "" {
        v(sp-sm, weak: true)
        text(size: fs-sm, fill: c-muted, desc)
      }
    ]
  }
]

// ── Languages ─────────────────────────────────────────────────────────────────
#let render-languages(pre: section-pre, post: section-post) = [
  #cv-section(section-title("languages", lang), pre: pre, post: post, id: "languages")
  #set text(hyphenate: false)
  #for lang in data.languages [
    #text(size: fs-md)[*#lang.title* ]#text(size: fs-sm, fill: c-muted, lang.at("subtitle", default: ""))#h(gap-lg)
  ]
]

// ── Certifications ────────────────────────────────────────────────────────────
#let render-certifications(pre: section-pre, post: section-post) = [
  #cv-section(section-title("certifications", lang), pre: pre, post: post, id: "certifications")
  #for (i, cert) in data.certifications.enumerate() {
    let tags    = cert.at("tags", default: ())
    let expired = "expired" in tags
    if i > 0 { v(sp-sm) }
    block(breakable: false)[
      #text(size: fs-sm, fill: if expired { c-light } else { c-body }, cert.title) \
      #text(size: fs-xs, fill: c-light)[#cert.at("subtitle", default: "")#if expired [ · exp.]]
    ]
  }
]

// ── Side Projects ─────────────────────────────────────────────────────────────
#let render-side-projects(pre: section-pre, post: section-post) = [
  #cv-section(section-title("side_projects", lang), pre: pre, post: post, id: "side_projects")
  #for (i, proj) in data.side_projects.enumerate() {
    if i > 0 { v(sp-md) }
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
      #let tags = proj.at("tags", default: ())
      #if tags.len() > 0 {
        v(sp-sm)
        for t in tags { pill(t); h(pill-gap) }
      }
    ]
  }
]

// ── Core Strengths ────────────────────────────────────────────────────────────
#let render-core-strengths(pre: section-pre, post: section-post) = {
  if "core_strengths" not in data { return }
  [
    #cv-section(section-title("core_strengths", lang), pre: pre, post: post, id: "core_strengths")
    #set par(justify: false)
    #set text(hyphenate: false)
    #for s in data.core_strengths { pill(s); h(pill-gap) }
  ]
}

// ── Leadership Profile ────────────────────────────────────────────────────────
#let render-leadership-profile(pre: section-pre, post: section-post) = {
  if "leadership_profile" not in data { return }
  [
    #cv-section(section-title("leadership_profile", lang), pre: pre, post: post, id: "leadership_profile")
    #let lp = data.leadership_profile
    #let sub = lp.at("subtitle", default: "")
    #if sub != "" {
      text(size: fs-sm, fill: c-muted, sub)
      v(sp-sm)
    }
    #let highlights = lp.at("highlights", default: ())
    #for (i, hl) in highlights.enumerate() {
      if i > 0 { v(sp-2xs) }
      [• #text(size: fs-md)[#parse-links(hl)]]
    }
  ]
}

// ── Generic fallback ──────────────────────────────────────────────────────────
#let render-generic(id, pre: section-pre, post: section-post) = {
  let sec = data.at(id, default: none)
  if sec == none { return }
  let label = id.replace("_", " ")
  cv-section(label, pre: pre, post: post, id: id)
  if type(sec) == str {
    text(size: fs-md)[#parse-links(sec)]
  } else if type(sec) == array {
    for (i, item) in sec.enumerate() {
      if i > 0 { v(sp-2xs) }
      if type(item) == str {
        [• #text(size: fs-md)[#parse-links(item)]]
      } else if type(item) == dictionary {
        let title    = item.at("title",    default: item.at("name", default: ""))
        let subtitle = item.at("subtitle", default: "")
        let period   = item.at("period",   default: "")
        let desc     = item.at("description", default: "")
        if title != "" {
          grid(
            columns: (1fr, auto),
            gutter: sp-sm,
            align: (left + bottom, right + bottom),
            text(size: fs-lg, weight: "bold", fill: c-ink, title),
            text(size: fs-sm, fill: c-muted, period),
          )
          if subtitle != "" { v(sp-xs); text(size: fs-sm, fill: c-muted, subtitle) }
          v(sp-xs)
        }
        if "highlights" in item {
          for (hi, hl) in item.highlights.enumerate() {
            if hi > 0 { v(sp-2xs) }
            [• #text(size: fs-md)[#parse-links(hl)]]
          }
        } else if desc != "" {
          text(size: fs-md)[#parse-links(desc)]
        }
      }
    }
  } else if type(sec) == dictionary {
    let sub = sec.at("subtitle", default: "")
    if sub != "" { text(size: fs-sm, fill: c-muted, sub); v(sp-sm) }
    if "highlights" in sec {
      for (i, hl) in sec.highlights.enumerate() {
        if i > 0 { v(sp-2xs) }
        [• #text(size: fs-md)[#parse-links(hl)]]
      }
    } else {
      let desc = sec.at("description", default: "")
      if desc != "" { text(size: fs-md)[#parse-links(desc)] }
    }
  }
}

// ── Dispatcher ────────────────────────────────────────────────────────────────
#let render-section(id, pre: section-pre, post: section-post) = {
  if id == "summary"                 { render-summary(pre: pre, post: post) }
  else if id == "experience"         { render-experience(pre: pre, post: post) }
  else if id == "awards"             { render-awards(pre: pre, post: post) }
  else if id == "skills"             { render-skills(pre: pre, post: post) }
  else if id == "education"          { render-education(pre: pre, post: post) }
  else if id == "languages"          { render-languages(pre: pre, post: post) }
  else if id == "certifications"     { render-certifications(pre: pre, post: post) }
  else if id == "side_projects"      { render-side-projects(pre: pre, post: post) }
  else if id == "core_strengths"     { render-core-strengths(pre: pre, post: post) }
  else if id == "leadership_profile" { render-leadership-profile(pre: pre, post: post) }
  else                               { render-generic(id, pre: pre, post: post) }
}
