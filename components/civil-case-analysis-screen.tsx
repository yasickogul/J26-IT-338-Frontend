'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Activity, ArrowRight, ChevronRight, Filter, Info, Library, Plus, Scale, Sparkles, Zap } from 'lucide-react'
import { SIMULATED_SUBMIT_FLAG } from '@/lib/case-draft'
import { Badge, caseData, MiniChart, SectionTitle, Stat } from './shared-ui'

const recent = [
  ['Perera v. Silva', 'Contract dispute', 74],
  ['Fernando Holdings v. Jayasinghe', 'Property or land dispute', 70],
  ['Employee v. ABC Services', 'Employment dispute', 66],
  ['Land ownership claim', 'Rental dispute', 62],
] as const

export function CivilCaseAnalysisScreen({ onOpenJudgment }: { onOpenJudgment?: (title: string) => void }) {
  const [showPrototypeNotice, setShowPrototypeNotice] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(SIMULATED_SUBMIT_FLAG) !== '1') return
    sessionStorage.removeItem(SIMULATED_SUBMIT_FLAG)
    setShowPrototypeNotice(true)
  }, [])

  return (
    <>
      {showPrototypeNotice && (
        <div className="notice" role="status">
          <Info size={17} />
          <span>
            <b>Prototype only.</b> Nothing was sent to a server. No relevant historical cases were retrieved, and no
            legal relevance score was calculated.
          </span>
        </div>
      )}
      <SectionTitle
        eyebrow="CIVIL RESEARCH MODULE"
        title="Civil Case Analysis"
        description="Prepare a civil dispute for comparison with relevant historical Sri Lankan judgments, similar facts, and evidence. This prototype does not predict a case outcome."
        action={
          <Link className="button primary" href="/civil-case-analysis/new">
            <Plus size={16} /> Analyze new case
          </Link>
        }
      />
      <div className="stats-grid four">
        <Stat label="Total analyses" value="24" detail="Across workspace" icon={Scale} />
        <Stat label="Sample relevance" value="82%" detail="Prototype figures only" icon={Activity} tone="gold" />
        <Stat label="Precedents indexed" value="1,248" detail="Sample prototype data" icon={Library} tone="blue" />
        <Stat label="This month" value="7" detail="Recent activity" icon={Zap} tone="rose" />
      </div>
      <div className="dashboard-grid">
        <section className="panel table-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">SAMPLE PROTOTYPE DATA</p>
              <h2>Recent analyses</h2>
            </div>
            <button type="button" className="icon-btn" aria-label="Filter">
              <Filter size={17} />
            </button>
          </div>
          {recent.map(([title, category, score], i) => (
            <button type="button" className="table-row" key={title} onClick={() => onOpenJudgment?.(title)}>
              <span>
                <b>{title}</b>
                <small>{category}</small>
              </span>
              <Badge tone={i === 0 ? 'teal' : 'slate'}>{score}% relevance</Badge>
              <ChevronRight size={15} />
            </button>
          ))}
        </section>
        <section className="panel chart-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">DISTRIBUTION</p>
              <h2>Case types</h2>
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
          <p className="muted">
            Preserve your notes between steps, then review the category, facts, and evidence before looking for
            relevant historical cases.
          </p>
        </div>
        <Link className="button secondary" href="/civil-case-analysis/new">
          Begin guided flow <ArrowRight size={15} />
        </Link>
      </div>
    </>
  )
}
