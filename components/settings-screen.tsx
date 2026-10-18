'use client'

import { SectionTitle, FormFields } from './shared-ui'

export function SettingsScreen() {
  return (
    <>
      <SectionTitle
        eyebrow="WORKSPACE PREFERENCES"
        title="Settings"
        description="Manage the way LexLanka presents your research workspace."
      />
      <div className="settings-grid">
        <section className="panel">
          <p className="eyebrow">APPEARANCE</p>
          <h2>Interface preferences</h2>
          {['Compact table density', 'Show research disclaimers', 'Animate processing stages'].map((x, i) => (
            <label className="setting-row" key={x}>
              <span>
                <b>{x}</b>
                <small>
                  {i === 0
                    ? 'Use tighter rows in tables'
                    : i === 1
                      ? 'Keep context visible throughout the workspace'
                      : 'Use subtle motion in simulated flows'}
                </small>
              </span>
              <input type="checkbox" defaultChecked={i < 2} />
            </label>
          ))}
        </section>
        <section className="panel">
          <p className="eyebrow">RESEARCH CONTEXT</p>
          <h2>Default settings</h2>
          <FormFields fields={['Default language', 'Default jurisdiction', 'Preferred citation style']} />
          <button type="button" className="button primary">
            Save preferences
          </button>
        </section>
      </div>
    </>
  )
}
