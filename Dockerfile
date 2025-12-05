# Dockerfile for Vinyl Collection App
# Compatible with Synology NAS and other Docker environments

FROM node:16-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps --production

# Copy application code
COPY . .

# Expose port
EXPOSE 8124

# Set environment to production
ENV NODE_ENV=production

# Start application
CMD ["node", "server.js"]
