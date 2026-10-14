import type { DisputeCategoryId } from './dispute-categories'

/** Nine provinces of Sri Lanka, alphabetical. */
export const SRI_LANKA_PROVINCES = [
  'Central',
  'Eastern',
  'North Central',
  'North Western',
  'Northern',
  'Sabaragamuwa',
  'Southern',
  'Uva',
  'Western',
] as const

export const COURT_TYPES = [
  'District Court',
  'High Court',
  'Commercial High Court',
  'Court of Appeal',
  'Supreme Court',
  'Labour Tribunal',
  'Rent Board',
  'Other',
] as const

export const CASE_STAGES = [
  { id: 'not_filed', label: 'Not yet filed' },
  { id: 'trial', label: 'Before a trial court or tribunal' },
  { id: 'appeal', label: 'Appeal stage' },
  { id: 'not_sure', label: 'Not sure' },
] as const

export type CaseStageId = (typeof CASE_STAGES)[number]['id']

export const EVIDENCE_STATUSES = ['available', 'not_available', 'not_sure', 'not_applicable'] as const

export type EvidenceStatus = (typeof EVIDENCE_STATUSES)[number]

/** Absence of a selection. Distinct from not_available, which means the user does not possess it. */
export type EvidenceAvailability = EvidenceStatus | 'not_provided'

export const EVIDENCE_STATUS_LABELS: Record<EvidenceStatus, string> = {
  available: 'Available',
  not_available: 'Not available',
  not_sure: 'Not sure',
  not_applicable: 'Not applicable',
}

export type EvidenceCatalogItem = {
  id: string
  label: string
}

export const OTHER_EVIDENCE_ITEM: EvidenceCatalogItem = {
  id: 'other_evidence',
  label: 'Other evidence',
}

export const EVIDENCE_BY_CATEGORY: Record<DisputeCategoryId, readonly EvidenceCatalogItem[]> = {
  contract: [
    { id: 'written_agreement', label: 'Written agreement' },
    { id: 'invoices', label: 'Invoices' },
    { id: 'payment_receipts', label: 'Payment receipts' },
    { id: 'legal_notices', label: 'Legal notices' },
    { id: 'correspondence', label: 'Correspondence' },
  ],
  property_land: [
    { id: 'property_deed', label: 'Property deed' },
    { id: 'survey_plan', label: 'Survey plan' },
    { id: 'title_records', label: 'Title records' },
    { id: 'ownership_documents', label: 'Ownership documents' },
  ],
  employment: [
    { id: 'employment_agreement', label: 'Employment agreement' },
    { id: 'termination_letter', label: 'Termination letter' },
    { id: 'payslips', label: 'Payslips' },
    { id: 'workplace_correspondence', label: 'Workplace correspondence' },
    { id: 'attendance_records', label: 'Attendance records' },
  ],
  rental: [
    { id: 'lease_agreement', label: 'Lease agreement' },
    { id: 'rent_receipts', label: 'Rent receipts' },
    { id: 'eviction_notices', label: 'Eviction notices' },
    { id: 'deposit_records', label: 'Deposit records' },
  ],
  other_civil: [],
}

export function evidenceItemsFor(category: DisputeCategoryId | null | undefined): EvidenceCatalogItem[] {
  const specific = category ? EVIDENCE_BY_CATEGORY[category] : []
  return [...specific, OTHER_EVIDENCE_ITEM]
}

/** Monetary value is relevant for contract, employment, and rental disputes. */
export function categoryShowsDisputeAmount(category: DisputeCategoryId | null | undefined): boolean {
  return category === 'contract' || category === 'employment' || category === 'rental'
}

export function isEvidenceStatus(value: unknown): value is EvidenceStatus {
  return typeof value === 'string' && (EVIDENCE_STATUSES as readonly string[]).includes(value)
}

export function isCaseStageId(value: unknown): value is CaseStageId {
  return typeof value === 'string' && CASE_STAGES.some((stage) => stage.id === value)
}

export function caseStageLabel(value: string | null | undefined): string | null {
  if (!value) return null
  return CASE_STAGES.find((stage) => stage.id === value)?.label ?? null
}

export function normalizeCaseStage(value: unknown): CaseStageId | '' {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  const match = CASE_STAGES.find((stage) => stage.id === trimmed || stage.label.toLowerCase() === trimmed.toLowerCase())
  return match?.id ?? ''
}
