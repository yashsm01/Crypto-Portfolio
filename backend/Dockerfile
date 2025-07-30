FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Install dependencies with legacy peer deps to handle conflicts
RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 3000

# Install curl for healthcheck
RUN apk add --no-cache curl

# Add healthcheck
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/api || exit 1

# Use development mode with proper logging
ENV NODE_ENV=development
ENV NPM_CONFIG_LOGLEVEL=verbose

# Start with proper logging
CMD ["npm", "run", "start:dev"] 