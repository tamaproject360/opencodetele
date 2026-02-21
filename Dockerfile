# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

# ---- Production stage ----
FROM node:20-alpine AS runner

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# Copy compiled output and runtime assets
COPY --from=builder /app/dist ./dist
COPY .env.example .env.example

# Create a non-root user for security
RUN addgroup -S botgroup && adduser -S botuser -G botgroup
USER botuser

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
