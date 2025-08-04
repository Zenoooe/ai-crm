# 🚀 AI CRM 快速部署指南

## 概述

本指南将帮助您将AI CRM系统部署到免费云平台，同时保持在IDE中的开发能力。

## 🎯 推荐部署方案

### 方案1: Railway (最推荐)
- ✅ 完全免费 (每月500小时)
- ✅ 自动部署
- ✅ 内置数据库
- ✅ 简单配置

### 方案2: Render
- ✅ 免费层可用
- ✅ 自动部署
- ✅ 良好的文档
- ⚠️ 冷启动较慢

### 方案3: Vercel + PlanetScale
- ✅ 前端免费
- ✅ 全球CDN
- ⚠️ 需要分离前后端
- ⚠️ 数据库需要额外配置

## 🛠️ 快速开始

### 1. 准备工作

```bash
# 确保在项目根目录
cd /Users/zeno/CRM3.1

# 检查文件
ls -la deploy.sh railway.json requirements_production.txt
```

### 2. 使用自动部署脚本

```bash
# 运行部署脚本
./deploy.sh
```

脚本会自动:
- 检查Git状态
- 创建必要的配置文件
- 提交代码到Git
- 部署到选择的平台

### 3. 手动部署 (Railway)

#### 3.1 安装Railway CLI
```bash
# macOS
brew install railway

# 或者使用npm
npm install -g @railway/cli
```

#### 3.2 登录和部署
```bash
# 登录Railway
railway login

# 初始化项目
railway init

# 部署
railway up
```

#### 3.3 配置环境变量
在Railway控制台设置:
- `FLASK_ENV=production`
- `SECRET_KEY=your-secret-key`
- 其他必要的环境变量

### 4. 手动部署 (Render)

#### 4.1 准备GitHub仓库
```bash
# 如果还没有远程仓库
git remote add origin https://github.com/yourusername/ai-crm.git
git push -u origin main
```

#### 4.2 在Render创建服务
1. 访问 [render.com](https://render.com)
2. 连接GitHub仓库
3. 选择 "Web Service"
4. 配置:
   - Build Command: `pip install -r requirements_production.txt`
   - Start Command: `python app.py`
   - Environment: `Python 3`

## 🔧 IDE集成开发

### 方案1: GitHub自动部署 (推荐)

1. **设置自动部署**
   - 在部署平台连接GitHub仓库
   - 启用自动部署功能

2. **开发流程**
   ```bash
   # 在IDE中修改代码
   # 提交更改
   git add .
   git commit -m "更新功能"
   git push origin main
   
   # 自动触发部署
   ```

### 方案2: 本地开发 + 手动部署

```bash
# 本地开发和测试
python app.py

# 满意后部署
./deploy.sh
```

### 方案3: 分支开发

```bash
# 创建开发分支
git checkout -b development

# 开发完成后合并到主分支
git checkout main
git merge development
git push origin main
```

## 📁 重要文件说明

| 文件 | 用途 | 平台 |
|------|------|------|
| `railway.json` | Railway配置 | Railway |
| `render.yaml` | Render配置 | Render |
| `vercel.json` | Vercel配置 | Vercel |
| `Procfile` | 进程配置 | Heroku/Render |
| `requirements_production.txt` | 生产依赖 | 所有 |
| `.env.production.example` | 环境变量模板 | 所有 |
| `deploy.sh` | 自动部署脚本 | 所有 |

## 🔐 环境变量配置

### 必需变量
```env
FLASK_ENV=production
PORT=5002
SECRET_KEY=your-super-secret-key
```

### 可选变量
```env
DATABASE_URL=your-database-url
OPENAI_API_KEY=your-openai-key
MAX_CONTENT_LENGTH=16777216
```

## 🗄️ 数据库选项

### SQLite (默认)
- ✅ 无需配置
- ✅ 适合小型应用
- ⚠️ 单文件存储

### PostgreSQL (推荐生产)
```env
DATABASE_URL=postgresql://user:pass@host:port/db
```

免费PostgreSQL提供商:
- [Supabase](https://supabase.com) - 500MB免费
- [PlanetScale](https://planetscale.com) - 5GB免费
- [Railway](https://railway.app) - 内置PostgreSQL

## 🚨 故障排除

### 常见问题

1. **部署失败**
   ```bash
   # 检查日志
   railway logs
   # 或在平台控制台查看
   ```

2. **端口错误**
   ```python
   # 确保使用环境变量
   port = int(os.environ.get('PORT', 5002))
   ```

3. **静态文件404**
   ```python
   # 检查静态文件路径
   app = Flask(__name__, static_folder='static')
   ```

4. **数据库连接失败**
   ```bash
   # 检查DATABASE_URL格式
   echo $DATABASE_URL
   ```

### 调试技巧

```bash
# 本地测试生产配置
FLASK_ENV=production python app.py

# 检查依赖
pip install -r requirements_production.txt

# 测试数据库连接
python -c "from app import app; print('数据库连接正常')"
```

## 📊 监控和维护

### 日志监控
- Railway: 内置日志查看
- Render: 控制台日志
- Vercel: 函数日志

### 性能监控
- 使用平台内置监控
- 配置Sentry错误追踪
- 设置健康检查端点

### 备份策略
```bash
# 定期备份数据库
# 导出用户数据
# 备份上传文件
```

## 🎉 部署完成后

1. **测试功能**
   - 用户注册/登录
   - 文件上传
   - 数据库操作
   - API接口

2. **配置域名** (可选)
   - 在平台设置自定义域名
   - 配置SSL证书

3. **设置监控**
   - 配置错误通知
   - 设置性能警报

4. **文档更新**
   - 更新README
   - 记录部署URL
   - 更新API文档

---

## 🆘 需要帮助？

- 查看平台官方文档
- 检查项目GitHub Issues
- 联系技术支持

**祝您部署顺利！** 🚀