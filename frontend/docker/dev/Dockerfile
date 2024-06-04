FROM node:20.14.0-slim
ENV NODE_ENV development
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /usr/local/app/frontend

COPY ./frontend/package.json ./
COPY ./frontend/pnpm-lock.yaml ./
COPY ./frontend/tsconfig.json ./
COPY ./frontend/tsconfig.node.json ./
COPY ./frontend/biome.json ./
COPY ./.env ./

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

WORKDIR /usr/local/app/lib

COPY ./lib/package.json ./
COPY ./lib/pnpm-lock.yaml ./
COPY ./lib/tsconfig.json ./

RUN pnpm fetch
RUN pnpm install -r --offline

COPY ./lib/src /usr/local/app/lib/src

RUN pnpm tsc --build
RUN rm -rf src
RUN mv dist src

WORKDIR /usr/local/app/frontend

COPY ./frontend ./

CMD ["pnpm", "run", "dev", "--host"]
