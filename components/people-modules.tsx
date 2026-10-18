'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  Filter,
  Info,
  Plus,
  Quote,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
  Zap,
} from 'lucide-react'
import { Badge, caseData, FormFields, MiniChart, SectionTitle, Stat } from './shared-ui'

export function DocumentAnalysisScreen() {
  return (
    <>
      <SectionTitle
        eyebrow="DOCUMENT RESEARCH MODULE"
        title="Legal Document Analysis"
        description="Analyze civil legal documents for key information, contractual risks, rights restrictions, and missing protections."
        action={
          <Link className="button primary" href="/legal-document-analysis/new">
            <Plus size={16} /> Analyze document
          </Link>
        }
      />
      <div className="stats-grid four">
        <Stat label="Documents analyzed" value="32" detail="Across workspace" icon={FileText} />
        <Stat label="Clauses reviewed" value="684" detail="Across 32 documents" icon={Activity} tone="gold" />
        <Stat label="Potential risks" value="57" detail="Sample prototype data" icon={AlertTriangle} tone="blue" />
        <Stat label="This month" value="12" detail="Recent activity" icon={Zap} tone="rose" />
      </div>
      <div className="dashboard-grid">
        <section className="panel table-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">SAMPLE PROTOTYPE DATA</p>
              <h2>Recent documents</h2>
            </div>
            <button type="button" className="icon-btn" aria-label="Filter">
              <Filter size={17} />
            </button>
          </div>
          {[
            ['Employment Agreement — Perera', 'Employment contract'],
            ['Residential Rental Agreement — Silva', 'Rental agreement'],
            ['Commercial Service Agreement — Fernando Holdings', 'Service agreement'],
            ['Loan Agreement — Jayasinghe', 'Loan agreement'],
          ].map(([title, kind], i) => (
            <button type="button" className="table-row" key={title}>
              <span>
                <b>{title}</b>
                <small>{kind}</small>
              </span>
              <Badge tone={i === 0 ? 'teal' : 'slate'}>{i < 2 ? 'Reviewed' : 'In progress'}</Badge>
              <ChevronRight size={15} />
            </button>
          ))}
        </section>
        <section className="panel chart-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">DISTRIBUTION</p>
              <h2>Documents by type</h2>
            </div>
          </div>
          <MiniChart type="pie" />
          <div className="legend">
            {caseData.map((x, i) => (
              <span key={x.name}>
                <i style={{ background: ['#0d7c78', '#d2a64a', '#28547d', '#6f8da1', '#aab8c4'][i] }} />
                {x.name}
                <b>{x.value}%</b>
              </span>
            ))}
          </div>
        </section>
      </div>
      <div className="panel callout">
        <div className="feature-icon teal">
          <Sparkles size={19} />
        </div>
        <div>
          <h3>Start with a guided analysis</h3>
          <p className="muted">Preserve your notes between steps and review what the simulated estimate is based on.</p>
        </div>
        <Link className="button secondary" href="/legal-document-analysis/new">
          Begin guided flow <ArrowRight size={15} />
        </Link>
      </div>
    </>
  )
}

export function DocumentWizard() {
  const [step, setStep] = useState(1)
  const steps = ['Upload document', 'Analysis context', 'Case context', 'Analysis options', 'Review']
  return (
    <div className="wizard">
      <div className="wizard-head">
        <div>
          <p className="eyebrow">GUIDED RESEARCH FLOW</p>
          <h1>Document Intelligence</h1>
        </div>
        <Link className="icon-btn" href="/legal-document-analysis" aria-label="Close wizard">
          <X size={19} />
        </Link>
      </div>
      <div className="stepper">
        {steps.map((x, i) => (
          <div className={step > i + 1 ? 'step done' : step === i + 1 ? 'step current' : 'step'} key={x}>
            <span>{step > i + 1 ? <Check size={14} /> : i + 1}</span>
            <small>{x}</small>
          </div>
        ))}
      </div>
      <div className="wizard-card">
        <p className="eyebrow">
          STEP {step} OF 5
        </p>
        <h2>{steps[step - 1]}</h2>
        {step === 1 && (
          <>
            <button type="button" className="dropzone">
              <Upload size={27} />
              <b>Drop your document here</b>
              <span>or choose a file from your device</span>
              <small>PDF · DOCX · JPG · PNG, up to 25 MB</small>
            </button>
            <label className="checkline">
              <input type="checkbox" defaultChecked /> I confirm that I have permission to process this document.
            </label>
          </>
        )}
        {step === 2 && <FormFields fields={['Document category', 'Your role', 'Document language', 'Analysis mode']} />}
        {step === 3 && (
          <FormFields fields={['Short description', 'Main concern', 'Specific clause of concern', 'Expected purpose']} />
        )}
        {step === 4 && (
          <div className="toggle-list">
            {[
              'Extract key information',
              'Identify rights and obligations',
              'Detect potentially risky clauses',
              'Contract fairness assessment',
              'Rights restriction detection',
              'Future dispute hotspot analysis',
              'Missing legal protection detection',
              'Legal consequence simulation',
              'Retrieve similar Sri Lankan precedents',
            ].map((x) => (
              <label key={x}>
                <span>
                  <b>{x}</b>
                  <small>Include in the simulated report</small>
                </span>
                <input type="checkbox" defaultChecked />
              </label>
            ))}
          </div>
        )}
        {step === 5 && (
          <div className="review">
            <div className="review-file">
              <FileText size={20} />
              <b>Employment_Agreement_Kasun_Perera.pdf</b>
              <Badge tone="teal">Ready to analyze</Badge>
            </div>
            {['Employment Contract', 'Employee: Kasun Perera', 'Language: English', 'Mode: Standard', '9 analyses selected'].map(
              (x) => (
                <div className="review-row" key={x}>
                  <Check size={15} />
                  <span>{x}</span>
                </div>
              ),
            )}
            <div className="acknowledge">
              <input type="checkbox" defaultChecked />
              <span>I understand that this is an AI-assisted research tool and not professional legal advice.</span>
            </div>
          </div>
        )}
        <div className="wizard-actions">
          {step === 1 ? (
            <Link className="button ghost" href="/legal-document-analysis">
              Cancel
            </Link>
          ) : (
            <button type="button" className="button ghost" onClick={() => setStep(step - 1)}>
              Back
            </button>
          )}
          <div>
            <button type="button" className="button secondary">
              Save draft
            </button>
            {step < 5 ? (
              <button type="button" className="button primary" onClick={() => setStep(step + 1)}>
                Continue <ArrowRight size={15} />
              </button>
            ) : (
              <Link className="button primary" href="/legal-document-analysis">
                <Sparkles size={15} /> Run simulated analysis
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function MisinformationScreen() {
  const [tab, setTab] = useState('Text Claim')
  const [category, setCategory] = useState('Employment')
  const [claim, setClaim] = useState('')
  const [checked, setChecked] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [done, setDone] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [scenario, setScenario] = useState('Mostly Supported')
  const [expanded, setExpanded] = useState(false)
  const outcomes: Record<string, string> = {
    Employment: 'Mostly Supported',
    Rental: 'Misleading',
    Property: 'Not Supported',
    Contract: 'Partially Supported',
    'Insufficient evidence': 'Insufficient Evidence',
  }
  const run = () => {
    setAnalyzing(true)
    setDone(false)
    setTimeout(() => {
      setAnalyzing(false)
      setDone(true)
      setScenario(outcomes[category] || 'Mostly Supported')
    }, 1600)
  }
  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
  }
  const sample = claim || "An employer can deduct any amount from an employee's salary without written consent."

  return (
    <>
      <SectionTitle
        eyebrow="SOURCE VERIFICATION"
        title="Legal Misinformation Analysis"
        description="Compare a legal claim, image, document, or reference with simulated Sri Lankan civil-law evidence."
        action={
          <button type="button" className="button secondary" onClick={() => setDone(false)}>
            Analysis history
          </button>
        }
      />
      <div className="notice">
        <ShieldCheck size={17} />
        <span>
          <b>Research prototype</b> — LexLanka compares submitted information with simulated sources. This is not legal
          advice or a definitive legal conclusion.
        </span>
      </div>
      <div className="mis-input panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">INPUT</p>
            <h2>Upload legal information</h2>
          </div>
          <Badge tone="gold">Client-side simulation</Badge>
        </div>
        <div className="mis-tabs">
          {['Text Claim', 'Upload Image', 'Upload Document', 'Reference / URL'].map((x) => (
            <button key={x} type="button" className={tab === x ? 'mis-tab active' : 'mis-tab'} onClick={() => setTab(x)}>
              {x}
            </button>
          ))}
        </div>
        {tab === 'Text Claim' && (
          <textarea
            className="mis-textarea"
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
            placeholder="An employer can deduct any amount from an employee's salary without written consent."
          />
        )}
        {tab === 'Reference / URL' && <input className="mis-url" placeholder="Paste a webpage or reference URL" />}
        {(tab === 'Upload Image' || tab === 'Upload Document') && (
          <label className="mis-dropzone">
            <Upload size={25} />
            <b>Drop your {tab === 'Upload Image' ? 'image' : 'document'} here, or browse files</b>
            <span>PNG, JPG, JPEG, WEBP, PDF · prototype limit 25 MB</span>
            <input
              type="file"
              accept={tab === 'Upload Image' ? 'image/png,image/jpeg,image/webp' : 'application/pdf,.docx'}
              onChange={pick}
            />
          </label>
        )}
        {file && (
          <div className="uploaded-file">
            <FileText size={25} />
            <span>
              <b>{file.name}</b>
              <small>{(file.size / 1024 / 1024).toFixed(1)} MB · Ready for analysis</small>
            </span>
            <button
              type="button"
              className="icon-btn"
              aria-label="Remove uploaded file"
              onClick={() => {
                setFile(null)
              }}
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className="mis-controls">
          <label>
            <span>Claim category</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {['Employment', 'Contract', 'Rental', 'Property', 'Insufficient evidence'].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label className="checkline">
            <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} /> I understand this
            is a source comparison, not legal advice.
          </label>
          <button type="button" className="button primary" onClick={run} disabled={!checked}>
            {analyzing ? (
              <>
                <Activity size={16} className="spin" /> Comparing evidence...
              </>
            ) : (
              <>
                Analyze claim <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
      {done && (
        <section className="mis-results">
          <div className="verdict-card panel">
            <div className="verdict-copy">
              <p className="eyebrow">VERIFICATION OUTCOME</p>
              <h2>{scenario}</h2>
              <p>We found a clear match for the supplied claim. Review the linked evidence and source context before relying on it.</p>
            </div>
            <Badge tone={scenario === 'Not Supported' ? 'rose' : 'teal'}>
              {scenario === 'Not Supported' ? 'High risk' : 'Review complete'}
            </Badge>
          </div>
          <div className="result-two-col">
            <section className="panel evidence-panel">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">EVIDENCE SUMMARY</p>
                  <h3>What the sources indicate</h3>
                </div>
                <ShieldCheck size={20} />
              </div>
              <p>The analysis compares the claim against indexed legislation, published judgments, and trusted institutional sources.</p>
              <div className="evidence-meter">
                <span>Source agreement</span>
                <b>{scenario === 'Not Supported' ? '18' : '82'}%</b>
              </div>
              <div className="meter">
                <i style={{ width: scenario === 'Not Supported' ? '18%' : '82%' }} />
              </div>
            </section>
            <section className="panel evidence-panel">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">CLAIM TEXT</p>
                  <h3>Submitted statement</h3>
                </div>
                <Quote size={20} />
              </div>
              <blockquote>
                “{sample.slice(0, 240)}
                {sample.length > 240 ? '…' : ''}”
              </blockquote>
              <button type="button" className="button secondary" onClick={() => setExpanded(!expanded)}>
                {expanded ? 'Hide' : 'View'} full claim <ChevronDown size={15} />
              </button>
            </section>
          </div>
        </section>
      )}
    </>
  )
}

export function PrecedentsScreen({ onOpenJudgment }: { onOpenJudgment?: (title: string) => void }) {
  return (
    <>
      <SectionTitle
        eyebrow="SRI LANKAN CASE LAW"
        title="Precedent Library"
        description="Browse indexed sample judgments and discover the principles most relevant to your research question."
        action={
          <button type="button" className="button secondary">
            <Filter size={15} /> Filters
          </button>
        }
      />
      <div className="library-toolbar">
        <div className="search wide-search">
          <Search size={16} />
          <input placeholder="Search case names, issues, principles..." />
        </div>
        <select>
          <option>Most similar</option>
          <option>Most recent</option>
          <option>Same jurisdiction</option>
        </select>
      </div>
      <div className="precedent-grid">
        {['Perera v. Silva', 'Fernando Holdings v. Jayasinghe', 'Gunaratne v. Abeywickrama', 'Nexa Solutions v. Perera'].map(
          (x, i) => (
            <article className="precedent-card" key={x}>
              <div className="precedent-head">
                <Badge tone="teal">{['Contract', 'Property', 'Employment', 'Rental'][i]}</Badge>
                <b>{92 - i * 7}% match</b>
              </div>
              <h3>{x}</h3>
              <p className="muted small">
                SC Appeal {i + 12}/2018 · Supreme Court of Sri Lanka · {2018 + i}
              </p>
              <div className="principle">
                <p className="eyebrow">KEY PRINCIPLE</p>
                <p>Documentary evidence and reasonable notice are central to assessing contractual performance.</p>
              </div>
              <button type="button" className="text-button" onClick={() => onOpenJudgment?.(x)}>
                View judgment <ArrowRight size={15} />
              </button>
            </article>
          ),
        )}
      </div>
    </>
  )
}

export function InsightsScreen() {
  return (
    <>
      <SectionTitle
        eyebrow="RESEARCH PATTERNS"
        title="Research Insights"
        description="Explore patterns across the simulated LexLanka research workspace. All values are illustrative."
      />
      <div className="insight-grid">
        <section className="panel insight-main">
          <div className="panel-head">
            <div>
              <p className="eyebrow">ACTIVITY TREND</p>
              <h2>Research volume</h2>
            </div>
            <Badge tone="teal">+41%</Badge>
          </div>
          <div className="large-chart">
            <MiniChart />
          </div>
        </section>
        <section className="panel">
          <p className="eyebrow">TOP RESEARCH AREAS</p>
          <h2>What researchers explore</h2>
          {[
            ['Contracts', 38],
            ['Employment', 26],
            ['Property', 21],
            ['Rental', 15],
          ].map(([x, n]) => (
            <div className="progress-row" key={String(x)}>
              <span>
                {x}
                <b>{n}%</b>
              </span>
              <i>
                <em style={{ width: `${Number(n) * 2}%` }} />
              </i>
            </div>
          ))}
        </section>
      </div>
      <div className="notice">
        <Info size={17} />
        <span>
          These insights summarize simulated prototype activity. They should not be interpreted as legal, social, or
          judicial conclusions.
        </span>
      </div>
    </>
  )
}

export function AnalysisHistoryScreen() {
  return (
    <>
      <SectionTitle
        eyebrow="WORKSPACE HISTORY"
        title="Analysis History"
        description="Review recent prototype analyses across LexLanka modules."
      />
      <div className="panel">
        {[
          ['Perera v. Silva', 'Civil Case Analysis'],
          ['Employment Agreement', 'Document Analysis'],
          ['Rent increase without notice', 'Settlement Simulator'],
          ['Overtime claim check', 'Misinformation Analysis'],
        ].map(([title, type]) => (
          <div className="history-row" key={title}>
            <span>
              <b>{title}</b>
              <small>{type}</small>
            </span>
            <Badge tone="teal">Prototype</Badge>
          </div>
        ))}
      </div>
    </>
  )
}
