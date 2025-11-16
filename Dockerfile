# Use Node.js 22 LTS
FROM node:22-slim

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy app source
COPY . .

# Expose port 8080 (Google Cloud Run default)
EXPOSE 8080

# Start the application
CMD [ "node", "index.js" ]
