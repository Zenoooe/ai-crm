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
