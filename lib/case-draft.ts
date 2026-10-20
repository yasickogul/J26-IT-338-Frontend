import type { C1CaseIntakeRequest, C1EvidenceFactorItem } from './c1-api'
import {
  caseStageLabel,
  categoryShowsDisputeAmount,
  evidenceItemsFor,
  isEvidenceStatus,
  normalizeCaseStage,
  type EvidenceAvailability,
  type EvidenceStatus,
} from './case-intake'
import {
  getDisputeCategory,
  getSubcategoryLabel,
  isDisputeCategoryId,
  isSubcategoryId,
  resolveDisputeCategoryId,
  toApiCategoryPayload,
  type DisputeCategoryId,
} from './dispute-categories'

export const CASE_DRAFT_STORAGE_KEY = 'lexlanka_case_draft_v1'
/** @deprecated Simulated submit is replaced by real C1 intake; kept for one release of cleanup. */
export const SIMULATED_SUBMIT_FLAG = 'lexlanka_c2_simulated_submit'
export const C1_INTAKE_SUBMITTED_FLAG = 'lexlanka_c1_intake_submitted'

export type EvidenceEntry = {
  status: EvidenceStatus | null
  description: string
}

export type SupportingDocumentRef = {
  name: string
  size: number
  type: string
}

export type CaseDraft = {
  category: DisputeCategoryId | null
  /** Optional structuring hint. Not an exact-match search filter. */
  subcategory: string | null
  /** Free-text category note used when category is other_civil. */
  otherCategoryDescription: string
  /** Raw value from an older draft that is no longer supported */
  legacyCategoryLabel: string | null
  needsCategoryReselect: boolean
  title: string
  plaintiff: string
  defendant: string
  courtType: string
  province: string
  district: string
  amountLkr: string
  relevantDates: string
  caseStage: string
  description: string
  legalIssue: string
  remedy: string
  evidence: Record<string, EvidenceEntry>
  supportingDocuments: SupportingDocumentRef[]
  acknowledged: boolean
  step: number
  updatedAt: string
}

export type IntakeValidationError = {
  step: 1 | 3
  message: string
}

export type C2EvidencePayload = {
  id: string
  label: string
  availability: EvidenceAvailability
  /** Present only when the user marked the item available and described it. */
  shows: string | null
}

/**
 * Structured intake for a future C2 submit.
 * Relevance scoring and retrieval are not performed here.
 * subcategory is organisational only and must not be treated as an exact-match filter.
 */
export type C2IntakePayload = {
  prototype: true
  submitted_to_backend: false
  dispute_category: DisputeCategoryId
  case_type_label: string
  subcategory: string | null
  subcategory_label: string | null
  other_category_description: string | null
  title: string
  title_generated: boolean
  parties: {
    applicant: string | null
    respondent: string | null
  }
  court_type: string | null
  province: string | null
  district: string | null
  dispute_amount_lkr: string | null
  relevant_dates: string | null
  case_stage: string | null
  case_stage_label: string | null
  description: string
  legal_issue: string | null
  requested_remedy: string | null
  evidence: C2EvidencePayload[]
  supporting_documents: SupportingDocumentRef[]
  research_disclaimer_accepted: boolean
}

export function emptyCaseDraft(step = 1): CaseDraft {
  return {
    category: null,
    subcategory: null,
    otherCategoryDescription: '',
    legacyCategoryLabel: null,
    needsCategoryReselect: false,
    title: '',
    plaintiff: '',
    defendant: '',
    courtType: '',
    province: '',
    district: '',
    amountLkr: '',
    relevantDates: '',
    caseStage: '',
    description: '',
    legalIssue: '',
    remedy: '',
    evidence: {},
    supportingDocuments: [],
    acknowledged: true,
    step,
    updatedAt: new Date().toISOString(),
  }
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

export function normalizeEvidence(raw: unknown): Record<string, EvidenceEntry> {
  if (!raw || typeof raw !== 'object') return {}
  const result: Record<string, EvidenceEntry> = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === 'boolean') {
      result[key] = { status: value ? 'available' : null, description: '' }
      continue
    }
    if (!value || typeof value !== 'object') continue
    const record = value as { status?: unknown; description?: unknown }
    result[key] = {
      status: isEvidenceStatus(record.status) ? record.status : null,
      description: asString(record.description),
    }
  }
  return result
}

function normalizeDocuments(raw: unknown): SupportingDocumentRef[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const record = item as { name?: unknown; size?: unknown; type?: unknown }
    if (typeof record.name !== 'string' || !record.name.trim()) return []
    return [
      {
        name: record.name.trim(),
        size: typeof record.size === 'number' && Number.isFinite(record.size) ? record.size : 0,
        type: asString(record.type),
      },
    ]
  })
}

export function loadCaseDraft(): CaseDraft | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CASE_DRAFT_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<CaseDraft> & { category?: unknown; evidence?: unknown }
    const resolved = resolveDisputeCategoryId(parsed.category)
    const hadCategory = parsed.category != null && String(parsed.category).trim() !== ''
    const needsReselect = Boolean(hadCategory && !resolved)
    const step = typeof parsed.step === 'number' ? Math.min(5, Math.max(1, parsed.step)) : 1
    const base = emptyCaseDraft(step)

    return {
      ...base,
      category: resolved,
      subcategory: isSubcategoryId(resolved, parsed.subcategory) ? parsed.subcategory : null,
      otherCategoryDescription: asString(parsed.otherCategoryDescription),
      legacyCategoryLabel: needsReselect ? String(parsed.category) : asString(parsed.legacyCategoryLabel) || null,
      needsCategoryReselect: needsReselect,
      title: asString(parsed.title),
      plaintiff: asString(parsed.plaintiff),
      defendant: asString(parsed.defendant),
      courtType: asString(parsed.courtType),
      province: asString(parsed.province),
      district: asString(parsed.district),
      amountLkr: asString(parsed.amountLkr),
      relevantDates: asString(parsed.relevantDates),
      caseStage: normalizeCaseStage(parsed.caseStage),
      description: asString(parsed.description),
      legalIssue: asString(parsed.legalIssue),
      remedy: asString(parsed.remedy),
      evidence: normalizeEvidence(parsed.evidence),
      supportingDocuments: normalizeDocuments(parsed.supportingDocuments),
      acknowledged: typeof parsed.acknowledged === 'boolean' ? parsed.acknowledged : base.acknowledged,
      step,
      updatedAt: asString(parsed.updatedAt) || base.updatedAt,
    }
  } catch {
    return null
  }
}

export function saveCaseDraft(draft: CaseDraft): void {
  if (typeof window === 'undefined') return
  const category = isDisputeCategoryId(draft.category) ? draft.category : null
  const payload: CaseDraft = {
    ...draft,
    category,
    subcategory: isSubcategoryId(category, draft.subcategory) ? draft.subcategory : null,
    caseStage: normalizeCaseStage(draft.caseStage),
    evidence: normalizeEvidence(draft.evidence),
    supportingDocuments: normalizeDocuments(draft.supportingDocuments),
    updatedAt: new Date().toISOString(),
  }
  localStorage.setItem(CASE_DRAFT_STORAGE_KEY, JSON.stringify(payload))
}

export function clearCaseDraft(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CASE_DRAFT_STORAGE_KEY)
}

export function draftHasUnsavedContent(draft: CaseDraft): boolean {
  const evidenceTouched = Object.values(draft.evidence).some(
    (entry) => entry.status != null || entry.description.trim() !== '',
  )
  return Boolean(
    draft.category ||
      draft.needsCategoryReselect ||
      draft.subcategory ||
      draft.otherCategoryDescription.trim() ||
      draft.title.trim() ||
      draft.plaintiff.trim() ||
      draft.defendant.trim() ||
      draft.description.trim() ||
      draft.legalIssue.trim() ||
      draft.remedy.trim() ||
      draft.amountLkr.trim() ||
      draft.courtType.trim() ||
      draft.province.trim() ||
      draft.district.trim() ||
      draft.relevantDates.trim() ||
      draft.caseStage ||
      draft.supportingDocuments.length ||
      evidenceTouched,
  )
}

export function isMeaningfulDescription(value: string): boolean {
  const text = value.trim().replace(/\s+/g, ' ')
  if (text.length < 20) return false
  return text.split(' ').length >= 3
}

export function validateCaseIntake(draft: CaseDraft): IntakeValidationError | null {
  if (!draft.category || draft.needsCategoryReselect) {
    return { step: 1, message: 'Select a dispute category to continue.' }
  }
  if (!isMeaningfulDescription(draft.description)) {
    return {
      step: 3,
      message: draft.description.trim()
        ? 'Add more detail about what happened, including the important events and circumstances. A short phrase is not enough to find similar historical cases.'
        : 'Enter a case description before continuing. Describe what happened in simple language.',
    }
  }
  return null
}

export function resolveCaseTitle(draft: CaseDraft): { title: string; generated: boolean } {
  const explicit = draft.title.trim()
  if (explicit) return { title: explicit, generated: false }
  const applicant = draft.plaintiff.trim()
  const respondent = draft.defendant.trim()
  if (applicant && respondent) return { title: `${applicant} v. ${respondent}`, generated: true }
  const category = getDisputeCategory(draft.category)
  const subcategory = getSubcategoryLabel(draft.category, draft.subcategory, draft.otherCategoryDescription)
  if (category && subcategory) return { title: `${category.displayShort}: ${subcategory}`, generated: true }
  if (category) return { title: category.displayShort, generated: true }
  return { title: 'Untitled civil case', generated: true }
}

function orNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function joinClauses(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? ''
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`
  return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`
}

export function summarizeEvidence(draft: CaseDraft): string {
  const items = evidenceItemsFor(draft.category)
  const counts = { available: 0, not_available: 0, not_sure: 0, not_applicable: 0, not_provided: 0, noted: 0 }
  for (const item of items) {
    const entry = draft.evidence[item.id]
    const status = entry?.status ?? null
    if (!status) {
      counts.not_provided += 1
      continue
    }
    counts[status] += 1
    if (status === 'available' && entry.description.trim()) counts.noted += 1
  }
  if (counts.available + counts.not_available + counts.not_sure + counts.not_applicable === 0) {
    return 'No evidence provided to the platform'
  }
  const parts = [
    counts.available ? `${counts.available} available` : '',
    counts.not_available ? `${counts.not_available} not available` : '',
    counts.not_sure ? `${counts.not_sure} not sure` : '',
    counts.not_applicable ? `${counts.not_applicable} not applicable` : '',
    counts.not_provided ? `${counts.not_provided} not provided to the platform` : '',
  ].filter(Boolean)
  const summary = joinClauses(parts)
  if (!counts.noted) return summary
  const notes = counts.noted === 1 ? '1 includes a short description' : `${counts.noted} include a short description`
  return `${summary}. ${notes}`
}

export function toC2IntakePayload(draft: CaseDraft): C2IntakePayload | null {
  if (!draft.category) return null
  const category = toApiCategoryPayload(draft.category)
  const resolved = resolveCaseTitle(draft)
  const stage = normalizeCaseStage(draft.caseStage)
  const showAmount = categoryShowsDisputeAmount(draft.category)
  return {
    prototype: true,
    submitted_to_backend: false,
    dispute_category: category.dispute_category,
    case_type_label: category.case_type_label,
    subcategory: isSubcategoryId(draft.category, draft.subcategory) ? draft.subcategory : null,
    subcategory_label: getSubcategoryLabel(draft.category, draft.subcategory, draft.otherCategoryDescription),
    other_category_description: draft.category === 'other_civil' ? orNull(draft.otherCategoryDescription) : null,
    title: resolved.title,
    title_generated: resolved.generated,
    parties: {
      applicant: orNull(draft.plaintiff),
      respondent: orNull(draft.defendant),
    },
    court_type: orNull(draft.courtType),
    province: orNull(draft.province),
    district: orNull(draft.district),
    dispute_amount_lkr: showAmount ? orNull(draft.amountLkr) : null,
    relevant_dates: orNull(draft.relevantDates),
    case_stage: stage || null,
    case_stage_label: caseStageLabel(stage),
    description: draft.description.trim(),
    legal_issue: orNull(draft.legalIssue),
    requested_remedy: orNull(draft.remedy),
    evidence: evidenceItemsFor(draft.category).map((item) => {
      const entry = draft.evidence[item.id]
      const availability: EvidenceAvailability = entry?.status ?? 'not_provided'
      return {
        id: item.id,
        label: item.label,
        availability,
        shows: availability === 'available' ? orNull(entry?.description ?? '') : null,
      }
    }),
    supporting_documents: draft.supportingDocuments,
    research_disclaimer_accepted: draft.acknowledged,
  }
}

function evidenceItemsForApi(draft: CaseDraft): C1EvidenceFactorItem[] {
  return evidenceItemsFor(draft.category).flatMap((item) => {
    const entry = draft.evidence[item.id]
    const availability: EvidenceAvailability = entry?.status ?? 'not_provided'
    if (availability === 'not_provided') return []
    return [
      {
        id: item.id,
        label: item.label,
        availability,
        description: availability === 'available' ? orNull(entry?.description ?? '') : null,
      },
    ]
  })
}

/**
 * Map the Lawyer wizard draft to the C1 `CaseIntakeRequest` schema.
 * Optional PDF bytes are sent separately via `/intake/document`.
 */
export function toC1IntakeRequest(draft: CaseDraft): C1CaseIntakeRequest | null {
  if (!draft.category || draft.needsCategoryReselect) return null
  const category = toApiCategoryPayload(draft.category)
  const resolved = resolveCaseTitle(draft)
  const stage = normalizeCaseStage(draft.caseStage)
  const showAmount = categoryShowsDisputeAmount(draft.category)
  const evidenceItems = evidenceItemsForApi(draft)
  const documentNotes = draft.supportingDocuments.map(
    (doc) => `Supporting document selected in wizard: ${doc.name} (${doc.type || 'unknown type'})`,
  )

  return {
    dispute_category: category.dispute_category,
    title: resolved.title,
    plaintiff: orNull(draft.plaintiff),
    defendant: orNull(draft.defendant),
    court_type: orNull(draft.courtType),
    province: orNull(draft.province),
    district: orNull(draft.district),
    amount_lkr: showAmount ? orNull(draft.amountLkr) : null,
    relevant_dates: orNull(draft.relevantDates),
    case_stage: stage || null,
    case_stage_label: caseStageLabel(stage),
    subcategory: isSubcategoryId(draft.category, draft.subcategory) ? draft.subcategory : null,
    subcategory_label: getSubcategoryLabel(draft.category, draft.subcategory, draft.otherCategoryDescription),
    other_category_description: draft.category === 'other_civil' ? orNull(draft.otherCategoryDescription) : null,
    description: draft.description.trim(),
    legal_issue: orNull(draft.legalIssue),
    remedy: orNull(draft.remedy),
    evidence_items: evidenceItems,
    text: documentNotes.length ? documentNotes.join('\n') : null,
  }
}
