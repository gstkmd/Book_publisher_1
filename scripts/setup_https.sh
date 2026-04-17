#!/bin/bash

# Configuration
DOMAIN="publisher.connecterp.cloud"
EMAIL="caajaygill@gmail.com"
FRONTEND_PORT="3000"
BACKEND_PORT="8000"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "Please run as root (use sudo)"
  exit 1
fi

echo "🚀 Starting HTTPS setup for $DOMAIN on Ubuntu..."

# 1. Install dependencies
echo "📦 Installing Nginx and Certbot..."
apt update
apt install -y nginx certbot python3-certbot-nginx

# 2. Create Nginx configuration
echo "⚙️ Creating Nginx configuration for $DOMAIN..."
NGINX_CONF="/etc/nginx/sites-available/$DOMAIN"

cat <<EOF > $NGINX_CONF
server {
    listen 80;
    server_name $DOMAIN;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Maximum file upload size
    client_max_body_size 100M;

    # API requests (FastAPI)
    location /api {
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # WebSocket requests
    location /ws {
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Documentation
    location /docs {
        proxy_pass http://127.0.0.1:$BACKEND_PORT/docs;
        proxy_set_header Host \$host;
    }

    location /openapi.json {
        proxy_pass http://127.0.0.1:$BACKEND_PORT/api/v1/openapi.json;
        proxy_set_header Host \$host;
    }

    # Frontend application (Next.js)
    location / {
        proxy_pass http://127.0.0.1:$FRONTEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# 3. Enable the configuration
echo "🔗 Enabling Nginx site..."
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 4. Test Nginx and reload
echo "🔍 Testing Nginx configuration..."
nginx -t
if [ $? -eq 0 ]; then
    systemctl reload nginx
else
    echo "❌ Nginx configuration test failed. Please check the logs."
    exit 1
fi

# 5. Obtain SSL Certificate
echo "🔐 Obtaining SSL Certificate for $DOMAIN..."
certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m $EMAIL --redirect

# 6. Final verification
if [ $? -eq 0 ]; then
    echo "✅ Success! HTTPS is now configured for https://$DOMAIN"
    echo "📜 Your certificate is managed by Certbot and will auto-renew."
else
    echo "❌ Failed to obtain SSL certificate. Ensure your DNS record is correctly pointed to this IP."
fi
