'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Info, Scale } from 'lucide-react'
import {
  C1ApiError,
  getC1Intake,
  loadStoredC1Result,
  storeC1Result,
  type C1ExtractedLegalInfo,
} from '@/lib/c1-api'
import { lawyerPaths } from '@/lib/nav'
import { Badge, SectionTitle } from './shared-ui'

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="review-row">
      <span>
        <small>{label}</small>
        <b>{value}</b>
      </span>
    </div>
  )
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null
  return (
    <section className="panel">
      <p className="eyebrow">EXTRACTED</p>
      <h2>{title}</h2>
      <ul className="doc-list">
        {items.map((item) => (
          <li key={item}>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function IntakeResultScreen({ intakeId }: { intakeId: string }) {
  const [result, setResult] = useState<C1ExtractedLegalInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      const cached = loadStoredC1Result()
      if (cached?.intake_id === intakeId) {
        if (!cancelled) {
          setResult(cached)
          setLoading(false)
        }
      }

      try {
        const status = await getC1Intake(intakeId)
        if (cancelled) return
        if (status.error === 'INTAKE_NOT_FOUND' || (!status.result && status.status === 'failed')) {
          setError(status.error || 'This intake could not be found.')
          setLoading(false)
          return
        }
        if (!status.result) {
          setError('Extraction is still processing or unavailable for this intake.')
          setLoading(false)
          return
        }
        storeC1Result(status.result)
        setResult(status.result)
      } catch (err) {
        if (cancelled) return
        if (!cached || cached.intake_id !== intakeId) {
          setError(
            err instanceof C1ApiError
              ? err.message
              : 'Could not load the saved intake result from the backend.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [intakeId])

  if (loading && !result) {
    return <p className="muted">Loading intake result…</p>
  }

  if (error && !result) {
    return (
      <>
        <SectionTitle
          eyebrow="CIVIL CASE ANALYSIS"
          title="Intake result unavailable"
          description="The structured extraction for this intake could not be loaded."
          action={
            <Link className="button secondary" href={lawyerPaths.civilCaseAnalysis}>
              <ArrowLeft size={15} /> Back to Civil Case Analysis
            </Link>
          }
        />
        <div className="notice" role="alert">
          <Info size={17} />
          <span>{error}</span>
        </div>
      </>
    )
  }

  if (!result) return null

  const info = result.case_information
  const parties = result.parties_and_positions.map((party) => `${party.party} (${party.role})`)

  return (
    <>
      <SectionTitle
        eyebrow="STAGE 2 EXTRACTION"
        title={info.title || 'Case intake result'}
        description="Structured legal information extracted from your current-case intake. Similar historical judgments are not retrieved yet."
        action={
          <Link className="button secondary" href={lawyerPaths.civilCaseAnalysis}>
            <ArrowLeft size={15} /> Back to module
          </Link>
        }
      />

      <div className="notice" role="status">
        <Info size={17} />
        <span>
          <b>Intake saved.</b> Extraction completed through C1 Stage 2. Similar-case retrieval, legal relevance scoring,
          evidence-gap analysis, and LM Studio explanations are not connected yet.
        </span>
      </div>

      {error && (
        <div className="notice" role="status">
          <Info size={17} />
          <span>{error} Showing the last successful extraction from this session.</span>
        </div>
      )}

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">CURRENT CASE</p>
              <h2>Case information</h2>
            </div>
            <Badge tone="teal">Intake {result.intake_id.slice(0, 8)}</Badge>
          </div>
          <Field label="Dispute category" value={info.case_type || info.dispute_category} />
          <Field label="Subcategory" value={info.subcategory_label || info.subcategory} />
          <Field label="Other category note" value={info.other_category_description} />
          <Field label="Court" value={info.court} />
          <Field label="Province" value={info.province} />
          <Field label="District" value={info.district} />
          <Field label="Amount (LKR)" value={info.amount_lkr} />
          <Field label="Relevant dates" value={info.relevant_dates} />
          <Field label="Case stage" value={info.case_stage_label || info.case_stage} />
          <Field label="Case number" value={info.case_number} />
          <Field label="Summary" value={info.summary} />
          <Field label="Remedy requested" value={info.remedy_requested} />
          <Field label="Model version" value={result.model_version} />
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">CAPABILITY STATUS</p>
              <h2>What is available now</h2>
            </div>
          </div>
          <div className="review-row">
            <span>
              <small>Similar historical cases</small>
              <b>{result.similar_cases_available ? 'Available' : 'Not implemented yet'}</b>
            </span>
          </div>
          <div className="review-row">
            <span>
              <small>Legal Precedent Relevance Score</small>
              <b>{result.legal_relevance_score_available ? 'Available' : 'Not calculated'}</b>
            </span>
          </div>
          <div className="review-row">
            <span>
              <small>LM Studio explanations</small>
              <b>{result.llm_explanation_available ? 'Available' : 'Not connected'}</b>
            </span>
          </div>
          <p className="muted small" style={{ marginTop: 12 }}>
            {result.disclaimer}
          </p>
        </section>
      </div>

      <ListBlock title="Parties" items={parties} />
      <ListBlock title="Legal issues" items={result.legal_issues.map((item) => item.issue)} />
      <ListBlock title="Claims" items={result.claims} />
      <ListBlock title="Evidence mentioned" items={result.evidence_mentioned} />
      <ListBlock title="Cited case references in narrative" items={result.cited_case_references} />

      <section className="panel callout">
        <div className="feature-icon teal">
          <Scale size={19} />
        </div>
        <div>
          <h3>Historical case comparison is pending</h3>
          <p className="muted">
            The shared HybridRetriever is not implemented yet, so LexLanka does not invent judgments, relevance
            percentages, or LLM explanations on this screen.
          </p>
        </div>
        <Link className="button secondary" href={lawyerPaths.newCivilCaseAnalysis}>
          Analyze another case
        </Link>
      </section>
    </>
  )
}
