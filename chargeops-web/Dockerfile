# Stage 1: Build React/Vite web application
FROM node:20-alpine AS builder
WORKDIR /app

# Copy configuration and workspace manifests
COPY package.json package-lock.json tsconfig.base.json tsconfig.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/api/package.json ./packages/api/
COPY packages/auth/package.json ./packages/auth/
COPY packages/tokens/package.json ./packages/tokens/
COPY packages/ui/package.json ./packages/ui/

# Install workspace dependencies
RUN npm ci

# Copy full source code
COPY apps ./apps
COPY packages ./packages

# Public environment variables for build
ARG VITE_KEYCLOAK_ENABLED=true
ARG VITE_KEYCLOAK_URL=https://thang.tail704409.ts.net
ARG VITE_KEYCLOAK_REALM=chargeops
ARG VITE_KEYCLOAK_CLIENT_ID=chargeops-web
ARG VITE_USE_MOCKS=false
ARG VITE_API_URL=https://thang.tail704409.ts.net/api/v1
ARG VITE_DRIVER_APP_URL=http://localhost:8082

ENV VITE_KEYCLOAK_ENABLED=$VITE_KEYCLOAK_ENABLED \
    VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL \
    VITE_KEYCLOAK_REALM=$VITE_KEYCLOAK_REALM \
    VITE_KEYCLOAK_CLIENT_ID=$VITE_KEYCLOAK_CLIENT_ID \
    VITE_USE_MOCKS=$VITE_USE_MOCKS \
    VITE_API_URL=$VITE_API_URL \
    VITE_DRIVER_APP_URL=$VITE_DRIVER_APP_URL

# Build web distribution bundle
RUN npm run build

# Stage 2: Serve static bundle via lightweight Nginx
FROM nginx:alpine
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
