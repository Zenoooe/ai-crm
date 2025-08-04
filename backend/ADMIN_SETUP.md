# CRM系统管理员账号设置指南

## 默认管理员账号

系统已为您创建了一个默认的管理员账号，用于首次登录和系统管理：

```
邮箱: admin@crm.com
密码: Admin123!
角色: 管理员
```

⚠️ **重要提醒**: 请在首次登录后立即修改默认密码！

## 管理员账号管理

### 1. 初始化管理员账号

如果需要重新创建管理员账号，可以运行：

```bash
cd backend
npm run init-admin
```

### 2. 重置管理员密码

如果忘记了管理员密码，可以重置为默认密码：

```bash
cd backend
npm run reset-admin-password
```

### 3. 修改密码

登录系统后，可以通过以下方式修改密码：

#### 方式一：通过前端界面
1. 登录系统
2. 进入「设置」页面
3. 选择「修改密码」
4. 输入当前密码和新密码

#### 方式二：通过API接口

```bash
curl -X PUT http://localhost:5001/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "currentPassword": "Admin123!",
    "newPassword": "YourNewPassword123!"
  }'
```

## 用户注册功能

系统支持新用户注册，注册接口：`POST /api/auth/register`

### 注册要求

- **邮箱**: 必须是有效的邮箱格式，且未被注册
- **密码**: 至少8个字符，必须包含大小写字母、数字和特殊字符
- **姓名**: 名字和姓氏各1-50个字符
- **公司**: 可选，最多100个字符
- **手机**: 可选，必须是有效的手机号码

### 注册示例

```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "UserPass123!",
    "firstName": "张",
    "lastName": "三",
    "company": "示例公司",
    "phone": "+86 138 0013 8000"
  }'
```

## 登录功能

### 登录接口

`POST /api/auth/login`

### 登录示例

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@crm.com",
    "password": "Admin123!",
    "rememberMe": true
  }'
```

### 响应示例

```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "_id": "...",
      "email": "admin@crm.com",
      "name": "系统管理员",
      "role": "admin"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## 密码安全策略

系统采用以下密码安全策略：

1. **密码复杂度要求**:
   - 最少8个字符
   - 必须包含大写字母
   - 必须包含小写字母
   - 必须包含数字
   - 必须包含特殊字符 (@$!%*?&)

2. **密码加密**: 使用bcrypt进行哈希加密，盐值轮数为12

3. **令牌管理**:
   - 访问令牌(Access Token): 默认1天有效期，记住我时30天
   - 刷新令牌(Refresh Token): 默认7天有效期，记住我时90天

## 忘记密码功能

### 1. 申请重置密码

```bash
curl -X POST http://localhost:5001/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@crm.com"
  }'
```

### 2. 使用重置令牌设置新密码

```bash
curl -X POST http://localhost:5001/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "RESET_TOKEN_FROM_EMAIL",
    "password": "NewPassword123!"
  }'
```

## 会话管理

### 查看活跃会话

```bash
curl -X GET http://localhost:5001/api/auth/sessions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 终止指定会话

```bash
curl -X DELETE http://localhost:5001/api/auth/sessions/SESSION_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 终止所有其他会话

```bash
curl -X DELETE http://localhost:5001/api/auth/sessions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 用户权限说明

### 管理员权限 (admin)
- 访问所有系统功能
- 管理其他用户账号
- 查看系统统计数据
- 配置系统设置
- 企业级订阅计划
- 高额API使用限制

### 普通用户权限 (user)
- 管理自己的联系人
- 使用基础CRM功能
- 免费订阅计划
- 标准API使用限制

## 故障排除

### 1. 无法创建管理员账号

检查数据库连接是否正常：

```bash
# 检查MongoDB服务状态
mongosh --eval "db.adminCommand('ping')"

# 检查环境变量
echo $MONGODB_URI
```

### 2. 登录失败

- 确认邮箱和密码正确
- 检查账号是否已激活 (`isActive: true`)
- 检查邮箱是否已验证 (`isEmailVerified: true`)

### 3. 密码重置失败

- 确认重置令牌未过期
- 检查新密码是否符合复杂度要求
- 确认令牌格式正确

## 安全建议

1. **立即修改默认密码**: 首次登录后务必修改默认管理员密码
2. **定期更换密码**: 建议每3-6个月更换一次密码
3. **启用双因素认证**: 在生产环境中考虑启用2FA
4. **监控登录活动**: 定期检查登录日志和活跃会话
5. **限制管理员数量**: 只给必要的人员分配管理员权限
6. **使用HTTPS**: 生产环境必须使用HTTPS协议
7. **定期备份**: 定期备份用户数据和系统配置

---

如有任何问题，请查看系统日志或联系技术支持。