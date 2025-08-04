#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HTTPS和IPv6启动脚本
使用此脚本启动支持HTTPS和IPv6的CRM服务器
"""

import os
import sys

def main():
    """启动HTTPS和IPv6服务器"""
    print("=" * 50)
    print("AI CRM - HTTPS & IPv6 启动脚本")
    print("=" * 50)
    
    # 设置环境变量
    os.environ['ENABLE_HTTPS'] = 'true'
    os.environ['ENABLE_IPV6'] = 'true'
    os.environ['HOST'] = '::'
    os.environ['PORT'] = '5002'
    
    print("配置信息:")
    print(f"- HTTPS: 启用")
    print(f"- IPv6: 启用")
    print(f"- 主机: :: (IPv6 所有接口)")
    print(f"- 端口: 5002")
    print(f"- HTTP访问: http://[::1]:5002 或 http://localhost:5002")
    print(f"- HTTPS访问: https://[::1]:5002 或 https://localhost:5002")
    print("\n注意: 首次启动会自动生成自签名SSL证书")
    print("浏览器可能会显示安全警告，这是正常的，点击'继续访问'即可")
    print("=" * 50)
    
    # 导入并启动应用
    try:
        from app import app, init_db, create_ssl_context
        from config import api_config
        import logging
        
        # 配置日志
        logging.basicConfig(level=logging.INFO)
        logger = logging.getLogger(__name__)
        
        # 初始化数据库
        init_db()
        
        # 创建SSL上下文
        ssl_context = create_ssl_context()
        
        # 启动服务器
        if ssl_context:
            logger.info("启动HTTPS + IPv6服务器...")
            app.run(
                debug=False,
                host='::',
                port=5002,
                use_reloader=False,
                ssl_context=ssl_context
            )
        else:
            logger.warning("SSL证书创建失败，启动HTTP + IPv6服务器...")
            app.run(
                debug=False,
                host='::',
                port=5002,
                use_reloader=False
            )
            
    except Exception as e:
        print(f"启动失败: {e}")
        print("尝试IPv4回退...")
        try:
            app.run(
                debug=False,
                host='0.0.0.0',
                port=5002,
                use_reloader=False,
                ssl_context=ssl_context if 'ssl_context' in locals() else None
            )
        except Exception as e2:
            print(f"IPv4回退也失败: {e2}")
            sys.exit(1)

if __name__ == '__main__':
    main()