'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'

export function LegacyLawyerRedirect({ href, children }: { href: string; children?: ReactNode }) {
  const { role, ready } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!ready || role !== 'lawyer') return
    const target = `${href}${window.location.search}${window.location.hash}`
    if (`${window.location.pathname}${window.location.search}${window.location.hash}` === target) return
    router.replace(target)
  }, [ready, role, router, href])

  if (!ready || role === 'lawyer') {
    return <p className="muted">Redirecting…</p>
  }

  return children ?? <p className="muted">Redirecting…</p>
}
