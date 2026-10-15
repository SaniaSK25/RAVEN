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
`POSTGRES_PASSWORD=postgres`, and `POSTGRES_DB=raven_db`), so no PostgreSQL
environment values are required for local startup. For deployment, provide a
strong, persistent `SECRET_KEY` and unique PostgreSQL credentials through the
root `.env` file (based on `.env.example`) or exported environment variables.
Do not use the local fallback secret in production. Keep the database
credentials and `SECRET_KEY` unchanged across restarts so the database can use
its existing volume and authentication tokens remain valid.

The frontend host port is fixed at `80` to match the RADAR stack. Backend and
PostgreSQL ports are not published to the host.

Stop the stack with `docker compose down`. This keeps the database volume; do
not use `docker compose down --volumes` unless you intend to delete its data.

## Switching EC2 applications

On Windows, run `switch-ec2-app.bat` from the repository root to open an
interactive AWS Systems Manager session. Choose PS1 (RADAR) or PS2 (RAVEN) in
the EC2 terminal. The session runs `switch-ec2-app.sh`, which stops the other
Compose stack and builds/starts the selected one. The batch file contains the
instance ID and region; the shell script contains the EC2 application paths.
Deploy the latest repository changes to EC2 first so
`/home/ssm-user/RAVEN/switch-ec2-app.sh` exists there. AWS CLI and Session
Manager Plugin must be installed locally, and the instance must be online in
Systems Manager. The script uses `docker compose down` without removing
volumes, so database data is retained.
