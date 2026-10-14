# EC2 safe-deploy runbook — RAVEN as 2nd app, application 1 must keep running

Goal: RAVEN at `http://<ec2-host>/raven/`, app1 at `http://<ec2-host>/` uninterrupted.

Why app1 is safe by construction:

- No shared ports: RAVEN publishes only `127.0.0.1:3001` (loopback). Nothing
  listens on `80/8000/5432`. Backend (`8000`) and postgres (`5432`) are
  Docker-internal only.
- Isolated project: compose `name: raven-stack` + unique `raven_net` network +
  `raven_postgres_data` volume + `raven_*` container names. Commands run in the
  RAVEN directory only affect this project.
- Memory caps (`db 1g / backend 2g / frontend 1g`) so RAVEN cannot OOM app1.
  Lower them if `free -h` shows a small instance.
- nginx change is additive: one `include` inside the existing port-80 `server`
  block. `location /` (app1) is never edited. `nginx -t` gates every reload.

## 0. Preflight (read-only, safe to run any time)

```bash
docker ps --format 'table {{.Names}}\t{{.Ports}}\t{{.Image}}'
ss -tlnp | grep -E ':80|:300|:800|:5432' || true
free -h; df -h / | tail -1
sudo nginx -T 2>&1 | head -80
curl -s -o /dev/null -w 'app1 / -> %{http_code}\n' http://127.0.0.1/
```

Record app1's container names + the file containing its `server { listen 80 }`
block before proceeding.

## 1. Start RAVEN (does not touch app1)

```bash
git pull
cp .env.example .env   # first time only; then set SECRET_KEY + POSTGRES_PASSWORD
docker compose up -d --build
docker compose ps      # expect raven_frontend / raven_backend / raven_postgres only
docker compose logs --tail=50 backend frontend
```

The local-development defaults are not suitable for production. Keep the
root `.env` file configured with a strong, persistent `SECRET_KEY` and unique
PostgreSQL credentials before deploying; never commit `.env`.

Forbidden on the shared host (would affect app1):

```bash
# NEVER run these:
docker stop $(docker ps -q)
docker system prune -a
docker compose down --volumes   # deletes RAVEN db data; also never add -v casually
```

Scoped stop (RAVEN only, app1 keeps running):

```bash
docker compose stop        # pause RAVEN
docker compose up -d       # resume
docker compose down        # remove RAVEN containers only (same project)
```

## 2. Verify RAVEN internally (before exposing via nginx)

```bash
curl -s -o /dev/null -w 'raven internal -> %{http_code}\n' http://127.0.0.1:3001/raven/
docker compose exec backend python -c "import urllib.request; print(urllib.request.urlopen('http://127.0.0.1:8000/').read()[:80])"
curl -s -o /dev/null -w 'app1 / still -> %{http_code}\n' http://127.0.0.1/
```

## 3. Expose /raven/ via nginx (additive only)

```bash
sudo cp -a /etc/nginx /root/nginx.backup.$(date +%F)
sudo cp deploy/nginx-raven.conf /etc/nginx/snippets/raven.conf
# Edit ONLY the existing port-80 server block; add this line next to `location /`:
#   include /etc/nginx/snippets/raven.conf;
sudo nginx -t && sudo systemctl reload nginx   # reload ONLY if test passes
```

## 4. Post-deploy checks (both apps)

```bash
curl -s -o /dev/null -w 'app1 / -> %{http_code}\n' http://127.0.0.1/
curl -s -o /dev/null -w 'raven /raven/ -> %{http_code}\n' http://127.0.0.1/raven/
docker stats --no-stream --format 'table {{.Name}}\t{{.MemUsage}}'
```

## 5. Rollback

```bash
# RAVEN only:
docker compose down
# nginx:
sudo cp -a /root/nginx.backup.<date>/* /etc/nginx/ && sudo systemctl reload nginx
```

Security groups: leave `80` (+ restricted `22`) open; do NOT open
`3001/8001/5432` to `0.0.0.0/0` — nginx reaches RAVEN over loopback.
