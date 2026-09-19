# CV Data Schema

This is a short, human-readable summary of the CV content JSON. The complete
reference (CV schema, layout JSON, and every style parameter per template) is
at [`/for-llms`](http://localhost:3000/for-llms), also served as plain text
at `/llms.txt` and `/llms-full.txt`.

## identity

```json
{
  "name": "string",
  "headline": "string",
  "contact": [ContactEntry]
}
```

Only `name` is required — everything else in the CV, including `headline`
and `contact`, is optional.

### ContactEntry

```json
{ "type": "email | phone | location | linkedin | github | medium | facebook | web", "value": "string", "key": "string" }
```

- `type` drives link generation and which brand icon renders when
  `show_contact_icons` is on. An unrecognised `type` still renders (as a
  plain link with the generic globe icon) — it isn't schema-enforced.
- `key` is the label shown when `show_contact_labels` is on (e.g. "LinkedIn", "Work email")
- Order in the array controls display order everywhere it's shown
- URL prefix by type: `email` → `mailto:`, `phone` → `tel:`, `location` → no link, everything else → `https://` (added automatically if the value doesn't already start with `http`)

**Icons** (real SVGs, shown when `show_contact_icons` is on): `linkedin`,
`github`, `medium`, `facebook`, `email`, `phone`, `location`, and `web` each
have their own icon; any other `type` falls back to the generic web icon.

---

## Sections

Which sections render, and in what order, is controlled by the **layout**
JSON's `sections` array (see `/for-llms` §3) — not by a key on the CV data
itself. Ten section IDs have a dedicated renderer; anything else falls back
to a generic renderer driven by the shape of the data.

| Renderer | Section ID |
|---|---|
| dedicated | `summary`, `experience`, `awards`, `skills`, `education`, `languages`, `certifications`, `side_projects`, `core_strengths`, `leadership_profile` |
| generic fallback | any other top-level key |

`contact` isn't part of this list — `identity.contact` is rendered directly
wherever the template places it (the sidebar template's left column; other
templates don't show a standalone contact block beyond the header). Putting
`{"id": "contact"}` in the layout JSON's `sections` array (rather than
`sidebar_sections`), or on any non-sidebar template, silently renders
nothing.

### skills

Array of named groups — templates render them in a multi-column grid without hardcoding group names.

```json
[
  { "name": "Languages & Frameworks", "entries": ["TypeScript", "React", ...] },
  { "name": "Cloud & Infrastructure", "entries": ["AWS", "Kubernetes", ...] }
]
```

### core_strengths

Array of short strings, rendered as pills — not the unified item shape below.

```json
["Systems design", "Incident leadership", "Mentoring"]
```

### Unified item shape

`experience`, `awards`, `certifications`, `side_projects`, `education`, and
`languages` all use the same shape. All fields except `title` are optional.

```json
{
  "title":       "string — main heading (bold)",
  "subtitle":    "string — secondary line, muted (company · location, issuer · date, etc.)",
  "period":      "string — right-aligned date range",
  "description": "string — prose paragraph (supports [link](url) and [text](#section-id) syntax)",
  "highlights":  ["string — bullet point (supports inline links)"],
  "tags":        ["string — rendered as pills (tech stack, status, expired, etc.)"]
}
```

**Section mapping:**

| Section | title | subtitle | period | description | highlights | tags |
|---|---|---|---|---|---|---|
| experience | job title | company · location | period | — | bullets | stack |
| awards | award name | issuer · date | — | prose | — | — |
| certifications | cert name | issuer · year | — | — | — | `["expired"]` if applicable |
| side_projects | project name | status | — | prose | — | stack |
| education | institution | degree · field | period | notes | — | — |
| languages | language name | proficiency level | — | — | — | — |

### leadership_profile

A single object (not an array), with no `title`/`name` — it renders under a
fixed, translated heading instead.

```json
{
  "subtitle":    "optional — rendered as a muted line above the highlights",
  "highlights":  ["optional — bullet list"]
}
```

Any other custom top-level key follows this same rule when its value is a
single object rather than an array.

---

## Inline links

Supported anywhere in `description`, `highlights`, and `summary` strings:

```
[display text](https://example.com)    → external URL
[display text](#section-id)            → jumps to section inside the PDF
```

Valid internal IDs: `summary`, `experience`, `awards`, `skills`, `education`,
`languages`, `certifications`, `side_projects`, `core_strengths`, `leadership_profile`

A link to a section ID that isn't in the current layout's `sections` array
silently degrades to plain text instead of a broken jump.

---

## Style params — a few gotchas

The full style-parameter reference (every key, per template, with ranges and
defaults) is at `/for-llms` §4. A few that are easy to get wrong:

| key | type | effect |
|---|---|---|
| `show_contact_icons` | toggle | show each entry's brand icon instead of its `key` label. **Not independent of `show_contact_labels`**: this takes priority — when it's on, `show_contact_labels` has no effect at all. |
| `show_contact_labels` | toggle | show the `key` label before the value — but only when `show_contact_icons` is off; see above. |
| `show_footer` | toggle | prints only the page number (e.g. "2 / 5") in small text, bottom-right of every page — nothing else. |
| `show_qr` | toggle | small QR code in the header, linking to `qr_url` (or the first `linkedin` contact entry if `qr_url` is left empty). Supported on every template. |
| `qr_url` | text | QR target — see `show_qr` above. |
| `accent_color` | hex | present on all 10 templates, but each declares its own key — never `accent` |
