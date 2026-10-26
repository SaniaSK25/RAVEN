## Docker deployment

From the repository root, build and start the complete stack:

```sh
cp .env.example .env
chmod 600 .env
# Edit .env and replace POSTGRES_PASSWORD with a strong, persistent value.
docker-compose up -d --build
```

## Local development

From `backend/`, apply database migrations before starting the API:

```powershell
uv sync
uv run uvicorn app.main:app --reload
```

In development, API startup automatically applies pending Alembic migrations
before accepting requests. This creates the tables for a fresh local SQLite
database and applies schema changes after updates; it includes `id_counters`,
used to assign `REQ-` keys during requirement import. The default local
database is `backend/raven.db`. You can also apply migrations explicitly with
`uv run alembic upgrade head`.

The root `docker-compose.yml` builds the frontend and backend from their
respective Dockerfiles and starts them with PostgreSQL 16 on a shared network.
The backend waits for PostgreSQL to become healthy, then runs Alembic migrations
before starting the API. The frontend waits for the backend health check.
PostgreSQL data persists in the `raven_postgres_data` named volume.

The frontend is available at `http://localhost/raven/`. On EC2, use
`http://<ec2-public-ip>/raven/`. RAVEN and RADAR both use host port 80; the
application switcher stops one stack before starting the other, so only the
selected frontend binds that port. Allow inbound TCP port 80 in the EC2
security group. The backend and database remain reachable only inside the
Docker network; the frontend's Next.js proxy forwards API requests to the
backend.

The startup migration creates the schema expected by the current backend and
converts rows from the earlier requirements-only schema into versioned
requirements. Back up an existing database before deploying schema changes.

PostgreSQL uses inline defaults (`POSTGRES_USER=postgres`,
`POSTGRES_PASSWORD=postgres`, and `POSTGRES_DB=raven_db`). For production,
replace these with unique credentials in the root `.env` file. Keep the
database credentials unchanged across restarts so PostgreSQL can use its
existing volume. The backend currently does not use `SECRET_KEY` for token
signing, so it is not required by this deployment.

## Batch requirement assessment

After importing requirements, submit their IDs or requirement keys to
`POST /api/v1/assessments/batch-run` in groups of 1–10:

```json
{
  "requirement_ids": ["LIMS-001", "LIMS-002"]
}
```

The API batches evidence extraction, then independently validates, scores, and
persists each requirement. Risk scoring and assurance decisions remain
deterministic; severity 5 always requires scripted testing, while severity 1–4
use the configured risk band (High → Scripted, Medium → Exploratory,
Low → Unscripted). Test-script generation is deferred to the existing
per-requirement action. The response reports exact provider-reported token
totals for each batch; requirement-level token shares are proportional
estimates and are labeled as such. Batch totals are retained in
`batch_token_usage`, while per-requirement estimates remain visible alongside
the existing usage history. Failed extraction is reported separately from
per-requirement persistence failures. The ingestion page submits up to ten
requirements per API request. Each batch extracts all evidence groups in
exactly one model call, using schema-enforced structured output with compact
ordered arrays and no retries or individual-requirement fallback. This reduces
invalid output and response size.
Invalid or incomplete model output fails the batch rather
than making more calls. The batch call has an 8,192-token maximum output
allowance to avoid Bedrock's 1,024-token default truncating the response; this
is a ceiling, and usage is based on tokens actually generated. Evidence notes
are complete, grounded explanatory sentences, normally 8-12 words and at
most 160 characters, to reduce output time while retaining context.

If Bedrock returns `ServiceUnavailableException` after its SDK retries, the API
marks the batch as failed and responds with HTTP 503; wait briefly and retry the
batch from the ingestion page. This indicates temporary provider unavailability,
not a problem with the imported requirements.

The Next.js frontend proxy allows 15 minutes for a backend response. If that
request times out, the backend may still finish processing; check persisted
assessments before retrying the batch.

The frontend host port is fixed at `80` to match the RADAR stack. Backend and
PostgreSQL ports are not published to the host.

Stop the stack with `docker-compose down`. This keeps the database volume; do
not use `docker-compose down --volumes` unless you intend to delete its data.

## Switching EC2 applications

On Windows, run `switch-ec2-app.bat` from the repository root to open an
interactive AWS Systems Manager session. Choose PS1 (RADAR) or PS2 (RAVEN) in
the EC2 terminal. The session runs `switch-ec2-app.sh`, which stops the other
Compose stack and builds/starts the selected one. The batch file contains the
instance ID and region; the shell script contains the EC2 application paths.
Deploy the latest repository changes to EC2 first so
`/home/ssm-user/RAVEN/switch-ec2-app.sh` exists there. AWS CLI and Session
Manager Plugin must be installed locally, and the instance must be online in
Systems Manager. The script uses `docker-compose down` without removing
volumes, so database data is retained.
