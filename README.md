# ChronoFactorem (rewrite)

**NOTE:** Before contributing changes, we recommend you read the [Contributing Guide](./CONTRIBUTING.md)

**Steps for setup:**

1. Install [nvm](https://github.com/nvm-sh/nvm), and install Node v18.16.0 LTS using `nvm install v18.16.0`. If you're using a different node version manager, do the equivalent.
2. Activate Node v18.16.0 using `nvm use v18.16.0`
3. Install pnpm, using `npm i -g pnpm`
4. Install the packages in this repo by running `pnpm i` in the root of this repository.

**Steps to run this project:**

1. Run `docker compose down -v` to delete any existing instances of this project **WARNING:** The `-v` deletes all existing data in the database, skip this argument if you want to persist data.
2. Run `docker compose up -d --build` to build and run the container

Check [.env.example](./.env.example) for an example env file. It can be arbitrary, though we recommend using:

```
POSTGRES_USER="chrono"
POSTGRES_PASSWORD="aSBrbm93IHdoYXQgeW91IGFyZQ=="
POSTGRES_DB="chronofactorem"
POSTGRES_SOCKET="/var/run/postgresql" # Do not change this, it is required by postgres
NODE_ENV="development"
PROD_URL="https://chrono.crux-bphc.com"
PORT=3000
```

Obviously, we'll use different creds in production.
