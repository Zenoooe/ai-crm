# HTTPS 和 IPv6 配置指南

本指南介绍如何为 AI CRM 系统启用 HTTPS 和 IPv6 支持。

## 功能特性

✅ **自动SSL证书生成** - 自动生成自签名SSL证书  
✅ **HTTPS支持** - 安全的加密连接  
✅ **IPv6支持** - 现代网络协议支持  
✅ **自动回退** - IPv6失败时自动回退到IPv4  
✅ **灵活配置** - 通过环境变量控制

## 快速启动

### 方法1: 使用专用启动脚本

```bash
# 启动HTTPS + IPv6服务器
python start_https.py
```

### 方法2: 设置环境变量

```bash
# 启用HTTPS
export ENABLE_HTTPS=true

# 启用IPv6
export ENABLE_IPV6=true

# 启动服务器
python app.py
```

### 方法3: 创建.env文件

创建 `.env` 文件并添加以下配置：

```env
# HTTPS 和 IPv6 配置
ENABLE_HTTPS=true
ENABLE_IPV6=true
HOST=::
PORT=5002

# SSL证书路径 (可选，会自动生成)
SSL_CERT_PATH=ssl_certs/cert.pem
SSL_KEY_PATH=ssl_certs/key.pem
```

## 访问地址

### HTTP 访问
- IPv4: `http://127.0.0.1:5002`
- IPv4 (局域网): `http://192.168.x.x:5002`
- IPv6: `http://[::1]:5002`
- IPv6 (局域网): `http://[IPv6地址]:5002`

### HTTPS 访问
- IPv4: `https://127.0.0.1:5002`
- IPv4 (局域网): `https://192.168.x.x:5002`
- IPv6: `https://[::1]:5002`
- IPv6 (局域网): `https://[IPv6地址]:5002`

## SSL证书

### 自动生成
系统会自动生成自签名SSL证书，存储在 `ssl_certs/` 目录：
- `ssl_certs/cert.pem` - SSL证书
- `ssl_certs/key.pem` - 私钥

### 使用自定义证书
如果您有自己的SSL证书，可以通过环境变量指定：

```env
SSL_CERT_PATH=/path/to/your/cert.pem
SSL_KEY_PATH=/path/to/your/key.pem
```

## 浏览器安全警告

使用自签名证书时，浏览器会显示安全警告。这是正常的，您可以：

1. 点击 "高级" 或 "Advanced"
2. 点击 "继续访问" 或 "Proceed to localhost"
3. 或者在浏览器中添加证书例外

## 系统要求

### OpenSSL
自动生成SSL证书需要 OpenSSL：

```bash
# macOS
brew install openssl

# Ubuntu/Debian
sudo apt-get install openssl

# CentOS/RHEL
sudo yum install openssl
```

### IPv6 支持
确保您的系统和网络支持IPv6：

```bash
# 检查IPv6支持
ping6 ::1

# 查看IPv6地址
ifconfig | grep inet6
```

## 配置选项

| 环境变量 | 默认值 | 说明 |
|---------|--------|------|
| `ENABLE_HTTPS` | `false` | 启用HTTPS支持 |
| `ENABLE_IPV6` | `false` | 启用IPv6支持 |
| `HOST` | `0.0.0.0` | 绑定主机地址 |
| `PORT` | `5002` | 服务端口 |
| `SSL_CERT_PATH` | `ssl_certs/cert.pem` | SSL证书路径 |
| `SSL_KEY_PATH` | `ssl_certs/key.pem` | SSL私钥路径 |

## 故障排除

### 常见问题

**1. 端口被占用**
```bash
# 查找占用端口的进程
lsof -i :5002

# 杀死进程
kill -9 <PID>
```

**2. SSL证书生成失败**
- 确保安装了 OpenSSL
- 检查 `ssl_certs/` 目录权限
- 手动生成证书：
```bash
mkdir -p ssl_certs
openssl req -x509 -newkey rsa:4096 -keyout ssl_certs/key.pem -out ssl_certs/cert.pem -days 365 -nodes -subj '/C=CN/ST=Beijing/L=Beijing/O=CRM/OU=IT/CN=localhost'
```

**3. IPv6 连接失败**
- 检查系统IPv6支持
- 尝试使用IPv4回退
- 检查防火墙设置

**4. 浏览器无法访问**
- 检查防火墙设置
- 确认端口未被阻止
- 尝试不同的浏览器

### 日志信息

启动时会显示详细的日志信息：

```
INFO:__main__:启用IPv6支持
INFO:__main__:成功生成SSL证书: ssl_certs/cert.pem, ssl_certs/key.pem
INFO:__main__:启用HTTPS服务器，地址: https://[::]:5002
```

## 生产环境建议

1. **使用有效的SSL证书** - 从CA获取正式证书
2. **配置反向代理** - 使用Nginx或Apache
3. **启用防火墙** - 限制访问端口
4. **定期更新证书** - 设置自动续期
5. **监控日志** - 设置日志轮转和监控

## 示例配置

### Nginx 反向代理配置

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://127.0.0.1:5002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Docker Compose 配置

```yaml
version: '3.8'
services:
  crm:
    build: .
    ports:
      - "5002:5002"
    environment:
      - ENABLE_HTTPS=true
      - ENABLE_IPV6=true
      - HOST=::
    volumes:
      - ./ssl_certs:/app/ssl_certs
    networks:
      - crm_network

networks:
  crm_network:
    enable_ipv6: true
    ipam:
      config:
        - subnet: 2001:db8::/64
```

---

**注意**: 这是开发环境配置。生产环境请使用专业的Web服务器和有效的SSL证书。