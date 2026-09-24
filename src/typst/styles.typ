// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  styles.typ — tokens, colors, typography and editor style override system  ║
// ║  Import this file in all other .typ files (re-exports everything)          ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

#import "tokens.typ": *

// ── Colors ────────────────────────────────────────────────────────────────────
#let c-ink     = rgb("#111111")  // name, entry titles
#let c-body    = rgb("#333333")  // body text
#let c-muted   = rgb("#666666")  // metadata, company, period
#let c-light   = rgb("#999999")  // labels, pills, footnotes
#let c-rule    = rgb("#dddddd")  // dividers, pill borders
#let c-link    = rgb("#1a56db")  // hyperlinks
#let c-pill-bg = rgb("#fafafa")  // pill background

// ── Page & typography ─────────────────────────────────────────────────────────
#let font-family   = "New Computer Modern"
#let page-paper    = "a4"
#let page-margin-x = margin-lg
#let page-margin-y = margin-sm
#let par-leading   = sp-2xl
#let block-spacing = sp-lg

// ── Section headers ───────────────────────────────────────────────────────────
#let section-pre      = sp-xl
#let section-post     = sp-xs
#let section-tracking = tracking-lg
#let section-fill     = rgb("#444444")
#let rule-weight      = tracking-xs
#let rule-color       = rgb("#bbbbbb")

// ── Skills ────────────────────────────────────────────────────────────────────
#let skills-gutter         = margin-md
#let skills-label-tracking = tracking-sm

// ── Editor style overrides (active only when layout="editor") ─────────────────
// Reads editor.json once; shadows the tokens above so every render function —
// including those already imported from components.typ and sections.typ — uses
// the user's chosen values without any per-template changes.
#let _s = if sys.inputs.at("layout", default: "") == "editor" {
  json("/src/layouts/editor.json").at("style", default: (:))
} else { (:) }

// Typography — every fs-* token is connected to a style param.
// Derived sizes keep their proportional offset so defaults are preserved exactly:
//   fs-sm  = body_size - 0.5pt            (8.5 - 0.5 = 8pt  ✓)
//   fs-2xs = section_heading_size - 1.0pt (7.5 - 1.0 = 6.5pt ✓)
#let font-family = if "font_family"          in _s { _s.at("font_family")                          } else { font-family }
#let fs-2xl      = if "name_size"            in _s { _s.at("name_size")            * 1pt           } else { fs-2xl }
#let fs-xl       = if "headline_size"        in _s { _s.at("headline_size")        * 1pt           } else { fs-xl  }
#let fs-lg       = if "entry_size"           in _s { _s.at("entry_size")           * 1pt           } else { fs-lg  }
#let fs-md       = if "body_size"            in _s { _s.at("body_size")            * 1pt           } else { fs-md  }
#let fs-sm       = if "body_size"            in _s { (_s.at("body_size") - 0.5)    * 1pt           } else { fs-sm  }
#let fs-xs       = if "section_heading_size" in _s { _s.at("section_heading_size") * 1pt           } else { fs-xs  }
#let fs-2xs      = if "section_heading_size" in _s { (_s.at("section_heading_size") - 1.0) * 1pt   } else { fs-2xs }

// Colors
#let c-ink   = if "heading_color" in _s { rgb(_s.at("heading_color")) } else { c-ink  }
#let c-body  = if "body_color"    in _s { rgb(_s.at("body_color"))    } else { c-body }
#let c-muted = if "muted_color"   in _s { rgb(_s.at("muted_color"))   } else { c-muted }
#let c-link  = if "accent_color"  in _s { rgb(_s.at("accent_color"))  } else { c-link }

// Spacing
#let par-leading       = if "line_height"       in _s { _s.at("line_height")       * 1em } else { par-leading  }
#let section-pre       = if "section_pre"       in _s { _s.at("section_pre")       * 1em } else { section-pre  }
#let section-post      = if "section_post"      in _s { _s.at("section_post")      * 1em } else { section-post }
#let section-rule-gap  = if "section_rule_gap"  in _s { _s.at("section_rule_gap")  * 1em } else { sp-xs }

// ── Footer / QR / contact feature flags ──────────────────────────────────────
// Kept as strings so template-level `style.at(key, default: sys-val) == "true"` works
#let show-footer-sys         = sys.inputs.at("show_footer",         default: "false")
#let show-qr-sys             = sys.inputs.at("show_qr",             default: "false")
#let show-contact-icons-sys  = sys.inputs.at("show_contact_icons",  default: "false")
#let show-contact-labels-sys = sys.inputs.at("show_contact_labels", default: "false")
#let qr-url-sys              = sys.inputs.at("qr_url",              default: "")
#let qr-size                = 1.55cm
#let footer-height          = 0.55cm
