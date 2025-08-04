# CRM系统后端API

一个功能完整的CRM（客户关系管理）系统后端API，基于Node.js、Express、TypeScript、MongoDB和Redis构建。

## 功能特性

### 核心功能
- 🔐 **用户认证与授权** - JWT令牌、角色权限、会话管理
- 👥 **联系人管理** - 联系人信息、分组、标签、搜索
- 🏢 **客户管理** - 客户档案、交互记录、状态跟踪
- 💼 **销售机会管理** - 机会跟踪、阶段管理、预测分析
- 📋 **任务管理** - 任务分配、进度跟踪、提醒通知
- 🤖 **AI智能助手** - 话术生成、对话分析、内容优化

### 技术特性
- 📊 **数据分析** - 统计报表、趋势分析、导出功能
- 📁 **文件管理** - 文件上传、存储、预览
- 📧 **邮件服务** - 邮件发送、模板管理、通知系统
- 🔄 **缓存机制** - Redis缓存、会话存储、性能优化
- 🛡️ **安全防护** - 速率限制、数据验证、错误处理
- 📝 **日志系统** - 结构化日志、错误追踪、性能监控

## 技术栈

- **运行时**: Node.js 18+
- **框架**: Express.js
- **语言**: TypeScript
- **数据库**: MongoDB
- **缓存**: Redis
- **认证**: JWT
- **文件上传**: Multer
- **邮件服务**: Nodemailer
- **日志**: Winston
- **验证**: Express Validator
- **安全**: Helmet, CORS, Rate Limiting

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 8.0.0
- MongoDB >= 5.0
- Redis >= 6.0

### 安装依赖

```bash
# 克隆项目
git clone <repository-url>
cd crm-backend

# 安装依赖
npm install
```

### 环境配置

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
vim .env
```

### 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm run build
npm start
```

## 项目结构

```
src/
├── config/          # 配置文件
│   ├── database.ts  # 数据库配置
│   ├── redis.ts     # Redis配置
│   ├── email.ts     # 邮件配置
│   └── storage.ts   # 文件存储配置
├── controllers/     # 控制器
│   ├── authController.ts
│   ├── contactController.ts
│   ├── customerController.ts
│   ├── opportunityController.ts
│   ├── taskController.ts
│   └── aiController.ts
├── middleware/      # 中间件
│   ├── auth.ts      # 认证中间件
│   ├── validate.ts  # 验证中间件
│   ├── rateLimiter.ts # 限流中间件
│   └── errorHandler.ts # 错误处理
├── models/          # 数据模型
│   ├── User.ts
│   ├── Contact.ts
│   ├── Customer.ts
│   ├── Opportunity.ts
│   └── Task.ts
├── routes/          # 路由定义
│   ├── auth.ts
│   ├── contacts.ts
│   ├── customers.ts
│   ├── opportunities.ts
│   ├── tasks.ts
│   ├── ai.ts
│   └── index.ts
├── services/        # 业务服务
├── utils/           # 工具函数
│   ├── logger.ts    # 日志工具
│   ├── ApiError.ts  # 错误类
│   └── helpers.ts   # 辅助函数
├── types/           # 类型定义
├── app.ts           # 应用配置
└── server.ts        # 服务器入口
```

## API文档

### 认证相关

```
POST /api/auth/register     # 用户注册
POST /api/auth/login        # 用户登录
POST /api/auth/logout       # 用户登出
POST /api/auth/refresh      # 刷新令牌
POST /api/auth/forgot-password # 忘记密码
POST /api/auth/reset-password  # 重置密码
GET  /api/auth/me           # 获取当前用户
```

### 联系人管理

```
GET    /api/contacts        # 获取联系人列表
POST   /api/contacts        # 创建联系人
GET    /api/contacts/:id    # 获取联系人详情
PUT    /api/contacts/:id    # 更新联系人
DELETE /api/contacts/:id    # 删除联系人
```

### 客户管理

```
GET    /api/customers       # 获取客户列表
POST   /api/customers       # 创建客户
GET    /api/customers/:id   # 获取客户详情
PUT    /api/customers/:id   # 更新客户
DELETE /api/customers/:id   # 删除客户
```

### 销售机会

```
GET    /api/opportunities   # 获取机会列表
POST   /api/opportunities   # 创建机会
GET    /api/opportunities/:id # 获取机会详情
PUT    /api/opportunities/:id # 更新机会
DELETE /api/opportunities/:id # 删除机会
```

### 任务管理

```
GET    /api/tasks          # 获取任务列表
POST   /api/tasks          # 创建任务
GET    /api/tasks/:id      # 获取任务详情
PUT    /api/tasks/:id      # 更新任务
DELETE /api/tasks/:id      # 删除任务
```

### AI功能

```
POST /api/ai/generate-script    # 生成销售话术
POST /api/ai/analyze-conversation # 分析对话
POST /api/ai/generate-email     # 生成邮件
POST /api/ai/optimize-content   # 优化内容
```

## 开发指南

### 代码规范

```bash
# 代码检查
npm run lint

# 自动修复
npm run lint:fix

# 代码格式化
npm run format
```

### 测试

```bash
# 运行测试
npm test

# 监听模式
npm run test:watch

# 覆盖率报告
npm run test:coverage
```

### 构建部署

```bash
# 构建项目
npm run build

# 启动生产服务
npm start
```

## 环境变量说明

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| NODE_ENV | 运行环境 | development |
| PORT | 服务端口 | 3001 |
| MONGODB_URI | MongoDB连接字符串 | - |
| REDIS_HOST | Redis主机 | localhost |
| REDIS_PORT | Redis端口 | 6379 |
| JWT_SECRET | JWT密钥 | - |
| SMTP_HOST | 邮件服务器 | - |
| UPLOAD_DIR | 上传目录 | ./uploads |

## 性能优化

### 缓存策略
- Redis缓存热点数据
- 会话存储优化
- 查询结果缓存

### 数据库优化
- 索引优化
- 查询优化
- 连接池管理

### 安全措施
- 请求速率限制
- 输入数据验证
- SQL注入防护
- XSS攻击防护

## 监控与日志

### 日志级别
- error: 错误信息
- warn: 警告信息
- info: 一般信息
- debug: 调试信息

### 监控指标
- API响应时间
- 错误率统计
- 数据库性能
- 内存使用情况

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查MongoDB服务状态
   - 验证连接字符串
   - 确认网络连通性

2. **Redis连接失败**
   - 检查Redis服务状态
   - 验证配置参数
   - 确认端口开放

3. **文件上传失败**
   - 检查上传目录权限
   - 验证文件大小限制
   - 确认磁盘空间

### 调试模式

```bash
# 启用调试日志
DEBUG=crm:* npm run dev

# 查看详细错误
NODE_ENV=development npm run dev
```

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

MIT License

## 联系方式

- 项目地址: [GitHub Repository]
- 问题反馈: [Issues]
- 邮箱: support@crm.com

---

**注意**: 请确保在生产环境中修改所有默认密钥和敏感配置。