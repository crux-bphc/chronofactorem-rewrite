# Isolated hosting and Ditto

This deployment uses the application's master code, compiled frontend assets,
a Node production backend, and private Postgres 15. It does not connect to the
official Chronofactorem database. `serveStaging.ts` ingests the bundled
`backend/src/timetable.json` only when there are no courses; redeploys and
restarts preserve existing data. TypeORM's upstream schema synchronization still
runs at startup, so back up data before deploying schema changes.

## Persistent standalone instance

Create a private `.env` using `.env.example` as a list of required keys. Generate
a new Postgres password, base64 PEM RSA session keypair, SQIDS alphabet, and
CHRONO_SECRET for this installation. Set NODE_ENV=production, DB_HOST=db,
PGPORT=5432, BACKEND_PORT=3000 and LOG_MODE=production. Set FRONTEND_URL to the
HTTPS origin and BACKEND_URL to that origin plus `/api`. Supply valid Logto
credentials at runtime; no `.env` or secrets are copied into image layers.

```sh
docker compose -p chrono -f docker-compose.staging.yml -f deploy/compose.host.yml up -d --build
soumi-project register chrono 3110
soumi-project check chrono
```

Only `127.0.0.1:3110` is published. Database contents live in the `chrono_dbdata`
named volume. Do not use `down -v` for updates. The frontend reverse proxy is
inside the app container; the shared soumi.dev gateway handles external routing,
TLS and admin access. `/healthz` checks the backend's live database connection.

## Ditto

Add `crux-bphc/chronofactorem-rewrite` to Ditto's allowed repositories. Deploy a
PR containing these files through the dashboard. `staging.yml` selects the
separate Compose file and assigns HTTP ports through Ditto; no fixed host ports
or host bind mounts are in that Compose file.

Upload a complete staging dotenv through Ditto's Environment editor. Generate
separate database/session/machine secrets for staging. The setup hook privately
copies this dotenv for the non-exposed backend and database, then sets
FRONTEND_URL/BACKEND_URL from DITTO_URL_WEB. Relative frontend share URLs work
on each worker. Each worker has its own database volume; Ditto's teardown deletes
that volume, so worker data is disposable. Standalone instance data is separate.

In the Logto app, allow each origin's `/api/auth/callback` redirect and `/login`
post-sign-out redirect. For this server the standalone origin is
`https://chrono.soumi.dev`; use the assigned worker origin for PR previews.
Reusing Logto credentials does not require sharing the production database,
Chrono session keys, or the soumi gateway signing key.
