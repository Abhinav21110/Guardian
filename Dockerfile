# ─────────────────────────────────────────────────────────────────────────────
# Guardian AI – Frontend Dockerfile (multi-stage)
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Build ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json bun.lockb* ./
RUN npm install --frozen-lockfile 2>/dev/null || npm install

COPY . .

# Inject the API base URL at build time
ARG VITE_API_BASE_URL=http://localhost:8080
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# ── Stage 2: Serve with Nginx ──────────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# Security hardening
RUN addgroup -g 101 -S nginx-guardian && \
    adduser -u 101 -S nginx-guardian -G nginx-guardian 2>/dev/null; true

COPY --from=builder /app/dist /usr/share/nginx/html

# Custom Nginx config for SPA (React Router) + security headers
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost/index.html || exit 1

CMD ["nginx", "-g", "daemon off;"]
