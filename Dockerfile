# Stage 1: Build the frontend
FROM node:22-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for building)
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Vite frontend
RUN npm run build

# Stage 2: Run the server
FROM node:22-slim

WORKDIR /app

# Install git for the update check feature
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Install tsx globally to run server.ts
RUN npm install -g tsx

# Copy the built frontend from the builder stage
COPY --from=builder /app/dist ./dist

# Copy the server source and other necessary files
COPY server.ts ./
COPY .env.example ./.env.example

# Expose the port the app runs on
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production
ENV PORT=3000

# Command to run the application
CMD ["tsx", "server.ts"]
