FROM node:24.14.1-bookworm-slim AS build
RUN corepack enable && corepack install -g pnpm@11.18.0
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
COPY lib/package.json lib/package.json
RUN pnpm install --frozen-lockfile
COPY lib/ lib/
COPY backend/tsconfig.json backend/tsconfig.json
COPY backend/src/ backend/src/
COPY frontend/ frontend/
# Share URLs stay on the current origin, including each Ditto worker.
ENV VITE_FRONTEND_URL=""
RUN pnpm -C lib exec tsc --build && pnpm -C backend exec tsc --build && pnpm -C frontend run build
RUN rm -rf lib/src && mv lib/dist lib/src

FROM node:24.14.1-bookworm-slim AS backend
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build --chown=node:node /app /app
RUN mkdir -p /app/backend/build/logs && chown node:node /app/backend/build/logs
USER node
WORKDIR /app/backend/build
CMD ["node", "--enable-source-maps", "backend/src/serveStaging.js"]

FROM nginx:1.31.2-alpine-slim AS web
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
