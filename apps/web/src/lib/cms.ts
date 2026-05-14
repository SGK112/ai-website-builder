// CMS shared types + small helpers. The Project model owns the persisted
// shape (see packages/database/src/models/Project.ts); these are the
// browser-safe re-exports + light validation used by the API routes.

import type { CmsField, CmsFieldType, CmsSchema, CmsItem } from '@ai-website-builder/database'

export type { CmsField, CmsFieldType, CmsSchema, CmsItem }

const VALID_FIELD_TYPES: ReadonlySet<CmsFieldType> = new Set([
  'text', 'textarea', 'markdown', 'image', 'boolean', 'url', 'number', 'date', 'reference',
])

// Lowercase + hyphens, ascii only, no leading/trailing dashes. Used for both
// collection slugs and item slugs so they can drop into URLs without escaping.
export function isSafeSlug(s: unknown): s is string {
  if (typeof s !== 'string') return false
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s) && s.length > 0 && s.length <= 80
}

export function validateSchema(input: any): { ok: true; schema: CmsSchema } | { ok: false; error: string } {
  if (!input || typeof input !== 'object') return { ok: false, error: 'schema must be an object' }
  if (!isSafeSlug(input.slug)) return { ok: false, error: 'slug must be lowercase-hyphenated' }
  if (typeof input.name !== 'string' || !input.name.trim()) return { ok: false, error: 'name is required' }
  if (!Array.isArray(input.fields)) return { ok: false, error: 'fields must be an array' }
  const seen = new Set<string>()
  const fields: CmsField[] = []
  for (const f of input.fields) {
    if (!f || typeof f !== 'object') return { ok: false, error: 'each field must be an object' }
    if (!isSafeSlug(f.key)) return { ok: false, error: `field.key "${f.key}" must be lowercase-hyphenated` }
    if (seen.has(f.key)) return { ok: false, error: `duplicate field key "${f.key}"` }
    if (!VALID_FIELD_TYPES.has(f.type)) return { ok: false, error: `field.type "${f.type}" invalid` }
    if (f.type === 'reference' && !isSafeSlug(f.ref)) return { ok: false, error: `reference field "${f.key}" needs a valid ref` }
    seen.add(f.key)
    fields.push({
      key: f.key,
      type: f.type,
      label: typeof f.label === 'string' ? f.label : undefined,
      required: !!f.required,
      ref: f.type === 'reference' ? f.ref : undefined,
    })
  }
  return { ok: true, schema: { slug: input.slug, name: input.name.trim(), fields } }
}

// Coerce a raw field value against its declared type. Returns null on hard
// failure (so callers can 400) or a typed value on success. Doesn't enforce
// required-ness — that's the route's job since it knows whether this is a
// create or a partial update.
export function coerceField(type: CmsFieldType, value: any): { ok: true; value: any } | { ok: false; error: string } {
  if (value === null || value === undefined) return { ok: true, value: null }
  switch (type) {
    case 'text':
    case 'textarea':
    case 'markdown':
      return typeof value === 'string' ? { ok: true, value } : { ok: false, error: 'expected string' }
    case 'url':
      if (typeof value !== 'string') return { ok: false, error: 'expected string url' }
      try { new URL(value); return { ok: true, value } } catch { return { ok: false, error: 'invalid url' } }
    case 'image':
      // Stored as URL (Cloudinary or external). Empty string allowed = cleared.
      return typeof value === 'string' ? { ok: true, value } : { ok: false, error: 'expected image url string' }
    case 'boolean':
      return typeof value === 'boolean' ? { ok: true, value } : { ok: false, error: 'expected boolean' }
    case 'number':
      return typeof value === 'number' && Number.isFinite(value) ? { ok: true, value } : { ok: false, error: 'expected finite number' }
    case 'date':
      if (typeof value === 'string') {
        const d = new Date(value)
        return Number.isNaN(d.getTime()) ? { ok: false, error: 'invalid date' } : { ok: true, value: d.toISOString() }
      }
      return { ok: false, error: 'expected ISO date string' }
    case 'reference':
      return isSafeSlug(value) ? { ok: true, value } : { ok: false, error: 'reference must be a slug' }
    default:
      return { ok: false, error: `unknown field type ${type}` }
  }
}

export function coerceItemFields(schema: CmsSchema, raw: any): { ok: true; fields: Record<string, any> } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'fields must be an object' }
  const out: Record<string, any> = {}
  for (const f of schema.fields) {
    if (!(f.key in raw)) continue
    const r = coerceField(f.type, raw[f.key])
    if (!r.ok) return { ok: false, error: `${f.key}: ${r.error}` }
    out[f.key] = r.value
  }
  return { ok: true, fields: out }
}

// Reject when a required field is missing/null/empty in the MERGED result.
// Use after a PATCH-style merge of existing + coerced.fields, or right after
// coerceItemFields on a create. Centralizes the rule so PATCH + agent tools
// don't drift.
export function enforceRequiredFields(
  schema: CmsSchema,
  merged: Record<string, any>
): { ok: true } | { ok: false; error: string } {
  for (const f of schema.fields) {
    if (!f.required) continue
    const v = merged[f.key]
    if (v === undefined || v === null || v === '') {
      return { ok: false, error: `Required field "${f.key}" missing` }
    }
  }
  return { ok: true }
}

// Validate that every reference-typed field points at an item that actually
// exists in its target collection. Without this you can persist references
// to slugs that were deleted or were never created — broken-data territory.
export function validateReferences(
  schema: CmsSchema,
  merged: Record<string, any>,
  itemsByCollection: Record<string, Record<string, any>>
): { ok: true } | { ok: false; error: string } {
  for (const f of schema.fields) {
    if (f.type !== 'reference') continue
    const v = merged[f.key]
    if (v === null || v === undefined || v === '') continue // empty refs allowed unless required
    const target = f.ref
    if (!target) {
      return { ok: false, error: `reference field "${f.key}" has no target collection configured` }
    }
    if (!itemsByCollection[target]?.[v]) {
      return { ok: false, error: `reference field "${f.key}" points at "${target}/${v}" which doesn't exist` }
    }
  }
  return { ok: true }
}
