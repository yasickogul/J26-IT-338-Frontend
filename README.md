# J26-IT-338 Frontend - kavy - Civil Case Intelligence


## Overview

The frontend is a web-based user interface developed using **React and Vite** for the Civil Case Intelligence system.

It allows users to upload Sri Lankan civil case documents in PDF or image format and receive a structured **Civil Case Intelligence Report**.

The frontend communicates with the Python FastAPI backend through REST API endpoints.

## Main Features

- **Document Upload:** Upload civil case documents as PDFs or images.
- **Live Analysis Progress:** View the current processing stage, progress percentage, and warnings.
- **Extracted Information:** Display nine categories of information extracted from legal documents.
- **Report Visualization:** Present parties, key facts, party positions, evidence gaps, legal issues, and explanations.
- **Similar Historical Cases:** Display relevant previously decided cases retrieved by the backend.
- **Source Citations:** Provide clickable references linking legal explanations to their supporting sources.
- **Report Downloads:** Download completed reports in PDF, Markdown, or JSON format.
- **Job Management:** Monitor analysis status and stop a running analysis when required.

## Technology Stack

| Technology | Purpose |
|---|---|
| React | Build the user interface |
| Vite | Frontend development and build tooling |
| JavaScript | Frontend application logic |
| REST API | Communication with the FastAPI backend |

## Project Directory

```text
frontend/
    React (Vite)
    - Document upload
    - Live analysis progress
    - Extracted information display
    - Intelligence report display
    - Source citations
    - Report downloads
```

## How to Run the Frontend

**Step 1: Open the frontend directory**

```bash
cd J26-IT-338-Frontend
```

**Step 2: Install dependencies**

```bash
npm install
```

**Step 3: Start the development server**

```bash
npm run dev
```

**Step 4: Open the application**

http://localhost:5173

During development, Vite proxies requests beginning with `/api` to the FastAPI backend at `http://127.0.0.1:8000`.

## Backend API Integration

| Method | API Endpoint | Frontend Function |
|---|---|---|
| POST | `/api/v1/c2/analyze` | Upload a document and start analysis |
| GET | `/api/v1/c2/jobs/{id}` | Display processing status and progress |
| GET | `/api/v1/c2/jobs/{id}/extraction` | Display extracted legal information |
| GET | `/api/v1/c2/jobs/{id}/result` | Retrieve the completed report |
| GET | `/api/v1/c2/jobs/{id}/report.pdf` | Download the PDF report |
| GET | `/api/v1/c2/jobs/{id}/report.md` | Download the Markdown report |
| DELETE | `/api/v1/c2/jobs/{id}` | Stop a running analysis |

## Production Configuration

For production deployment, configure the following frontend environment variable:

```env
VITE_API_BASE_URL=https://your-backend-url.com/api/v1/c2
```

The backend must also allow the deployed frontend origin through its `CORS_ORIGINS` configuration.

## Frontend Responsibility

The frontend focuses on **user interaction and presentation**. It does not perform OCR, AI processing, legal information extraction, vector retrieval, or report generation.

All intelligence-processing tasks are handled by the backend.
