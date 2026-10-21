'use client'

import { ChangeEvent, DragEvent, useMemo, useState } from 'react'
import { Check, FileText, Info, Network, Play, Scale, ShieldCheck, Upload, X } from 'lucide-react'

type Mode = 'demo' | 'live'
type Tab = 'debate' | 'graph' | 'assessment'
type Stage = 'submitted' | 'retrieval' | 'plaintiff' | 'defense' | 'rebuttal' | 'verification' | 'audit' | 'complete'
type ExtractedDocument = {
  document_id: string
  sanitized_filename: string
  file_type: 'pdf' | 'docx'
  file_size: number
  extraction_status: 'extracted' | 'ocr_required' | 'failed'
  page_count: number | null
  sections: Array<{ label: string; text: string }>
  extracted_text: string
  character_count: number
  warnings: string[]
  ocr_required: boolean
  content_status: 'unverified_extracted_text'
}
type EvidenceFile = {
  id: string
  name: string
  size: number
  type: string
  status: 'uploading' | 'extracted' | 'ocr_required' | 'failed'
  warning?: string
  document?: ExtractedDocument
}
type AssessmentResponse = {
  case_summary: string
  stated_facts: string
  evidence_sufficiency: 'sufficient' | 'limited' | 'insufficient'
  strengths: string[]
  weaknesses: string[]
  missing_evidence: string[]
  unsupported_claim_warnings: string[]
  disclaimer: string
  verified_court_case_references: Array<{ source_id: string; case_number: string; start_page: number | null; end_page: number | null; similarity_score: number | null }>
  plaintiff_arguments: { arguments: Array<{ claim: string; supporting_principles?: string[]; evidence_source_ids: string[]; evidence_support?: string[]; assumptions?: string[]; missing_evidence: string[]; limitations?: string[] }>; limitations: string[]; unsupported_claim_warnings?: string[] }
  defense_counterarguments: { counterarguments: Array<{ challenged_claim: string; counterargument: string; evidence_source_ids: string[]; factual_disputes?: string[]; possible_defenses?: string[]; missing_evidence: string[]; limitations?: string[] }>; limitations: string[]; unsupported_claim_warnings?: string[] }
  neutral_case_assessment: { assessment: string; strengths: string[]; weaknesses: string[]; missing_evidence: string[]; unsupported_claim_warnings: string[]; contradictory_claims?: string[]; verified_source_ids?: string[]; evidence_sufficiency: string }
  citation_audits: Record<string, { valid_source_ids: string[]; invalid_source_ids: string[]; invalid_case_numbers: string[] }>
  execution_errors: string[]
  uploaded_document_references?: Array<{ source_id: string; document_id: string; sanitized_filename: string; section_label: string; section_text: string; extraction_status: 'extracted' | 'ocr_required'; warning?: string | null }>
  document_context_warnings?: string[]
}

const c4ApiBase = process.env.NEXT_PUBLIC_C4_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
const c4DocumentEndpoint = `${c4ApiBase.replace(/\/$/, '')}/api/v1/c_argumentation/documents/extract`

const disputeTypes = [
  'Rental Agreement Dispute',
  'Property Ownership Dispute',
  'Property Purchase Dispute',
  'Building Ownership Dispute',
  'Property-Related Contract Dispute',
]

const stages: Array<[Stage, string]> = [
  ['submitted', 'Case submitted'],
  ['retrieval', 'Legal retrieval'],
  ['plaintiff', 'Plaintiff analysis'],
  ['defense', 'Defense analysis'],
  ['rebuttal', 'Argument rebuttal'],
  ['verification', 'Citation verification'],
  ['audit', 'Neutral audit'],
  ['complete', 'Assessment complete'],
]

const demoMessages = [
  { round: 1, agent: 'Plaintiff/User Agent', title: 'Payment history is disputed', text: 'The tenant states that rent was paid in cash and that the landlord has not produced a complete receipt trail.', source: 'Illustrative evidence reference' },
  { round: 1, agent: 'Defense Agent', title: 'Ledger records arrears', text: 'The landlord relies on eight consecutive months in the ledger and challenges the unsupported cash-payment account.', source: 'Illustrative evidence reference' },
  { round: 2, agent: 'Plaintiff/User Agent', title: 'Repair notice affects the dispute', text: 'The reported roof leak and repeated notices may be relevant, but the lease clause and messages require review.', source: 'Illustrative source · not verified' },
  { round: 2, agent: 'Defense Agent', title: 'Notice does not prove rent was lawfully withheld', text: 'Messages may show notice was received, but they do not by themselves establish that all rent could be withheld.', source: 'Illustrative source · not verified' },
  { round: 3, agent: 'Plaintiff/User Agent', title: 'Further evidence is required', text: 'Payment records, the lease, photographs, and authenticated messages should be reviewed before reaching a conclusion.', source: 'Evidence gap identified' },
  { round: 3, agent: 'Defense Agent', title: 'The record remains contested', text: 'The ledger and repair evidence require corroboration. The available facts do not establish a final legal position.', source: 'Evidence gap identified' },
]

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function C4ArgumentationEngine() {
  const [tab, setTab] = useState<Tab>('debate')
  const [mode, setMode] = useState<Mode>('demo')
  const [stage, setStage] = useState<Stage>('submitted')
  const [title, setTitle] = useState('Rental Payment Dispute Between Landlord and Tenant')
  const [disputeType, setDisputeType] = useState(disputeTypes[0])
  const [facts, setFacts] = useState('Mr. Perera, the landlord, claims that Ms. Fernando has not paid rent for eight months. Ms. Fernando claims that she paid in cash without receipts and reports that the roof has leaked since March despite repeated notices.')
  const [userPosition, setUserPosition] = useState('I am the tenant. I paid my rent in cash, but the landlord claims that I have not paid.')
  const [opposingPosition, setOpposingPosition] = useState('The landlord claims that eight months of rent remain unpaid.')
  const [evidence, setEvidence] = useState<EvidenceFile[]>([])
  const [running, setRunning] = useState(false)
  const [visibleMessages, setVisibleMessages] = useState(0)
  const [error, setError] = useState('')
  const [assessment, setAssessment] = useState<AssessmentResponse | null>(null)

  const completedStage = stages.findIndex(([value]) => value === stage)
  const visible = demoMessages.slice(0, visibleMessages)
  const validEvidence = evidence.filter(file => (file.status === 'extracted' || file.status === 'ocr_required') && file.document)
  const caseValid = title.trim().length >= 4 && facts.trim().length >= 40 && userPosition.trim().length >= 10

  const processStage = (next: Stage) => setStage(next)

  const runAnalysis = async () => {
    if (!caseValid) {
      setError('Add a case title, at least 40 characters of facts, and your position before starting.')
      return
    }
    setError('')
    setRunning(true)
    setVisibleMessages(0)
    setAssessment(null)
    processStage('retrieval')
    if (mode === 'live') {
      try {
        const response = await fetch(`${c4ApiBase.replace(/\/$/, '')}/api/v1/c_argumentation/assess`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ case_title: title, dispute_type: disputeType, case_facts: facts, user_position: userPosition, opposing_position: opposingPosition || null, documents: validEvidence.flatMap(file => file.document ? [{ ...file.document, sections: file.document.sections.map(section => ({ label: section.label, text: '' })) }] : []) }),
        })
        if (!response.ok) throw new Error(`C4 backend returned HTTP ${response.status}`)
        const data = await response.json() as AssessmentResponse
        setAssessment(data)
        setStage('complete')
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Unable to connect to the C4 backend.')
        setStage('submitted')
      } finally {
        setRunning(false)
      }
      return
    }
    processStage('plaintiff')
    demoMessages.forEach((_, index) => {
      window.setTimeout(() => {
        setVisibleMessages(index + 1)
        processStage(index < 2 ? 'plaintiff' : index < 4 ? 'defense' : index < 5 ? 'rebuttal' : 'audit')
        if (index === demoMessages.length - 1) {
          setRunning(false)
          processStage('complete')
        }
      }, 500 + index * 450)
    })
  }

  const uploadDocument = async (file: File, id: string) => {
    const formData = new FormData()
    formData.append('document', file)
    try {
      const response = await fetch(c4DocumentEndpoint, { method: 'POST', body: formData })
      const data = await response.json().catch(() => null) as ExtractedDocument & { detail?: string } | null
      if (!response.ok) throw new Error(data?.detail || `Document extraction failed (HTTP ${response.status})`)
      if (!data || !data.document_id || (data.extraction_status !== 'extracted' && data.extraction_status !== 'ocr_required')) throw new Error('Document extraction returned an invalid result.')
      const status = data?.extraction_status === 'ocr_required' ? 'ocr_required' : 'extracted'
      setEvidence(current => current.map(item => item.id === id ? { ...item, status, warning: data?.warnings?.join(' '), document: data ?? undefined } : item))
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : 'Document extraction failed.'
      setEvidence(current => current.map(item => item.id === id ? { ...item, status: 'failed', warning: message } : item))
    }
  }

  const addFiles = (files: FileList | File[]) => {
    const allowedExtensions = ['.pdf', '.docx']
    const next = Array.from(files).map(file => ({
      id: `${file.name}-${file.lastModified}-${file.size}`,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading' as const,
    }))
    setEvidence(current => [...current.filter(file => !next.some(item => item.id === file.id)), ...next])
    next.forEach((item, index) => {
      const file = Array.from(files)[index]
      if (!allowedExtensions.some(extension => file.name.toLowerCase().endsWith(extension)) || file.size === 0 || file.size > 10 * 1024 * 1024) {
        setEvidence(current => current.map(existing => existing.id === item.id ? { ...existing, status: 'failed', warning: 'Only non-empty PDF or DOCX files up to 10 MB are accepted.' } : existing))
        return
      }
      void uploadDocument(file, item.id)
    })
  }

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) addFiles(event.target.files)
    event.target.value = ''
  }

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    addFiles(event.dataTransfer.files)
  }

  const workflowLabel = useMemo(() => stages[Math.max(0, completedStage)]?.[1] ?? 'Case submitted', [completedStage])

  return (
    <div className="c4x-engine">
      <header className="c4x-header">
        <div>
          <h1>Multi-Agent Legal Argumentation Engine</h1>
          <p>Three-agent deliberation for Sri Lankan property-related civil disputes.</p>
        </div>
        <div className="c4x-mode-switch" aria-label="Analysis mode">
          <span>Mode</span>
          <button className={mode === 'demo' ? 'active' : ''} onClick={() => setMode('demo')}>Demo</button>
          <button className={mode === 'live' ? 'active' : ''} onClick={() => setMode('live')}>Live</button>
        </div>
      </header>

      <div className="c4x-workflow" aria-label="Analysis workflow">
        {stages.map(([value, label], index) => <div className={index <= completedStage ? 'done' : ''} key={value}><span>{index < completedStage ? <Check size={12} /> : index + 1}</span><small>{label}</small></div>)}
      </div>

      <div className="c4x-layout">
        <section className="c4x-card c4x-input">
          <div className="c4x-card-heading"><div><span className="c4x-kicker">CASE INPUT</span><h2>Start a multi-agent analysis</h2></div><Scale size={21} /></div>
          <label>Case Title<input value={title} onChange={event => setTitle(event.target.value)} placeholder="Rental Payment Dispute Between Landlord and Tenant" /></label>
          <label>Dispute Type<select value={disputeType} onChange={event => setDisputeType(event.target.value)}>{disputeTypes.map(item => <option key={item}>{item}</option>)}</select></label>
          <label>Case Facts<textarea value={facts} onChange={event => setFacts(event.target.value)} rows={6} placeholder="Describe what happened chronologically, who was involved, and what evidence is available." /><small>{facts.length} characters · Include dates, people, claims, and available documents.</small></label>
          <label>Your Position<textarea value={userPosition} onChange={event => setUserPosition(event.target.value)} rows={3} placeholder="What is your position in this dispute?" /></label>
          <label>Opposing Party's Position <em>optional</em><textarea value={opposingPosition} onChange={event => setOpposingPosition(event.target.value)} rows={3} placeholder="What does the opposing party claim?" /></label>
          <label className="c4x-upload" onDragOver={event => event.preventDefault()} onDrop={onDrop}><Upload size={18} /><span>Drop supporting evidence here or <b>browse files</b></span><small>PDF, DOCX · maximum 10 MB per file</small><input type="file" multiple accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={onFileChange} /></label>
          {evidence.length > 0 && <div className="c4x-files">{evidence.map(file => <div className={file.status === 'failed' ? 'invalid' : ''} key={file.id}><FileText size={15} /><span>{file.name}<small>{formatBytes(file.size)} · {file.status === 'uploading' ? 'Uploading and extracting…' : file.status === 'extracted' ? 'Text extracted' : file.status === 'ocr_required' ? 'Text extracted; OCR required' : file.warning || 'Extraction failed'}</small>{file.warning && file.status !== 'failed' && <small>{file.warning}</small>}</span><button aria-label={`Remove ${file.name}`} onClick={() => setEvidence(current => current.filter(item => item.id !== file.id))}><X size={14} /></button></div>)}</div>}
          {validEvidence.length > 0 && <p className="c4x-upload-note">{validEvidence.length} extracted document{validEvidence.length === 1 ? '' : 's'} will be included as unverified D-source evidence.</p>}
          <div className="c4x-actions"><button className="c4x-primary" onClick={runAnalysis} disabled={running || !caseValid}><Play size={15} /> {running ? 'Analysis in progress' : 'Start Multi-Agent Analysis'}</button>{mode === 'demo' && <button className="c4x-secondary" onClick={() => { setVisibleMessages(demoMessages.length); setStage('complete'); setRunning(false) }}>Skip Ahead</button>}</div>
          {error && <p className="c4x-error" role="alert"><Info size={15} />{error}</p>}
          <p className="c4x-disclaimer"><ShieldCheck size={14} /> Informational research interface only. It does not provide legal advice or predict a court result.</p>
        </section>

        <section className="c4x-card c4x-results">
          <div className="c4x-tabs" role="tablist" aria-label="Analysis results">
            {([['debate', 'Debate', FileText], ['graph', 'Argument Graph', Network], ['assessment', 'Neutral Case Assessment', ShieldCheck]] as const).map(([value, label, Icon]) => <button role="tab" aria-selected={tab === value} className={tab === value ? 'active' : ''} key={value} onClick={() => setTab(value)}><Icon size={15} />{label}</button>)}
          </div>
          <div className="c4x-result-body">
            <div className="c4x-status"><span className={running ? 'pulse' : 'dot'} />{running ? `Processing · ${workflowLabel}` : stage === 'complete' ? (mode === 'live' ? 'Assessment complete · Live C4 data' : 'Assessment complete · Demo data') : 'Ready for analysis'}</div>
            {tab === 'debate' && <DebateView messages={visible} assessment={assessment} live={mode === 'live'} />}
            {tab === 'graph' && <GraphView hasData={visible.length > 0} assessment={assessment} live={mode === 'live'} />}
            {tab === 'assessment' && <AssessmentView complete={stage === 'complete'} title={title} disputeType={disputeType} evidenceCount={validEvidence.length} assessment={assessment} live={mode === 'live'} />}
          </div>
          <footer className="c4x-footer"><span>{mode === 'demo' ? 'Demo mode · illustrative data' : 'Live mode · backend connection required'}</span><button onClick={() => { setVisibleMessages(0); setStage('submitted'); setRunning(false) }}>Reset</button></footer>
        </section>
      </div>
    </div>
  )
}

function DebateView({ messages, assessment, live }: { messages: typeof demoMessages; assessment: AssessmentResponse | null; live: boolean }) {
  if (live) {
    if (!assessment) return <div className="c4x-empty"><FileText size={30} /><h2>Live debate pending</h2><p>Run a live assessment to display the Plaintiff, Defense, and Neutral Auditor outputs.</p></div>
    return <LiveDebateView assessment={assessment} />
  }
  return <div className="c4x-debate"><div className="c4x-retrieval"><Check size={15} /><div><b>Legal retrieval stage</b><small>Sources are illustrative in demo mode and are not verified legal support.</small></div><span>{messages.length > 0 ? 'Sources retrieved' : 'Pending'}</span></div>{[1, 2, 3].map(round => <section key={round}><div className="c4x-round">ROUND {round}<span /></div>{messages.filter(item => item.round === round).map(item => <article className={`c4x-argument ${item.agent.startsWith('Defense') ? 'defense' : 'plaintiff'}`} key={`${item.round}-${item.agent}`}><header><b>{item.agent}</b><small>Round {item.round}</small></header><h3>{item.title}</h3><p>{item.text}</p><footer><span>{item.source}</span><span>Citation status: illustrative</span></footer></article>)}</section>)}</div>
}

function LiveDebateView({ assessment }: { assessment: AssessmentResponse }) {
  const list = (items: string[] | undefined, empty = 'None reported.') => items?.length ? <ul>{items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : <p>{empty}</p>
  return <div className="c4x-debate" data-testid="live-debate">
    <div className="c4x-retrieval"><Check size={15} /><div><b>Live C4 evidence bundle</b><small>Generated agent outputs are research analysis, not statements from lawyers or court proceedings.</small></div><span>{assessment.evidence_sufficiency}</span></div>
    <section><div className="c4x-round">PLAINTIFF AGENT<span /></div>{assessment.plaintiff_arguments.arguments.length ? assessment.plaintiff_arguments.arguments.map((argument, index) => <article className="c4x-argument plaintiff" key={`${argument.claim}-${index}`}><header><b>Plaintiff Agent</b><small>Structured output</small></header><h3>{argument.claim}</h3>{argument.evidence_support?.length ? <p>{argument.evidence_support.join(' ')}</p> : null}<footer><span>Sources: {argument.evidence_source_ids.join(', ') || 'None cited'}</span><span>Unverified document content remains unverified</span></footer>{argument.missing_evidence.length > 0 && <><b>Missing evidence</b>{list(argument.missing_evidence)}</>}</article>) : <p>No structured Plaintiff arguments were returned.</p>}{list(assessment.plaintiff_arguments.unsupported_claim_warnings, 'No Plaintiff warnings reported.')}</section>
    <section><div className="c4x-round">DEFENSE AGENT<span /></div>{assessment.defense_counterarguments.counterarguments.length ? assessment.defense_counterarguments.counterarguments.map((argument, index) => <article className="c4x-argument defense" key={`${argument.challenged_claim}-${index}`}><header><b>Defense Agent</b><small>Structured output</small></header><h3>{argument.counterargument}</h3><p>Challenges: {argument.challenged_claim}</p><footer><span>Sources: {argument.evidence_source_ids.join(', ') || 'None cited'}</span><span>Counterargument from model output</span></footer>{argument.missing_evidence.length > 0 && <><b>Missing evidence</b>{list(argument.missing_evidence)}</>}</article>) : <p>No structured Defense counterarguments were returned.</p>}{list(assessment.defense_counterarguments.unsupported_claim_warnings, 'No Defense warnings reported.')}</section>
    <section><div className="c4x-round">NEUTRAL AUDITOR<span /></div><article className="c4x-argument"><header><b>Neutral Auditor</b><small>{assessment.neutral_case_assessment.evidence_sufficiency}</small></header><h3>Auditor findings</h3><p>{assessment.neutral_case_assessment.assessment || 'No neutral assessment was returned.'}</p><footer><span>Verified source IDs: {assessment.neutral_case_assessment.verified_source_ids?.join(', ') || 'None'}</span><span>Neutral evidence review</span></footer></article><b>Strengths</b>{list(assessment.neutral_case_assessment.strengths)}<b>Weaknesses</b>{list(assessment.neutral_case_assessment.weaknesses)}{assessment.neutral_case_assessment.contradictory_claims?.length ? <><b>Contradictory claims</b>{list(assessment.neutral_case_assessment.contradictory_claims)}</> : null}{assessment.neutral_case_assessment.unsupported_claim_warnings.length > 0 && <><b>Unsupported warnings</b>{list(assessment.neutral_case_assessment.unsupported_claim_warnings)}</>}</section>
    <section><div className="c4x-round">REFERENCES AND EVIDENCE GAPS<span /></div><h3>Court judgment references</h3>{assessment.verified_court_case_references.length ? <ul>{assessment.verified_court_case_references.map(source => <li key={source.source_id}><b>{source.source_id}</b> · {source.case_number}, pages {source.start_page ?? '?'}–{source.end_page ?? '?'}</li>)}</ul> : <p>No court judgment references were returned.</p>}<h3>Uploaded document references</h3>{assessment.uploaded_document_references?.length ? <ul>{assessment.uploaded_document_references.map(source => <li key={source.source_id}><b>{source.source_id}</b> · {source.sanitized_filename} · {source.section_label} · <em>unverified extracted text</em></li>)}</ul> : <p>No uploaded document references were returned.</p>}<h3>Missing evidence</h3>{list(assessment.missing_evidence)}{assessment.document_context_warnings?.length ? <><h3>Document context warnings</h3>{list(assessment.document_context_warnings)}</> : null}{assessment.unsupported_claim_warnings.length > 0 && <><h3>Unsupported argument warnings</h3>{list(assessment.unsupported_claim_warnings)}</>}</section>
  </div>
}

type GraphNode = { id: string; label: string; detail: string; kind: 'claim' | 'plaintiff' | 'defense' | 'auditor' | 'court' | 'document' | 'missing' }
type GraphEdge = { from: string; to: string; label: string }

function buildLiveGraph(assessment: AssessmentResponse): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [{ id: 'user-claim', label: 'User legal claim', detail: assessment.case_summary, kind: 'claim' }]
  const edges: GraphEdge[] = []
  const sourceIds = new Set<string>()
  assessment.verified_court_case_references.forEach(source => { sourceIds.add(source.source_id); nodes.push({ id: source.source_id, label: source.source_id, detail: `${source.case_number} · pages ${source.start_page ?? '?'}–${source.end_page ?? '?'}`, kind: 'court' }) })
  assessment.uploaded_document_references?.forEach(source => { sourceIds.add(source.source_id); nodes.push({ id: source.source_id, label: source.source_id, detail: `${source.sanitized_filename} · ${source.section_label} · unverified`, kind: 'document' }) })
  assessment.plaintiff_arguments.arguments.forEach((argument, index) => {
    const id = `plaintiff-${index}`
    nodes.push({ id, label: 'Plaintiff argument', detail: argument.claim, kind: 'plaintiff' })
    edges.push({
  from: id,
  to: 'user-claim',
  label: 'develops'
})
    argument.evidence_source_ids.forEach(sourceId => { if (sourceIds.has(sourceId)) edges.push({ from: id, to: sourceId, label: 'cites' }) })
  })
  assessment.defense_counterarguments.counterarguments.forEach((argument, index) => {
    const id = `defense-${index}`
    nodes.push({ id, label: 'Defense counterargument', detail: argument.counterargument, kind: 'defense' })

    // Connect only when the challenged claim exactly matches a Plaintiff claim.
    // A paraphrased claim is intentionally left unmatched rather than linked incorrectly.
    const challengedClaim = argument.challenged_claim.trim().toLowerCase()

    // Temporary diagnostic: inspect the claims returned by Qwen3.
    console.log('C4 Plaintiff claims:',
      assessment.plaintiff_arguments.arguments.map(item => item.claim)
    )
    console.log('C4 Defense challenged claim:', argument.challenged_claim)
    const plaintiffIndex = assessment.plaintiff_arguments.arguments.findIndex(
      plaintiff => plaintiff.claim.trim().toLowerCase() === challengedClaim
    )
    if (challengedClaim && plaintiffIndex !== -1) {
      edges.push({ from: id, to: `plaintiff-${plaintiffIndex}`, label: 'challenges' })
    }

    argument.evidence_source_ids.forEach(sourceId => {
      if (sourceIds.has(sourceId)) edges.push({ from: id, to: sourceId, label: 'cites' })
    })
  })
  const auditorId = 'auditor-findings'
  nodes.push({ id: auditorId, label: 'Neutral Auditor findings', detail: assessment.neutral_case_assessment.assessment, kind: 'auditor' })
  assessment.plaintiff_arguments.arguments.forEach((_, index) => {
  edges.push({
    from: auditorId,
    to: `plaintiff-${index}`,
    label: 'reviews'
  })
})

assessment.defense_counterarguments.counterarguments.forEach((_, index) => {
  edges.push({
    from: auditorId,
    to: `defense-${index}`,
    label: 'reviews'
  })
})
  assessment.neutral_case_assessment.verified_source_ids?.forEach(sourceId => { if (sourceIds.has(sourceId)) edges.push({ from: auditorId, to: sourceId, label: 'reviews' }) })
  assessment.missing_evidence.forEach((item, index) => nodes.push({ id: `missing-${index}`, label: 'Missing evidence', detail: item, kind: 'missing' }))
  return { nodes, edges }
}

function GraphView({ hasData, assessment, live }: { hasData: boolean; assessment: AssessmentResponse | null; live: boolean }) {
  const [selected, setSelected] = useState('Issue')
  if (live) {
    if (!assessment) return <div className="c4x-empty"><Network size={30} /><h2>Live argument graph pending</h2><p>Run a live assessment to build a graph from its structured outputs and explicit source references.</p></div>
    return <LiveGraphView assessment={assessment} selected={selected} setSelected={setSelected} />
  }
  if (!hasData) return <div className="c4x-empty"><Network size={30} /><h2>Argument graph is not ready</h2><p>Start an analysis to generate a graph from structured argument data.</p></div>
  const nodes = [['Issue', 'Payment dispute', 320, 45], ['Claim', 'User claim', 120, 145], ['Defense', 'Defense challenge', 520, 145], ['Evidence', 'Evidence gap', 320, 245]] as const
  return <div className="c4x-graph"><div className="c4x-graph-toolbar"><span>Demo graph · select a node for details</span><button onClick={() => setSelected('Issue')}>Reset view</button></div><svg viewBox="0 0 640 300" role="img" aria-label="Interactive argument graph">{nodes.slice(1).map(node => <line key={node[0]} x1={nodes[0][2]} y1={nodes[0][3]} x2={node[2]} y2={node[3]} className="c4x-edge" />)}{nodes.map(node => <g key={node[0]} onClick={() => setSelected(node[0])} className={selected === node[0] ? 'selected' : ''}><rect x={node[2] - 70} y={node[3] - 25} width="140" height="50" rx="10" /><text x={node[2]} y={node[3] - 3}>{node[0]}</text><text x={node[2]} y={node[3] + 13}>{node[1]}</text></g>)}</svg><div className="c4x-node-detail"><b>{selected}</b><p>Structured relationship details will be populated from the analysis response.</p></div></div>
}

function LiveGraphView({ assessment, selected, setSelected }: { assessment: AssessmentResponse; selected: string; setSelected: (value: string) => void }) {
  const graph = buildLiveGraph(assessment)
  const positions = graph.nodes.map((node, index) => ({ ...node, x: 90 + (index % 3) * 230, y: 45 + Math.floor(index / 3) * 92 }))
  const positionById = new Map(positions.map(node => [node.id, node]))
  return <div className="c4x-graph" data-testid="live-graph"><div className="c4x-graph-toolbar"><span>Live graph · cited sources and agent relationships</span><button onClick={() => setSelected('user-claim')}>Reset view</button></div><svg viewBox={`0 0 640 ${Math.max(300, Math.ceil(positions.length / 3) * 92 + 35)}`} role="img" aria-label="Live argument graph">{graph.edges.map(edge => { const from = positionById.get(edge.from); const to = positionById.get(edge.to); return from && to ? <line data-testid="graph-edge" key={`${edge.from}-${edge.to}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} className="c4x-edge" /> : null })}{positions.map(node => <g data-testid={`graph-node-${node.id}`} key={node.id} onClick={() => setSelected(node.id)} className={`c4x-graph-node ${node.kind} ${selected === node.id ? 'selected' : ''}`}><title>{node.detail}</title><rect x={node.x - 88} y={node.y - 25} width="176" height="50" rx="10" /><text x={node.x} y={node.y - 3}>{node.label}</text><text x={node.x} y={node.y + 13}>{node.kind === 'document' ? 'unverified' : node.detail.slice(0, 24)}</text></g>)}</svg><div className="c4x-node-detail"><b>{positionById.get(selected)?.label ?? 'Select a node'}</b><p>{positionById.get(selected)?.detail ?? 'Select a graph node to inspect its structured evidence.'}</p></div></div>
}

function AssessmentView({ complete, title, disputeType, evidenceCount, assessment, live }: { complete: boolean; title: string; disputeType: string; evidenceCount: number; assessment: AssessmentResponse | null; live: boolean }) {
  if (!complete) return <div className="c4x-empty"><ShieldCheck size={30} /><h2>Neutral assessment pending</h2><p>The report appears after the debate, verification, and audit stages are complete.</p></div>
  if (live && assessment) return <LiveAssessmentView assessment={assessment} />
  if (live) return <div className="c4x-empty"><ShieldCheck size={30} /><h2>Neutral assessment pending</h2><p>Complete a live assessment to display the backend response.</p></div>
  return <div className="c4x-assessment"><div className="c4x-assessment-banner"><ShieldCheck size={19} /><div><b>Mixed or uncertain</b><small>Demo assessment · not a prediction</small></div></div><dl><div><dt>Case title</dt><dd>{title}</dd></div><div><dt>Dispute type</dt><dd>{disputeType}</dd></div><div><dt>Assessment status</dt><dd>Completed for review</dd></div></dl><section><h3>Neutral Auditor Conclusion</h3><p>The available record contains arguable positions on payment and repairs. The evidence should be authenticated and reviewed by a qualified professional before any real-world decision.</p></section><section><h3>Evidence Gaps</h3><p>{evidenceCount ? `${evidenceCount} uploaded evidence file(s) are available for review.` : 'Payment records, lease terms, and authenticated messages remain to be supplied.'}</p></section><section><h3>Legal Source Verification</h3><p>No legal source is marked verified in demo mode. Real verification must come from the backend.</p></section><div className="c4x-report-actions"><button onClick={() => window.print()}>Print Report</button><button disabled>Download PDF</button><button disabled>Save Assessment</button></div><p className="c4x-legal-disclaimer">This AI-generated case assessment is intended for informational and educational purposes only. It is not legal advice and does not predict the outcome of a court proceeding. Consult a qualified Sri Lankan legal professional for advice about your situation.</p></div>
}

function LiveAssessmentView({ assessment }: { assessment: AssessmentResponse }) {
  const list = (items: string[]) => items.length ? <ul>{items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : <p>None reported.</p>
  return <div className="c4x-assessment">
    <div className="c4x-assessment-banner"><ShieldCheck size={19} /><div><b>Live C4 assessment: {assessment.evidence_sufficiency}</b><small>Retrieved evidence and local Qwen3 analysis</small></div></div>
    <section><h3>Neutral Auditor Conclusion</h3><p>{assessment.neutral_case_assessment.assessment || 'No neutral assessment was returned.'}</p></section>
    <section><h3>Plaintiff Arguments</h3>{assessment.plaintiff_arguments.arguments.length ? assessment.plaintiff_arguments.arguments.map((argument, index) => <article key={`${argument.claim}-${index}`}><p><b>{argument.claim}</b></p><small>Sources: {argument.evidence_source_ids.join(', ') || 'None verified'}</small>{list(argument.missing_evidence)}</article>) : <p>No structured Plaintiff arguments were returned.</p>}</section>
    <section><h3>Defense Counterarguments</h3>{assessment.defense_counterarguments.counterarguments.length ? assessment.defense_counterarguments.counterarguments.map((argument, index) => <article key={`${argument.challenged_claim}-${index}`}><p><b>{argument.counterargument}</b></p><small>Challenges: {argument.challenged_claim} · Sources: {argument.evidence_source_ids.join(', ') || 'None verified'}</small>{list(argument.missing_evidence)}</article>) : <p>No structured Defense arguments were returned.</p>}</section>
    <section><h3>Strengths and Weaknesses</h3><b>Strengths</b>{list(assessment.strengths)}<b>Weaknesses</b>{list(assessment.weaknesses)}</section>
    <section><h3>Missing Evidence</h3>{list(assessment.missing_evidence)}</section>
    <section><h3>Verified Court References</h3>{assessment.verified_court_case_references.length ? <ul>{assessment.verified_court_case_references.map(source => <li key={source.source_id}>{source.source_id}: {source.case_number}, pages {source.start_page ?? '?'}–{source.end_page ?? '?'}{source.similarity_score == null ? '' : ` · similarity ${source.similarity_score.toFixed(3)}`}</li>)}</ul> : <p>No court references were retrieved.</p>}</section>
    {assessment.unsupported_claim_warnings.length > 0 && <section><h3>Unsupported-Claim Warnings</h3>{list(assessment.unsupported_claim_warnings)}</section>}
    {assessment.uploaded_document_references && assessment.uploaded_document_references.length > 0 && <section><h3>Uploaded Document Evidence</h3><ul>{assessment.uploaded_document_references.map(source => <li key={source.source_id}>{source.source_id}: {source.sanitized_filename}, {source.section_label}{source.warning ? ` · ${source.warning}` : ''}</li>)}</ul></section>}
    {assessment.document_context_warnings && assessment.document_context_warnings.length > 0 && <section><h3>Document Context Warnings</h3>{list(assessment.document_context_warnings)}</section>}
    {assessment.execution_errors.length > 0 && <section><h3>Execution Warnings</h3>{list(assessment.execution_errors)}</section>}
    <p className="c4x-legal-disclaimer">{assessment.disclaimer}</p>
  </div>
}

export default C4ArgumentationEngine
