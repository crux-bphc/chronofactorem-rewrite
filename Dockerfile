FROM node:18.16.0-slim AS build-stage
ENV NODE_ENV production
WORKDIR /usr/src/app

ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="${PATH}:${PNPM_HOME}"

RUN npm install -g pnpm

RUN pnpm i -g typescript

COPY pnpm-lock.yaml ./

RUN pnpm fetch --prod

COPY --chown=node:node . .

COPY . .

RUN pnpm install -r --offline --prod

RUN tsc

FROM node:18.16.0-slim
WORKDIR /usr/src/app

COPY --chown=node:node --from=build-stage /usr/src/app/build /usr/src/app/build
COPY --chown=node:node --from=build-stage /usr/src/app/node_modules /usr/src/app/node_modules

RUN apt-get update && apt-get install -y --no-install-recommends dumb-init && apt-get clean && rm -rf /var/lib/apt/lists/*

USER node
CMD ["dumb-init", "node", "build/src/index.js"]