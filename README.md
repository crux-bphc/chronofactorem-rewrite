# ChronoFactorem (rewrite)

**NOTE:** Before contributing changes, we recommend you read the [Contributing Guide](./CONTRIBUTING.md)

**NOTE:** ⚠️ If you have a development environment with latest commit at or before c288045, please read the [dev section](#dev) carefully. Old development environments are now broken.

## Steps for setup:

1. Install [nvm](https://github.com/nvm-sh/nvm), and install Node v20.14.0 LTS using `nvm install v20.14.0`. If you're using a different node version manager, do the equivalent.
2. Activate Node v20.14.0 using `nvm use v20.14.0`
3. Install pnpm, using `npm i -g pnpm`
4. Install the packages in this repo by running `pnpm i` in the the `backend`, `lib` and `frontend` folders of this repository.

Check [.env.example](./.env.example) for an example env file. It can be arbitrary, though we recommend using:

```
POSTGRES_USER="chrono"
PGUSER="chrono" # should be same as POSTGRES_USER
POSTGRES_PASSWORD="aSBrbm93IHdoYXQgeW91IGFyZQ=="
POSTGRES_DB="chrono" # should be same as POSTGRES_USER for some reason
PGPORT=5432
DB_HOST="db"
NODE_ENV="development"
BACKEND_URL="http://localhost:5000/api"
FRONTEND_URL="http://localhost:5000"
BACKEND_PORT=3000
GOOGLE_CLIENT_ID="859305615575-i9o0mr1vfh728u1a0tj227qbosbrk4rk.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="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"
FRONTEND_DEV_PORT=5173
JWT_PRIVATE_KEY="LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFb3dJQkFBS0NBUUVBc3luWEt0RUtvdzFsaXZXd1dTVkdzVlQ2Nnl3RTZCZXpZRzM4TTJMTXNmRDAwSjhCCmNNalVreTdzRmxSN2pzV2NjRjk0Y0tIbXFPcEdlYy9LcDdFSUhJWFhrZFB3TncyRHltOE1rc1Z4WjlDUHpIU1kKTmptRzZ2akVlVUgxcEJGc1NaLzVoTGtldzNXd2NQVHNwWVgraVU5Qm82L2M0QVFEMG9qamUyZk1iRTNDK3hLTwpPckFYWkE0V1ZmTEZiL0pQbTgvQlJ6ODk0Z1pwSFg4Sk9oVmRFNjFkdzhsRGFSUXo4RzhoRjJOMlA1UnMwbGx3CnJxSkxadCtTZW5DSEt6eWNOYmJFMGNhMGFRZnpHcW9wUlNGS28vc21id3Jydi94a0ZXcEkxL2ZhUDhGMWEyY1MKSmQ5RVZ4M245NzN6ZVdFekZnOUFWTEVQMGZZdlNTQXJzWUNMbHdJREFRQUJBb0lCQUd3NWhnUVRLajI4UmU1ZQo0eHUyYkxHS0I5Z3ZTdmQzK1o3eVVUb3BJRVVNckpXb3R4SU4vbnE2Q1ZxanhjOUVoMjlKL0ZMdE9Zd25tRkxVCnRqSDl1a3lnZk10V0h2RGlkUTIvYnZUcDE4dENMTnJ3UTFIZUJpWENCOHpIano2QVY4MVJtVVFYSHdJckFWMzYKVlVqWFhCNU5oZlQrc29tUFkwKzE2TlFPcTJsdnZENUtoZ1VUYjdPM2V6cXQ5b0VZM3ZqTURhaU5mZ0poWndRbQpUcjkvV2k2OWxyNGtvWE80KzhrT3dDUFRlOWJYVFYxTTREcGpoM29CNTV3ZUJUNXUxK3IxZnJPdml6cFJCUTB2CjhvNHlEYjVGdTJqTDQyLzR2Z0t2VEczd0pPNVE3MVJ2bGNoSktRTjhuZFJJaU5rMUNadXJ5QjhRdWRpelpsKzkKcFFlbUFZRUNnWUVBNW1wM2N1NUdBK3cxY2s2amlhRWora1F0UmJ3V2VTall0S2hmTnhtNjRGZ0VNMCtlM2pXWQpXRnI3VVRYVE9CeGZ6UkZqeVBTUVBqcUJYc2hXajZzcURGMmVWa3h1V3YwdlpKc082YjBYV3BNVmtiQUx0M0UyCk5DNldhQjZYS3lubGlKcWU5aUQ4cHlRSSt2dzlJY2ZWMEZyOUdxSG81a05hRFoyOHhBKytqNmNDZ1lFQXh3NkkKRjhIajV1RkIyS2NheE5RUG1BcUI0QUUrdG1UbzF1Yk1kZUFDbFE5UWRkU01Sc2VvSk8yQzI4bnpLSGpvRlg1cQpxajJhVkYrbTlDZWFJRW5vVzhvS2MvODJreVNpVVo3WXUveWRaeE5IcDloVEhRNEE1QjNqaUdIZUsxVHZhdTV1CmZtcHhrY01zVE9wSlorb2FKbTU0cnVBZXlIaWRpTWRTN0VRN0lwRUNnWUFrUUdYd3NDcFYzYWovQmY1VzNnSnkKRXAzbzFkSFhXQ1RZTDVGamN1bmkrQllaR0pMUE5URjEzVUtqSVV2TkRUSEphczMvUlBNWXgwMnBZdTJ6aHVPRAp0SXIvMnVDVjhqV3RwM091TkxEaThEYzVoN0FnT1hDa3Z4dXMzL3M2c0VuTHQwQUJTMmxVeHFlZkRXWjAxU0wvCnVBRVFXcDd3ODNITXFKK1ZYVURIQ3dLQmdRQ3RZMjBNTktuTnJKenNtUEpxVE1XZ2pGYUF4dFRYajZKNXZ1U08KTUtoUEt0M05KVzFqSWZyRzM5UkNtdkNoYWwvT2lTVmtVUENqV2daVldrR1lxb2dwbkIzcTJIMnpRZy9aeE9ISgpMY3Yxd3dlQm5wOFhDZUdnMHFBbFpncGQrRWZyL3ZCa1VWZkh2aGhTanltTnlJOHF0c09Nb0ZCd0V4QTEybG5TCno4UXE0UUtCZ0UvQTdtM2ZLVlBTa25ma05iZSt2aENMbHEyMUFCTkE1bmZtbDFLUlNmZmhXQUJWNDZ5WnFHanMKa1RUUk00bWFpNmZ3YUkydGRDWmljcGd4OG5uSHFkM2RndVRMOURueVJSbWR0ZEoyWDAvOHpvcUdLUXlxU2g2VwpwUElhSmZ3UWk2UUU4RXJTRVNkZFl6U0J0Ykh4L0xWeE1QMWdENENabDhZNXkwMEdBNW41Ci0tLS0tRU5EIFJTQSBQUklWQVRFIEtFWS0tLS0t"
JWT_PUBLIC_KEY="LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFzeW5YS3RFS293MWxpdld3V1NWRwpzVlQ2Nnl3RTZCZXpZRzM4TTJMTXNmRDAwSjhCY01qVWt5N3NGbFI3anNXY2NGOTRjS0htcU9wR2VjL0twN0VJCkhJWFhrZFB3TncyRHltOE1rc1Z4WjlDUHpIU1lOam1HNnZqRWVVSDFwQkZzU1ovNWhMa2V3M1d3Y1BUc3BZWCsKaVU5Qm82L2M0QVFEMG9qamUyZk1iRTNDK3hLT09yQVhaQTRXVmZMRmIvSlBtOC9CUno4OTRnWnBIWDhKT2hWZApFNjFkdzhsRGFSUXo4RzhoRjJOMlA1UnMwbGx3cnFKTFp0K1NlbkNIS3p5Y05iYkUwY2EwYVFmekdxb3BSU0ZLCm8vc21id3Jydi94a0ZXcEkxL2ZhUDhGMWEyY1NKZDlFVngzbjk3M3plV0V6Rmc5QVZMRVAwZll2U1NBcnNZQ0wKbHdJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0t"
NGINX_PORT=5000
SQIDS_ALPHABET="P1fF29hw8BARdJpoSUZIDnXVWNzcCeGrlgk0qbsMxjYKaE5uLTyOt376Hmv4Qi"
VITE_FRONTEND_URL="http://localhost:5000"
SESSION_MAX_AGE_MS=86400000
VITE_CMS_EXTENSION_ID="ebjldebpahljhpakgngnandakdbajdnj"
CHRONO_SECRET="99fcf0561404319f865d52ec3d3d6239ccc1fbcd5f1f6e5c72cbfd3f5b6feff119ba5dc9a027f06e1ab5fcc39de6c71da6fc46c46b0206c06097394491f26b15"
```

Obviously, we'll use different creds in production.

## Information about this project's Docker system

This project's docker build system relies on something Docker Compose calls "profiles"

This project has 4 profiles as of now:

- `dev`
- `prod`
- `testing`
- `ingestion`

## Steps to run any given profile:

1. Run `docker compose --profile PROFILE down` to stop, and delete any containers in the profile named PROFILE.

   **NOTE:** Adding a `-v` flag at the end of this command deletes only the node_modules cache for the `frontend-dev` container. If you want to clear database data, you will have to delete the `backend/data` folder. Deleting this usually requires root permissions.

2. Run `docker compose --profile PROFILE up --build` to build and run all containers in the profile named PROFILE.

   **NOTE:** Adding a `-d` flag runs the containers in the background, so if you want to look at the logs, omit this flag.

### Dev

Running the project with the `dev` profile runs the backend with `nodemon`, and creates a bind mount with vite on the frontend, hot-reloading the running containers as soon as you save changes to your code. More importantly, this also creates an `nginx` container that makes the frontend and backend the same host to allow easy integration of the two. The `NGINX_PORT` defines which port it opens up for development. The frontend will be available at `http://localhost:NGINX_PORT/` and the backend will be at `http://localhost:NGINX_PORT/api`.

**NOTE:** Changes to the `package.json`, `pnpm-lock.yaml` obviously, will require container rebuilds, and since the frontend container caches dependencies for the `dev` profile, we highly recommend rebuilding the containers entirely using `docker compose --profile dev down` and `docker compose --profile dev up --build`. Additionally, **any changes to code in the `lib` directory will also require a container rebuild**, due to the current state of `nodemon` not supporting external reference-based builds, see https://github.com/TypeStrong/ts-node/issues/897.

#### Containers in the `dev` profile

- db
- backend-dev
- frontend-dev
- nginx-dev

**NOTE:** This same `db` container is used in `prod` and `ingestion`

### Prod

**NOTE:** As of this commit, prod containers for the frontend do not exist, and it is not verified whether or not the backend prod containers still work after the container reworking.

Running the project with the `prod` profile compiles the backend code, and runs the container while replicating the exact process with which the project is hosted on our server. It is a good idea to test any PR with this profile before merging it. **In rare cases, what might work in `dev` might not work in `prod`.** Better safe than sorry!

#### Containers in the `prod` profile

- db
- backend-prod

**NOTE:** This same `db` container is used in `dev` and `ingestion`

### Testing

**NOTE:** As of this commit, prod/testing containers for the frontend do not exist, and it is not verified whether or not the backend testing containers still work after the container reworking.

Running the project with the `testing` profile copies the project into the container like dev would, but runs tests instead of running the code with `nodemon`. Testing uses the environment variables from [.env.testing](./.env.testing).

**NOTE:** For `testing`, the tests insert test courses from [timetable.test.json](./src/backend/tests/timetable.test.json), runs the necessary tests, and then removes these test courses. For safety, it also clears the db before inserting these test courses, just like an auto-flushing toilet would. Two flushes: once before you start using it, and once after you're done.

**NOTE:** This replicates the base environment of `dev`, not `prod`. So, unit tests running fine doesn't guarantee that the project will run fine in prod. It is better to sanity check this separately. This failure to replicate the `prod` env is due to how `ts-jest` runs tests for TypeScript files. (It transforms .ts files instead of transpiling them using some tool like Babel). The `prod` base environment assumes a kind of two-staged "build and then run" build, which is not possible because of `ts-jest`.

#### Containers in the `testing` profile

- db-testing
- backend-testing

**NOTE:** This `db-testing` container is NOT THE SAME as the one used in `prod`, `dev` and `ingestion`

### Ingestion

To import new courses, add a `timetable.json` file to the `src` folder, and run `docker compose --profile ingestion up --build`

This marks all old courses as archived, and inserts new courses from the `timetable.json` file.

If something goes wrong, and you need to overwrite the course data for a semester whose data has already been ingested, add the `--overwrite` flag to the ingest script in `docker-compose.yml`. **Note that overwriting course data will wipe all course, section, and timetable data for the combination of academic year and semester being overwritten.**

#### Containers in the `ingestion` profile

- db
- ingestion

**NOTE:** This same `db` container is used in `dev` and `prod`
**NOTE:** This same `ingestion` container is the container that runs the ingestion script.
