FROM node:22.17.0-bookworm-slim
ENV NODE_ENV development
WORKDIR /usr/local/app/backend

RUN npm install -g pnpm

COPY ./backend/package.json ./
COPY ./backend/pnpm-lock.yaml ./
COPY ./backend/tsconfig.json ./

RUN pnpm fetch
RUN pnpm install -r --offline

WORKDIR /usr/local/app/lib

COPY ./lib/package.json ./
COPY ./lib/pnpm-lock.yaml ./
COPY ./lib/tsconfig.json ./

RUN pnpm fetch
RUN pnpm install -r --offline

COPY ./lib/src /usr/local/app/lib/src

WORKDIR /usr/local/app/backend

CMD ["pnpm", "tsx", "watch", "--clear-screen=false", "src/index.ts"]
