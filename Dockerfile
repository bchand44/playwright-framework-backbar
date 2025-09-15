FROM mcr.microsoft.com/playwright:v1.40.0-focal

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p test-results logs data

# Set environment variables
ENV NODE_ENV=production
ENV HEADLESS=true
ENV CI=true

# Install browsers (they might already be installed in the base image)
RUN npx playwright install --with-deps

# Create non-root user for security
RUN groupadd -r playwright && useradd -r -g playwright -G audio,video playwright
RUN chown -R playwright:playwright /app
USER playwright

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node --version || exit 1

# Default command
CMD ["npm", "test"]
