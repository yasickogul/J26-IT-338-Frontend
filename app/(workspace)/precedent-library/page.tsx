'use client'

import { useState } from 'react'
import { PrecedentsScreen } from '@/components/people-modules'
import { JudgmentDrawer } from '@/components/judgment-drawer'

export default function PrecedentLibraryPage() {
  const [drawer, setDrawer] = useState<string | null>(null)
  return (
    <>
      <PrecedentsScreen onOpenJudgment={setDrawer} />
      {drawer && <JudgmentDrawer title={drawer} onClose={() => setDrawer(null)} />}
    </>
  )
}
