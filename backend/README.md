## Docker deployment

From the repository root, create a `.env` file containing persistent,
deployment-specific secrets:

```bash
umask 077
printf 'SECRET_KEY=%s\nPOSTGRES_PASSWORD=%s\n' \
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

RAVEN uses Compose project name `raven` and listens on host port `3001` for the
frontend and `8001` for the API by default, avoiding the other application's
ports `80` and `8000`. Set `FRONTEND_PORT` or `BACKEND_PORT` in the root `.env`
to choose different available host ports. PostgreSQL is reachable only inside
RAVEN's Docker network and does not publish port `5432`. Do not expose the
backend port to the public internet unless required; restrict its EC2
security-group ingress to trusted sources.

When using the standalone backend Compose file, run it from this directory and
provide `SECRET_KEY` and `POSTGRES_PASSWORD` in `backend/.env`. It uses project
name `raven-backend` and host port `8001` by default.
