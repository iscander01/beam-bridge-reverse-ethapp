FROM node:18 AS builder

# Set working directory
WORKDIR /app

# Copy package.json, package-lock.json, and yarn.lock for better layer caching
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile || yarn install

# Copy the rest of the application code
COPY . .

# Build the application
RUN yarn build

# Use a smaller base image for the final stage
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy only the necessary files from the builder stage
COPY --from=builder /app/build /app/build
COPY --from=builder /app/package.json /app/yarn.lock ./

# Install only production dependencies
RUN yarn install --production --frozen-lockfile || yarn install --production

# Use a non-root user
RUN useradd -m appuser
USER appuser

# Set environment variables
ENV NODE_ENV=production

# Expose the application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Start the application
CMD ["yarn", "start"]