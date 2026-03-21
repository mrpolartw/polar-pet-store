# ── Stage 1: Build the Vite app ──────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# 注入 build-time 環境變數（Cloud Run 部署時通過 --build-arg 傳入）
ARG VITE_MEDUSA_API_URL
ARG VITE_MEDUSA_API_KEY

ENV VITE_MEDUSA_API_URL=$VITE_MEDUSA_API_URL
ENV VITE_MEDUSA_API_KEY=$VITE_MEDUSA_API_KEY

RUN npm run build

# ── Stage 2: Serve with Nginx ─────────────────────────────────────────────────
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# SPA Router 設定：所有路由交给 index.html 處理
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
