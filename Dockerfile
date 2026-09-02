# Delok Backend — Production Dockerfile
# Minimal, no app redesign; works on any Docker-capable host
# Requires: Node 22, DATABASE_URL must be reachable at runtime (not build)
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Do not bake secrets — injected at runtime via platform env/secrets
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/generated ./src/generated
COPY prisma ./prisma
# Prisma needs schema at runtime for migrate deploy if run in container
COPY prisma.config.ts ./

# Non-root
RUN addgroup -S app && adduser -S app -G app
USER app
EXPOSE 8000
# Health check uses the app's /health endpoint (no DB required)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT:-8000}/health || exit 1
CMD ["node", "dist/server.js"]
