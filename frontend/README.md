# RAVEN frontend

Next.js App Router frontend for the RAVEN regulated-software QA workspace.

UI route pages are organized under `app/(pages)`. The parenthesized route group
keeps the existing URL paths unchanged; API route handlers remain under
`app/api`.

## Run locally

```bash
npm install
npm run dev
```

Set `RAVEN_BACKEND_URL` in the frontend server environment when the backend is
not at `http://127.0.0.1:8000`. The variable is server-only; requests to the
FastAPI `/api/v1` routes go through the same-origin Next.js proxy under
`/raven/api/v1`, avoiding browser CORS configuration.
The proxy allows up to 15 minutes for backend response headers and body so
long-running batch assessments are not cut off by Node's shorter default
headers timeout. If a request does time out, the backend may still finish
processing it; the ingestion workflow stops at that batch rather than
submitting later batches, and saved assessments should be checked before retrying.

## Docker deployment

The single root Compose file builds and starts the frontend, backend, and
PostgreSQL containers together. From the repository root, run:

```bash
docker-compose up -d --build
```

The frontend reaches the backend over the Compose network and is available at
`http://localhost/raven/`. On EC2, it is available at
`http://<ec2-public-ip>/raven/`. RAVEN and RADAR share host port 80 because the
application switcher runs only one stack at a time. Allow inbound TCP port 80
in the EC2 security group. For deployment setup, follow the
[backend Docker deployment instructions](../backend/README.md#docker-deployment)
to configure secure, persistent database credentials.

## Requirement ingestion

Open **Ingestion** from the primary navigation. The page accepts CSV files with
a `text` header and JSON arrays of strings or objects with a string `text`
property. It previews rows, marks empty rows and within-file duplicates, then
creates valid requirements through `POST /api/v1/requirements`.

Each row is sent separately. The result can therefore be partial if a request
fails. This path creates requirement records and REQ keys only; it does not run
the analysis, assurance, or test-generation pipeline. Duplicate text already
stored in the backend is not checked by the current API.

## Live backend workspaces

Requirements list and detail, persisted assessments and assurance decisions,
traceability matrix/graph/orphans, change-event list, and test-script list read
actual backend records. Their API calls show loading, empty, and error states
rather than substituting sample records. Assessment and assurance lists use
`GET /api/v1/assessments` and `GET /api/v1/assurance`; those screens display
saved decisions and their rule context but do not recalculate scores. A
requirement detail can start backend analysis with
`POST /api/v1/assessments/{requirement_id}/run`. If the saved assurance decision
is scripted, the page offers a separate `Generate test script` action backed by
`POST /api/v1/assessments/{requirement_id}/generate-script`. Token usage is
stored per analysis/script-generation run and summarized for the current
requirement version. Ingestion creates requirements using the same backend.
In the traceability graph, scrolling over the canvas scrolls the page; use the
graph controls to zoom and fit the chain, or drag the canvas to pan.

Compliance, exports, and dashboard summary views still use demo data. The
backend does not yet expose complete read/write workflows for those areas. Test
execution and change-event resolution actions are not initiated by the
frontend. The Changes page can edit or retire an existing requirement through
the backend and shows the exact impacted artifact IDs recorded for each event;
the traceability matrix is the live view for reviewing stale links and
artifacts.
