## Docker deployment

From the repository root, create a `.env` file containing persistent,
deployment-specific secrets:

```bash
umask 077
printf 'SECRET_KEY=%s\nPOSTGRES_PASSWORD=%s\nPOSTGRES_USER=raven\nPOSTGRES_DB=raven\n' \
  "$(openssl rand -hex 32)" \
  "$(openssl rand -hex 32)" > .env
docker compose up -d --build
```

The root `docker-compose.yml` starts the frontend, FastAPI backend, and
PostgreSQL 16 containers on a shared network. The backend waits for PostgreSQL
to become healthy, then runs Alembic migrations before starting the API. The
frontend waits for the backend health check. PostgreSQL data persists in a
named Docker volume; its port is not published to the host.

Use the root Compose file for the complete application. The backend-folder
`docker-compose.yml` is a standalone backend-plus-PostgreSQL option; do not
start it alongside the root stack, since both need host port `8001`.

Keep both secrets in the root `.env` or a protected deployment secret store.
Use the same values when restarting an existing deployment so authentication
tokens remain valid and PostgreSQL can unlock its data volume. The secrets are
not committed to source control.

RAVEN listens on host port `3001` for the frontend, `8001` for the API, and
`5433` for PostgreSQL by default, avoiding the other application's ports
`80`, `8000`, and `5432`. Set `FRONTEND_PORT`, `BACKEND_PORT`, or
`POSTGRES_PORT` in the root `.env` to choose different available host ports.
Do not expose the backend or PostgreSQL ports to the public internet unless
required; restrict their EC2 security-group ingress to trusted sources.

When using the standalone backend Compose file, run it from this directory and
provide `SECRET_KEY` and `POSTGRES_PASSWORD` in `backend/.env`. It uses the
same default host ports as the root Compose file. Do not run the root and
standalone backend Compose files at the same time, as they would conflict on
those ports.
