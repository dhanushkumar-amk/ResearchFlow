# Stage 1: Build phase
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies including devDependencies for tsc
RUN npm install

# Copy source code and config
COPY . .

# Compile TypeScript to JavaScript
RUN npm run build

# Stage 2: Production runtime
FROM node:20-alpine

WORKDIR /app

# Environment variables for production (can be overridden at runtime)
ENV NODE_ENV=production
ENV PORT=3001

# Copy package manifests to install prod dependencies
COPY package*.json ./

# Install only production dependencies to keep the image slim
RUN npm install --omit=dev

# Copy the compiled output from the builder stage
COPY --from=builder /app/dist ./dist

# Create a logs directory for Winston
RUN mkdir logs

EXPOSE 3001

# Start the application using compiled JS
CMD ["npm", "start"]
