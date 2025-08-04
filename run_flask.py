#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Flask应用启动脚本
用于启动改造后的AI CRM Flask应用
"""

import os
import sys
import argparse
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# 导入配置和应用
try:
    from config import api_config
    from app import app
except ImportError as e:
    print(f"导入错误: {e}")
    print("请确保已安装所有依赖: pip install -r requirements_flask.txt")
    sys.exit(1)

def check_environment():
    """检查环境配置"""
    print("=" * 50)
    print("AI CRM Flask应用启动检查")
    print("=" * 50)
    
    # 检查.env文件
    env_file = project_root / '.env'
    if not env_file.exists():
        print("⚠️  警告: .env文件不存在")
        print("请复制.env.example为.env并配置API密钥")
        return False
    
    # 检查API密钥配置
    missing_keys = []
    
    # 检查至少一个AI模型的API密钥
    ai_keys = [
        ('OPENAI_API_KEY', 'OpenAI'),
        ('GROK_API_KEY', 'Grok'),
        ('DEEPSEEK_API_KEY', 'Deepseek'),
        ('MOONSHOT_API_KEY', 'Moonshot'),
        ('GOOGLE_API_KEY', 'Google Gemini')
    ]
    
    has_ai_key = False
    for key, name in ai_keys:
        if os.getenv(key) and os.getenv(key) != f'your_{key.lower()}_here':
            print(f"✅ {name} API密钥已配置")
            has_ai_key = True
        else:
            print(f"❌ {name} API密钥未配置")
    
    if not has_ai_key:
        print("\n⚠️  警告: 没有配置任何AI模型API密钥")
        print("应用将使用模拟数据运行，AI功能将不可用")
    
    # 检查数据库
    db_path = api_config.database['sqlite_path']
    if os.path.exists(db_path):
        print(f"✅ 数据库文件存在: {db_path}")
    else:
        print(f"ℹ️  数据库文件将自动创建: {db_path}")
    
    # 检查上传目录
    upload_dir = api_config.upload['upload_folder']
    if os.path.exists(upload_dir):
        print(f"✅ 上传目录存在: {upload_dir}")
    else:
        print(f"ℹ️  上传目录将自动创建: {upload_dir}")
    
    print("\n" + "=" * 50)
    return True

def main():
    """主函数"""
    # 解析命令行参数
    parser = argparse.ArgumentParser(description='启动AI CRM Flask应用')
    parser.add_argument('--port', type=int, default=None, help='指定端口号')
    parser.add_argument('--host', type=str, default=None, help='指定主机地址')
    parser.add_argument('--debug', action='store_true', help='启用调试模式')
    args = parser.parse_args()
    
    # 检查环境
    if not check_environment():
        print("环境检查失败，请检查配置后重试")
        return
    
    # 获取配置，命令行参数优先
    host = args.host or api_config.app.get('host', '0.0.0.0')
    port = args.port or api_config.app.get('port', 5000)
    debug = args.debug or api_config.app.get('debug', True)
    
    print(f"启动Flask应用...")
    print(f"地址: http://{host}:{port}")
    print(f"调试模式: {debug}")
    print(f"前端地址: {api_config.app.get('frontend_url', 'http://localhost:3000')}")
    print("\n按 Ctrl+C 停止应用")
    print("=" * 50)
    
    try:
        # 启动Flask应用
        app.run(
            host=host,
            port=port,
            debug=debug,
            threaded=True
        )
    except KeyboardInterrupt:
        print("\n应用已停止")
    except Exception as e:
        print(f"启动失败: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()