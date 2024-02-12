FROM node:20.10.0-slim AS build-stage
ENV NODE_ENV production
WORKDIR /usr/src/app/frontend

ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="${PATH}:${PNPM_HOME}"

COPY --chown=node:node frontend/tsconfig.json ./
COPY --chown=node:node frontend/tsconfig.node.json ./
COPY --chown=node:node frontend/public ./
COPY --chown=node:node frontend/postcss.config.js ./
COPY --chown=node:node frontend/tailwind.config.js ./
COPY --chown=node:node frontend/vite.config.ts ./
COPY --chown=node:node frontend/CDCs.json ./
COPY --chown=node:node frontend/components.json ./
COPY --chown=node:node frontend/index.html ./
COPY --chown=node:node .env ./

RUN npm install -g pnpm

COPY --chown=node:node frontend/package.json ./
COPY --chown=node:node frontend/pnpm-lock.yaml ./

RUN pnpm fetch --prod
RUN pnpm install -r --offline --prod

WORKDIR /usr/src/app/lib

COPY --chown=node:node ./lib/package.json ./
COPY --chown=node:node ./lib/pnpm-lock.yaml ./
COPY --chown=node:node ./lib/tsconfig.json ./

RUN pnpm fetch
RUN pnpm install -r --offline

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
