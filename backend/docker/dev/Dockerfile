FROM node:22.17.0-bookworm-slim
ENV NODE_ENV development

RUN corepack enable pnpm && corepack install -g pnpm@latest-10

WORKDIR /usr/local/app
COPY --chown=node:node ./package.json ./
COPY --chown=node:node ./pnpm-lock.yaml ./
COPY --chown=node:node ./pnpm-workspace.yaml ./

WORKDIR /usr/local/app/backend
COPY --chown=node:node ./backend/tsconfig.json ./
COPY --chown=node:node ./backend/package.json ./

WORKDIR /usr/local/app/lib
COPY --chown=node:node ./lib/tsconfig.json ./
COPY --chown=node:node ./lib/package.json ./

WORKDIR /usr/local/app
RUN pnpm install -r

COPY ./lib/src /usr/local/app/lib/src

WORKDIR /usr/local/app/backend
CMD ["pnpm", "tsx", "watch", "--clear-screen=false", "src/index.ts"]
