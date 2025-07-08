```
# Stage 1: Build the application
FROM node:18 AS builder

# Set working directory
WORKDIR /app

# Copy package.json, package-lock.json, and yarn.lock for better layer caching
COPY package*.json yarn.lock* ./

# Install dependencies
RUN yarn install --frozen-lockfile || yarn install

# Copy the rest of the application code
COPY . .

# Build the application
RUN yarn build

# Stage 2: Create the production image
FROM node:18-slim

# Create a non-root user
RUN useradd --user-group --create-home --shell /bin/false appuser

# Set working directory
WORKDIR /app

# Copy built files from the builder stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/package*.json /app/yarn.lock* ./

# Install only production dependencies
RUN yarn install --production --frozen-lockfile || yarn install --production

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the application port
EXPOSE 3000

# Switch to non-root user
USER appuser

# Start the application
CMD ["yarn", "start"]
```