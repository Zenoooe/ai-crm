# 免费部署指南 - AI CRM系统

## 概述

本指南将帮助您将AI CRM系统部署到免费的云服务器上，并保持在IDE中的开发能力。

## 免费部署平台选项

### 1. Railway (推荐) ⭐⭐⭐⭐⭐

**优势：**
- 每月500小时免费使用
- 支持GitHub自动部署
- 内置数据库支持
- 简单易用

**部署步骤：**

1. **准备代码**
   ```bash
   # 创建railway.json配置文件
   echo '{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "python app.py",
    "healthcheckPath": "/"
  }
}' > railway.json
   ```

2. **环境变量设置**
   - 在Railway控制台设置以下环境变量：
   ```
   PORT=5002
   FLASK_ENV=production
   SECRET_KEY=your-production-secret-key
   ```

3. **数据库配置**
   - Railway提供免费PostgreSQL数据库
   - 修改数据库连接配置

### 2. Render ⭐⭐⭐⭐

**优势：**
- 完全免费的Web服务
- 自动SSL证书
- GitHub集成
- 750小时/月免费使用

**部署步骤：**

1. **创建render.yaml**
   ```yaml
   services:
     - type: web
       name: ai-crm
       env: python
       buildCommand: pip install -r requirements.txt
       startCommand: python app.py
       envVars:
         - key: PORT
           value: 5002
         - key: FLASK_ENV
           value: production
   ```

### 3. Heroku (有限免费) ⭐⭐⭐

**注意：** Heroku已取消免费计划，但仍可用于学习

### 4. Vercel + PlanetScale ⭐⭐⭐⭐

**优势：**
- Vercel: 免费静态部署
- PlanetScale: 免费MySQL数据库
- 全球CDN加速

## 部署配置文件

### 1. 创建生产环境配置

```python
# config_production.py
import os

class ProductionConfig:
    SECRET_KEY = os.environ.get('SECRET_KEY')
    DATABASE_URL = os.environ.get('DATABASE_URL')
    PORT = int(os.environ.get('PORT', 5002))
    DEBUG = False
    
    # AI API配置
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
    DEEPSEEK_API_KEY = os.environ.get('DEEPSEEK_API_KEY')
```

### 2. 修改app.py支持生产环境

```python
# 在app.py中添加
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5002))
    debug = os.environ.get('FLASK_ENV') != 'production'
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug
    )
```

### 3. 创建requirements.txt

```txt
Flask==2.3.3
Flask-CORS==4.0.0
requests==2.31.0
sqlite3
werkzeug==2.3.7
gunicorn==21.2.0
```

### 4. 创建Procfile (Heroku)

```
web: gunicorn app:app
```

## IDE集成开发方案

### 方案1: GitHub + 自动部署

1. **设置GitHub仓库**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/ai-crm.git
   git push -u origin main
   ```

2. **配置自动部署**
   - 在部署平台连接GitHub仓库
   - 设置自动部署分支（main/master）
   - 每次推送代码自动部署

3. **IDE开发流程**
   ```bash
   # 本地开发
   git add .
   git commit -m "Update feature"
   git push origin main
   # 自动触发部署
   ```

### 方案2: VS Code + Remote Development

1. **安装扩展**
   - Remote - SSH
   - Remote - Containers
   - GitHub Codespaces

2. **使用GitHub Codespaces**
   - 直接在浏览器中编辑代码
   - 集成终端和调试
   - 自动同步到GitHub

### 方案3: 本地开发 + 云端部署

1. **本地开发环境**
   ```bash
   # 本地运行
   python app.py
   # 访问 http://localhost:5002
   ```

2. **部署脚本**
   ```bash
   #!/bin/bash
   # deploy.sh
   echo "部署到生产环境..."
   git add .
   git commit -m "Deploy: $(date)"
   git push origin main
   echo "部署完成！"
   ```

## 数据库迁移方案

### SQLite → PostgreSQL (Railway/Render)

```python
# database_migration.py
import sqlite3
import psycopg2
import os

def migrate_sqlite_to_postgresql():
    # 连接SQLite
    sqlite_conn = sqlite3.connect('crm_database.db')
    sqlite_cursor = sqlite_conn.cursor()
    
    # 连接PostgreSQL
    pg_conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
    pg_cursor = pg_conn.cursor()
    
    # 迁移数据逻辑
    # ...
```

## 环境变量配置

### 必需的环境变量

```bash
# 基础配置
PORT=5002
FLASK_ENV=production
SECRET_KEY=your-super-secret-key

# 数据库
DATABASE_URL=postgresql://user:pass@host:port/dbname

# AI API密钥
OPENAI_API_KEY=sk-...
DEEPSEEK_API_KEY=sk-...
MOONSHOT_API_KEY=sk-...
XAI_API_KEY=xai-...
GOOGLE_API_KEY=AIza...
```

## 监控和维护

### 1. 日志监控

```python
# 添加到app.py
import logging

if not app.debug:
    # 生产环境日志配置
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s %(levelname)s: %(message)s'
    )
```

### 2. 健康检查

```python
@app.route('/health')
def health_check():
    return {'status': 'healthy', 'timestamp': datetime.now().isoformat()}
```

### 3. 错误处理

```python
@app.errorhandler(500)
def internal_error(error):
    return {'error': 'Internal server error'}, 500
```

## 成本优化

### 免费额度管理

1. **Railway**: 500小时/月
2. **Render**: 750小时/月
3. **Vercel**: 100GB带宽/月
4. **PlanetScale**: 5GB存储

### 休眠策略

```python
# 自动休眠配置
SLEEP_AFTER_MINUTES = 30  # 30分钟无活动后休眠
```

## 推荐部署方案

### 🏆 最佳方案: Railway + GitHub

1. **优势**
   - 部署简单
   - 自动扩容
   - 内置数据库
   - GitHub集成

2. **步骤**
   ```bash
   # 1. 推送到GitHub
   git push origin main
   
   # 2. Railway连接仓库
   # 3. 设置环境变量
   # 4. 自动部署完成
   ```

3. **IDE工作流**
   - 本地开发和测试
   - 提交到GitHub
   - 自动部署到Railway
   - 实时查看部署状态

## 故障排除

### 常见问题

1. **端口问题**
   ```python
   # 确保使用环境变量端口
   port = int(os.environ.get('PORT', 5002))
   ```

2. **静态文件问题**
   ```python
   # 配置静态文件路径
   app.static_folder = 'static'
   ```

3. **数据库连接**
   ```python
   # 检查数据库URL格式
   DATABASE_URL = os.environ.get('DATABASE_URL')
   ```

## 下一步

1. 选择部署平台
2. 配置GitHub仓库
3. 设置环境变量
4. 测试部署
5. 配置域名（可选）

---

**提示**: 建议先在Railway上测试部署，成功后可以考虑其他平台或付费升级。