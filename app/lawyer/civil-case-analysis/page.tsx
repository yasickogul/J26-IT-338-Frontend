'use client'

import { useState } from 'react'
import { CivilCaseAnalysisScreen } from '@/components/civil-case-analysis-screen'
import { JudgmentDrawer } from '@/components/judgment-drawer'

export default function LawyerCivilCaseAnalysisPage() {
  const [drawer, setDrawer] = useState<string | null>(null)
  return (
    <>
      <CivilCaseAnalysisScreen onOpenJudgment={setDrawer} />
      {drawer && <JudgmentDrawer title={drawer} onClose={() => setDrawer(null)} />}
    </>
  )
}
