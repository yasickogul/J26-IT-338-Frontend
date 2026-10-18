'use client'

import { useState } from 'react'
import { ArrowRight, Scale, ShieldCheck, UserRound } from 'lucide-react'
import type { UserRole } from '@/lib/nav'

export function LoginScreen({ onLogin }: { onLogin: (role: UserRole) => void }) {
  const [role, setRole] = useState<UserRole>('lawyer')
  return (
    <main className="login-shell">
      <section className="login-visual">
        <div className="brand">
          <div className="brand-mark">
            <Scale size={20} />
          </div>
          <div>
            <strong>LexLanka</strong>
            <span>Sri Lankan Legal Intelligence</span>
          </div>
        </div>
        <div className="login-copy">
          <p className="eyebrow">TRUSTED LEGAL RESEARCH</p>
          <h1>Clarity for every legal question.</h1>
          <p>Explore Sri Lankan legal intelligence with tools designed for lawyers and the people they serve.</p>
          <div className="login-proof">
            <ShieldCheck size={18} />
            <span>Private, source-grounded research workspace</span>
          </div>
        </div>
      </section>
      <section className="login-panel">
        <div className="login-card">
          <p className="eyebrow">WELCOME BACK</p>
          <h2>Sign in to LexLanka</h2>
          <p className="muted">Choose your workspace to continue.</p>
          <div className="role-switch" role="tablist" aria-label="Choose account type">
            <button
              type="button"
              className={role === 'lawyer' ? 'role-option active' : 'role-option'}
              onClick={() => setRole('lawyer')}
            >
              <Scale size={17} />
              <span>
                <b>Lawyer</b>
                <small>Full research access</small>
              </span>
            </button>
            <button
              type="button"
              className={role === 'people' ? 'role-option active' : 'role-option'}
              onClick={() => setRole('people')}
            >
              <UserRound size={17} />
              <span>
                <b>People</b>
                <small>Guided legal tools</small>
              </span>
            </button>
          </div>
          <label className="login-field">
            <span>Email address</span>
            <input type="email" placeholder="you@example.com" />
          </label>
          <label className="login-field">
            <span>Password</span>
            <input type="password" placeholder="Enter your password" />
          </label>
          <button type="button" className="button primary login-button" onClick={() => onLogin(role)}>
            Continue as {role === 'lawyer' ? 'Lawyer' : 'People'} <ArrowRight size={15} />
          </button>
          <p className="login-note">
            <ShieldCheck size={14} /> Prototype sign-in — no credentials are stored.
          </p>
        </div>
      </section>
    </main>
  )
}
