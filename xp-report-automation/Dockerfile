# XP Report Automation - Dockerfile (Multi-stage build)

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY src ./src
COPY scripts ./scripts

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN apk add --no-cache python3 make g++ && \
    npm ci --only=production && \
    apk del python3 make g++

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/scripts ./scripts

# Create db directory
RUN mkdir -p db && chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Health check (using Node.js http module - no curl needed)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start service
CMD ["node", "dist/index.js"]
