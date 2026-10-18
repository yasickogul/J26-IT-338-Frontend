'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { UserRole } from './nav'

const ROLE_KEY = 'lexlanka_role'

type AuthContextValue = {
  role: UserRole | null
  ready: boolean
  login: (role: UserRole) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(ROLE_KEY)
      if (stored === 'lawyer' || stored === 'people') setRole(stored)
    } finally {
      setReady(true)
    }
  }, [])

  const login = useCallback((next: UserRole) => {
    localStorage.setItem(ROLE_KEY, next)
    setRole(next)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(ROLE_KEY)
    setRole(null)
  }, [])

  const value = useMemo(
    () => ({ role, ready, login, logout }),
    [role, ready, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
