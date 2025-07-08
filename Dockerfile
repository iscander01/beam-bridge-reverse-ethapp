FROM node:18 AS builder

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .

RUN yarn build

FROM node:18-slim

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json /app/yarn.lock ./

RUN yarn install --production --frozen-lockfile

USER node

CMD ["node", "dist/index.js"]