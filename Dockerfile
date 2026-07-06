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

# config.json must be mounted as a secret/volume at runtime.
# It is NOT baked into the image.
RUN rm -f config.json

USER appuser

EXPOSE 3000

CMD ["node", "src/index.js"]
