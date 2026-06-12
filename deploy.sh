#!/bin/bash
###
 # @Author: chenjianfeng chenjianfeng93@163.com
 # @Date: 2026-06-12 15:22:34
 # @Description: 
### 

# Bibabu Web 部署脚本
# 使用方法: bash deploy.sh

set -e

PROJECT_DIR="/project/bibabu-tech/bibabu-web"
LOG_DIR="/var/log/pm2"
NGINX_CONFIG="/etc/nginx/sites-available/bibabu"

echo "=== 开始部署 Bibabu Web ==="

# 1. 创建日志目录
echo "[1/5] 创建日志目录..."
mkdir -p $LOG_DIR

# 2. 创建 PM2 配置文件
echo "[2/5] 创建 PM2 配置..."
cat > $PROJECT_DIR/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'bibabu-web',
    script: 'npm',
    args: 'start',
    cwd: '/project/bibabu-tech/bibabu-web',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    log_file: '/var/log/pm2/bibabu-web.log',
    error_file: '/var/log/pm2/bibabu-web-error.log',
    out_file: '/var/log/pm2/bibabu-web-out.log',
    time: true
  }]
};
EOF

# 3. 安装 Nginx（如果未安装）
echo "[3/5] 检查并安装 Nginx..."
if ! command -v nginx &> /dev/null; then
    apt update
    apt install -y nginx
fi

# 4. 创建 Nginx 配置
echo "[4/5] 配置 Nginx..."
cat > $NGINX_CONFIG << 'EOF'
server {
    listen 80;
    server_name 116.198.230.20;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# 启用配置
ln -sf $NGINX_CONFIG /etc/nginx/sites-enabled/bibabu
rm -f /etc/nginx/sites-enabled/default

# 测试配置
nginx -t

# 5. 启动服务
echo "[5/5] 启动服务..."
cd $PROJECT_DIR

# 停止旧进程（如果存在）
pm2 delete bibabu-web 2>/dev/null || true

# 启动新进程
pm2 start ecosystem.config.js
pm2 save

# 重启 Nginx
systemctl restart nginx

echo ""
echo "=== 部署完成 ==="
echo "应用地址: http://116.198.230.20"
echo "PM2 状态: pm2 status"
echo "查看日志: pm2 logs bibabu-web"
