# Legacy split stack (nginx + API). Prefer repo root Dockerfile.node + docker-compose.node.yml (one port 8080).
FROM node:20-alpine AS build
WORKDIR /app
# Force same-origin /api in the bundle (nginx proxies to Node). Do not bake localhost:5000.
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# SPA + reverse-proxy API to Node server (service name: server)
RUN printf '%s\n' \
  'server {' \
  '  listen 80;' \
  '  server_name _;' \
  '  root /usr/share/nginx/html;' \
  '  index index.html;' \
  '  client_max_body_size 25m;' \
  '  location /api/ {' \
  '    proxy_pass http://server:5000/api/;' \
  '    proxy_http_version 1.1;' \
  '    proxy_set_header Host $host;' \
  '    proxy_set_header X-Real-IP $remote_addr;' \
  '    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;' \
  '    proxy_set_header X-Forwarded-Proto $scheme;' \
  '    proxy_connect_timeout 60s;' \
  '    proxy_read_timeout 120s;' \
  '  }' \
  '  location / {' \
  '    try_files $uri /index.html;' \
  '  }' \
  '}' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
