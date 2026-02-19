# Stage 1: Build
FROM node:24-alpine AS builder

WORKDIR /app

# Accept Vite env vars as build args (baked into static JS at build time)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_TRANSLATION_API_URL
ARG VITE_APP_NAME
ARG VITE_APP_VERSION

# Make them available to Vite during build
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_TRANSLATION_API_URL=$VITE_TRANSLATION_API_URL
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_APP_VERSION=$VITE_APP_VERSION

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

# Stage 2: Serve with nginx (gzip, caching, SPA routing)
FROM nginx:alpine AS production

# Default port (Render overrides with PORT=10000)
ENV PORT=3000

# Remove default nginx config, use template for PORT substitution
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE ${PORT}

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q --spider http://127.0.0.1:${PORT}/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
