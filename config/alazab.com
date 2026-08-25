server {
    if ($host = www.alazab.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot


    if ($host = alazab.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot


    listen 80;
    server_name alazab.com www.alazab.com;
    return 301 https://$host$request_uri;




}

server {
    listen 443 ssl http2;
    server_name alazab.com www.alazab.com;
    ssl_certificate /etc/letsencrypt/live/alazab.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/alazab.com/privkey.pem; # managed by Certbot

    client_max_body_size 10M;

    root /var/www/core/alazab.com/dist;
    index index.html;

    access_log /var/log/nginx/alazab-access.log;
    error_log /var/log/nginx/alazab-error.log;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    location /api/ {
        proxy_pass http://127.0.0.1:3004/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
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
        rewrite ^/auth/meta-app/webhook$ /api/webhook/whatsapp break;
        proxy_pass http://127.0.0.1:3004;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /meta/ {
        proxy_pass http://127.0.0.1:3004/meta/;
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
    }


    # ============================================================
    # Daftra Finance MCP — Streamable HTTP
    # Public:  https://alazab.com/mcp-daftra
    # Upstream: http://127.0.0.1:4007/mcp
    # ============================================================

    location = /mcp-daftra {
        proxy_pass http://127.0.0.1:4007/mcp;
        proxy_http_version 1.1;

        # Keep upstream Host local for MCP host-header validation.
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;

        # Streamable HTTP / SSE
        proxy_set_header Connection "";
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_cache off;

        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    location = /mcp-daftra/ {
        proxy_pass http://127.0.0.1:4007/mcp;
        proxy_http_version 1.1;

        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;

        proxy_set_header Connection "";
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_cache off;

        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    location /mcp/ {
       proxy_pass http://127.0.0.1:4005/mcp/;
       proxy_http_version 1.1;

       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;

       # مهم جدًا للـ long AI calls
       proxy_read_timeout 120s;
       proxy_send_timeout 120s;
    }

    location = /index.html {
        try_files /index.html =404;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        expires -1;
    }

    location /dataset/ {
        alias /var/www/core/alazab.com/dataset/;
        autoindex on;
        autoindex_exact_size off;
        autoindex_localtime on;
        add_header Access-Control-Allow-Origin *;
        add_header Cache-Control "no-cache, must-revalidate";
        charset utf-8;
    }

    location /mcp-uberfix/ {
        proxy_pass http://127.0.0.1:4006/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Important for SSE (Server-Sent Events)
        proxy_set_header Connection '';
        proxy_cache off;
        chunked_transfer_encoding off;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    location /admin/ {
        alias /var/www/core/alazab.com/dist/admin/;
        try_files $uri $uri/ /admin/index.html;
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
