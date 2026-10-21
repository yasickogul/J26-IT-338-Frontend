'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Activity, ArrowRight, FileText, RotateCcw, ShieldCheck, Upload, X } from 'lucide-react'

type LifecycleStatus = 'queued' | 'processing' | 'completed' | 'failed'

type ImageExtraction = {
  ocr_raw_text: string
  cleaned_text: string
  extracted_legal_claim: string | null
  ocr_status: 'completed' | 'failed'
  extraction_status: string
  detected_language: 'en' | 'si' | 'ta' | 'mixed' | null
  ocr_confidence: number | null
  low_confidence: boolean
  error: { code: string; stage: string } | null
}

type EvidencePassage = {
  evidence_id?: string
  chunk_id?: string
  original_chunk_id?: string
  text?: string
  metadata?: Record<string, unknown>
  source?: Record<string, unknown>
  roles?: string[]
}

type AnalysisResult = {
  claim_verdict?: 'True' | 'False' | 'Misleading' | null
  explanation?: string | null
  citations?: string[]
  insufficient_evidence?: boolean
  limitations?: string[]
  evidence?: { passages?: EvidencePassage[] }
}

type ResultResponse = {
  status: LifecycleStatus
  result: AnalysisResult | null
}

type HistoryItem = {
  claim_id: string
  extracted_claim: string | null
  status: LifecycleStatus
  verdict: string | null
  created_at: string
}

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000').replace(/\/$/, '')
const POLL_INTERVAL_MS = 1500
const POLL_TIMEOUT_MS = 120000
const MAX_IMAGE_BYTES = 10 * 1024 * 1024

function errorMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'object' && payload !== null && 'detail' in payload) {
    const detail = (payload as { detail?: unknown }).detail
    if (typeof detail === 'object' && detail !== null && 'code' in detail) {
      return String((detail as { code: string }).code).replaceAll('_', ' ')
    }
    if (typeof detail === 'string') return detail
  }
  return fallback
}

async function readResponse(response: Response, fallback: string) {
  const payload = await response.json().catch(() => null)
  if (!response.ok) throw new Error(errorMessage(payload, fallback))
  return payload
}

function verdictTone(verdict: AnalysisResult['claim_verdict']) {
  if (verdict === 'True') return '#0d7c78'
  if (verdict === 'False') return '#a84d56'
  return '#a8751c'
}

function sourceReference(passage: EvidencePassage) {
  const source = passage.source ?? {}
  const citation = source.citation
  if (typeof citation === 'string' && citation.trim()) return citation
  const parts = [source.title, source.act_number, source.section_label, source.source_file]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
  return parts.join(' · ') || passage.evidence_id || passage.chunk_id || 'Source reference unavailable'
}

export function C3MisinformationScreen() {
  const [claim, setClaim] = useState('')
  const [submittedClaim, setSubmittedClaim] = useState('')
  const [status, setStatus] = useState<LifecycleStatus | null>(null)
  const [claimId, setClaimId] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [image, setImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [extraction, setExtraction] = useState<ImageExtraction | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [reopened, setReopened] = useState(false)
  const requestController = useRef<AbortController | null>(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      requestController.current?.abort()
    }
  }, [])

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  const passages = result?.evidence?.passages ?? []
  const canSubmit = claim.trim().length > 0 && !busy
  const statusText = useMemo(() => {
    if (status === 'queued') return 'Claim queued for analysis…'
    if (status === 'processing') return 'Retrieving legal evidence and preparing analysis…'
    if (status === 'failed') return 'The backend could not complete this analysis.'
    return ''
  }, [status])

  const reset = () => {
    requestController.current?.abort()
    setClaim('')
    setSubmittedClaim('')
    setStatus(null)
    setClaimId(null)
    setResult(null)
    setError(null)
    setReopened(false)
    setExtraction(null)
    setImage(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
  }

  const pollClaim = async (id: string, controller: AbortController) => {
    const started = Date.now()
    while (Date.now() - started < POLL_TIMEOUT_MS) {
      const resultResponse = await fetch(`${API_URL}/api/v1/c3/results/${id}`, {
        credentials: 'include',
        cache: 'no-store',
        signal: controller.signal,
      })
      const current = await readResponse(resultResponse, 'Unable to retrieve the analysis result.') as ResultResponse
      if (controller.signal.aborted || !mounted.current) return
      setStatus(current.status)
      if (current.status === 'completed') {
        if (!current.result) throw new Error('The backend returned no analysis result.')
        setResult(current.result)
        return
      }
      if (current.status === 'failed') throw new Error('claim analysis failed')
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
      if (controller.signal.aborted || !mounted.current) return
    }
    throw new Error('The analysis is taking longer than expected. You can try again later.')
  }

  const openHistory = async () => {
    if (historyOpen) {
      setHistoryOpen(false)
      return
    }
    if (historyLoading) return
    setHistoryOpen(true)
    setHistoryLoading(true)
    setHistoryError(null)
    try {
      const response = await fetch(`${API_URL}/api/v1/c3/history?page=1&page_size=20`, {
        credentials: 'include',
        cache: 'no-store',
      })
      if (response.status === 401) {
        if (mounted.current) setHistory([])
        return
      }
      const payload = await readResponse(response, 'Unable to load previous claims.') as { items: HistoryItem[] }
      if (mounted.current) setHistory(payload.items)
    } catch (cause) {
      if (mounted.current) setHistoryError(cause instanceof Error ? cause.message : 'Unable to load previous claims.')
    } finally {
      if (mounted.current) setHistoryLoading(false)
    }
  }

  const reopenClaim = async (item: HistoryItem) => {
    if (busy) return
    const controller = new AbortController()
    requestController.current?.abort()
    requestController.current = controller
    setBusy(true)
    setError(null)
    setResult(null)
    setReopened(true)
    setSubmittedClaim(item.extracted_claim || 'Claim text unavailable')
    setClaimId(item.claim_id)
    setStatus(item.status)
    try {
      await pollClaim(item.claim_id, controller)
    } catch (cause) {
      if (!controller.signal.aborted && mounted.current) {
        setError(cause instanceof Error ? cause.message : 'Unable to reopen this claim.')
      }
    } finally {
      if (mounted.current && requestController.current === controller) setBusy(false)
      if (requestController.current === controller) requestController.current = null
    }
  }

  const chooseImage = (file: File | undefined) => {
    if (!file) return
    setError(null)
    setExtraction(null)
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Only JPEG and PNG images are supported by the C3 backend.')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('The image must be 10 MB or smaller.')
      return
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setImage(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const extractImage = async () => {
    if (!image || busy) return
    const controller = new AbortController()
    requestController.current?.abort()
    requestController.current = controller
    setBusy(true)
    setError(null)
    try {
      const body = new FormData()
      body.append('image', image)
      const response = await fetch(`${API_URL}/api/v1/c3/claims/extract-image`, {
        method: 'POST',
        body,
        credentials: 'include',
        signal: controller.signal,
      })
      const payload = (await readResponse(response, 'Image extraction failed.')) as ImageExtraction
      if (!mounted.current || controller.signal.aborted) return
      setExtraction(payload)
      const extractedClaim = payload.extracted_legal_claim || payload.cleaned_text
      if (extractedClaim) setClaim(extractedClaim)
      if (payload.error) setError(payload.error.code.replaceAll('_', ' '))
      else if (!extractedClaim) setError('No claim text was extracted from this image.')
    } catch (cause) {
      if (controller.signal.aborted || !mounted.current) return
      setError(cause instanceof Error ? cause.message : 'Image extraction failed.')
    } finally {
      if (mounted.current && requestController.current === controller) setBusy(false)
      if (requestController.current === controller) requestController.current = null
    }
  }

  const submit = async () => {
    const text = claim.trim()
    if (!text || busy) return
    const controller = new AbortController()
    requestController.current?.abort()
    requestController.current = controller
    setBusy(true)
    setError(null)
    setResult(null)
    setSubmittedClaim(text)
    setReopened(false)
    setStatus(null)
    let submitted = false
    try {
      const submissionResponse = await fetch(`${API_URL}/api/v1/c3/claims/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text }),
        signal: controller.signal,
      })
      const submission = await readResponse(submissionResponse, 'Claim submission failed.') as { claim_id: string; status: LifecycleStatus }
      submitted = true
      setClaimId(submission.claim_id)
      setStatus(submission.status)

      await pollClaim(submission.claim_id, controller)
    } catch (cause) {
      if (controller.signal.aborted || !mounted.current) return
      if (!submitted) setStatus(null)
      setError(cause instanceof Error ? cause.message : 'Claim analysis failed.')
    } finally {
      if (mounted.current && requestController.current === controller) setBusy(false)
      if (requestController.current === controller) requestController.current = null
    }
  }

  return (
    <div>
      <div className="section-title">
        <div>
          <p className="eyebrow">SOURCE VERIFICATION</p>
          <h1>Legal Misinformation Analysis</h1>
          <p className="muted">Check a Sri Lankan legal claim against the C3 evidence and citation pipeline.</p>
        </div>
        <div className="mis-controls"><button type="button" className="button secondary" onClick={openHistory} disabled={historyLoading}>{historyLoading ? 'Loading history…' : 'Previous claims'}</button><button type="button" className="button secondary" onClick={reset}><RotateCcw size={15} /> New analysis</button></div>
      </div>

      {historyOpen && <section className="panel" aria-label="Previous claims"><div className="panel-head"><h2>Previous claims</h2></div>{historyError && <p role="alert">{historyError}</p>}{!historyLoading && !historyError && (history.length ? history.map((item) => <button type="button" className="table-row" key={item.claim_id} onClick={() => reopenClaim(item)} disabled={busy}><span><b>{item.extracted_claim || 'Claim text unavailable'}</b><small>{item.status}{item.verdict ? ` · ${item.verdict}` : ''} · {new Date(item.created_at).toLocaleString()}</small></span><ArrowRight size={15} /></button>) : <p className="muted">No previous claims for this browser session.</p>)}</section>}

      <div className="notice"><ShieldCheck size={17} /><span><b>Research tool</b> — Results are AI-assisted source comparisons, not legal advice or a definitive legal conclusion.</span></div>

      <section className="panel mis-input">
        <div className="panel-head"><div><p className="eyebrow">CLAIM INPUT</p><h2>Submit a legal claim</h2></div><span className="badge teal">English · Sinhala · Tamil</span></div>
        <label className="c3-field"><span>Claim text</span><textarea value={claim} onChange={(event) => setClaim(event.target.value)} placeholder="Enter the legal statement you want to verify…" rows={4} style={{ minHeight: 112, resize: 'vertical' }} disabled={busy} /></label>
        <div className="c3-image-row">
          <label className="mis-dropzone"><Upload size={20} /><b>Extract a claim from an image</b><span>JPEG or PNG · up to 10 MB</span><input type="file" accept="image/jpeg,image/png" onChange={(event) => chooseImage(event.target.files?.[0])} disabled={busy} /></label>
          {previewUrl && <div className="c3-preview"><img src={previewUrl} alt="Selected claim source" /><button type="button" className="icon-btn" aria-label="Remove image" onClick={() => { setImage(null); setExtraction(null); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }}><X size={15} /></button></div>}
          {image && <button type="button" className="button secondary" onClick={extractImage} disabled={busy}>{busy ? <Activity size={15} className="spin" /> : <FileText size={15} />} Extract claim</button>}
        </div>
        {extraction && <div className="c3-extraction"><b>Extracted text</b><p>{extraction.extracted_legal_claim || extraction.cleaned_text || 'No claim text found.'}</p><small>{extraction.detected_language ? `Detected language: ${extraction.detected_language}` : 'Language was not detected'}{extraction.low_confidence ? ' · Review the extracted text carefully' : ''}</small></div>}
        <div className="mis-controls"><button type="button" className="button primary" onClick={submit} disabled={!canSubmit}>{busy ? <><Activity size={16} className="spin" /> Analyzing…</> : <>Analyze claim <ArrowRight size={16} /></>}</button></div>
        {error && <p className="c3-error" role="alert">{error}</p>}
      </section>

      {status && !result && <section className="panel c3-status-panel" aria-live="polite"><Activity size={18} className={busy ? 'spin' : ''} /><div><b>{statusText}</b><p>Keep this page open while the backend processes claim {claimId ? `${claimId.slice(0, 8)}…` : ''}.</p></div></section>}

      {result && <section className="mis-results" aria-live="polite">
        <div className="verdict-card panel"><div className="verdict-copy"><p className="eyebrow">VERIFICATION OUTCOME</p><h2 style={{ color: verdictTone(result.claim_verdict) }}>{result.insufficient_evidence ? 'Insufficient evidence' : result.claim_verdict || 'No verdict returned'}</h2><p>{result.explanation || 'The backend returned no explanation for this result.'}</p></div><span className="badge" style={{ color: verdictTone(result.claim_verdict) }}>{result.insufficient_evidence ? 'Review required' : 'Analysis complete'}</span></div>
        <div className="result-two-col"><section className="panel evidence-panel"><div className="panel-head"><div><p className="eyebrow">SUBMITTED CLAIM</p><h3>{reopened ? 'Stored claim text' : 'Original text preserved'}</h3></div><FileText size={20} /></div><blockquote>“{submittedClaim}”</blockquote></section><section className="panel evidence-panel"><div className="panel-head"><div><p className="eyebrow">LEGAL EVIDENCE</p><h3>{passages.length ? `${passages.length} evidence passage${passages.length === 1 ? '' : 's'}` : 'No evidence returned'}</h3></div><ShieldCheck size={20} /></div>{passages.map((passage, index) => <article className="evidence-card" key={passage.evidence_id || passage.chunk_id || index}><div><b>{String(passage.metadata?.title || passage.source?.title || passage.evidence_id || 'Evidence passage')}</b><p>{passage.text || 'No excerpt supplied.'}</p><small>{passage.source?.citation ? String(passage.source.citation) : passage.evidence_id || passage.chunk_id || 'Source reference unavailable'}</small></div></article>)}</section></div>
        <section className="panel c3-citations"><p className="eyebrow">CITATIONS AND LIMITATIONS</p><h3>Traceable references</h3>{result.citations?.length ? <p>{result.citations.join(' · ')}</p> : <p>No citation identifiers were returned.</p>}{passages.length ? <div>{passages.map((passage, index) => <small key={passage.evidence_id || passage.chunk_id || index} style={{ display: 'block', marginTop: 6 }}>{sourceReference(passage)}</small>)}</div> : null}{result.limitations?.length ? <ul>{result.limitations.map((item) => <li key={item}>{item}</li>)}</ul> : null}</section>
      </section>}
    </div>
  )
}
