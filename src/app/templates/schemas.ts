import { z } from 'zod'

// ── CV JSON ───────────────────────────────────────────────────────────────────

/**
 * Validates a CV JSON object. Permissive — extra top-level fields are allowed for forward
 * compatibility. The only hard requirement is `identity.name`, which every Typst template needs.
 */
export const CvSchema = z
  .object({
    identity: z.object({ name: z.string().min(1, 'identity.name is required') }).passthrough(),
  })
  .passthrough()

export type CvJson = z.infer<typeof CvSchema>

// ── Layout config import ──────────────────────────────────────────────────────

const SerializedSectionSchema = z.union([
  z.object({ id: z.string(), breakable: z.boolean() }).passthrough(),
  z
    .object({
      type: z.literal('columns'),
      // Bounded: every Typst template loops `range(n-cols)` over this value,
      // and it's the one field here an import can set that the UI itself
      // never produces (the UI only ever writes 2) — an unbounded number
      // let a hostile import hang the compile worker.
      columns: z.number().int().min(1).max(4),
      content: z.array(z.array(z.string())),
      breakable: z.boolean(),
    })
    .passthrough(),
])

const SidebarSectionEntrySchema = z.union([
  z.string(),
  z
    .object({
      id: z.string(),
      breakable: z.boolean().optional(),
      pre_spacing: z.number().optional(),
      post_spacing: z.number().optional(),
    })
    .passthrough(),
])

/**
 * Validates an imported layout config file. The exported file spreads LayoutData fields at the
 * top level; only `header` and `sections` are load-bearing — metadata fields are passed through.
 */
export const LayoutImportSchema = z
  .object({
    header: z.object({ style: z.enum(['split', 'stacked']) }),
    sidebar_sections: z.array(SidebarSectionEntrySchema).optional(),
    sections: z.array(SerializedSectionSchema),
  })
  .passthrough()

// ── Design bundle (template + layout + style) ─────────────────────────────────

export const DesignSchema = z
  .object({
    templateId: z.string(),
    layoutId: z.string(),
    layout: LayoutImportSchema,
    style: z.record(z.string(), z.union([z.string(), z.number()])),
  })
  .transform((design) => {
    // qr_url isn't settable anywhere in the app's own Style panel — the only
    // way it can arrive here is inside an imported bundle. Trusting it let a
    // shared bundle silently redirect the recipient's PDF QR code to an
    // attacker-controlled URL. Always re-derive it from the CV's own contact
    // info instead (see resolveQrUrl in cv-editor/cv-utils.ts).
    if (!('qr_url' in design.style)) return design
    const { qr_url: _qrUrl, ...style } = design.style
    return { ...design, style }
  })

export type Design = z.infer<typeof DesignSchema>

/**
 * The full "everything about this CV" export/import shape: CV content plus,
 * optionally, the template/layout/style it was rendered with. `design` is
 * optional so a bare CV-only file — hand-edited, or exported before this
 * existed — still imports exactly as it always has, data-only.
 */
export const ExportBundleSchema = z.object({
  cv: CvSchema,
  design: DesignSchema.optional(),
})

// ── CV entry (localStorage) ───────────────────────────────────────────────────

export const CvEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  content: z.string(),
  updatedAt: z.number(),
})

export const CvListSchema = z.array(CvEntrySchema)

// ── Custom section list (`_sections` in CV JSON) ──────────────────────────────

/**
 * Validates the optional `_sections` array a CV's JSON can carry to override
 * the default section list. Read on every render of the active CV, so a
 * malformed value here — e.g. from an imported bundle with a hostile
 * `_sections` field — must never be allowed to reach the layout editor
 * unchecked: it previously crashed on load and re-crashed on every reload.
 */
export const SectionDefSchema = z.object({
  id: z.string(),
  label: z.string(),
  locations: z.array(z.enum(['main', 'sidebar'])),
})

export const SectionDefListSchema = z.array(SectionDefSchema)
