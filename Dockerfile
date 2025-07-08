```dockerfile
# Stage 1: Build
FROM node:18 AS build

# Set working directory
WORKDIR /app

# Copy package.json and yarn.lock
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the application
RUN yarn build

# Stage 2: Production
FROM node:18-slim

# Create a non-root user
RUN useradd --user-group --create-home --shell /bin/false appuser

# Set working directory
WORKDIR /app

# Copy built files from the build stage
COPY --from=build /app/dist ./dist

# Copy package.json and yarn.lock for production dependencies
COPY package.json yarn.lock ./

# Install only production dependencies
RUN yarn install --frozen-lockfile --production

# Change ownership to non-root user
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose the application port
EXPOSE 8080

# Start the application
CMD ["yarn", "start"]
```