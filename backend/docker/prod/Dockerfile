FROM node:22.17.0-bookworm-slim AS build-stage
ENV NODE_ENV production

RUN corepack enable pnpm && corepack install -g pnpm@latest-10

WORKDIR /usr/src/app
COPY --chown=node:node ./package.json ./
COPY --chown=node:node ./pnpm-lock.yaml ./
COPY --chown=node:node ./pnpm-workspace.yaml ./

WORKDIR /usr/src/app/backend
COPY --chown=node:node ./backend/tsconfig.json ./
COPY --chown=node:node ./backend/package.json ./

WORKDIR /usr/src/app/lib
COPY --chown=node:node ./lib/tsconfig.json ./
COPY --chown=node:node ./lib/package.json ./

WORKDIR /usr/src/app
RUN pnpm install --prod -r

WORKDIR /usr/src/app/lib
COPY --chown=node:node ./lib/src ./src
RUN pnpm tsc --build

WORKDIR /usr/src/app/backend
COPY --chown=node:node ./backend/src ./src
RUN pnpm tsc --build

USER node
CMD ["dumb-init", "node", "--enable-source-maps", "build/index.js"]

FROM node:22.17.0-bookworm-slim
ENV NODE_ENV production
WORKDIR /usr/src/app

RUN corepack enable pnpm && corepack install -g pnpm@latest-10

RUN apt-get update && apt-get install -y --no-install-recommends dumb-init && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --chown=node:node --from=build-stage /usr/src/app/node_modules /usr/src/app/node_modules
COPY --chown=node:node --from=build-stage /usr/src/app/backend/node_modules /usr/src/app/backend/node_modules
COPY --chown=node:node --from=build-stage /usr/src/app/backend/package.json /usr/src/app/backend/package.json
COPY --chown=node:node --from=build-stage /usr/src/app/backend/build /usr/src/app/backend/build

USER node
WORKDIR /usr/src/app/backend/build
CMD ["dumb-init", "node", "--enable-source-maps", "backend/src/index.js"]
