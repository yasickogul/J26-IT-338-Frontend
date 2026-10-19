'use client'

import Link from 'next/link'
import {
  Activity,
  ArrowRight,
  ChevronRight,
  CircleHelp,
  FileSearch,
  FileText,
  Info,
  Library,
  Plus,
  Scale,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { Badge, MiniChart, SectionTitle, Stat } from './shared-ui'

const activity = [
  ['Perera v. Silva', 'Civil Case Analysis', '12 min ago', Scale, 'teal'],
  ['Employment Agreement', 'Document Analysis', 'Yesterday', FileText, 'gold'],
  ['Can a landlord increase rent without notice?', 'Multi-Agent Legal Argumentation Engine', '2 days ago', CircleHelp, 'blue'],
  ['Employees can never claim overtime...', 'Misinformation Analysis', '3 days ago', ShieldCheck, 'rose'],
] as const

export function OverviewScreen({ onOpenJudgment }: { onOpenJudgment?: (title: string) => void }) {
  const { role } = useAuth()
  if (!role) return null

  const features =
    role === 'lawyer'
      ? [
          {
            title: 'Civil Case Analysis',
            desc: 'Find relevant historical cases and compare similar facts, evidence, and legal precedent relevance.',
            Icon: Scale,
            href: '/civil-case-analysis',
            badge: 'Precedent research',
          },
        ]
      : [
          {
            title: 'Legal Document Intelligence',
            desc: 'Understand clauses, risks, protections, and historical dispute patterns.',
            Icon: FileSearch,
            href: '/legal-document-analysis',
            badge: 'Document review',
          },
          {
            title: 'Multi-Agent Legal Argumentation Engine',
            desc: 'Compare plaintiff, defense, auditor, and settlement perspectives for a civil dispute.',
            Icon: CircleHelp,
            href: '/settlement-simulator',
            badge: 'Source check',
          },
          {
            title: 'Legal Misinformation Detector',
            desc: 'Check legal claims against available Sri Lankan legal sources.',
            Icon: ShieldCheck,
            href: '/legal-misinformation',
            badge: 'Source check',
          },
        ]

  return (
    <>
      <SectionTitle
        eyebrow="LEXLANKA RESEARCH WORKSPACE"
        title={role === 'lawyer' ? 'Civil Case Analysis Workspace' : 'Legal Intelligence Overview'}
        description={
          role === 'lawyer'
            ? 'Review civil disputes against relevant historical Sri Lankan judgments, similar facts, and evidence.'
            : 'Explore AI-assisted civil legal research, document intelligence, legal questions, misinformation analysis, and Sri Lankan precedent research.'
        }
        action={
          <button type="button" className="button secondary">
            <Plus size={16} /> New workspace
          </button>
        }
      />
      <div className="notice">
        <Info size={17} />
        <span>
          <b>Research prototype</b> — Results are simulated for exploration and should not be treated as legal advice
          or a prediction of any real case.
        </span>
      </div>
      <div className="feature-grid">
        {features.map((f, i) => (
          <article className={`feature-card feature-${i}`} key={f.title}>
            <div className="feature-top">
              <div className="feature-icon">
                <f.Icon size={22} />
              </div>
              <Badge tone={i === 1 ? 'gold' : 'teal'}>{f.badge}</Badge>
            </div>
            <h3>{f.title}</h3>
            <p className="muted">{f.desc}</p>
            <Link className="text-button" href={f.href}>
              Open module <ArrowRight size={15} />
            </Link>
          </article>
        ))}
      </div>
      <div className="stats-grid">
        <Stat label="Civil analyses" value="24" detail="7 this month" icon={Scale} />
        <Stat label="Documents analyzed" value="32" detail="684 clauses reviewed" icon={FileText} tone="gold" />
        <Stat label="Legal questions" value="86" detail="Across 4 categories" icon={CircleHelp} tone="blue" />
        <Stat label="Claims checked" value="41" detail="9 need review" icon={ShieldCheck} tone="rose" />
        <Stat label="Precedents indexed" value="1,248" detail="Sri Lankan sources" icon={Library} tone="navy" />
      </div>
      <div className="dashboard-grid">
        <section className="panel activity-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">WORKSPACE SIGNALS</p>
              <h2>Recent activity</h2>
            </div>
            <Link className="text-button" href="/analysis-history">
              View history <ArrowRight size={14} />
            </Link>
          </div>
          {activity.map(([title, type, date, Icon, tone]) => (
            <button
              type="button"
              className="activity-row"
              key={title}
              onClick={() => (type.includes('Civil') ? onOpenJudgment?.(title) : undefined)}
            >
              <span className={`activity-icon ${tone}`}>
                <Icon size={17} />
              </span>
              <span className="activity-copy">
                <b>{title}</b>
                <small>{type}</small>
              </span>
              <span className="muted small">{date}</span>
              <ChevronRight size={15} />
            </button>
          ))}
        </section>
        <section className="panel chart-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">RESEARCH VOLUME</p>
              <h2>Analyses over time</h2>
            </div>
            <Badge tone="teal">Last 6 months</Badge>
          </div>
          <MiniChart />
          <div className="chart-foot">
            <b>24</b>
            <span className="muted small">total civil analyses</span>
            <span className="trend">
              +41% <small>vs previous period</small>
            </span>
          </div>
        </section>
      </div>
      <p className="footer-disclaimer">
        <Scale size={14} /> LexLanka is an academic research prototype. It does not provide legal advice, attorney-client
        services, or guaranteed legal outcomes.
      </p>
    </>
  )
}
