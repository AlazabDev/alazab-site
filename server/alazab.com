server {
    listen 80;
    server_name alazab.com www.alazab.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name alazab.com www.alazab.com;

    ssl_certificate /etc/letsencrypt/live/alazab.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/alazab.com/privkey.pem;

    client_max_body_size 50M;

    root /var/www/core/alazab.com/dist;
    index index.html;

    access_log /var/log/nginx/alazab-access.log;
    error_log /var/log/nginx/alazab-error.log;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    location = /health {
        proxy_pass http://127.0.0.1:3004/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location = /ready {
        proxy_pass http://127.0.0.1:3004/ready;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location ~ ^/(dashboard|admin|admin/dashboard)$ {
        proxy_pass http://127.0.0.1:3004$request_uri;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location = /webhook/wauf/whatsapp {
        proxy_pass http://127.0.0.1:3004/webhook/wauf/whatsapp;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
        client_max_body_size 50M;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3004/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
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

    location /meta/ {
        proxy_pass http://127.0.0.1:3004/api/meta/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /webhook/ {
        proxy_pass http://127.0.0.1:3004/webhook/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
        client_max_body_size 50M;
    }

    location /mcp/ {
        proxy_pass http://127.0.0.1:3004/api/mcp/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }

    location = /index.html {
        try_files /index.html =404;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        expires -1;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        try_files $uri =404;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location = /favicon.ico {
        try_files $uri =404;
        expires 7d;
        add_header Cache-Control "public, immutable";
        log_not_found off;
        access_log off;
    }

    location = /robots.txt {
        try_files $uri =404;
        expires 1d;
        add_header Cache-Control "public";
        log_not_found off;
        access_log off;
    }

    location = /manifest.webmanifest {
        try_files $uri =404;
        expires 1d;
        add_header Cache-Control "public";
    }

    location = /site.webmanifest {
        try_files $uri =404;
        expires 1d;
        add_header Cache-Control "public";
    }

    location = /og-image.jpg {
        try_files $uri =404;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location ~* \.(css|js|mjs|json|map|png|jpg|jpeg|gif|svg|webp|avif|ico|woff|woff2|ttf|otf)$ {
        try_files $uri =404;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
