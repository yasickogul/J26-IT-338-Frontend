'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
  Bell,
  ChevronRight,
  Menu,
  Moon,
  MoreHorizontal,
  Scale,
  Search,
  Sparkles,
  Sun,
  X,
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { canAccessPath, crumbLabelForPath, isNavActive, navForRole } from '@/lib/nav'

export function AppShell({ children }: { children: React.ReactNode }) {
  const { role, ready, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [dark, setDark] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [query, setQuery] = useState('')
  const [language, setLanguage] = useState('English')

  useEffect(() => {
    if (!ready) return
    if (!role) {
      router.replace('/')
      return
    }
    if (!canAccessPath(role, pathname)) {
      router.replace('/overview')
    }
  }, [ready, role, pathname, router])

  const visibleNav = useMemo(() => (role ? navForRole(role) : []), [role])
  const crumb = crumbLabelForPath(pathname)
  const lawyerOverview = role === 'lawyer' && pathname.startsWith('/overview')

  if (!ready || !role) {
    return (
      <div className="lex-app" style={{ placeItems: 'center', display: 'grid', minHeight: '100vh' }}>
        <p className="muted">Loading workspace…</p>
      </div>
    )
  }

  return (
    <div className={`${dark ? 'lex-app dark' : 'lex-app'}${lawyerOverview ? ' lawyer-overview' : ''}`}>
      <aside className={mobile ? 'sidebar open' : 'sidebar'}>
        <div className="brand">
          <div className="brand-mark">
            <Scale size={20} />
          </div>
          <div>
            <strong>LexLanka</strong>
            <span>Sri Lankan Legal Intelligence</span>
          </div>
          <button className="icon-btn sidebar-close" aria-label="Close navigation" onClick={() => setMobile(false)}>
            <X size={18} />
          </button>
        </div>
        <nav aria-label="Main navigation">
          {visibleNav.map(({ label, href, icon: Icon }) => {
            const active = isNavActive(pathname, href)
            return (
              <Link
                key={href}
                href={href}
                className={active ? 'nav-item active' : 'nav-item'}
                onClick={() => setMobile(false)}
              >
                <Icon size={17} />
                <span>{label}</span>
                {active && <ChevronRight size={14} className="nav-chevron" />}
              </Link>
            )
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="research-note">
            <Sparkles size={15} />
            <span>
              {role === 'lawyer' ? 'Professional workspace' : 'People workspace'}
              <br />
              <b>Research mode enabled</b>
            </span>
          </div>
          <button
            type="button"
            className="profile"
            onClick={() => {
              logout()
              router.replace('/')
            }}
          >
            <span className="avatar">{role === 'lawyer' ? 'LW' : 'P'}</span>
            <span>
              <b>{role === 'lawyer' ? 'Lawyer account' : 'People account'}</b>
              <small>Sign out</small>
            </span>
            <MoreHorizontal size={17} />
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="icon-btn mobile-menu" onClick={() => setMobile(true)} aria-label="Open navigation">
            <Menu size={21} />
          </button>
          <div className="crumb">
            <span>Workspace</span>
            <ChevronRight size={14} />
            <b>{crumb}</b>
          </div>
          <div className="top-actions">
            <label className="search">
              <Search size={16} />
              <input
                aria-label="Search workspace"
                placeholder="Search cases, documents..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <kbd>⌘ K</kbd>
            </label>
            <select
              className="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              aria-label="Language"
            >
              <option>English</option>
              <option>සිංහල</option>
              <option>தமிழ்</option>
            </select>
            <button className="icon-btn" aria-label="Toggle theme" onClick={() => setDark(!dark)}>
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="icon-btn notification" aria-label="Notifications">
              <Bell size={18} />
              <i />
            </button>
            <span className="avatar">{role === 'lawyer' ? 'LW' : 'P'}</span>
          </div>
        </header>
        <div className="content">{children}</div>
      </main>
    </div>
  )
}
