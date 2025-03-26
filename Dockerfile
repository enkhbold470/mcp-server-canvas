FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

FROM node:20-alpine AS release

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/smithery.yaml ./smithery.yaml

# Set production environment
ENV NODE_ENV=production

# Use direct access to your MCP server (no flags needed for ES modules since package.json has type: module)
ENTRYPOINT ["node", "dist/index.js"]