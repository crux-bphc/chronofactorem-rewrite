# ChronoFactorem (rewrite)

Steps to run this project:

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
