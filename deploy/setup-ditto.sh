#!/bin/sh
set -eu
# Ditto injects env_file only into exposed services. The backend/database also
# need the repo secrets; copy them privately without sourcing or logging them.
if [ ! -s .ditto/secrets.env ]; then
  echo 'Upload the staging dotenv through Ditto Environment before deploying.' >&2
  exit 1
fi
umask 077
cp .ditto/secrets.env .env
printf '\nFRONTEND_URL=%s\nBACKEND_URL=%s/api\n' "$DITTO_URL_WEB" "$DITTO_URL_WEB" >> .env
