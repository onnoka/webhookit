# Dockerfile for Vinyl Collection App
# Compatible with Synology NAS and other Docker environments
# Uses pre-installed node_modules from the repo

FROM node:14-alpine

# Set working directory
WORKDIR /app

# Copy ALL application code including node_modules
COPY . .

# Expose port
EXPOSE 8124

# Set environment to production
ENV NODE_ENV=production

# Start application
CMD ["node", "server.js"]
