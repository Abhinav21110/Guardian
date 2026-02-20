# ─────────────────────────────────────────────────────────────────────────────
# Guardian AI – Server Dockerfile (multi-stage)
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Build ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install only production-critical build tools
RUN apk add --no-cache python3 make g++

COPY package.json ./
RUN npm install --include=dev --frozen-lockfile 2>/dev/null || npm install --include=dev

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# ── Stage 2: Production image ──────────────────────────────────────────────────
FROM node:22-alpine AS production

# Security: run as non-root
RUN addgroup -g 1001 -S guardian && adduser -u 1001 -S guardian -G guardian

WORKDIR /app

# Copy package manifest and install production deps only
COPY package.json ./
RUN npm install --omit=dev --frozen-lockfile 2>/dev/null || npm install --omit=dev

COPY --from=builder /app/dist ./dist

# Tighten file permissions
RUN chown -R guardian:guardian /app
USER guardian

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:8080/api/health/live || exit 1

CMD ["node", "dist/index.js"]
