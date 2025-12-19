# Stage 1: Build the SvelteKit app
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source files
COPY . .

# Build the static site
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy built static files from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx config for SPA fallback
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
