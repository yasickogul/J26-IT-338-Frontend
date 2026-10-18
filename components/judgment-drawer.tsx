'use client'

import { X } from 'lucide-react'
import { Badge } from './shared-ui'

export function JudgmentDrawer({
  title,
  onClose,
}: {
  title: string
  onClose: () => void
}) {
  return (
    <div className="overlay" onClick={onClose}>
      <aside className="judgment-drawer" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="icon-btn close-drawer" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
        <p className="eyebrow">Sample prototype data</p>
        <h2>{title}</h2>
        <Badge tone="teal">Supreme Court · 2018</Badge>
        <div className="drawer-block">
          <p className="eyebrow">Key principle</p>
          <p>
            Contractual obligations should be interpreted in light of the agreement as a whole and the surrounding
            circumstances.
          </p>
        </div>
        <button type="button" className="button secondary full" onClick={onClose}>
          Close judgment
        </button>
      </aside>
    </div>
  )
}
