###############################
# Base stage — install pnpm
###############################
FROM node:22-alpine AS base
WORKDIR /app

# Install PNPM globally
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install only production deps
RUN pnpm install --prod


###############################
# Builder — compile TypeScript
###############################
FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy all root metadata
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install all deps (prod + dev)
RUN pnpm install

# Copy project files
COPY tsconfig.json ./
COPY drizzle.config.ts ./
COPY src ./src

# Build TypeScript → JavaScript
RUN pnpm run build


###############################
# Final — smallest image
###############################
FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy production dependencies
COPY --from=base /app/node_modules ./node_modules

# Copy main metadata
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Copy Drizzle configs & migrations
COPY drizzle.config.ts ./
COPY drizzle ./drizzle

# Copy built JS files
COPY --from=builder /app/dist ./dist

# Expose backend port
EXPOSE 3001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => { if(r.statusCode !== 200) throw new Error(r.statusCode); })"

# Start the server
CMD ["node", "dist/index.js"]
