'use client'

import { useState } from 'react'
import { OverviewScreen } from '@/components/overview-screen'
import { JudgmentDrawer } from '@/components/judgment-drawer'

export default function OverviewPage() {
  const [drawer, setDrawer] = useState<string | null>(null)
  return (
    <>
      <OverviewScreen onOpenJudgment={setDrawer} />
      {drawer && <JudgmentDrawer title={drawer} onClose={() => setDrawer(null)} />}
    </>
  )
}
