'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoginScreen } from '@/components/login-screen'
import { useAuth } from '@/lib/auth'

export default function HomePage() {
  const { role, ready, login } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (ready && role) router.replace('/overview')
  }, [ready, role, router])

  if (!ready) {
    return (
      <div className="lex-app" style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <p className="muted">Loading…</p>
      </div>
    )
  }

  if (role) {
    return (
      <div className="lex-app" style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <p className="muted">Redirecting to overview…</p>
      </div>
    )
  }

  return (
    <LoginScreen
      onLogin={(next) => {
        login(next)
        router.replace('/overview')
      }}
    />
  )
}
