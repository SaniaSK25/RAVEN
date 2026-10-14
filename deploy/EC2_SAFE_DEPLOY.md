# RAVEN EC2 deployment alongside an existing application

RAVEN runs in its own Compose project with three containers:

- `raven_frontend` publishes host port `3001` (default).
- `raven_backend` is internal to the RAVEN Docker network on port `8000`.
- `raven_postgres` is internal to the RAVEN Docker network on port `5432`.

The existing application remains at `http://<ec2-public-ip>/` on port `80`.
RAVEN is available separately at `http://<ec2-public-ip>:3001/raven/`.
This setup does not require changes to the existing application's containers,
Docker network, frontend, or web-server configuration.

## Deploy RAVEN

From the RAVEN repository directory on EC2:

```sh
git pull
# Keep a strong, persistent SECRET_KEY and unique database credentials in
# the server-only root .env file. Never commit .env.
docker-compose up -d --build
docker-compose ps
docker-compose logs --tail=50 backend frontend
```

Confirm only RAVEN's three containers are listed by `docker-compose ps`:
`raven_frontend`, `raven_backend`, and `raven_postgres`.

In the EC2 security group, allow inbound TCP port `3001` from the intended
client IP addresses. Avoid opening backend/database ports `8000` or `5432`.
If the RAVEN website must be publicly accessible, allow `3001` from the
required audience; otherwise restrict it to trusted IPs.

Verify from EC2:

```sh
curl -sS -L -o /dev/null -w 'RAVEN -> %{http_code}\n' \
  http://127.0.0.1:3001/raven/
docker-compose exec backend python -c \
  "import urllib.request; print(urllib.request.urlopen('http://127.0.0.1:8000/').read()[:80])"
```

Then open `http://<ec2-public-ip>:3001/raven/` in a browser.

## RAVEN-only operations

Run these commands from the RAVEN repository directory. They are scoped to
the `raven-stack` Compose project and do not stop the other application's
containers:

```sh
docker-compose stop
docker-compose up -d
docker-compose down
```

Do not run global container stop/prune commands. Do not use
`docker-compose down --volumes` unless intentionally deleting RAVEN's database.
