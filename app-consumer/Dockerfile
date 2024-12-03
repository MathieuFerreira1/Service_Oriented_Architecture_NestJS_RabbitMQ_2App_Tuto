# Dockerfile for App 2 (Consumer)
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

# Build the application
RUN npm run build

# Expose application port (optional for debugging or extra endpoints)
EXPOSE 3001

# Start the application
CMD ["npm", "run", "start:prod"]