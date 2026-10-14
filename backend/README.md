## Docker deployment

From the repository root, create a `.env` file for the backend's persistent
secret:

```bash
umask 077
printf 'SECRET_KEY=%s\n' "$(openssl rand -hex 32)" > .env
docker compose up -d --build
```

The root `docker-compose.yml` starts the frontend, FastAPI backend, and
PostgreSQL 16 containers on a shared network. The backend waits for PostgreSQL
to become healthy, then runs Alembic migrations before starting the API. The
frontend waits for the backend health check. PostgreSQL data persists in a
named Docker volume.

Use the root Compose file for the complete application. The backend-folder
`docker-compose.yml` is a standalone backend-plus-PostgreSQL option; do not
start it alongside the root stack, since both need host port `8001`.

PostgreSQL uses inline defaults (`POSTGRES_USER=postgres`,
`POSTGRES_PASSWORD=postgres`, and `POSTGRES_DB=raven_db`), so no PostgreSQL
`.env` values are required. Override them with secure credentials for
production, and keep the same values when restarting so PostgreSQL can access
its existing data volume. Keep `SECRET_KEY` unchanged as well so authentication
tokens remain valid.

RAVEN listens on host port `3001` for the frontend, `8001` for the API, and
`5433` for PostgreSQL by default, avoiding the other application's ports
`80`, `8000`, and `5432`. Set `FRONTEND_PORT`, `BACKEND_PORT`, or
`POSTGRES_PORT` in the root `.env` to choose different available host ports.
Do not expose the backend or PostgreSQL ports to the public internet unless
required; restrict their EC2 security-group ingress to trusted sources.

When using the standalone backend Compose file, run it from this directory and
provide `SECRET_KEY` in `backend/.env`. PostgreSQL uses the same inline defaults
and can be overridden with environment variables or entries in `backend/.env`.
The standalone file uses the same default host ports as the root Compose file.
Do not run the root and standalone backend Compose files at the same time, as
they would conflict on those ports.
