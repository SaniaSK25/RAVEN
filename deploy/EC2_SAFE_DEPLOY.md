# RAVEN EC2 deployment alongside an existing application

RAVEN runs in its own Compose project with three containers:

- `raven_frontend` publishes host port `80`.
- `raven_backend` is internal to the RAVEN Docker network on port `8000`.
- `raven_postgres` is internal to the RAVEN Docker network on port `5432`.

RADAR and RAVEN both use host port `80`. Use `switch-ec2-app.sh` to stop one
stack before starting the other, then open the selected application at
`http://<ec2-public-ip>/` (RAVEN uses the `/raven/` base path). Do not start both
stacks simultaneously because they will contend for port `80`.

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

In the EC2 security group, allow inbound TCP port `80` from the intended client
IP addresses. Backend/database ports `8000` and `5432` are not published to the
host and should not be opened.

Verify from EC2:

```sh
curl -sS -L -o /dev/null -w 'RAVEN -> %{http_code}\n' \
  http://127.0.0.1/raven/
docker-compose exec backend python -c \
  "import urllib.request; print(urllib.request.urlopen('http://127.0.0.1:8000/').read()[:80])"
```

Then open `http://<ec2-public-ip>/raven/` in a browser.

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
