FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/database/package.json packages/database/package.json
RUN npm ci
COPY . .
RUN npm run build -w @algi/database && npm run build -w @algi/api

FROM node:22-bookworm-slim AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/packages/database ./packages/database
USER node
EXPOSE 4000
CMD ["node", "apps/api/dist/main.js"]
