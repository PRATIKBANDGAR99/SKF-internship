# =========================================================
# Stage 1: Build React + Vite SPA
# =========================================================
FROM node:18-alpine AS builder

WORKDIR /app

# Accept build arguments for environment configuration
ARG VITE_API_BASE_URL=http://localhost:8001
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Install node dependencies
COPY package*.json ./
RUN npm ci || npm install

# Copy application source code
COPY . .

# Build production bundle
RUN npm run build

# =========================================================
# Stage 2: Serve with Nginx on Port 3030
# =========================================================
FROM nginx:alpine

# Copy custom Nginx configuration for port 3030
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled production assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose frontend port
EXPOSE 3030

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3030/ || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
