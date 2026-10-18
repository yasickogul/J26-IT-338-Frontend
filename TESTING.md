# Frontend testing (Playwright)

These are **browser tests**. The civil-case wizard uses prototype localStorage auth and a **simulated** submit (`submitted_to_backend: false`). They are **not** full-stack tests against FastAPI unless you deliberately point the UI at a running backend and remove request mocks.

## Install

```bash
npm ci
# or: npm install
npx playwright install chromium
```

Node **20+**. Lockfile: `package-lock.json` (README uses npm; `pnpm-lock.yaml` also exists but CI uses npm).

If `registry.npmjs.org` returns HTTP 403 in your environment, install with a mirror once, then keep the updated lockfile:

```bash
npm install @playwright/test --save-dev --registry=https://registry.npmmirror.com
```

## Run

```bash
# Headless (also used in CI)
npm run test:e2e

# Headed
npm run test:e2e:headed

# Interactive UI mode
npm run test:e2e:ui

# Open the last HTML report
npm run test:e2e:report
```

Playwright starts the Next.js app via `webServer`:

- Local: `npm run dev` (reuses an already-running server)
- CI: `npm run build && npm run start`

## Auth fixture

Prototype sign-in stores `lexlanka_role` in `localStorage`. E2E helpers set that key only — there is no production auth bypass and no real session tokens.

## Category selector note

The product shows **five** dispute categories, including **Other civil dispute**, plus the four required labels:

- Contract dispute
- Property or land dispute
- Employment dispute
- Rental dispute

Commercial / compensation categories are intentionally absent.

## Mocked vs missing API behaviour

| Flow | Status |
|------|--------|
| Successful “Find Relevant Cases” | Local simulated submit → prototype notice on `/civil-case-analysis` |
| API failure UI | **Not implemented** — wizard does not call the backend yet |
| Draft save / reopen | Implemented via `localStorage` (`lexlanka_case_draft_v1`) |

## Artifacts (gitignored)

- `playwright-report/`
- `test-results/`
- `e2e/.auth/` / `playwright/.auth/`

## GitHub Actions

Workflow: `.github/workflows/frontend-ci.yml`  
Required-check name (when enabling branch protection): **`Frontend Playwright`**

Local success does **not** prove GitHub Actions passed.
