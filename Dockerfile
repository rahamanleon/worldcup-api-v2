# syntax=docker/dockerfile:1

# ── Build stage ───────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

# ── Runtime stage ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

WORKDIR /app

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Remove config.json (keep config.example.json as fallback).
# Credentials MUST come from environment variables (DATABASE_URL, ADMIN_TOKEN, etc.)
RUN rm -f config.json

USER appuser

EXPOSE 3000

CMD ["node", "src/index.js"]
