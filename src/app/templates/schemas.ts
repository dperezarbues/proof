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
      columns: z.number(),
      content: z.array(z.array(z.string())),
      breakable: z.boolean(),
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
    sections: z.array(SerializedSectionSchema),
  })
  .passthrough()

export type LayoutImport = z.infer<typeof LayoutImportSchema>

// ── Design bundle (template + layout + style) ─────────────────────────────────

export const DesignSchema = z.object({
  templateId: z.string(),
  layoutId: z.string(),
  layout: LayoutImportSchema,
  style: z.record(z.string(), z.union([z.string(), z.number()])),
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

export type ExportBundle = z.infer<typeof ExportBundleSchema>

// ── CV entry (localStorage) ───────────────────────────────────────────────────

export const CvEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  content: z.string(),
  updatedAt: z.number(),
})

export const CvListSchema = z.array(CvEntrySchema)
