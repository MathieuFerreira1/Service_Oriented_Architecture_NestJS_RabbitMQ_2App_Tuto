# Dockerfile for App 1 (Producer)
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

# Expose application port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start:prod"]