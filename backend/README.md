## Docker deployment

From the repository root, build and start the complete stack:

```sh
docker compose up -d --build
```

No `.env` file is needed for local startup. The root `docker-compose.yml`
builds the frontend and backend from their respective Dockerfiles and starts
them with PostgreSQL 16 on a shared network. The backend waits for PostgreSQL
to become healthy, then runs Alembic migrations before starting the API. The
frontend waits for the backend health check. PostgreSQL data persists in the
`raven_postgres_data` named volume.

The frontend is available at `http://localhost:3001/raven/` by default. The
backend and database are only reachable inside the Docker network; the
frontend's Next.js proxy forwards API requests to the backend.

The startup migration creates the schema expected by the current backend and
converts rows from the earlier requirements-only schema into versioned
requirements. Back up an existing database before deploying schema changes.

PostgreSQL uses inline defaults (`POSTGRES_USER=postgres`,
`POSTGRES_PASSWORD=postgres`, and `POSTGRES_DB=raven_db`), so no PostgreSQL
environment values are required for local startup. For deployment, provide a
strong, persistent `SECRET_KEY` and unique PostgreSQL credentials through the
root `.env` file (based on `.env.example`) or exported environment variables.
Do not use the local fallback secret in production. Keep the database
credentials and `SECRET_KEY` unchanged across restarts so the database can use
its existing volume and authentication tokens remain valid.

Set `FRONTEND_PORT` in the root `.env` or environment to change the frontend's
host port from `3001`. The frontend port is bound to loopback by default for
the EC2 nginx reverse proxy; backend and PostgreSQL ports are not published to
the host.

Stop the stack with `docker compose down`. This keeps the database volume; do
not use `docker compose down --volumes` unless you intend to delete its data.
