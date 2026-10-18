'use client'

import { useState } from 'react'
import { JudgmentDrawer } from '@/components/judgment-drawer'
import { LegacyLawyerRedirect } from '@/components/legacy-lawyer-redirect'
import { OverviewScreen } from '@/components/overview-screen'
import { lawyerPaths } from '@/lib/nav'

export default function OverviewPage() {
  const [drawer, setDrawer] = useState<string | null>(null)
  return (
    <LegacyLawyerRedirect href={lawyerPaths.overview}>
      <OverviewScreen onOpenJudgment={setDrawer} />
      {drawer && <JudgmentDrawer title={drawer} onClose={() => setDrawer(null)} />}
    </LegacyLawyerRedirect>
  )
}
