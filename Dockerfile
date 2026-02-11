# ------------------------------------------------------------------------------
# BUILD STAGE
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first to leverage cache
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# ------------------------------------------------------------------------------
# PRODUCTION STAGE
# ------------------------------------------------------------------------------
FROM node:20-alpine AS production

WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist

# Create non-root user for security
RUN addgroup -g 1001 nodejs && adduser -S -u 1001 -G nodejs nestjs
USER nestjs

# Expose port (default 3000)
EXPOSE 3000

# Start command
CMD ["node", "dist/main"]
