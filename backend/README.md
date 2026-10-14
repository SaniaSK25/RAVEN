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

Keep both secrets in the root `.env` or a protected deployment secret store.
Use the same values when restarting an existing deployment so authentication
tokens remain valid and PostgreSQL can unlock its data volume. The secrets are
not committed to source control.

The frontend listens on port `3000` and the API on port `8000` by default; set
`FRONTEND_PORT` or `BACKEND_PORT` in the root `.env` to change the host ports.
Do not expose the backend port to the public internet unless required; restrict
its EC2 security-group ingress to trusted sources.
