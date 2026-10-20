'use client'

import { use } from 'react'
import { IntakeResultScreen } from '@/components/intake-result-screen'

export default function LawyerIntakeResultPage({
  params,
}: {
  params: Promise<{ intakeId: string }>
}) {
  const { intakeId } = use(params)
  return <IntakeResultScreen intakeId={intakeId} />
}
