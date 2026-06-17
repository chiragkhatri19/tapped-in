FROM node:22-alpine AS builder
WORKDIR /app

# Copy shared types/prompts needed by the backend
COPY shared/ ./shared/

# Install and build backend
COPY backend/package*.json ./backend/
RUN cd backend && npm ci

COPY backend/ ./backend/
RUN cd backend && npm run build

# ── Runtime image ──────────────────────────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/package.json ./package.json

EXPOSE 3000
CMD ["node", "dist/index.mjs"]
