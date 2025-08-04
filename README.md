# AI CRM 改进版 - 智能客户关系管理系统

这是一个基于 FastAPI + React 的现代化 CRM 系统，集成了多种 AI 模型，提供智能客户分析、话术生成、OCR 名片识别、实时通知等功能。

## 🚀 项目概览

本项目是一个全栈CRM解决方案，采用React + FastAPI + PostgreSQL技术栈，集成了Grok-4、Deepseek Reasoner、Moonshot Kimi K2、OpenAI GPT-4等多种AI模型，为销售团队提供智能化的客户管理和销售支持。

### ✨ 核心特性

#### 🤖 AI 智能功能
- **多 AI 模型集成**: 支持 Grok-4、Deepseek Reasoner、Moonshot Kimi K2、OpenAI GPT-4
- **智能客户分析**: 性格分析、沟通偏好、兴趣挖掘、痛点识别、推荐策略
- **AI 话术生成**: 基于 SPIN、BANT 等销售方法论生成个性化话术
- **OCR 名片识别**: 自动识别名片信息并创建联系人

#### 📊 客户管理
- **拖拽式文件夹管理**: 支持客户批量移动和文件夹排序
- **进度跟踪**: 可视化进度条，自动生成跟进任务
- **标签系统**: 灵活的客户标签管理
- **优先级管理**: 高、中、低优先级客户分类

#### 🔔 提醒系统
- **智能提醒**: 支持多种提醒类型和重复设置
- **实时通知**: WebSocket 实时推送
- **浏览器通知**: 桌面通知支持
- **任务管理**: 自动生成跟进任务

#### 📈 数据分析
- **统计仪表板**: 客户分布、进度统计、AI 使用情况
- **实时更新**: WebSocket 实时数据同步
- **导出功能**: 支持 Excel 数据导出

## 🛠 技术栈

### 后端技术栈
- **框架**: FastAPI (Python 3.8+)
- **数据库**: PostgreSQL + SQLAlchemy ORM
- **缓存**: Redis
- **任务队列**: Celery
- **WebSocket**: FastAPI WebSocket
- **AI 集成**: OpenAI API、Google Generative AI
- **图像处理**: OpenCV、Tesseract OCR

### 前端技术栈
- **框架**: React 18 + TypeScript
- **UI 库**: Material-UI (MUI)
- **状态管理**: Redux Toolkit
- **实时通信**: WebSocket
- **拖拽功能**: React DnD

### AI 模型集成
- **Grok-4**: xAI 最新模型，擅长逻辑推理
- **Deepseek Reasoner**: 深度推理能力强
- **Moonshot Kimi K2**: 1万亿参数 MoE 模型
- **OpenAI GPT-4**: 通用性能优秀

### 基础设施
- **Docker** - 容器化部署
- **Docker Compose** - 多容器编排
- **Nginx** - 反向代理和负载均衡
- **Alembic** - 数据库迁移

## 📋 系统要求

- Python 3.8+
- Node.js 16+
- PostgreSQL 12+
- Redis 6+
- Docker & Docker Compose (推荐)

## 🚀 快速开始

### 使用Docker Compose (推荐)

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd CRM3
   ```

2. **配置环境变量**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，填入必要的配置信息
   ```

3. **启动服务**
   ```bash
   docker-compose up -d
   ```

4. **访问应用**
   - 前端应用: http://localhost:3000
   - 后端API: http://localhost:5000
   - API文档: http://localhost:5000/api-docs
   - MongoDB管理: http://localhost:8081
   - Redis管理: http://localhost:8082

### 本地开发环境

1. **安装依赖**
   ```bash
   # 后端依赖
   cd backend
   npm install
   
   # 前端依赖
   cd ../frontend
   npm install
   ```

2. **启动数据库服务**
   ```bash
   # 使用Docker启动MongoDB和Redis
   docker-compose up -d mongodb redis
   ```

3. **启动开发服务器**
   ```bash
   # 启动后端 (终端1)
   cd backend
   npm run dev
   
   # 启动前端 (终端2)
   cd frontend
   npm start
   ```

## 📖 使用指南

### 基本功能

1. **用户注册和登录**
   - 访问 http://localhost:3000
   - 点击"注册"创建新账户
   - 使用邮箱和密码登录

2. **添加联系人**
   - 在联系人页面点击"添加联系人"
   - 填写基本信息或上传名片自动识别
   - 系统会自动生成AI客户画像

3. **记录交互**
   - 在联系人详情页添加通话、邮件等交互记录
   - AI会自动分析交互内容并提供洞察

4. **生成销售话术**
   - 选择销售场景和方法论
   - AI会根据客户特征生成个性化话术

5. **查看分析报告**
   - 在仪表盘查看销售数据和趋势
   - 获取AI驱动的销售建议

### 高级功能

- **批量导入联系人** - 支持Excel/CSV文件导入
- **自定义标签和分组** - 灵活的联系人分类管理
- **销售漏斗分析** - 可视化销售流程和转化率
- **团队协作** - 多用户权限管理和数据共享
- **API集成** - 与第三方系统集成

## 🔧 配置说明

### 环境变量配置

主要配置项说明：

```bash
# 应用配置
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/ai_crm
REDIS_URL=redis://localhost:6379

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# AI服务配置
OPENAI_API_KEY=your-openai-api-key
GOOGLE_VISION_API_KEY=your-google-vision-key
BAIDU_API_KEY=your-baidu-api-key
TIANYANCHA_API_KEY=your-tianyancha-key

# 文件存储配置
FILE_STORAGE_TYPE=local
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# 邮件配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### AI服务配置

1. **OpenAI配置**
   - 注册OpenAI账户并获取API密钥
   - 设置`OPENAI_API_KEY`环境变量

2. **Google Vision API**
   - 在Google Cloud Console启用Vision API
   - 创建服务账户并下载密钥文件
   - 设置`GOOGLE_APPLICATION_CREDENTIALS`环境变量

3. **百度AI**
   - 注册百度AI开放平台账户
   - 创建应用并获取API Key和Secret Key

## 🧪 测试

```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 运行特定测试文件
npm test ContactService.test.ts

# 监听模式运行测试
npm run test:watch
```

## 📚 API文档

详细的API文档可以通过以下方式访问：

- **在线文档**: http://localhost:5000/api-docs (开发环境)
- **文档文件**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

主要API端点：

- `POST /api/auth/login` - 用户登录
- `GET /api/contacts` - 获取联系人列表
- `POST /api/contacts` - 创建新联系人
- `POST /api/interactions` - 记录交互
- `POST /api/ai/analyze-profile` - AI分析客户画像
- `POST /api/ai/generate-script` - 生成销售话术

## 🏗 项目结构

```
CRM3/
├── frontend/                 # React前端应用
│   ├── src/
│   │   ├── components/      # 可复用组件
│   │   ├── pages/          # 页面组件
│   │   ├── store/          # Redux状态管理
│   │   ├── services/       # API服务
│   │   └── types/          # TypeScript类型定义
│   └── package.json
├── backend/                 # Node.js后端应用
│   ├── src/
│   │   ├── controllers/    # 路由控制器
│   │   ├── models/         # 数据模型
│   │   ├── services/       # 业务逻辑服务
│   │   ├── middleware/     # 中间件
│   │   └── routes/         # API路由
│   └── package.json
├── docs/                   # 项目文档
├── docker-compose.yml      # Docker编排配置
├── .env.example           # 环境变量模板
└── README.md              # 项目说明
```

## 🚀 部署

### Docker部署

```bash
# 构建生产镜像
docker-compose -f docker-compose.prod.yml build

# 启动生产环境
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes部署

```bash
# 应用Kubernetes配置
kubectl apply -f k8s/

# 检查部署状态
kubectl get pods
kubectl get services
```

详细部署指南请参考：[DEPLOYMENT.md](./DEPLOYMENT.md)

## 🔒 安全考虑

- **身份认证**: JWT令牌认证，支持刷新令牌
- **数据加密**: 敏感数据AES加密存储
- **输入验证**: 严格的输入验证和SQL注入防护
- **访问控制**: 基于角色的权限管理
- **API限流**: 防止API滥用和DDoS攻击
- **HTTPS**: 生产环境强制使用HTTPS
- **数据备份**: 定期数据备份和恢复机制

## 📈 性能优化

- **数据库索引**: 优化的MongoDB索引策略
- **Redis缓存**: 多层缓存提升响应速度
- **CDN加速**: 静态资源CDN分发
- **代码分割**: React代码分割和懒加载
- **图片优化**: 自动图片压缩和格式转换
- **API优化**: 数据分页和字段选择

## 🤝 贡献指南

我们欢迎社区贡献！请遵循以下步骤：

1. Fork项目仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

详细的开发指南请参考：[DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)

### 代码规范

- 使用TypeScript进行类型安全开发
- 遵循ESLint和Prettier代码格式规范
- 编写单元测试和集成测试
- 提交前运行代码检查和测试

## 📄 许可证

本项目采用MIT许可证 - 详见 [LICENSE](LICENSE) 文件

## 🆘 支持和帮助

如果您遇到问题或需要帮助：

1. **查看文档**: 首先查看项目文档和API文档
2. **搜索Issues**: 在GitHub Issues中搜索类似问题
3. **创建Issue**: 如果没有找到解决方案，创建新的Issue
4. **联系我们**: 发送邮件至 support@ai-crm.com

## 🗺 路线图

### 即将推出的功能

- [ ] 移动端APP (React Native)
- [ ] 语音通话录音和分析
- [ ] 更多AI模型集成 (Claude, Gemini)
- [ ] 高级报表和BI功能
- [ ] 微信小程序集成
- [ ] 多语言支持
- [ ] 企业级SSO集成

### 长期规划

- [ ] AI销售助手聊天机器人
- [ ] 预测性销售分析
- [ ] 客户流失预警系统
- [ ] 销售培训和考核系统
- [ ] 第三方CRM数据迁移工具

## 📊 项目统计

- **开发语言**: TypeScript, JavaScript
- **代码行数**: ~50,000 行
- **测试覆盖率**: >80%
- **支持的数据库**: MongoDB, Redis
- **支持的部署方式**: Docker, Kubernetes, 云平台

## 🙏 致谢

感谢以下开源项目和服务提供商：

- [React](https://reactjs.org/) - 前端框架
- [Node.js](https://nodejs.org/) - 后端运行时
- [MongoDB](https://www.mongodb.com/) - 数据库
- [OpenAI](https://openai.com/) - AI服务
- [Material-UI](https://mui.com/) - UI组件库
- [Docker](https://www.docker.com/) - 容器化平台

---

**AI-Driven CRM** - 让AI赋能您的销售团队 🚀

如果这个项目对您有帮助，请给我们一个⭐️！