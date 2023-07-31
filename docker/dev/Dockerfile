FROM node:18.16.0-slim
ENV NODE_ENV development
WORKDIR /usr/local/app

RUN npm install -g pnpm

COPY --chown=node:node patches ./patches
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY tsconfig.json ./
COPY nodemon.json ./

RUN pnpm fetch
RUN pnpm install -r --offline

CMD ["pnpm", "nodemon", "src/index.ts"]
