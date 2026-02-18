# Stage 1: Build
FROM node:24-alpine AS builder

WORKDIR /app

# Accept Vite env vars as build args (baked into static JS at build time)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_GEMINI_API_KEY
ARG VITE_GROQ_API_KEY
ARG VITE_TRANSLATION_API_URL
ARG VITE_APP_NAME
ARG VITE_APP_VERSION
ARG VITE_ORS_API_KEY

# Make them available to Vite during build
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY
ENV VITE_GROQ_API_KEY=$VITE_GROQ_API_KEY
ENV VITE_TRANSLATION_API_URL=$VITE_TRANSLATION_API_URL
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_APP_VERSION=$VITE_APP_VERSION
ENV VITE_ORS_API_KEY=$VITE_ORS_API_KEY

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

# Stage 2: Serve with nginx (gzip, caching, SPA routing)
FROM nginx:alpine AS production

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q --spider http://localhost:3000/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
