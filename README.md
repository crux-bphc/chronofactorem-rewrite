# ChronoFactorem (rewrite)

**NOTE:** Before contributing changes, we recommend you read the [Contributing Guide](./CONTRIBUTING.md)

**Steps for setup:**

1. Install [nvm](https://github.com/nvm-sh/nvm), and install Node v18.16.0 LTS using `nvm install v18.16.0`. If you're using a different node version manager, do the equivalent.
2. Activate Node v18.16.0 using `nvm use v18.16.0`
3. Install pnpm, using `npm i -g pnpm`
4. Install the packages in this repo by running `pnpm i` in the root of this repository.

**Steps to run this project:**

1. Run `docker compose down -v` to delete any existing instances of this project **WARNING:** The `-v` deletes all existing data in the database, skip this argument if you want to persist data.
2. Run `docker compose up -d --build` to build and run the container. The `-d` runs the containers in the background, so if you want to look at the logs, omit this flag.

**Ingestion**

To import new courses, add a `timetable.json` file to the `src` folder, and run `docker compose up --build --force-recreate ingestion`

This marks all old courses as archived, and inserts new courses from the `timetable.json` file.

If something goes wrong, and you need to overwrite the course data for a semester whose data has already been ingested, add the `--overwrite` flag to the ingest script in `docker-compose.yml`. **Note that overwriting course data will wipe all course, section, and timetable data for the combination of academic year and semester being overwritten.**

Check [.env.example](./.env.example) for an example env file. It can be arbitrary, though we recommend using:

```
POSTGRES_USER="chrono"
PGUSER="chrono" # should be same as POSTGRES_USER
POSTGRES_PASSWORD="aSBrbm93IHdoYXQgeW91IGFyZQ=="
POSTGRES_DB="chrono" # should be same as POSTGRES_USER for some reason
NODE_ENV="development"
PROD_URL="http://localhost:3000"
PORT=3000
GOOGLE_CLIENT_ID=859305615575-i9o0mr1vfh728u1a0tj227qbosbrk4rk.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

Obviously, we'll use different creds in production.
