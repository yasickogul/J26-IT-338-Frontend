'use client'

import { LegacyLawyerRedirect } from '@/components/legacy-lawyer-redirect'
import { lawyerPaths } from '@/lib/nav'

export default function LawyerIndexPage() {
  return <LegacyLawyerRedirect href={lawyerPaths.overview} />
}
