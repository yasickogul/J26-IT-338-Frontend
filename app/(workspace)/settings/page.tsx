'use client'

import { LegacyLawyerRedirect } from '@/components/legacy-lawyer-redirect'
import { SettingsScreen } from '@/components/settings-screen'
import { lawyerPaths } from '@/lib/nav'

export default function SettingsPage() {
  return (
    <LegacyLawyerRedirect href={lawyerPaths.settings}>
      <SettingsScreen />
    </LegacyLawyerRedirect>
  )
}
