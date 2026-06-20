# ─────────────────────────────────────────────
# Stage 1 — Build the React app
# ─────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --frozen-lockfile
COPY . .
RUN npm run build

# ─────────────────────────────────────────────
# Stage 2 — Serve via Nginx
# ─────────────────────────────────────────────
FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html

# Forward React Router paths to index.html (SPA routing)
RUN echo 'server { \
  listen 80; \
  location / { \
    root /usr/share/nginx/html; \
    try_files $uri $uri/ /index.html; \
  } \
}' > /etc/nginx/conf.d/default.conf

# React frontend served on port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
