'use client'

import { ChangeEvent, DragEvent, useMemo, useState } from 'react'
import { Check, FileText, Info, Network, Play, Scale, ShieldCheck, Upload, X } from 'lucide-react'

type Mode = 'demo' | 'live'
type Tab = 'debate' | 'graph' | 'assessment'
type Stage = 'submitted' | 'retrieval' | 'plaintiff' | 'defense' | 'rebuttal' | 'verification' | 'audit' | 'complete'
type EvidenceFile = { id: string; name: string; size: number; type: string; status: 'ready' | 'invalid' }

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

  const completedStage = stages.findIndex(([value]) => value === stage)
  const visible = demoMessages.slice(0, visibleMessages)
  const validEvidence = evidence.filter(file => file.status === 'ready')
  const caseValid = title.trim().length >= 4 && facts.trim().length >= 40 && userPosition.trim().length >= 10

  const processStage = (next: Stage) => setStage(next)

  const runDemo = () => {
    if (!caseValid) {
      setError('Add a case title, at least 40 characters of facts, and your position before starting.')
      return
    }
    setError('')
    setRunning(true)
    setVisibleMessages(0)
    processStage('retrieval')
    if (mode === 'live') {
      setError('Live API integration is ready for connection, but no C4 backend endpoint is configured yet.')
      setRunning(false)
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

  const addFiles = (files: FileList | File[]) => {
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png']
    const next = Array.from(files).map(file => ({
      id: `${file.name}-${file.lastModified}`,
      name: file.name,
      size: file.size,
      type: file.type,
      status: allowed.includes(file.type) && file.size <= 10 * 1024 * 1024 ? 'ready' as const : 'invalid' as const,
    }))
    setEvidence(current => [...current.filter(file => !next.some(item => item.id === file.id)), ...next])
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
          <label className="c4x-upload" onDragOver={event => event.preventDefault()} onDrop={onDrop}><Upload size={18} /><span>Drop supporting evidence here or <b>browse files</b></span><small>PDF, DOCX, JPG, PNG · maximum 10 MB per file</small><input type="file" multiple accept=".pdf,.docx,.jpg,.jpeg,.png" onChange={onFileChange} /></label>
          {evidence.length > 0 && <div className="c4x-files">{evidence.map(file => <div className={file.status === 'invalid' ? 'invalid' : ''} key={file.id}><FileText size={15} /><span>{file.name}<small>{formatBytes(file.size)} · {file.status === 'ready' ? 'Ready for analysis' : 'Unsupported file or size'}</small></span><button aria-label={`Remove ${file.name}`} onClick={() => setEvidence(current => current.filter(item => item.id !== file.id))}><X size={14} /></button></div>)}</div>}
          <div className="c4x-actions"><button className="c4x-primary" onClick={runDemo} disabled={running || !caseValid}><Play size={15} /> {running ? 'Analysis in progress' : 'Start Multi-Agent Analysis'}</button>{mode === 'demo' && <button className="c4x-secondary" onClick={() => { setVisibleMessages(demoMessages.length); setStage('complete'); setRunning(false) }}>Skip Ahead</button>}</div>
          {error && <p className="c4x-error" role="alert"><Info size={15} />{error}</p>}
          <p className="c4x-disclaimer"><ShieldCheck size={14} /> Informational research interface only. It does not provide legal advice or predict a court result.</p>
        </section>

        <section className="c4x-card c4x-results">
          <div className="c4x-tabs" role="tablist" aria-label="Analysis results">
            {([['debate', 'Debate', FileText], ['graph', 'Argument Graph', Network], ['assessment', 'Neutral Case Assessment', ShieldCheck]] as const).map(([value, label, Icon]) => <button role="tab" aria-selected={tab === value} className={tab === value ? 'active' : ''} key={value} onClick={() => setTab(value)}><Icon size={15} />{label}</button>)}
          </div>
          <div className="c4x-result-body">
            <div className="c4x-status"><span className={running ? 'pulse' : 'dot'} />{running ? `Processing · ${workflowLabel}` : stage === 'complete' ? 'Assessment complete · Demo data' : 'Ready for analysis'}</div>
            {tab === 'debate' && <DebateView messages={visible} />}
            {tab === 'graph' && <GraphView hasData={visible.length > 0} />}
            {tab === 'assessment' && <AssessmentView complete={stage === 'complete'} title={title} disputeType={disputeType} evidenceCount={validEvidence.length} />}
          </div>
          <footer className="c4x-footer"><span>{mode === 'demo' ? 'Demo mode · illustrative data' : 'Live mode · backend connection required'}</span><button onClick={() => { setVisibleMessages(0); setStage('submitted'); setRunning(false) }}>Reset</button></footer>
        </section>
      </div>
    </div>
  )
}

function DebateView({ messages }: { messages: typeof demoMessages }) {
  return <div className="c4x-debate"><div className="c4x-retrieval"><Check size={15} /><div><b>Legal retrieval stage</b><small>Sources are illustrative in demo mode and are not verified legal support.</small></div><span>{messages.length > 0 ? 'Sources retrieved' : 'Pending'}</span></div>{[1, 2, 3].map(round => <section key={round}><div className="c4x-round">ROUND {round}<span /></div>{messages.filter(item => item.round === round).map(item => <article className={`c4x-argument ${item.agent.startsWith('Defense') ? 'defense' : 'plaintiff'}`} key={`${item.round}-${item.agent}`}><header><b>{item.agent}</b><small>Round {item.round}</small></header><h3>{item.title}</h3><p>{item.text}</p><footer><span>{item.source}</span><span>Citation status: illustrative</span></footer></article>)}</section>)}</div>
}

function GraphView({ hasData }: { hasData: boolean }) {
  const [selected, setSelected] = useState('Issue')
  if (!hasData) return <div className="c4x-empty"><Network size={30} /><h2>Argument graph is not ready</h2><p>Start an analysis to generate a graph from structured argument data.</p></div>
  const nodes = [['Issue', 'Payment dispute', 320, 45], ['Claim', 'User claim', 120, 145], ['Defense', 'Defense challenge', 520, 145], ['Evidence', 'Evidence gap', 320, 245]] as const
  return <div className="c4x-graph"><div className="c4x-graph-toolbar"><span>Demo graph · select a node for details</span><button onClick={() => setSelected('Issue')}>Reset view</button></div><svg viewBox="0 0 640 300" role="img" aria-label="Interactive argument graph">{nodes.slice(1).map(node => <line key={node[0]} x1={nodes[0][2]} y1={nodes[0][3]} x2={node[2]} y2={node[3]} className="c4x-edge" />)}{nodes.map(node => <g key={node[0]} onClick={() => setSelected(node[0])} className={selected === node[0] ? 'selected' : ''}><rect x={node[2] - 70} y={node[3] - 25} width="140" height="50" rx="10" /><text x={node[2]} y={node[3] - 3}>{node[0]}</text><text x={node[2]} y={node[3] + 13}>{node[1]}</text></g>)}</svg><div className="c4x-node-detail"><b>{selected}</b><p>Structured relationship details will be populated from the analysis response.</p></div></div>
}

function AssessmentView({ complete, title, disputeType, evidenceCount }: { complete: boolean; title: string; disputeType: string; evidenceCount: number }) {
  if (!complete) return <div className="c4x-empty"><ShieldCheck size={30} /><h2>Neutral assessment pending</h2><p>The report appears after the debate, verification, and audit stages are complete.</p></div>
  return <div className="c4x-assessment"><div className="c4x-assessment-banner"><ShieldCheck size={19} /><div><b>Mixed or uncertain</b><small>Demo assessment · not a prediction</small></div></div><dl><div><dt>Case title</dt><dd>{title}</dd></div><div><dt>Dispute type</dt><dd>{disputeType}</dd></div><div><dt>Assessment status</dt><dd>Completed for review</dd></div></dl><section><h3>Neutral Auditor Conclusion</h3><p>The available record contains arguable positions on payment and repairs. The evidence should be authenticated and reviewed by a qualified professional before any real-world decision.</p></section><section><h3>Evidence Gaps</h3><p>{evidenceCount ? `${evidenceCount} uploaded evidence file(s) are available for review.` : 'Payment records, lease terms, and authenticated messages remain to be supplied.'}</p></section><section><h3>Legal Source Verification</h3><p>No legal source is marked verified in demo mode. Real verification must come from the backend.</p></section><div className="c4x-report-actions"><button onClick={() => window.print()}>Print Report</button><button disabled>Download PDF</button><button disabled>Save Assessment</button></div><p className="c4x-legal-disclaimer">This AI-generated case assessment is intended for informational and educational purposes only. It is not legal advice and does not predict the outcome of a court proceeding. Consult a qualified Sri Lankan legal professional for advice about your situation.</p></div>
}

export default C4ArgumentationEngine
