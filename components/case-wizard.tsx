'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  FileText,
  Home,
  Info,
  Scale,
  ScrollText,
  Shapes,
  Sparkles,
  Upload,
  X,
} from 'lucide-react'
import {
  CASE_STAGES,
  COURT_TYPES,
  EVIDENCE_STATUSES,
  EVIDENCE_STATUS_LABELS,
  SRI_LANKA_PROVINCES,
  caseStageLabel,
  categoryShowsDisputeAmount,
  evidenceItemsFor,
  type EvidenceStatus,
} from '@/lib/case-intake'
import {
  DISPUTE_CATEGORIES,
  getDisputeCategory,
  getSubcategoryLabel,
  getSubcategoryOptions,
  type DisputeCategoryId,
} from '@/lib/dispute-categories'
import {
  C1ApiError,
  createC1Intake,
  createC1IntakeWithDocument,
  storeC1Result,
} from '@/lib/c1-api'
import {
  clearCaseDraft,
  draftHasUnsavedContent,
  emptyCaseDraft,
  isMeaningfulDescription,
  loadCaseDraft,
  resolveCaseTitle,
  saveCaseDraft,
  summarizeEvidence,
  toC1IntakeRequest,
  validateCaseIntake,
  type CaseDraft,
  type IntakeValidationError,
} from '@/lib/case-draft'
import { lawyerPaths } from '@/lib/nav'
import { Badge } from './shared-ui'

type PendingUpload = {
  file: File
  name: string
  size: number
  type: string
}

const STEPS = ['Case category', 'Basic information', 'Case facts', 'Evidence & factors', 'Review'] as const

const CATEGORY_ICONS = {
  contract: ScrollText,
  property_land: Home,
  employment: BriefcaseBusiness,
  rental: Scale,
  other_civil: Shapes,
} as const

const DESCRIPTION_PLACEHOLDER =
  'Describe what happened in your case, including the important events, circumstances, and the main problem. You can write in simple language.'

function confirmDiscard(): boolean {
  return window.confirm('Discard unsaved case details and leave this wizard?')
}

function withCurrentOption(options: readonly string[], current: string): string[] {
  if (current && !options.includes(current)) return [current, ...options]
  return [...options]
}

function summarizeText(value: string, max = 180): string {
  const clean = value.trim().replace(/\s+/g, ' ')
  if (clean.length <= max) return clean
  return `${clean.slice(0, max - 1).trimEnd()}…`
}

export function CaseWizard() {
  const router = useRouter()
  const [draft, setDraft] = useState<CaseDraft>(() => emptyCaseDraft())
  const [hydrated, setHydrated] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [formError, setFormError] = useState<IntakeValidationError | null>(null)
  const [acknowledgeError, setAcknowledgeError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([])

  useEffect(() => {
    const existing = loadCaseDraft()
    if (existing) setDraft(existing)
    setHydrated(true)
  }, [])

  const update = useCallback((patch: Partial<CaseDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }))
  }, [])

  const leave = useCallback(
    (force = false) => {
      if (!force && draftHasUnsavedContent(draft) && !confirmDiscard()) return
      router.push('/lawyer/civil-case-analysis')
    },
    [draft, router],
  )

  const saveDraft = () => {
    saveCaseDraft(draft)
    setSavedFlash(true)
    window.setTimeout(() => setSavedFlash(false), 1600)
  }

  const selectCategory = (id: DisputeCategoryId) => {
    setFormError((current) => (current?.step === 1 ? null : current))
    setDraft((prev) => ({
      ...prev,
      category: id,
      subcategory: prev.category === id ? prev.subcategory : null,
      needsCategoryReselect: false,
      legacyCategoryLabel: null,
    }))
  }

  const goNext = () => {
    if (draft.step === 1 || draft.step === 3) {
      const problem = validateCaseIntake(draft)
      if (problem && problem.step <= draft.step) {
        setFormError(problem)
        if (problem.step !== draft.step) update({ step: problem.step })
        return
      }
    }
    setFormError(null)
    setAcknowledgeError(null)
    update({ step: Math.min(5, draft.step + 1) })
  }

  const goBack = () => {
    if (draft.step === 1) {
      leave()
      return
    }
    setFormError(null)
    setAcknowledgeError(null)
    update({ step: draft.step - 1 })
  }

  const goToStep = (step: number) => {
    setFormError(null)
    setAcknowledgeError(null)
    update({ step })
  }

  const runAnalysis = async () => {
    if (submitting) return
    const problem = validateCaseIntake(draft)
    if (problem) {
      setAcknowledgeError(null)
      setSubmitError(null)
      setFormError(problem)
      update({ step: problem.step })
      return
    }
    if (!draft.acknowledged) {
      setSubmitError(null)
      setAcknowledgeError('Confirm that this is a research tool and not legal advice before continuing.')
      return
    }

    const payload = toC1IntakeRequest(draft)
    if (!payload) {
      setSubmitError('Select a dispute category and enter a case description before continuing.')
      return
    }

    setSubmitError(null)
    setAcknowledgeError(null)
    setSubmitting(true)
    saveCaseDraft(draft)

    try {
      const pdfUpload = pendingUploads.find(
        (item) =>
          item.type.toLowerCase().includes('pdf') || item.name.toLowerCase().endsWith('.pdf'),
      )
      const result = pdfUpload
        ? await createC1IntakeWithDocument(payload, pdfUpload.file)
        : await createC1Intake(payload)

      if (!result.intake_id) {
        throw new C1ApiError('The backend did not return an intake identifier.', 502, 'INVALID_RESPONSE')
      }

      storeC1Result(result)
      clearCaseDraft()
      setPendingUploads([])
      router.push(lawyerPaths.intakeResult(result.intake_id))
    } catch (error) {
      const message =
        error instanceof C1ApiError
          ? error.message
          : 'Could not submit this case to the analysis service. Your draft has been kept.'
      setSubmitError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!hydrated) {
    return <p className="muted">Loading draft…</p>
  }

  const category = getDisputeCategory(draft.category)
  const resolvedTitle = resolveCaseTitle(draft)
  const ready = Boolean(category) && !draft.needsCategoryReselect && isMeaningfulDescription(draft.description)
  const visibleError = formError && formError.step === draft.step ? formError.message : null

  return (
    <div className="wizard">
      <div className="wizard-head">
        <div>
          <p className="eyebrow">GUIDED RESEARCH FLOW</p>
          <h1>Civil Case Analysis</h1>
        </div>
        <button type="button" className="icon-btn" onClick={() => leave()} aria-label="Close wizard">
          <X size={19} />
        </button>
      </div>

      <div className="stepper">
        {STEPS.map((label, i) => {
          const n = i + 1
          const state = draft.step > n ? 'step done' : draft.step === n ? 'step current' : 'step'
          return (
            <div className={state} key={label}>
              <span>{draft.step > n ? <Check size={14} /> : n}</span>
              <small>{label}</small>
            </div>
          )
        })}
      </div>

      <div className="wizard-card">
        <p className="eyebrow">
          STEP {draft.step} OF {STEPS.length}
        </p>
        <h2>{STEPS[draft.step - 1]}</h2>

        {visibleError && (
          <p className="field-error" role="alert">
            {visibleError}
          </p>
        )}

        {draft.step === 1 && (
          <CategoryStep
            draft={draft}
            onSelect={selectCategory}
            onSubcategory={(subcategory) => update({ subcategory })}
            onOtherDescription={(otherCategoryDescription) => update({ otherCategoryDescription })}
          />
        )}

        {draft.step === 2 && <BasicInfoStep draft={draft} onChange={update} />}

        {draft.step === 3 && (
          <FactsStep
            draft={draft}
            invalid={Boolean(visibleError)}
            pendingUploads={pendingUploads}
            onChange={(patch) => {
              if (formError?.step === 3) setFormError(null)
              update(patch)
            }}
            onUploadsChange={setPendingUploads}
          />
        )}

        {draft.step === 4 && <EvidenceStep draft={draft} onChange={update} />}

        {draft.step === 5 && (
          <ReviewStep
            draft={draft}
            ready={ready}
            title={resolvedTitle}
            acknowledgeError={acknowledgeError}
            onEdit={goToStep}
            onAcknowledge={(acknowledged) => {
              if (acknowledged) setAcknowledgeError(null)
              update({ acknowledged })
            }}
          />
        )}

        {draft.step === 5 && (
          <p className="prototype-caption">
            <Info size={14} />
            Find Relevant Cases submits this intake to C1 for structured extraction. Similar historical judgment
            retrieval and legal relevance scoring are not available yet.
          </p>
        )}

        {submitError && (
          <p className="field-error" role="alert">
            {submitError}
          </p>
        )}

        <div className="wizard-actions">
          <button type="button" className="button ghost" onClick={goBack} disabled={submitting}>
            {draft.step === 1 ? 'Cancel' : 'Back'}
          </button>
          <div>
            <button type="button" className="button secondary" onClick={saveDraft} disabled={submitting}>
              {savedFlash ? 'Draft saved' : 'Save draft'}
            </button>
            {draft.step < 5 ? (
              <button type="button" className="button primary" onClick={goNext} disabled={submitting}>
                Continue <ArrowRight size={15} />
              </button>
            ) : (
              <button type="button" className="button primary" onClick={() => void runAnalysis()} disabled={submitting}>
                <Sparkles size={15} /> {submitting ? 'Submitting case…' : 'Find Relevant Cases'}
              </button>
            )}
          </div>
        </div>
      </div>

      <p className="footer-disclaimer">
        <Info size={14} /> Drafts stay in this browser. Submitted intake is sent to the LexLanka C1 API. Do not upload
        confidential personal information without permission.
      </p>
    </div>
  )
}

function FormLabel({
  label,
  optional = true,
  wide = false,
  hint,
  children,
}: {
  label: string
  optional?: boolean
  wide?: boolean
  hint?: string
  children: ReactNode
}) {
  return (
    <label className={wide ? 'wide' : undefined}>
      <span>
        {label}
        {optional ? (
          <em className="optional">Optional</em>
        ) : (
          <em className="optional required-mark">Required</em>
        )}
      </span>
      {children}
      {hint ? <small className="field-hint">{hint}</small> : null}
    </label>
  )
}

function CategoryStep({
  draft,
  onSelect,
  onSubcategory,
  onOtherDescription,
}: {
  draft: CaseDraft
  onSelect: (id: DisputeCategoryId) => void
  onSubcategory: (id: string | null) => void
  onOtherDescription: (value: string) => void
}) {
  const subcategories = getSubcategoryOptions(draft.category)
  return (
    <div>
      <p className="step-lead">
        Choose the closest civil dispute. An optional subcategory organises the case for later comparison of similar
        facts and legal issues. It does not limit the search to an exact match.
      </p>
      {draft.needsCategoryReselect && (
        <div className="notice" role="status">
          <Info size={17} />
          <span>
            <b>Category no longer supported.</b> Your previous selection
            {draft.legacyCategoryLabel ? ` (“${draft.legacyCategoryLabel}”)` : ''} was removed. Choose one of the five
            supported dispute categories below — your other draft details were kept.
          </span>
        </div>
      )}
      <div className="choice-grid category-grid" role="radiogroup" aria-label="Dispute category" aria-required="true">
        {DISPUTE_CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.id]
          const isSelected = draft.category === cat.id
          return (
            <button
              key={cat.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={isSelected ? 'choice selected' : 'choice'}
              onClick={() => onSelect(cat.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect(cat.id)
                }
              }}
            >
              <span className="choice-symbol" aria-hidden>
                <Icon size={18} />
              </span>
              <b>{cat.label}</b>
              <small>{cat.description}</small>
            </button>
          )
        })}
      </div>

      {draft.category === 'other_civil' && (
        <div className="form-grid subcategory-panel">
          <FormLabel
            label="Describe the category"
            wide
            hint="Optional. Ordinary language is enough. This note structures the case and does not restrict which historical cases can be compared."
          >
            <textarea
              rows={3}
              value={draft.otherCategoryDescription}
              placeholder="Describe the kind of civil dispute in simple language."
              onChange={(e) => onOtherDescription(e.target.value)}
            />
          </FormLabel>
        </div>
      )}

      {draft.category && draft.category !== 'other_civil' && (
        <div className="form-grid subcategory-panel">
          <FormLabel
            label="Subcategory"
            hint="Optional. This helps structure the case. It does not restrict the search to an exact subcategory match."
          >
            <select
              value={draft.subcategory ?? ''}
              onChange={(e) => onSubcategory(e.target.value || null)}
              aria-label="Subcategory"
            >
              <option value="">Select a subcategory…</option>
              {subcategories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </FormLabel>
        </div>
      )}
    </div>
  )
}

function BasicInfoStep({ draft, onChange }: { draft: CaseDraft; onChange: (patch: Partial<CaseDraft>) => void }) {
  const showAmount = categoryShowsDisputeAmount(draft.category)
  const provinces = withCurrentOption(SRI_LANKA_PROVINCES, draft.province)
  const courts = withCurrentOption(COURT_TYPES, draft.courtType)
  return (
    <>
      <p className="step-lead">
        These details are optional. Add the ones you know. They give context for similar facts and legal precedent
        relevance, and they do not block the next step.
      </p>
      <div className="form-grid">
        <FormLabel
          label="Case title"
          hint="If you leave this blank, a title is created from the parties or the dispute category."
        >
          <input
            value={draft.title}
            placeholder="For example, Perera v. Silva"
            onChange={(e) => onChange({ title: e.target.value })}
          />
        </FormLabel>
        <FormLabel label="Applicant / Plaintiff">
          <input value={draft.plaintiff} onChange={(e) => onChange({ plaintiff: e.target.value })} />
        </FormLabel>
        <FormLabel label="Respondent / Defendant">
          <input value={draft.defendant} onChange={(e) => onChange({ defendant: e.target.value })} />
        </FormLabel>
        <FormLabel label="Court type">
          <select value={draft.courtType} onChange={(e) => onChange({ courtType: e.target.value })}>
            <option value="">Select a court type…</option>
            {courts.map((court) => (
              <option key={court} value={court}>
                {court}
              </option>
            ))}
          </select>
        </FormLabel>
        <FormLabel label="Province">
          <select value={draft.province} onChange={(e) => onChange({ province: e.target.value })} aria-label="Province">
            <option value="">Select a province…</option>
            {provinces.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
        </FormLabel>
        <FormLabel label="District / jurisdiction">
          <input
            value={draft.district}
            placeholder="District or jurisdiction"
            onChange={(e) => onChange({ district: e.target.value })}
          />
        </FormLabel>
        {showAmount && (
          <FormLabel label="Dispute amount in LKR">
            <input
              inputMode="decimal"
              value={draft.amountLkr}
              placeholder="Amount in LKR"
              onChange={(e) => onChange({ amountLkr: e.target.value })}
            />
          </FormLabel>
        )}
        <FormLabel label="Relevant dates">
          <input
            value={draft.relevantDates}
            placeholder="For example, agreement date or incident date"
            onChange={(e) => onChange({ relevantDates: e.target.value })}
          />
        </FormLabel>
        <FormLabel label="Current case stage">
          <select value={draft.caseStage} onChange={(e) => onChange({ caseStage: e.target.value })}>
            <option value="">Select a stage…</option>
            {CASE_STAGES.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.label}
              </option>
            ))}
          </select>
        </FormLabel>
      </div>
    </>
  )
}

function FactsStep({
  draft,
  invalid,
  pendingUploads,
  onChange,
  onUploadsChange,
}: {
  draft: CaseDraft
  invalid: boolean
  pendingUploads: PendingUpload[]
  onChange: (patch: Partial<CaseDraft>) => void
  onUploadsChange: (uploads: PendingUpload[]) => void
}) {
  return (
    <>
      <p className="step-lead">
        The description is the main source for finding relevant historical cases. You do not need legal terminology.
      </p>
      <div className="form-grid">
        <FormLabel
          label="Case description"
          optional={false}
          wide
          hint="Required. Include the important events, circumstances, and the main problem."
        >
          <textarea
            id="case-description"
            rows={6}
            required
            aria-required="true"
            aria-invalid={invalid}
            placeholder={DESCRIPTION_PLACEHOLDER}
            value={draft.description}
            onChange={(e) => onChange({ description: e.target.value })}
          />
        </FormLabel>
        <FormLabel
          label="Legal issue / claim"
          wide
          hint="Optional. Leave this blank if you are unsure. Legal issues can be identified later from your description."
        >
          <textarea
            rows={3}
            value={draft.legalIssue}
            placeholder="Optional. The question or claim, if you already know it."
            onChange={(e) => onChange({ legalIssue: e.target.value })}
          />
        </FormLabel>
        <FormLabel label="Requested remedy" wide hint="Optional. What outcome are you asking for, in ordinary language?">
          <textarea
            rows={3}
            value={draft.remedy}
            placeholder="Optional. For example, return of a deposit or payment of unpaid wages."
            onChange={(e) => onChange({ remedy: e.target.value })}
          />
        </FormLabel>
      </div>
      <DocumentPicker
        uploads={pendingUploads}
        onChange={(next) => {
          onUploadsChange(next)
          onChange({
            supportingDocuments: next.map((item) => ({
              name: item.name,
              size: item.size,
              type: item.type,
            })),
          })
        }}
      />
    </>
  )
}

function DocumentPicker({
  uploads,
  onChange,
}: {
  uploads: PendingUpload[]
  onChange: (uploads: PendingUpload[]) => void
}) {
  return (
    <div className="document-picker">
      <label className="upload">
        <Upload size={19} />
        <span>
          <b>Upload supporting documents</b>
          <small>PDF preferred for backend processing · optional</small>
        </span>
        <input
          className="file-input"
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? [])
            if (!files.length) return
            onChange([
              ...uploads,
              ...files.map((file) => ({
                file,
                name: file.name,
                size: file.size,
                type: file.type,
              })),
            ])
            e.target.value = ''
          }}
        />
      </label>
      <p className="field-hint document-note">
        Optional. If you attach a PDF, it is sent with the intake to C1. Draft saves keep only file names in this
        browser; file contents stay in memory until you submit or leave this page.
      </p>
      {uploads.length > 0 && (
        <ul className="doc-list">
          {uploads.map((file, index) => (
            <li key={`${file.name}-${file.size}-${index}`}>
              <FileText size={15} />
              <span>{file.name}</span>
              <button
                type="button"
                className="text-button"
                onClick={() => onChange(uploads.filter((_, i) => i !== index))}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function EvidenceStep({ draft, onChange }: { draft: CaseDraft; onChange: (patch: Partial<CaseDraft>) => void }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const items = evidenceItemsFor(draft.category)

  const setStatus = (id: string, status: EvidenceStatus | null) => {
    const current = draft.evidence[id] ?? { status: null, description: '' }
    onChange({
      evidence: {
        ...draft.evidence,
        [id]: { ...current, status },
      },
    })
  }

  const setDescription = (id: string, description: string) => {
    const current = draft.evidence[id] ?? { status: 'available' as const, description: '' }
    onChange({
      evidence: {
        ...draft.evidence,
        [id]: { ...current, description },
      },
    })
  }

  return (
    <>
      <p className="step-lead">
        Mark the evidence you can use for evidence comparison with relevant historical cases. This is optional and does
        not predict an outcome. <b>Not available</b> means you do not have that evidence. Leaving an item unset means
        you have not provided it to the platform.
      </p>
      {!draft.category && (
        <div className="notice" role="status">
          <Info size={17} />
          <span>Select a dispute category first. Evidence types follow the category you choose.</span>
        </div>
      )}
      <div className="intake-evidence-list">
        {items.map((item) => {
          const entry = draft.evidence[item.id]
          const open = openId === item.id
          const status = entry?.status ?? null
          return (
            <article className={open ? 'intake-evidence open' : 'intake-evidence'} key={item.id}>
              <button
                type="button"
                className="intake-evidence-toggle"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : item.id)}
              >
                <span>
                  <b>{item.label}</b>
                  <small>{status ? EVIDENCE_STATUS_LABELS[status] : 'Not provided to the platform'}</small>
                </span>
                <ChevronDown size={16} />
              </button>
              {open && (
                <div className="intake-evidence-body">
                  <p className="field-hint">
                    Choose availability for legal precedent analysis. Clear the selection if this information has not
                    been provided to the platform.
                  </p>
                  <div className="status-options" role="radiogroup" aria-label={`${item.label} availability`}>
                    {EVIDENCE_STATUSES.map((option) => {
                      const selected = status === option
                      return (
                        <button
                          key={option}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          className={selected ? 'status-option selected' : 'status-option'}
                          onClick={() => setStatus(item.id, selected ? null : option)}
                        >
                          {EVIDENCE_STATUS_LABELS[option]}
                        </button>
                      )
                    })}
                  </div>
                  {status === 'available' && (
                    <label className="evidence-note">
                      <span>What does this evidence show?</span>
                      <textarea
                        rows={2}
                        value={entry?.description ?? ''}
                        placeholder="Optional. A short note is enough."
                        onChange={(e) => setDescription(item.id, e.target.value)}
                      />
                    </label>
                  )}
                  {status && (
                    <button type="button" className="text-button" onClick={() => setStatus(item.id, null)}>
                      Clear selection — not provided to the platform
                    </button>
                  )}
                </div>
              )}
            </article>
          )
        })}
      </div>
    </>
  )
}

function ReviewStep({
  draft,
  ready,
  title,
  acknowledgeError,
  onEdit,
  onAcknowledge,
}: {
  draft: CaseDraft
  ready: boolean
  title: { title: string; generated: boolean }
  acknowledgeError: string | null
  onEdit: (step: number) => void
  onAcknowledge: (value: boolean) => void
}) {
  const category = getDisputeCategory(draft.category)
  const subcategory = getSubcategoryLabel(draft.category, draft.subcategory, draft.otherCategoryDescription)
  const categoryLine = category
    ? subcategory
      ? `${category.label} · ${subcategory}`
      : category.label
    : 'Category not selected'
  const basicLines = basicInformationLines(draft)
  const rows: { key: string; step: number; content: ReactNode }[] = [
    { key: 'category', step: 1, content: categoryLine },
    {
      key: 'basic',
      step: 2,
      content:
        basicLines.length > 0 ? (
          <span className="review-stack">
            {basicLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </span>
        ) : (
          'No optional case details entered'
        ),
    },
    {
      key: 'description',
      step: 3,
      content: draft.description.trim()
        ? `Case description: ${summarizeText(draft.description)}`
        : 'Case description has not been entered',
    },
  ]
  if (draft.legalIssue.trim()) {
    rows.push({ key: 'issue', step: 3, content: `Legal issue: ${summarizeText(draft.legalIssue)}` })
  }
  if (draft.remedy.trim()) {
    rows.push({ key: 'remedy', step: 3, content: `Requested remedy: ${summarizeText(draft.remedy)}` })
  }
  rows.push({ key: 'evidence', step: 4, content: `Evidence: ${summarizeEvidence(draft)}` })
  if (draft.supportingDocuments.length > 0) {
    const count = draft.supportingDocuments.length
    rows.push({
      key: 'documents',
      step: 3,
      content: `${count} supporting ${count === 1 ? 'document' : 'documents'} selected (prototype — not analyzed or stored)`,
    })
  }

  return (
    <div className="review">
      <div className="review-file">
        <FileText size={20} />
        <span className="review-copy">
          <b>{title.title}</b>
          {title.generated && <small>Generated because the case title was left blank</small>}
        </span>
        <button type="button" className="text-button" onClick={() => onEdit(2)} aria-label="Edit case title">
          Edit
        </button>
        <Badge tone={ready ? 'teal' : 'rose'}>
          {ready ? 'Ready to find relevant cases' : draft.category ? 'Case description required' : 'Category required'}
        </Badge>
      </div>
      {rows.map((row) => (
        <div className="review-row" key={row.key}>
          <Check size={15} />
          <span>{row.content}</span>
          <button type="button" className="text-button" onClick={() => onEdit(row.step)} aria-label={`Edit ${row.key}`}>
            Edit
          </button>
        </div>
      ))}
      <div className="acknowledge">
        <input
          type="checkbox"
          checked={draft.acknowledged}
          onChange={(e) => onAcknowledge(e.target.checked)}
        />
        <span>I understand that this is an AI-assisted research tool and not professional legal advice.</span>
      </div>
      {acknowledgeError && (
        <p className="field-error" role="alert">
          {acknowledgeError}
        </p>
      )}
    </div>
  )
}

function basicInformationLines(draft: CaseDraft): string[] {
  const lines: string[] = []
  if (draft.plaintiff.trim()) lines.push(`Applicant / plaintiff: ${draft.plaintiff.trim()}`)
  if (draft.defendant.trim()) lines.push(`Respondent / defendant: ${draft.defendant.trim()}`)
  if (draft.courtType.trim()) lines.push(`Court type: ${draft.courtType.trim()}`)
  if (draft.province.trim()) lines.push(`Province: ${draft.province.trim()}`)
  if (draft.district.trim()) lines.push(`District / jurisdiction: ${draft.district.trim()}`)
  if (categoryShowsDisputeAmount(draft.category) && draft.amountLkr.trim()) {
    lines.push(`Dispute amount: LKR ${draft.amountLkr.trim()}`)
  }
  if (draft.relevantDates.trim()) lines.push(`Relevant dates: ${draft.relevantDates.trim()}`)
  const stage = caseStageLabel(draft.caseStage)
  if (stage) lines.push(`Current case stage: ${stage}`)
  return lines
}
