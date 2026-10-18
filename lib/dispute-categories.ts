/**
 * C2 intake dispute categories (UI + draft + future API payload).
 * Distinct from shared corpus case_type="civil" on historical judgments.
 */

export const DISPUTE_CATEGORY_IDS = [
  'contract',
  'property_land',
  'employment',
  'rental',
  'other_civil',
] as const

export type DisputeCategoryId = (typeof DISPUTE_CATEGORY_IDS)[number]

export type DisputeCategory = {
  id: DisputeCategoryId
  label: string
  description: string
  /** Value historically shown in review / sample tables */
  displayShort: string
  /** Maps to StructuredLegalInfo-style case_type labels used in architecture examples */
  apiCaseType: string
}

export const DISPUTE_CATEGORIES: DisputeCategory[] = [
  {
    id: 'contract',
    label: 'Contract dispute',
    description: 'Breach, performance, or interpretation of written or oral agreements.',
    displayShort: 'Contract dispute',
    apiCaseType: 'Contract',
  },
  {
    id: 'property_land',
    label: 'Property or land dispute',
    description: 'Ownership, partition, boundaries, title, or land-related civil claims.',
    displayShort: 'Property or land dispute',
    apiCaseType: 'Property',
  },
  {
    id: 'employment',
    label: 'Employment dispute',
    description: 'Wrongful termination, wages, workplace rights, and service contracts.',
    displayShort: 'Employment dispute',
    apiCaseType: 'Employment',
  },
  {
    id: 'rental',
    label: 'Rental dispute',
    description: 'Tenancy, rent, eviction notices, and residential or commercial leases.',
    displayShort: 'Rental dispute',
    apiCaseType: 'Rental',
  },
  {
    id: 'other_civil',
    label: 'Other civil dispute',
    description: 'A civil matter that does not fit the categories above. Describe it in your own words.',
    displayShort: 'Other civil dispute',
    apiCaseType: 'Other civil',
  },
]

/** Optional structure only. Retrieval must not require an exact subcategory match. */
export const DISPUTE_SUBCATEGORIES: Record<DisputeCategoryId, readonly { id: string; label: string }[]> = {
  contract: [
    { id: 'breach', label: 'Breach of contract' },
    { id: 'payment', label: 'Payment dispute' },
    { id: 'failure_to_perform', label: 'Failure to perform' },
    { id: 'interpretation', label: 'Contract interpretation' },
  ],
  property_land: [
    { id: 'ownership', label: 'Ownership' },
    { id: 'boundary', label: 'Boundary dispute' },
    { id: 'partition', label: 'Partition' },
    { id: 'transfer', label: 'Property transfer' },
  ],
  employment: [
    { id: 'wrongful_termination', label: 'Wrongful termination' },
    { id: 'unpaid_wages', label: 'Unpaid wages' },
    { id: 'agreement', label: 'Employment agreement dispute' },
    { id: 'workplace_rights', label: 'Workplace rights' },
  ],
  rental: [
    { id: 'unpaid_rent', label: 'Unpaid rent' },
    { id: 'eviction', label: 'Eviction' },
    { id: 'lease_termination', label: 'Lease termination' },
    { id: 'security_deposit', label: 'Security deposit' },
  ],
  other_civil: [],
}

/** Removed from the intake selector; drafts with these must re-select. */
export const LEGACY_UNSUPPORTED_CATEGORY_IDS = ['commercial', 'compensation'] as const

const LABEL_TO_ID: Record<string, DisputeCategoryId> = {
  'contract dispute': 'contract',
  contract: 'contract',
  'property or land dispute': 'property_land',
  'property dispute': 'property_land',
  property_land: 'property_land',
  property: 'property_land',
  'employment dispute': 'employment',
  employment: 'employment',
  'rental dispute': 'rental',
  rental: 'rental',
  'other civil dispute': 'other_civil',
  'other civil matter': 'other_civil',
  other: 'other_civil',
  other_civil: 'other_civil',
}

export function isDisputeCategoryId(value: unknown): value is DisputeCategoryId {
  return typeof value === 'string' && (DISPUTE_CATEGORY_IDS as readonly string[]).includes(value)
}

export function getDisputeCategory(id: DisputeCategoryId | null | undefined): DisputeCategory | undefined {
  if (!id) return undefined
  return DISPUTE_CATEGORIES.find((c) => c.id === id)
}

/** Normalize draft/API/legacy labels into a supported id, or null if unsupported/unknown. */
export function resolveDisputeCategoryId(value: unknown): DisputeCategoryId | null {
  if (isDisputeCategoryId(value)) return value
  if (typeof value !== 'string') return null
  const key = value.trim().toLowerCase()
  if (!key) return null
  if ((LEGACY_UNSUPPORTED_CATEGORY_IDS as readonly string[]).includes(key)) return null
  if (key.includes('commercial') || key.includes('compensation')) return null
  return LABEL_TO_ID[key] ?? null
}

export function getSubcategoryOptions(category: DisputeCategoryId | null | undefined) {
  if (!category) return []
  return DISPUTE_SUBCATEGORIES[category]
}

/** Label for a saved subcategory id, or the free-text note used by Other civil dispute. */
export function getSubcategoryLabel(
  category: DisputeCategoryId | null | undefined,
  subcategory: string | null | undefined,
  otherCategoryDescription = '',
): string | null {
  if (!category) return null
  if (category === 'other_civil') {
    const note = otherCategoryDescription.trim()
    return note || null
  }
  if (!subcategory) return null
  return DISPUTE_SUBCATEGORIES[category].find((item) => item.id === subcategory)?.label ?? null
}

export function isSubcategoryId(category: DisputeCategoryId | null | undefined, value: unknown): value is string {
  return typeof value === 'string' && getSubcategoryOptions(category).some((item) => item.id === value)
}

/** Payload shape for a future C2 submit — keeps corpus case_type="civil" out of intake. */
export function toApiCategoryPayload(id: DisputeCategoryId) {
  const cat = getDisputeCategory(id)!
  return {
    dispute_category: cat.id,
    case_type_label: cat.apiCaseType,
    // Corpus judgments remain case_type="civil"; do not send intake category as corpus case_type.
  }
}
