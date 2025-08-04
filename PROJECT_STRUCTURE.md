# Project Structure - AI-Driven CRM System

## 项目总体结构

```
CRM3/
├── README.md                          # 项目说明文档
├── ARCHITECTURE.md                     # 系统架构文档
├── API_DOCUMENTATION.md                # API接口文档
├── DEPLOYMENT.md                       # 部署指南
├── DEVELOPMENT_GUIDE.md                # 开发指南
├── DATABASE_DESIGN.md                  # 数据库设计文档
├── SYSTEM_ARCHITECTURE.md              # 系统架构图
├── FRONTEND_ARCHITECTURE.md            # 前端架构文档
├── BACKEND_ARCHITECTURE.md             # 后端架构文档
├── PROJECT_STRUCTURE.md                # 项目结构说明（本文件）
├── docker-compose.yml                  # Docker编排配置
├── docker-compose.prod.yml             # 生产环境Docker配置
├── .env.example                        # 环境变量示例
├── .gitignore                          # Git忽略文件
├── package.json                        # 根目录包管理
├── lerna.json                          # Monorepo配置
├── .github/                            # GitHub Actions配置
│   └── workflows/
│       ├── ci.yml                      # 持续集成
│       ├── cd.yml                      # 持续部署
│       └── security.yml                # 安全扫描
├── docs/                               # 文档目录
│   ├── api/                            # API文档
│   ├── guides/                         # 使用指南
│   ├── architecture/                   # 架构文档
│   └── deployment/                     # 部署文档
├── scripts/                            # 脚本目录
│   ├── setup.sh                       # 环境设置脚本
│   ├── build.sh                       # 构建脚本
│   ├── deploy.sh                       # 部署脚本
│   └── backup.sh                       # 备份脚本
├── frontend/                           # 前端应用
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── .env.example
│   ├── public/
│   │   ├── index.html
│   │   ├── favicon.ico
│   │   └── manifest.json
│   ├── src/
│   │   ├── main.tsx                    # 应用入口
│   │   ├── App.tsx                     # 根组件
│   │   ├── index.css                   # 全局样式
│   │   ├── vite-env.d.ts              # Vite类型定义
│   │   ├── components/                 # 组件目录
│   │   │   ├── common/                 # 通用组件
│   │   │   │   ├── Button/
│   │   │   │   ├── Input/
│   │   │   │   ├── Modal/
│   │   │   │   ├── Loading/
│   │   │   │   ├── ErrorBoundary/
│   │   │   │   └── index.ts
│   │   │   ├── layout/                 # 布局组件
│   │   │   │   ├── Header/
│   │   │   │   ├── Sidebar/
│   │   │   │   ├── MainLayout/
│   │   │   │   └── index.ts
│   │   │   ├── contact/                # 联系人相关组件
│   │   │   │   ├── ContactList/
│   │   │   │   ├── ContactCard/
│   │   │   │   ├── ContactDetail/
│   │   │   │   ├── ContactForm/
│   │   │   │   ├── ContactSearch/
│   │   │   │   ├── FolderTree/
│   │   │   │   └── index.ts
│   │   │   ├── interaction/             # 互动相关组件
│   │   │   │   ├── InteractionTimeline/
│   │   │   │   ├── InteractionForm/
│   │   │   │   ├── InteractionCard/
│   │   │   │   └── index.ts
│   │   │   ├── ai/                     # AI相关组件
│   │   │   │   ├── AIProfile/
│   │   │   │   ├── ScriptGenerator/
│   │   │   │   ├── ChatAssistant/
│   │   │   │   ├── OCRScanner/
│   │   │   │   └── index.ts
│   │   │   ├── analytics/              # 分析相关组件
│   │   │   │   ├── Dashboard/
│   │   │   │   ├── Charts/
│   │   │   │   ├── Reports/
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── pages/                      # 页面组件
│   │   │   ├── Login/
│   │   │   ├── Dashboard/
│   │   │   ├── Contacts/
│   │   │   ├── Interactions/
│   │   │   ├── Analytics/
│   │   │   ├── Settings/
│   │   │   ├── Profile/
│   │   │   └── index.ts
│   │   ├── hooks/                      # 自定义Hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useContacts.ts
│   │   │   ├── useInteractions.ts
│   │   │   ├── useAI.ts
│   │   │   ├── useWebSocket.ts
│   │   │   ├── useLocalStorage.ts
│   │   │   └── index.ts
│   │   ├── store/                      # Redux状态管理
│   │   │   ├── index.ts                # Store配置
│   │   │   ├── rootReducer.ts          # 根Reducer
│   │   │   ├── middleware.ts           # 中间件配置
│   │   │   ├── slices/                 # Redux Slices
│   │   │   │   ├── authSlice.ts
│   │   │   │   ├── contactSlice.ts
│   │   │   │   ├── interactionSlice.ts
│   │   │   │   ├── aiSlice.ts
│   │   │   │   ├── uiSlice.ts
│   │   │   │   └── index.ts
│   │   │   └── api/                    # RTK Query APIs
│   │   │       ├── baseApi.ts
│   │   │       ├── authApi.ts
│   │   │       ├── contactApi.ts
│   │   │       ├── interactionApi.ts
│   │   │       ├── aiApi.ts
│   │   │       └── index.ts
│   │   ├── utils/                      # 工具函数
│   │   │   ├── api.ts                  # API工具
│   │   │   ├── auth.ts                 # 认证工具
│   │   │   ├── validation.ts           # 验证工具
│   │   │   ├── formatting.ts           # 格式化工具
│   │   │   ├── constants.ts            # 常量定义
│   │   │   ├── helpers.ts              # 辅助函数
│   │   │   └── index.ts
│   │   ├── types/                      # TypeScript类型定义
│   │   │   ├── auth.ts
│   │   │   ├── contact.ts
│   │   │   ├── interaction.ts
│   │   │   ├── ai.ts
│   │   │   ├── api.ts
│   │   │   ├── common.ts
│   │   │   └── index.ts
│   │   ├── styles/                     # 样式文件
│   │   │   ├── globals.css
│   │   │   ├── components.css
│   │   │   ├── utilities.css
│   │   │   └── themes/
│   │   │       ├── light.css
│   │   │       └── dark.css
│   │   ├── assets/                     # 静态资源
│   │   │   ├── images/
│   │   │   ├── icons/
│   │   │   ├── fonts/
│   │   │   └── locales/
│   │   │       ├── en.json
│   │   │       └── zh.json
│   │   └── tests/                      # 测试文件
│   │       ├── __mocks__/
│   │       ├── components/
│   │       ├── pages/
│   │       ├── hooks/
│   │       ├── utils/
│   │       └── setup.ts
│   ├── Dockerfile                      # 前端Docker配置
│   └── nginx.conf                      # Nginx配置
├── backend/                            # 后端应用
│   ├── package.json
│   ├── tsconfig.json
│   ├── nodemon.json
│   ├── jest.config.js
│   ├── .env.example
│   ├── src/
│   │   ├── app.ts                      # 应用入口
│   │   ├── server.ts                   # 服务器启动
│   │   ├── config/                     # 配置文件
│   │   │   ├── database.ts             # 数据库配置
│   │   │   ├── redis.ts                # Redis配置
│   │   │   ├── auth.ts                 # 认证配置
│   │   │   ├── ai.ts                   # AI服务配置
│   │   │   ├── upload.ts               # 文件上传配置
│   │   │   ├── email.ts                # 邮件配置
│   │   │   ├── logger.ts               # 日志配置
│   │   │   └── index.ts
│   │   ├── controllers/                # 控制器
│   │   │   ├── authController.ts
│   │   │   ├── userController.ts
│   │   │   ├── contactController.ts
│   │   │   ├── interactionController.ts
│   │   │   ├── aiController.ts
│   │   │   ├── uploadController.ts
│   │   │   ├── analyticsController.ts
│   │   │   └── index.ts
│   │   ├── services/                   # 业务逻辑服务
│   │   │   ├── authService.ts
│   │   │   ├── userService.ts
│   │   │   ├── contactService.ts
│   │   │   ├── interactionService.ts
│   │   │   ├── aiService.ts
│   │   │   ├── uploadService.ts
│   │   │   ├── emailService.ts
│   │   │   ├── analyticsService.ts
│   │   │   ├── integrationService.ts
│   │   │   └── index.ts
│   │   ├── repositories/               # 数据访问层
│   │   │   ├── baseRepository.ts
│   │   │   ├── userRepository.ts
│   │   │   ├── contactRepository.ts
│   │   │   ├── interactionRepository.ts
│   │   │   ├── aiProfileRepository.ts
│   │   │   ├── aiScriptRepository.ts
│   │   │   └── index.ts
│   │   ├── models/                     # 数据模型
│   │   │   ├── User.ts
│   │   │   ├── Contact.ts
│   │   │   ├── Interaction.ts
│   │   │   ├── AIProfile.ts
│   │   │   ├── AIScript.ts
│   │   │   ├── Folder.ts
│   │   │   ├── Tag.ts
│   │   │   ├── Notification.ts
│   │   │   └── index.ts
│   │   ├── middleware/                 # 中间件
│   │   │   ├── auth.ts                 # 认证中间件
│   │   │   ├── validation.ts           # 验证中间件
│   │   │   ├── rateLimit.ts            # 限流中间件
│   │   │   ├── cors.ts                 # CORS中间件
│   │   │   ├── logger.ts               # 日志中间件
│   │   │   ├── error.ts                # 错误处理中间件
│   │   │   ├── upload.ts               # 文件上传中间件
│   │   │   └── index.ts
│   │   ├── routes/                     # 路由定义
│   │   │   ├── auth.ts
│   │   │   ├── users.ts
│   │   │   ├── contacts.ts
│   │   │   ├── interactions.ts
│   │   │   ├── ai.ts
│   │   │   ├── upload.ts
│   │   │   ├── analytics.ts
│   │   │   ├── webhooks.ts
│   │   │   └── index.ts
│   │   ├── utils/                      # 工具函数
│   │   │   ├── logger.ts               # 日志工具
│   │   │   ├── validation.ts           # 验证工具
│   │   │   ├── encryption.ts           # 加密工具
│   │   │   ├── jwt.ts                  # JWT工具
│   │   │   ├── email.ts                # 邮件工具
│   │   │   ├── file.ts                 # 文件工具
│   │   │   ├── cache.ts                # 缓存工具
│   │   │   ├── constants.ts            # 常量定义
│   │   │   ├── helpers.ts              # 辅助函数
│   │   │   └── index.ts
│   │   ├── types/                      # TypeScript类型定义
│   │   │   ├── auth.ts
│   │   │   ├── user.ts
│   │   │   ├── contact.ts
│   │   │   ├── interaction.ts
│   │   │   ├── ai.ts
│   │   │   ├── api.ts
│   │   │   ├── database.ts
│   │   │   ├── common.ts
│   │   │   └── index.ts
│   │   ├── jobs/                       # 后台任务
│   │   │   ├── aiAnalysisJob.ts        # AI分析任务
│   │   │   ├── emailJob.ts             # 邮件发送任务
│   │   │   ├── dataBackupJob.ts        # 数据备份任务
│   │   │   ├── cleanupJob.ts           # 清理任务
│   │   │   ├── syncJob.ts              # 数据同步任务
│   │   │   └── index.ts
│   │   ├── integrations/               # 外部集成
│   │   │   ├── openai/                 # OpenAI集成
│   │   │   │   ├── client.ts
│   │   │   │   ├── prompts.ts
│   │   │   │   └── index.ts
│   │   │   ├── baidu/                  # 百度AI集成
│   │   │   │   ├── ocr.ts
│   │   │   │   ├── nlp.ts
│   │   │   │   └── index.ts
│   │   │   ├── tianyancha/             # 天眼查集成
│   │   │   │   ├── client.ts
│   │   │   │   ├── parser.ts
│   │   │   │   └── index.ts
│   │   │   ├── email/                  # 邮件服务集成
│   │   │   │   ├── smtp.ts
│   │   │   │   ├── templates.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── websocket/                  # WebSocket处理
│   │   │   ├── server.ts               # WebSocket服务器
│   │   │   ├── handlers/               # 事件处理器
│   │   │   │   ├── connection.ts
│   │   │   │   ├── notification.ts
│   │   │   │   ├── chat.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── database/                   # 数据库相关
│   │   │   ├── connection.ts           # 数据库连接
│   │   │   ├── migrations/             # 数据迁移
│   │   │   │   ├── 001_initial.ts
│   │   │   │   ├── 002_add_ai.ts
│   │   │   │   └── index.ts
│   │   │   ├── seeds/                  # 种子数据
│   │   │   │   ├── users.ts
│   │   │   │   ├── contacts.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   └── tests/                      # 测试文件
│   │       ├── __mocks__/
│   │       ├── unit/                   # 单元测试
│   │       │   ├── controllers/
│   │       │   ├── services/
│   │       │   ├── repositories/
│   │       │   └── utils/
│   │       ├── integration/            # 集成测试
│   │       │   ├── auth.test.ts
│   │       │   ├── contacts.test.ts
│   │       │   └── ai.test.ts
│   │       ├── e2e/                    # 端到端测试
│   │       │   ├── auth.e2e.ts
│   │       │   ├── contacts.e2e.ts
│   │       │   └── ai.e2e.ts
│   │       ├── fixtures/               # 测试数据
│   │       │   ├── users.json
│   │       │   ├── contacts.json
│   │       │   └── interactions.json
│   │       └── setup.ts
│   ├── Dockerfile                      # 后端Docker配置
│   └── .dockerignore
├── shared/                             # 共享代码
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── types/                      # 共享类型定义
│   │   │   ├── api.ts
│   │   │   ├── auth.ts
│   │   │   ├── contact.ts
│   │   │   ├── interaction.ts
│   │   │   ├── ai.ts
│   │   │   └── index.ts
│   │   ├── constants/                  # 共享常量
│   │   │   ├── api.ts
│   │   │   ├── auth.ts
│   │   │   ├── validation.ts
│   │   │   └── index.ts
│   │   ├── utils/                      # 共享工具函数
│   │   │   ├── validation.ts
│   │   │   ├── formatting.ts
│   │   │   ├── date.ts
│   │   │   └── index.ts
│   │   └── schemas/                    # 验证Schema
│   │       ├── auth.ts
│   │       ├── contact.ts
│   │       ├── interaction.ts
│   │       └── index.ts
│   └── tests/
├── infrastructure/                     # 基础设施配置
│   ├── docker/                         # Docker配置
│   │   ├── nginx/
│   │   │   ├── Dockerfile
│   │   │   └── nginx.conf
│   │   ├── mongodb/
│   │   │   ├── Dockerfile
│   │   │   └── mongod.conf
│   │   └── redis/
│   │       ├── Dockerfile
│   │       └── redis.conf
│   ├── kubernetes/                     # Kubernetes配置
│   │   ├── namespace.yaml
│   │   ├── configmap.yaml
│   │   ├── secret.yaml
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── ingress.yaml
│   │   └── hpa.yaml
│   ├── terraform/                      # Terraform配置
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── modules/
│   │       ├── vpc/
│   │       ├── eks/
│   │       └── rds/
│   └── monitoring/                     # 监控配置
│       ├── prometheus/
│       │   └── config.yml
│       ├── grafana/
│       │   └── dashboards/
│       └── alertmanager/
│           └── config.yml
└── tools/                              # 开发工具
    ├── generators/                     # 代码生成器
    │   ├── component.js
    │   ├── api.js
    │   └── model.js
    ├── linters/                        # 代码检查配置
    │   ├── .eslintrc.js
    │   ├── .prettierrc
    │   └── .stylelintrc
    ├── scripts/                        # 工具脚本
    │   ├── migrate.js
    │   ├── seed.js
    │   └── cleanup.js
    └── configs/                        # 配置文件
        ├── webpack.config.js
        ├── babel.config.js
        └── jest.config.js
```

## 核心文件说明

### 1. 根目录配置文件

#### package.json (根目录)
```json
{
  "name": "ai-crm-system",
  "version": "1.0.0",
  "description": "AI-Driven CRM System for Sales Enhancement",
  "private": true,
  "workspaces": [
    "frontend",
    "backend",
    "shared"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd backend && npm run dev",
    "build": "npm run build:shared && npm run build:backend && npm run build:frontend",
    "build:frontend": "cd frontend && npm run build",
    "build:backend": "cd backend && npm run build",
    "build:shared": "cd shared && npm run build",
    "test": "npm run test:backend && npm run test:frontend",
    "test:frontend": "cd frontend && npm run test",
    "test:backend": "cd backend && npm run test",
    "lint": "npm run lint:frontend && npm run lint:backend",
    "lint:frontend": "cd frontend && npm run lint",
    "lint:backend": "cd backend && npm run lint",
    "docker:build": "docker-compose build",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "migrate": "cd backend && npm run migrate",
    "seed": "cd backend && npm run seed",
    "setup": "npm install && npm run build:shared && npm run migrate && npm run seed"
  },
  "devDependencies": {
    "concurrently": "^8.2.0",
    "lerna": "^7.1.0",
    "husky": "^8.0.3",
    "lint-staged": "^13.2.0"
  },
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run test"
    }
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{css,scss,less}": [
      "stylelint --fix",
      "prettier --write"
    ]
  }
}
```

#### docker-compose.yml
```yaml
version: '3.8'

services:
  # 前端服务
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: development
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - VITE_API_URL=http://localhost:5000/api
      - VITE_WS_URL=ws://localhost:5000
    depends_on:
      - backend
    networks:
      - crm-network

  # 后端服务
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: development
    ports:
      - "5000:5000"
    volumes:
      - ./backend:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - PORT=5000
      - MONGODB_URI=mongodb://mongodb:27017/crm_dev
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=your-jwt-secret-key
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - BAIDU_API_KEY=${BAIDU_API_KEY}
      - TIANYANCHA_API_KEY=${TIANYANCHA_API_KEY}
    depends_on:
      - mongodb
      - redis
    networks:
      - crm-network

  # MongoDB数据库
  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
      - ./infrastructure/docker/mongodb/mongod.conf:/etc/mongod.conf
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password
      - MONGO_INITDB_DATABASE=crm_dev
    networks:
      - crm-network

  # Redis缓存
  redis:
    image: redis:7.0-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
      - ./infrastructure/docker/redis/redis.conf:/etc/redis/redis.conf
    command: redis-server /etc/redis/redis.conf
    networks:
      - crm-network

  # Nginx反向代理
  nginx:
    build:
      context: ./infrastructure/docker/nginx
      dockerfile: Dockerfile
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infrastructure/docker/nginx/nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - frontend
      - backend
    networks:
      - crm-network

volumes:
  mongodb_data:
  redis_data:

networks:
  crm-network:
    driver: bridge
```

### 2. 前端核心文件

#### frontend/package.json
```json
{
  "name": "crm-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.14.0",
    "@reduxjs/toolkit": "^1.9.5",
    "react-redux": "^8.1.1",
    "@mui/material": "^5.14.0",
    "@mui/icons-material": "^5.14.0",
    "@mui/x-data-grid": "^6.10.0",
    "@mui/x-date-pickers": "^6.10.0",
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "@dnd-kit/core": "^6.0.8",
    "@dnd-kit/sortable": "^7.0.2",
    "@dnd-kit/utilities": "^3.2.1",
    "react-beautiful-dnd": "^13.1.1",
    "react-hook-form": "^7.45.0",
    "@hookform/resolvers": "^3.1.0",
    "yup": "^1.2.0",
    "axios": "^1.4.0",
    "socket.io-client": "^4.7.0",
    "react-query": "^3.39.0",
    "recharts": "^2.7.0",
    "react-virtualized": "^9.22.5",
    "react-window": "^1.8.8",
    "react-intersection-observer": "^9.5.0",
    "framer-motion": "^10.12.0",
    "react-hot-toast": "^2.4.0",
    "dayjs": "^1.11.0",
    "lodash": "^4.17.21",
    "classnames": "^2.3.2",
    "react-helmet-async": "^1.3.0",
    "react-error-boundary": "^4.0.11"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/lodash": "^4.14.0",
    "@types/react-beautiful-dnd": "^13.1.4",
    "@types/react-virtualized": "^9.21.21",
    "@types/react-window": "^1.8.5",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "eslint": "^8.45.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.0",
    "typescript": "^5.0.2",
    "vite": "^4.4.0",
    "vitest": "^0.34.0",
    "@vitest/ui": "^0.34.0",
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^5.16.5",
    "@testing-library/user-event": "^14.4.3",
    "jsdom": "^22.1.0",
    "msw": "^1.2.0"
  }
}
```

#### frontend/vite.config.ts
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared/src')
    }
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
          redux: ['@reduxjs/toolkit', 'react-redux'],
          charts: ['recharts']
        }
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts'
  }
});
```

### 3. 后端核心文件

#### backend/package.json
```json
{
  "name": "crm-backend",
  "version": "1.0.0",
  "description": "AI-Driven CRM Backend API",
  "main": "dist/server.js",
  "scripts": {
    "dev": "nodemon src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "migrate": "ts-node src/database/migrations/index.ts",
    "seed": "ts-node src/database/seeds/index.ts",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "express": "^4.18.0",
    "mongoose": "^7.4.0",
    "redis": "^4.6.0",
    "socket.io": "^4.7.0",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "express-rate-limit": "^6.8.0",
    "express-validator": "^7.0.0",
    "multer": "^1.4.5",
    "sharp": "^0.32.0",
    "nodemailer": "^6.9.0",
    "bull": "^4.11.0",
    "winston": "^3.10.0",
    "morgan": "^1.10.0",
    "compression": "^1.7.4",
    "dotenv": "^16.3.0",
    "openai": "^3.3.0",
    "axios": "^1.4.0",
    "cheerio": "^1.0.0-rc.12",
    "puppeteer": "^20.7.0",
    "tesseract.js": "^4.1.0",
    "jimp": "^0.22.0",
    "pdf-parse": "^1.1.1",
    "csv-parser": "^3.0.0",
    "xlsx": "^0.18.5",
    "moment": "^2.29.4",
    "lodash": "^4.17.21",
    "uuid": "^9.0.0",
    "validator": "^13.9.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/node": "^20.4.0",
    "@types/mongoose": "^5.11.97",
    "@types/jsonwebtoken": "^9.0.0",
    "@types/bcryptjs": "^2.4.0",
    "@types/cors": "^2.8.0",
    "@types/multer": "^1.4.0",
    "@types/nodemailer": "^6.4.0",
    "@types/morgan": "^1.9.0",
    "@types/compression": "^1.7.0",
    "@types/lodash": "^4.14.0",
    "@types/uuid": "^9.0.0",
    "@types/validator": "^13.9.0",
    "@types/jest": "^29.5.0",
    "@types/supertest": "^2.0.12",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.45.0",
    "jest": "^29.6.0",
    "ts-jest": "^29.1.0",
    "ts-node": "^10.9.0",
    "typescript": "^5.1.0",
    "nodemon": "^3.0.0",
    "supertest": "^6.3.0",
    "mongodb-memory-server": "^8.13.0"
  }
}
```

#### backend/tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitThis": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "moduleResolution": "node",
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"],
      "@shared/*": ["../../shared/src/*"]
    },
    "allowSyntheticDefaultImports": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
```

### 4. 共享代码

#### shared/package.json
```json
{
  "name": "crm-shared",
  "version": "1.0.0",
  "description": "Shared types and utilities for CRM system",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "jest",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix"
  },
  "dependencies": {
    "yup": "^1.2.0",
    "dayjs": "^1.11.0"
  },
  "devDependencies": {
    "@types/node": "^20.4.0",
    "typescript": "^5.1.0",
    "jest": "^29.6.0",
    "ts-jest": "^29.1.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.45.0"
  }
}
```

## 开发工作流

### 1. 环境设置
```bash
# 克隆项目
git clone <repository-url>
cd CRM3

# 安装依赖
npm install

# 构建共享代码
npm run build:shared

# 设置环境变量
cp .env.example .env
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env

# 启动开发环境
npm run docker:up

# 运行数据迁移
npm run migrate

# 添加种子数据
npm run seed

# 启动开发服务器
npm run dev
```

### 2. 代码规范
- **TypeScript**: 严格模式，完整类型定义
- **ESLint**: 代码质量检查
- **Prettier**: 代码格式化
- **Husky**: Git钩子，提交前检查
- **Conventional Commits**: 提交信息规范

### 3. 测试策略
- **单元测试**: Jest + Testing Library
- **集成测试**: Supertest + MongoDB Memory Server
- **E2E测试**: Playwright
- **覆盖率**: 目标80%以上

### 4. 部署流程
- **开发环境**: Docker Compose
- **测试环境**: Kubernetes + Helm
- **生产环境**: AWS EKS + Terraform
- **CI/CD**: GitHub Actions

这个项目结构提供了完整的AI驱动CRM系统开发框架，支持现代化的开发工作流和最佳实践。