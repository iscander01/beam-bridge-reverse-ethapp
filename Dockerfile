FROM node:18 AS builder

WORKDIR /app

COPY package.json yarn.lock* ./

RUN yarn install --frozen-lockfile || npm ci

COPY . .

RUN yarn build || npm run build

FROM node:18-slim

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json /app/yarn.lock* ./

RUN yarn install --production --frozen-lockfile || npm ci --only=production

USER node

CMD ["node", "dist/index.js"]