#!/bin/bash

# AI CRM 部署脚本
# 支持多个免费平台部署

set -e

echo "🚀 AI CRM 部署脚本"
echo "=================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查Git状态
check_git_status() {
    echo -e "${BLUE}检查Git状态...${NC}"
    
    if [ ! -d ".git" ]; then
        echo -e "${RED}错误: 当前目录不是Git仓库${NC}"
        echo "请先运行: git init"
        exit 1
    fi
    
    if [ -n "$(git status --porcelain)" ]; then
        echo -e "${YELLOW}警告: 有未提交的更改${NC}"
        read -p "是否继续部署? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# 准备部署文件
prepare_deployment() {
    echo -e "${BLUE}准备部署文件...${NC}"
    
    # 创建生产环境配置
    if [ ! -f "config_production.py" ]; then
        cat > config_production.py << EOF
import os
from config import APIConfig

class ProductionConfig(APIConfig):
    def __init__(self):
        super().__init__()
        # 覆盖生产环境配置
        self.app.update({
            'debug': False,
            'host': '0.0.0.0',
            'port': int(os.environ.get('PORT', 5002)),
            'secret_key': os.environ.get('SECRET_KEY', self.app['secret_key'])
        })
        
        # 数据库配置
        database_url = os.environ.get('DATABASE_URL')
        if database_url:
            self.database['sqlite_path'] = database_url

# 生产环境配置实例
api_config = ProductionConfig()
EOF
        echo -e "${GREEN}✓ 创建生产环境配置${NC}"
    fi
    
    # 创建Procfile (Heroku)
    if [ ! -f "Procfile" ]; then
        echo "web: gunicorn app:app" > Procfile
        echo -e "${GREEN}✓ 创建Procfile${NC}"
    fi
    
    # 创建runtime.txt (指定Python版本)
    if [ ! -f "runtime.txt" ]; then
        echo "python-3.11.5" > runtime.txt
        echo -e "${GREEN}✓ 创建runtime.txt${NC}"
    fi
}

# Railway部署
deploy_railway() {
    echo -e "${BLUE}部署到Railway...${NC}"
    
    if ! command -v railway &> /dev/null; then
        echo -e "${RED}Railway CLI未安装${NC}"
        echo "请访问: https://railway.app/cli"
        return 1
    fi
    
    railway login
    railway link
    railway up
    
    echo -e "${GREEN}✓ Railway部署完成${NC}"
}

# Render部署
deploy_render() {
    echo -e "${BLUE}准备Render部署...${NC}"
    
    # 创建render.yaml
    cat > render.yaml << EOF
services:
  - type: web
    name: ai-crm
    env: python
    buildCommand: pip install -r requirements_production.txt
    startCommand: python app.py
    envVars:
      - key: PORT
        sync: false
      - key: FLASK_ENV
        value: production
      - key: SECRET_KEY
        generateValue: true
EOF
    
    echo -e "${GREEN}✓ 创建render.yaml配置${NC}"
    echo -e "${YELLOW}请手动在Render控制台连接GitHub仓库${NC}"
}

# Vercel部署
deploy_vercel() {
    echo -e "${BLUE}准备Vercel部署...${NC}"
    
    # 创建vercel.json
    cat > vercel.json << EOF
{
  "version": 2,
  "builds": [
    {
      "src": "app.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "app.py"
    }
  ],
  "env": {
    "FLASK_ENV": "production"
  }
}
EOF
    
    if command -v vercel &> /dev/null; then
        vercel --prod
        echo -e "${GREEN}✓ Vercel部署完成${NC}"
    else
        echo -e "${YELLOW}Vercel CLI未安装，请手动部署${NC}"
        echo "安装: npm i -g vercel"
    fi
}

# Git提交和推送
git_commit_push() {
    echo -e "${BLUE}提交代码到Git...${NC}"
    
    git add .
    
    # 检查是否有更改
    if git diff --staged --quiet; then
        echo -e "${YELLOW}没有新的更改需要提交${NC}"
    else
        read -p "请输入提交信息 (默认: Deploy $(date '+%Y-%m-%d %H:%M')): " commit_message
        commit_message=${commit_message:-"Deploy $(date '+%Y-%m-%d %H:%M')"}
        
        git commit -m "$commit_message"
        echo -e "${GREEN}✓ 代码已提交${NC}"
    fi
    
    # 推送到远程仓库
    if git remote | grep -q origin; then
        git push origin main 2>/dev/null || git push origin master 2>/dev/null || {
            echo -e "${RED}推送失败，请检查远程仓库配置${NC}"
            return 1
        }
        echo -e "${GREEN}✓ 代码已推送到远程仓库${NC}"
    else
        echo -e "${YELLOW}警告: 未配置远程仓库${NC}"
    fi
}

# 显示部署选项
show_deployment_options() {
    echo -e "${BLUE}选择部署平台:${NC}"
    echo "1) Railway (推荐)"
    echo "2) Render"
    echo "3) Vercel"
    echo "4) 仅准备文件"
    echo "5) 退出"
    echo
}

# 主函数
main() {
    check_git_status
    prepare_deployment
    
    while true; do
        show_deployment_options
        read -p "请选择 (1-5): " choice
        
        case $choice in
            1)
                git_commit_push
                deploy_railway
                break
                ;;
            2)
                git_commit_push
                deploy_render
                break
                ;;
            3)
                git_commit_push
                deploy_vercel
                break
                ;;
            4)
                git_commit_push
                echo -e "${GREEN}✓ 部署文件已准备完成${NC}"
                break
                ;;
            5)
                echo -e "${YELLOW}部署已取消${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}无效选择，请重试${NC}"
                ;;
        esac
    done
    
    echo
    echo -e "${GREEN}🎉 部署流程完成！${NC}"
    echo -e "${BLUE}接下来的步骤:${NC}"
    echo "1. 在部署平台设置环境变量"
    echo "2. 配置数据库连接"
    echo "3. 测试应用功能"
    echo "4. 配置自定义域名 (可选)"
}

# 运行主函数
main "$@"