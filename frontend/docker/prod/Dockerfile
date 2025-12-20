FROM node:22.17.0-bookworm-slim AS build-stage
ENV NODE_ENV production

RUN corepack enable pnpm && corepack install -g pnpm@latest-10

WORKDIR /usr/src/app/frontend
COPY --chown=node:node frontend/tsconfig.json ./
COPY --chown=node:node frontend/tsconfig.node.json ./
COPY --chown=node:node frontend/public ./
COPY --chown=node:node frontend/tailwind.config.js ./
COPY --chown=node:node frontend/vite.config.ts ./
COPY --chown=node:node frontend/CDCs.json ./
COPY --chown=node:node frontend/components.json ./
COPY --chown=node:node frontend/index.html ./
COPY --chown=node:node .env ./
COPY --chown=node:node frontend/package.json ./

WORKDIR /usr/src/app/lib
COPY --chown=node:node ./lib/package.json ./
COPY --chown=node:node ./lib/tsconfig.json ./

WORKDIR /usr/src/app
COPY --chown=node:node ./package.json ./
COPY --chown=node:node ./pnpm-lock.yaml ./
COPY --chown=node:node ./pnpm-workspace.yaml ./
RUN pnpm install --prod -r

WORKDIR /usr/src/app/lib
COPY --chown=node:node ./lib/src ./src
RUN pnpm tsc --build
RUN rm -rf src
RUN mv dist src

WORKDIR /usr/src/app/frontend
COPY --chown=node:node frontend/src ./src
RUN pnpm run build

FROM nginx:1.25.3-alpine-slim
WORKDIR /usr/share/nginx/html

RUN mkdir /usr/log
RUN rm -rf ./*
COPY nginx.prod.conf /etc/nginx/nginx.conf

COPY --from=build-stage /usr/src/app/frontend/dist .

CMD ["nginx", "-g", "daemon off;"]
