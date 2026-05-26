# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

# Create uploads directory (ephemeral — swap for S3/Cloudinary in production)
RUN mkdir -p uploads

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Render / Railway inject PORT automatically
EXPOSE 5000

CMD ["node", "server.js"]
