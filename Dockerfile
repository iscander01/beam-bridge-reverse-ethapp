FROM node:18 AS builder

# Set working directory
WORKDIR /app

# Copy package manager files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile || yarn install

# Copy the rest of the application code
COPY . .

# Build the application
RUN yarn build

# Production stage
FROM node:18-slim

# Create a non-root user
RUN useradd --user-group --create-home --shell /bin/false appuser

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/yarn.lock ./yarn.lock

# Install production dependencies
RUN yarn install --production --frozen-lockfile || yarn install --production

# Change to non-root user
USER appuser

# Expose application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Start the application
CMD ["yarn", "start"]