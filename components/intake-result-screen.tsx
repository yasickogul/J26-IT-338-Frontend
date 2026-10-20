'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Info, Scale, Sparkles } from 'lucide-react'
import {
  C1ApiError,
  fetchC1SimilarCasesForIntake,
  getC1Intake,
  loadStoredC1Result,
  storeC1Result,
  type C1ExtractedLegalInfo,
  type C1IntakeSimilarCasesResponse,
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
  const [retrieval, setRetrieval] = useState<C1IntakeSimilarCasesResponse | null>(null)
  const [retrievalError, setRetrievalError] = useState<string | null>(null)
  const [retrieving, setRetrieving] = useState(false)

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

  const runSimilarCases = async () => {
    if (retrieving) return
    setRetrieving(true)
    setRetrievalError(null)
    try {
      const response = await fetchC1SimilarCasesForIntake(intakeId, {
        top_k: 5,
        include_analysis: true,
        use_llm: false,
      })
      setRetrieval(response)
    } catch (err) {
      setRetrieval(null)
      setRetrievalError(
        err instanceof C1ApiError
          ? err.message
          : 'Similar-case retrieval failed. Your intake extraction is unchanged.',
      )
    } finally {
      setRetrieving(false)
    }
  }

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
  const analysis = retrieval?.analysis

  return (
    <>
      <SectionTitle
        eyebrow="CIVIL CASE ANALYSIS"
        title={info.title || 'Case intake result'}
        description="Stage 2 extraction is complete. Run semantic retrieval to find similar historical judgments in the Neon corpus."
        action={
          <Link className="button secondary" href={lawyerPaths.civilCaseAnalysis}>
            <ArrowLeft size={15} /> Back to module
          </Link>
        }
      />

      <div className="notice" role="status">
        <Info size={17} />
        <span>
          <b>Intake saved.</b> Structured extraction completed. Similarity scores are retrieval cosine similarity only —
          not a legal success probability.
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
              <p className="eyebrow">SIMILAR CASES</p>
              <h2>Semantic retrieval</h2>
            </div>
          </div>
          <p className="muted">
            Search the existing judgment corpus with the saved intake narrative. No fabricated judgments are shown.
          </p>
          <button
            type="button"
            className="button primary"
            onClick={() => void runSimilarCases()}
            disabled={retrieving}
            style={{ marginTop: 14 }}
          >
            <Sparkles size={15} /> {retrieving ? 'Searching judgments…' : 'Find Similar Historical Cases'}
          </button>
          {retrievalError && (
            <p className="field-error" role="alert" style={{ marginTop: 12 }}>
              {retrievalError}
            </p>
          )}
          {retrieval && (
            <div style={{ marginTop: 14 }}>
              <Field label="Retrieved judgments" value={String(retrieval.retrieved_count)} />
              <Field label="Retrieval method" value={retrieval.retrieval_method} />
              <p className="muted small">{retrieval.score_explanation}</p>
            </div>
          )}
        </section>
      </div>

      <ListBlock title="Parties" items={parties} />
      <ListBlock title="Legal issues" items={result.legal_issues.map((item) => item.issue)} />
      <ListBlock title="Claims" items={result.claims} />
      <ListBlock title="Evidence mentioned" items={result.evidence_mentioned} />
      <ListBlock title="Cited case references in narrative" items={result.cited_case_references} />

      {retrieving && (
        <div className="notice" role="status">
          <Info size={17} />
          <span>Running semantic search against the Neon judgment corpus…</span>
        </div>
      )}

      {retrieval && retrieval.retrieved_count === 0 && (
        <div className="notice" role="status">
          <Info size={17} />
          <span>No similar judgments were retrieved for this intake query.</span>
        </div>
      )}

      {retrieval && retrieval.cases.length > 0 && (
        <section className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">RETRIEVED JUDGMENTS</p>
              <h2>Similar historical cases</h2>
            </div>
            <Badge tone="teal">{retrieval.retrieved_count} found</Badge>
          </div>
          {retrieval.cases.map((item) => (
            <article className="table-row" key={item.document_id} style={{ alignItems: 'flex-start' }}>
              <span>
                <b>{item.citation || item.document_id}</b>
                <small>{item.title}</small>
                <small>
                  {[item.court, item.decision_date].filter(Boolean).join(' · ') || 'Court / date unavailable'}
                </small>
                <small>{item.supporting_excerpt}</small>
                {item.source_url ? (
                  <a className="text-button" href={item.source_url} target="_blank" rel="noreferrer">
                    Open source
                  </a>
                ) : null}
              </span>
              <Badge tone="slate">{(item.retrieval_similarity * 100).toFixed(1)}% similarity</Badge>
            </article>
          ))}
        </section>
      )}

      {analysis && (
        <>
          <section className="panel">
            <p className="eyebrow">GROUNDED ANALYSIS</p>
            <h2>Case summary</h2>
            <p>{analysis.case_summary}</p>
          </section>
          <ListBlock title="Legal issues" items={analysis.legal_issues} />
          <ListBlock title="Applicant-side arguments" items={analysis.arguments_for_applicant} />
          <ListBlock title="Respondent-side arguments" items={analysis.arguments_for_respondent} />
          <ListBlock title="Evidence gaps" items={analysis.evidence_gaps} />
          <ListBlock title="Limitations" items={analysis.limitations} />
          {analysis.applicable_legal_principles.length > 0 && (
            <section className="panel">
              <p className="eyebrow">SOURCE-SUPPORTED EXCERPTS</p>
              <h2>Applicable themes from retrieved judgments</h2>
              {analysis.applicable_legal_principles.map((section) => (
                <div className="review-row" key={`${section.title}-${section.content.slice(0, 24)}`}>
                  <span>
                    <small>{section.title}</small>
                    <b>{section.content}</b>
                  </span>
                </div>
              ))}
            </section>
          )}
          <p className="muted small">
            Analysis model: {analysis.model_version}. LM Studio: {analysis.llm_status}.
          </p>
        </>
      )}

      {!retrieval && (
        <section className="panel callout">
          <div className="feature-icon teal">
            <Scale size={19} />
          </div>
          <div>
            <h3>Ready for semantic retrieval</h3>
            <p className="muted">
              Use Find Similar Historical Cases to query the existing Neon embeddings. Hybrid keyword fusion and a
              validated legal relevance percentage are not implemented yet.
            </p>
          </div>
          <Link className="button secondary" href={lawyerPaths.newCivilCaseAnalysis}>
            Analyze another case
          </Link>
        </section>
      )}
    </>
  )
}
