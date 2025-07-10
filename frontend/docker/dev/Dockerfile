FROM node:22.17.0-bookworm-slim
ENV NODE_ENV development

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable pnpm && corepack install -g pnpm@latest-10

WORKDIR /usr/local/app/frontend
COPY ./frontend/package.json ./
COPY ./frontend/tsconfig.json ./
COPY ./frontend/tsconfig.node.json ./
COPY ./frontend/biome.json ./
COPY ./.env ./

WORKDIR /usr/local/app/lib
COPY ./lib/package.json ./
COPY ./lib/tsconfig.json ./

WORKDIR /usr/local/app
COPY ./package.json ./
COPY ./pnpm-lock.yaml ./
COPY ./pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod -r -frozen-lockfile

WORKDIR /usr/local/app/lib
COPY ./lib/src ./src
RUN pnpm tsc --build
RUN rm -rf src
RUN mv dist src

WORKDIR /usr/local/app/frontend
COPY ./frontend ./

CMD ["pnpm", "run", "dev", "--host"]
