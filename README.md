# Smart Civil Case Analysis Platform — Frontend

Next.js frontend for the Smart Civil Case Analysis Platform. Talks to the FastAPI backend on port **8000**.

## Prerequisites

- **Node.js 20+** (LTS recommended)
- **npm** (comes with Node)
- Backend running locally (see `../J26-IT-338-Backend/README.md`)

Check versions:

```bash
node --version
npm --version
```

---

## Setup

From this folder (`J26-IT-338-Frontend`):

### 1. Install dependencies

**macOS / Linux / Windows**

```bash
npm install
```

### 2. Environment file (optional)

Create `.env.local` so the UI can reach the API:

**macOS / Linux**

```bash
echo 'NEXT_PUBLIC_API_URL=http://localhost:8000' > .env.local
```

**Windows (PowerShell)**

```powershell
Set-Content -Path .env.local -Value 'NEXT_PUBLIC_API_URL=http://localhost:8000'
```

**Windows (Command Prompt)**

```cmd
echo NEXT_PUBLIC_API_URL=http://localhost:8000> .env.local
```

---

## Run

### Development server

```bash
npm run dev
```

Open: [http://localhost:3000](http://localhost:3000)

### Production build

```bash
npm run build
npm start
```

---

## Backend (Python) — use uv

The API is a separate Python project. Use **uv** there (not in this frontend folder).

### Install uv (if needed)

**macOS / Linux**

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows (PowerShell)**

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### Create venv, install, and run the API

**macOS / Linux**

```bash
cd ../J26-IT-338-Backend
uv venv
source .venv/bin/activate
uv pip install -r requirements-dev.txt
cp .env.example .env   # then edit DATABASE_URL, etc.
uv run uvicorn app.main:app --reload --port 8000
```

**Windows (PowerShell)**

```powershell
cd ..\J26-IT-338-Backend
uv venv
.venv\Scripts\Activate.ps1
uv pip install -r requirements-dev.txt
copy .env.example .env
uv run uvicorn app.main:app --reload --port 8000
```

Full backend setup: see the Backend README.

---

## Useful scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js with hot reload |
| `npm run build` | Production build |
| `npm start` | Serve the production build |

---

## Ports

| App | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Backend docs | http://localhost:8000/docs |
