#!/bin/bash
# Nginx + SSL Setup for publisher.connecterp.cloud
# ===============================================

# Configuration
DOMAIN="publisher.connecterp.cloud"
EMAIL="caajaygill@gmail.com"
NGINX_TEMPLATE="nginx/publisher.conf"

# Must run as root
if [ "$EUID" -ne 0 ]; then 
  echo "Please run as root (use sudo)"
  exit 1
fi

echo "🚀 Starting Nginx and SSL setup for $DOMAIN..."

# 1. Install Certbot
echo "📦 Installing Nginx and Certbot if missing..."
apt update
apt install -y nginx certbot python3-certbot-nginx

# 2. Setup Nginx Configuration
echo "⚙️ Creating Nginx configuration from template..."
if [ ! -f "$NGINX_TEMPLATE" ]; then
    echo "❌ Error: Nginx template not found at $NGINX_TEMPLATE"
    exit 1
fi

cp "$NGINX_TEMPLATE" "/etc/nginx/sites-available/$DOMAIN"
ln -sf "/etc/nginx/sites-available/$DOMAIN" "/etc/nginx/sites-enabled/"

# 3. Test and Reload Nginx
echo "🔍 Testing Nginx configuration..."
nginx -t && systemctl reload nginx

# 4. Obtain SSL Certificate
echo "🔐 Obtaining SSL Certificate via Let's Encrypt..."
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect

# 5. Final Reload
echo "🔄 Finalizing SSL activation..."
systemctl reload nginx

echo "✅ Success! HTTPS is now active for https://$DOMAIN"
echo "📜 Certbot handles auto-renewal via a systemd timer (certbot.timer)."
