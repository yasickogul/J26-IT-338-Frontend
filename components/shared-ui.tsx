'use client'

import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export const caseData = [
  { name: 'Contract', value: 34 },
  { name: 'Property', value: 23 },
  { name: 'Employment', value: 18 },
  { name: 'Rental', value: 15 },
  { name: 'Other', value: 10 },
]

export const trend = [
  { name: 'Jan', analyses: 8 },
  { name: 'Feb', analyses: 11 },
  { name: 'Mar', analyses: 9 },
  { name: 'Apr', analyses: 14 },
  { name: 'May', analyses: 17 },
  { name: 'Jun', analyses: 24 },
]

export function Badge({ children, tone = 'slate' }: { children: React.ReactNode; tone?: string }) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

export function Stat({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'teal',
}: {
  label: string
  value: string
  detail: string
  icon: React.ComponentType<{ size?: number }>
  tone?: string
}) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="eyebrow">{label}</p>
        <p className="stat-value">{value}</p>
        <p className="muted small">{detail}</p>
      </div>
    </div>
  )
}

export function SectionTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="section-title">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="muted lead">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function MiniChart({ type = 'area' }: { type?: string }) {
  return (
    <div className="mini-chart">
      {type === 'pie' ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={caseData} dataKey="value" innerRadius={42} outerRadius={67} paddingAngle={3}>
              {caseData.map((_, i) => (
                <Cell key={i} fill={['#0d7c78', '#d2a64a', '#28547d', '#6f8da1', '#aab8c4'][i]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trend}>
            <defs>
              <linearGradient id="fillTeal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0d7c78" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#0d7c78" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dce4ea" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
            <YAxis hide />
            <Tooltip />
            <Area type="monotone" dataKey="analyses" stroke="#0d7c78" fill="url(#fillTeal)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export function FormFields({
  fields,
  values,
  onChange,
}: {
  fields: string[]
  values?: Record<string, string>
  onChange?: (field: string, value: string) => void
}) {
  return (
    <div className="form-grid">
      {fields.map((x, i) => {
        const controlled = values != null && onChange != null
        const isWide =
          x.toLowerCase().includes('description') ||
          x.toLowerCase().includes('concern') ||
          x.toLowerCase().includes('purpose') ||
          x.toLowerCase().includes('issue') ||
          x.toLowerCase().includes('remedy')
        const isSelect =
          x.includes('category') ||
          x.includes('mode') ||
          x.includes('language') ||
          x.includes('role') ||
          x.includes('Court') ||
          x.includes('Province')
        return (
          <label key={x} className={isWide ? 'wide' : ''}>
            <span>{x}</span>
            {isSelect ? (
              <select
                value={controlled ? values[x] ?? '' : undefined}
                defaultValue={controlled ? undefined : ''}
                onChange={controlled ? (e) => onChange(x, e.target.value) : undefined}
              >
                <option value="">Select…</option>
                <option>Auto detect</option>
                <option>Standard</option>
                <option>English</option>
                <option>Employee</option>
                <option>District Court</option>
                <option>Western</option>
              </select>
            ) : isWide ? (
              <textarea
                rows={4}
                placeholder={i === 0 ? 'Enter details...' : ''}
                value={controlled ? values[x] ?? '' : undefined}
                defaultValue={controlled ? undefined : ''}
                onChange={controlled ? (e) => onChange(x, e.target.value) : undefined}
              />
            ) : (
              <input
                placeholder={i === 0 ? 'Enter details...' : ''}
                value={controlled ? values[x] ?? '' : undefined}
                defaultValue={controlled ? undefined : ''}
                onChange={controlled ? (e) => onChange(x, e.target.value) : undefined}
              />
            )}
          </label>
        )
      })}
    </div>
  )
}

export function ReviewPanel({
  title,
  rows,
}: {
  title: string
  rows: string[]
}) {
  return (
    <div className="review">
      <div className="review-file">
        <b>{title}</b>
        <Badge tone="teal">Ready to analyze</Badge>
      </div>
      {rows.map((x) => (
        <div className="review-row" key={x}>
          <span>{x}</span>
        </div>
      ))}
    </div>
  )
}
