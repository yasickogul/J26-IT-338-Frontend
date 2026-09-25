'use client'

import { useMemo, useState } from 'react'
import { BarChart3, Check, Download, FileText, Info, RotateCcw, Save, Scale, Sparkles } from 'lucide-react'

const tabs = ['Case details', 'Arguments', 'Settlement zone', 'Summary']
const scenarios = [
  { label: 'Balanced', plaintiff: 64, defense: 51 },
  { label: 'Plaintiff stronger', plaintiff: 78, defense: 43 },
  { label: 'Defense stronger', plaintiff: 48, defense: 71 },
]
const whatIfs = [
  ['Written agreement verified', 8, -3],
  ['Prior complaint discovered', 6, -4],
  ['Payment records removed', -12, 5],
]

function StrengthBar({ plaintiff, defense }: { plaintiff: number; defense: number }) {
  const low = Math.max(0, Math.min(plaintiff, defense) + 8)
  const high = Math.min(100, Math.max(plaintiff, defense) - 4)
  return (
    <div className="zone-visual">
      <div className="zone-scale"><span>0 · Defense</span><b>{low}%–{high}% likely agreement</b><span>100 · Plaintiff</span></div>
      <div className="zone-track">
        <div className="zone-range" style={{ left: `${low}%`, width: `${Math.max(8, high - low)}%` }} />
        <div className="zone-marker defense-marker" style={{ left: `${defense}%` }} />
        <div className="zone-marker plaintiff-marker" style={{ left: `${plaintiff}%` }} />
      </div>
      <div className="zone-legend"><span><i className="dot plaintiff-dot" /> Plaintiff strength {plaintiff}</span><span><i className="dot defense-dot" /> Defense strength {defense}</span></div>
    </div>
  )
}

export function SettlementSimulator() {
  const [tab, setTab] = useState('Case details')
  const [scenario, setScenario] = useState('Balanced')
  const [saved, setSaved] = useState(false)
  const [title, setTitle] = useState('Perera v. Silva — rental agreement dispute')
  const [plaintiff, setPlaintiff] = useState(64)
  const [defense, setDefense] = useState(51)
  const [selected, setSelected] = useState<number[]>([])

  const chooseScenario = (name: string) => {
    const next = scenarios.find((item) => item.label === name) ?? scenarios[0]
    setScenario(next.label); setPlaintiff(next.plaintiff); setDefense(next.defense); setSelected([])
  }
  const toggleWhatIf = (index: number) => {
    const next = selected.includes(index) ? selected.filter((item) => item !== index) : [...selected, index]
    setSelected(next)
    setPlaintiff(Math.max(0, Math.min(100, 64 + next.reduce((sum, item) => sum + whatIfs[item][1], 0))))
    setDefense(Math.max(0, Math.min(100, 51 + next.reduce((sum, item) => sum + whatIfs[item][2], 0))))
    setScenario('Custom scenario')
  }
  const zone = useMemo(() => `${Math.max(0, Math.min(plaintiff, defense) + 8)}%–${Math.min(100, Math.max(plaintiff, defense) - 4)}%`, [plaintiff, defense])

  return <div className="simulator-page">
    <div className="section-title"><div><p className="eyebrow">CIVIL RESEARCH SIMULATOR</p><h1>Multi-Agent Deliberation &amp; Settlement Simulator</h1><p className="muted lead">Explore a structured civil dispute discussion between Plaintiff Counsel, Defense Counsel, and a Neutral Auditor.</p></div><div className="button-row"><button className="button secondary" onClick={() => setSaved(true)}><Save size={15} /> {saved ? 'Saved' : 'Save result'}</button><button className="button primary"><Download size={15} /> Export</button></div></div>
    <div className="notice"><Info size={17} /><span><b>Civil cases only</b> — This client-side simulation is for research exploration and is not legal advice or a prediction of an actual outcome.</span></div>
    <div className="mis-tabs">{tabs.map((item) => <button key={item} className={tab === item ? 'mis-tab active' : 'mis-tab'} onClick={() => setTab(item)}>{item}</button>)}</div>

    {tab === 'Case details' && <div className="dashboard-grid"><section className="panel"><div className="panel-head"><div><p className="eyebrow">INPUT</p><h2>Civil case details</h2></div><Scale size={20} /></div><label className="login-field"><span>Case title</span><input value={title} onChange={(event) => setTitle(event.target.value)} /></label><div className="form-grid"><label><span>Case type</span><select><option>Rental dispute</option><option>Contract dispute</option><option>Property dispute</option><option>Employment dispute</option></select></label><label><span>Jurisdiction</span><select><option>Colombo District Court</option><option>District Court — Gampaha</option><option>District Court — Kandy</option></select></label></div><label className="login-field"><span>Case facts and evidence</span><textarea rows={5} defaultValue="A written rental agreement covered a two-year term. The tenant says the landlord ended the agreement early after a repair dispute. Payment records and written notices are available for review." /></label><div className="button-row"><button className="button secondary" onClick={() => setTab('Arguments')}>Review arguments <Sparkles size={15} /></button></div></section><section className="panel"><div className="panel-head"><div><p className="eyebrow">LIVE MODEL</p><h2>Initial assessment</h2></div><BarChart3 size={20} /></div><StrengthBar plaintiff={plaintiff} defense={defense} /><div className="metric-list"><div><span>Current scenario</span><b>{scenario}</b></div><div><span>Settlement zone</span><b>{zone}</b></div><div><span>Deliberation confidence</span><b>Moderate</b></div></div><p className="muted small">The model weighs the stated facts, available evidence, and each side's ability to directly answer the opposing argument.</p></section></div>}

    {tab === 'Arguments' && <section className="panel"><div className="panel-head"><div><p className="eyebrow">MULTI-AGENT TRANSCRIPT</p><h2>Arguments and rebuttals</h2></div><FileText size={20} /></div><div className="argument-stack"><article className="argument plaintiff-argument"><b>Plaintiff Counsel</b><p>The tenant relied on the written agreement and can show consistent payments. Ending the arrangement early without a documented process weakens the landlord's position.</p></article><article className="argument defense-argument"><b>Defense Counsel</b><p>The agreement included repair obligations, and the landlord says notices were sent after the tenant failed to address the disputed damage.</p></article><article className="argument auditor-argument"><b>Neutral Auditor</b><p>The plaintiff's payment records are a strong anchor. The outcome turns on whether the written notices and repair evidence can be independently verified.</p></article></div><button className="button primary" onClick={() => setTab('Settlement zone')}>Estimate settlement zone</button></section>}

    {tab === 'Settlement zone' && <section className="panel"><div className="panel-head"><div><p className="eyebrow">ZOPA ANALYSIS</p><h2>Where might this actually settle?</h2></div><BarChart3 size={20} /></div><p className="muted">ZOPA is the Zone of Possible Agreement — the range where both sides could plausibly accept a settlement.</p><StrengthBar plaintiff={plaintiff} defense={defense} /><div className="scenario-row">{scenarios.map((item) => <button key={item.label} className={scenario === item.label ? 'scenario active' : 'scenario'} onClick={() => chooseScenario(item.label)}>{item.label}</button>)}</div><h3>What if...</h3><div className="scenario-row">{whatIfs.map(([label], index) => <button key={label} className={selected.includes(index) ? 'scenario active' : 'scenario'} onClick={() => toggleWhatIf(index)}>{label}</button>)}</div><div className="simulator-callout"><b>Recommended range: {zone}</b><span>A negotiated resolution is more plausible when both parties can verify their strongest evidence before formal proceedings.</span></div><button className="button secondary" onClick={() => { chooseScenario('Balanced'); setSelected([]) }}><RotateCcw size={15} /> Reset scenario</button></section>}

    {tab === 'Summary' && <section className="panel summary-panel"><div className="panel-head"><div><p className="eyebrow">NEUTRAL AUDITOR SUMMARY</p><h2>Research interpretation</h2></div><Check size={20} /></div><div className="summary-grid"><div><span>Leading position</span><b>{plaintiff > defense ? 'Plaintiff' : 'Defense'}</b></div><div><span>Settlement zone</span><b>{zone}</b></div><div><span>Review status</span><b>Needs human review</b></div></div><p>Based on the facts provided, the strongest next step is to put the request in writing, preserve messages and receipts, and consult a qualified Sri Lankan legal professional before making a real decision.</p><div className="notice"><Info size={17} /><span>This simulator models arguments for research only. It does not provide legal advice, legal representation, or a prediction of a court result.</span></div></section>}
  </div>
}

export default SettlementSimulator
