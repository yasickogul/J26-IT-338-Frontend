/**
 * Typed Lawyer → C1 Case Analysis API client.
 * Talks only to FastAPI `/api/v1/c1`. Never call LM Studio from the browser.
 */

import type { DisputeCategoryId } from './dispute-categories'

export type C1EvidenceAvailability =
  | 'available'
  | 'not_available'
  | 'not_sure'
  | 'not_applicable'
  | 'not_provided'

export type C1EvidenceFactorItem = {
  id?: string | null
  label: string
  availability: C1EvidenceAvailability
  description?: string | null
}

/** Matches backend `CaseIntakeRequest`. */
export type C1CaseIntakeRequest = {
  dispute_category: DisputeCategoryId
  title?: string | null
  case_number?: string | null
  plaintiff?: string | null
  defendant?: string | null
  court_type?: string | null
  province?: string | null
  district?: string | null
  amount_lkr?: string | null
  relevant_dates?: string | null
  case_stage?: string | null
  case_stage_label?: string | null
  subcategory?: string | null
  subcategory_label?: string | null
  other_category_description?: string | null
  description?: string | null
  legal_issue?: string | null
  remedy?: string | null
  evidence_factors?: string[]
  evidence_items?: C1EvidenceFactorItem[]
  text?: string | null
}

export type C1PartyPosition = {
  party: string
  role: 'plaintiff' | 'defendant' | 'appellant' | 'respondent' | 'other'
  position?: string | null
}

export type C1LegalIssueItem = {
  issue: string
  description?: string | null
}

export type C1CaseInformation = {
  case_type?: string | null
  dispute_category?: DisputeCategoryId | null
  court?: string | null
  case_number?: string | null
  title?: string | null
  summary?: string | null
  remedy_requested?: string | null
  province?: string | null
  district?: string | null
  amount_lkr?: string | null
  relevant_dates?: string | null
  case_stage?: string | null
  case_stage_label?: string | null
  subcategory?: string | null
  subcategory_label?: string | null
  other_category_description?: string | null
}

export type C1StructuredLegalInfo = {
  document_id?: string | null
  document_type?: string
  case_type?: string | null
  legal_issue?: string | null
  claims: string[]
  remedy_requested?: string | null
  parties: string[]
  evidence: string[]
  court?: string | null
  entities: Array<{ text: string; label: string; start?: number | null; end?: number | null }>
  raw_text_ref?: string | null
  confidence?: number | null
}

export type C1ExtractedLegalInfo = {
  intake_id: string
  status: 'queued' | 'processing' | 'done' | 'failed'
  case_information: C1CaseInformation
  parties_and_positions: C1PartyPosition[]
  legal_issues: C1LegalIssueItem[]
  claims: string[]
  evidence_mentioned: string[]
  cited_case_references: string[]
  entities: Array<Record<string, unknown>>
  structured_legal_info: C1StructuredLegalInfo
  source_text_chars: number
  model_version: string
  disclaimer: string
  created_at?: string | null
  similar_cases_available?: boolean
  legal_relevance_score_available?: boolean
  llm_explanation_available?: boolean
}

export type C1IntakeStatusResponse = {
  intake_id: string
  status: 'queued' | 'processing' | 'done' | 'failed'
  result: C1ExtractedLegalInfo | null
  error?: string | null
}

export class C1ApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly details?: unknown

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message)
    this.name = 'C1ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

const DEFAULT_TIMEOUT_MS = 60_000

export function getC1ApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim()
  if (configured) return configured.replace(/\/$/, '')
  return 'http://localhost:8000'
}

function c1Url(path: string): string {
  return `${getC1ApiBaseUrl()}/api/v1/c1${path}`
}

function parseErrorDetail(payload: unknown): { message: string; code?: string } {
  if (!payload || typeof payload !== 'object') {
    return { message: 'The case analysis service returned an unexpected error.' }
  }
  const detail = (payload as { detail?: unknown }).detail
  if (typeof detail === 'string') return { message: detail }
  if (detail && typeof detail === 'object') {
    const nested = detail as { error?: { code?: string; message?: string }; message?: string; code?: string }
    if (nested.error?.message) {
      return { message: nested.error.message, code: nested.error.code }
    }
    if (typeof nested.message === 'string') {
      return { message: nested.message, code: nested.code }
    }
  }
  if (Array.isArray(detail)) {
    const parts = detail
      .map((item) => {
        if (!item || typeof item !== 'object') return null
        const row = item as { loc?: unknown[]; msg?: string }
        const field = Array.isArray(row.loc) ? row.loc.slice(1).join('.') : null
        if (row.msg && field) return `${field}: ${row.msg}`
        return row.msg ?? null
      })
      .filter(Boolean)
    if (parts.length) return { message: parts.join(' '), code: 'VALIDATION_ERROR' }
  }
  return { message: 'The case analysis service could not process this request.' }
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new C1ApiError('The case analysis service returned an invalid response.', response.status)
  }
}

async function requestJson<T>(
  path: string,
  init: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(c1Url(path), {
      ...init,
      signal: controller.signal,
    })
    const payload = await readJson(response)
    if (!response.ok) {
      const parsed = parseErrorDetail(payload)
      throw new C1ApiError(parsed.message, response.status, parsed.code, payload)
    }
    if (payload == null || typeof payload !== 'object') {
      throw new C1ApiError('The case analysis service returned an empty response.', response.status)
    }
    return payload as T
  } catch (error) {
    if (error instanceof C1ApiError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new C1ApiError('The case analysis service timed out. Please try again.', 408, 'TIMEOUT')
    }
    throw new C1ApiError(
      'Could not reach the case analysis service. Check that the backend is running and reachable.',
      0,
      'NETWORK_ERROR',
      error,
    )
  } finally {
    window.clearTimeout(timer)
  }
}

export async function pingC1(): Promise<{ component: string; status: string; stage: number }> {
  return requestJson('/ping', { method: 'GET' }, 10_000)
}

export async function createC1Intake(body: C1CaseIntakeRequest): Promise<C1ExtractedLegalInfo> {
  return requestJson('/intake', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function createC1IntakeWithDocument(
  body: C1CaseIntakeRequest,
  file: File,
): Promise<C1ExtractedLegalInfo> {
  const form = new FormData()
  form.append('intake_json', JSON.stringify(body))
  form.append('file', file, file.name)
  return requestJson('/intake/document', {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: form,
  })
}

export async function getC1Intake(intakeId: string): Promise<C1IntakeStatusResponse> {
  return requestJson(`/intake/${encodeURIComponent(intakeId)}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })
}

export const C1_LAST_RESULT_KEY = 'lexlanka_c1_last_result'

export function storeC1Result(result: C1ExtractedLegalInfo): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(C1_LAST_RESULT_KEY, JSON.stringify(result))
}

export function loadStoredC1Result(): C1ExtractedLegalInfo | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(C1_LAST_RESULT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as C1ExtractedLegalInfo
  } catch {
    return null
  }
}
