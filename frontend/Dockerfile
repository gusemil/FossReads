# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files first so npm ci is cached when only source changes.
COPY package*.json .
RUN npm ci

# VITE_API_BASE_URL is baked into the JS bundle at build time.
# Setting it to "" means axios uses relative URLs (e.g. /api/books),
# which nginx then proxies to the backend container.
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

COPY . .
RUN npm run build

# ── Stage 2: Serve ─────────────────────────────────────────────────────────────
# nginx:alpine is tiny (~25 MB) and serves static files very efficiently.
FROM nginx:alpine AS runtime

# Copy the compiled React app from the build stage.
COPY --from=build /app/dist /usr/share/nginx/html

# Replace the default nginx config with our own (SPA routing + API proxy).
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
