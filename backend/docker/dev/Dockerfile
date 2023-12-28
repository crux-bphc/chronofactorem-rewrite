FROM node:20.10.0-slim
ENV NODE_ENV development
WORKDIR /usr/local/app

RUN npm install -g pnpm

COPY package.json ./
COPY pnpm-lock.yaml ./
COPY tsconfig.json ./
COPY nodemon.json ./

RUN pnpm fetch
RUN pnpm install -r --offline

CMD ["pnpm", "nodemon", "src/index.ts"]
