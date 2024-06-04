FROM node:20.14.0-slim AS build-stage
ENV NODE_ENV production
WORKDIR /usr/src/app/backend

ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="${PATH}:${PNPM_HOME}"

COPY --chown=node:node ./backend/tsconfig.json ./
COPY --chown=node:node ./backend/.env* ./

RUN npm install -g pnpm

COPY ./backend/package.json ./
COPY ./backend/pnpm-lock.yaml ./

RUN pnpm fetch --prod
RUN pnpm install -r --offline --prod

COPY --chown=node:node ./backend/src ./src

WORKDIR /usr/src/app/lib

COPY --chown=node:node ./lib/tsconfig.json ./

COPY ./lib/package.json ./
COPY ./lib/pnpm-lock.yaml ./

RUN pnpm fetch --prod
RUN pnpm install -r --offline --prod

COPY --chown=node:node ./lib/src ./src

WORKDIR /usr/src/app/backend

RUN pnpm tsc --build

FROM node:20.14.0-slim
ENV NODE_ENV production
WORKDIR /usr/src/app

ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="${PATH}:${PNPM_HOME}"

RUN apt-get update && apt-get install -y --no-install-recommends dumb-init && apt-get clean && rm -rf /var/lib/apt/lists/*
COPY --chown=node:node --from=build-stage /usr/src/app/backend/node_modules /usr/src/app/backend/node_modules
COPY --chown=node:node --from=build-stage /usr/src/app/lib/dist /usr/src/app/lib/src
COPY --chown=node:node --from=build-stage /usr/src/app/lib/node_modules /usr/src/app/lib/node_modules
COPY --chown=node:node --from=build-stage /usr/src/app/lib/package.json /usr/src/app/lib/package.json

COPY --chown=node:node --from=build-stage /usr/src/app/backend/build /usr/src/app/backend/build
COPY --chown=node:node --from=build-stage /usr/src/app/backend/package.json /usr/src/app/backend/package.json

USER node
WORKDIR /usr/src/app/backend
CMD ["dumb-init", "node", "--enable-source-maps", "build/index.js"]