# Production Nginx vhost for alazab.com
# Expected frontend release path: /srv/apps/alazab-site/current/dist
# Expected backend listeners: API 127.0.0.1:3004, MCP 127.0.0.1:4005

server {
    listen 80;
    listen [::]:80;
    server_name alazab.com www.alazab.com;
    return 301 https://alazab.com$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.alazab.com;

    ssl_certificate /etc/letsencrypt/live/alazab.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/alazab.com/privkey.pem;

    return 301 https://alazab.com$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name alazab.com;

    ssl_certificate /etc/letsencrypt/live/alazab.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/alazab.com/privkey.pem;

    root /srv/apps/alazab-site/current/dist;
    index index.html;

    client_max_body_size 10M;
    server_tokens off;

    access_log /var/log/nginx/alazab-access.log;
    error_log /var/log/nginx/alazab-error.log warn;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(self), geolocation=(self)" always;

    location = /health {
        proxy_pass http://127.0.0.1:3004/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        access_log off;
    }

    location = /ready {
        proxy_pass http://127.0.0.1:3004/ready;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        access_log off;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3004/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 10s;
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }

    location /auth/v1/ {
        proxy_pass http://127.0.0.1:3004/auth/v1/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location = /auth/meta-app/webhook {
        proxy_pass http://127.0.0.1:3004/api/webhook/whatsapp;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /mcp/ {
        proxy_pass http://127.0.0.1:4005/mcp/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    location = /index.html {
        try_files /index.html =404;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        expires -1;
    }

    location /assets/ {
        try_files $uri =404;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location ~* \.(?:png|jpg|jpeg|gif|svg|webp|avif|ico|woff|woff2|ttf|otf)$ {
        try_files $uri =404;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location ~ /\. {
        deny all;
    }

    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, must-revalidate";
    }
}
