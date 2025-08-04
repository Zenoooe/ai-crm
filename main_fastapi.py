# main_fastapi.py - FastAPI CRM 主应用程序
from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import httpx
import json
import os
from datetime import datetime, timedelta
import asyncio
from contextlib import asynccontextmanager
import redis
from celery import Celery
import logging
from database import get_db, Customer, Folder, engine, Base
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Redis连接
redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    db=0,
    decode_responses=True
)

# Celery配置
celery_app = Celery(
    "crm_tasks",
    broker=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0"),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")
)

# AI模型配置
AI_MODELS = {
    "grok-4": {
        "api_key": os.getenv("XAI_API_KEY"),
        "base_url": "https://api.x.ai/v1",
        "model": "grok-4"
    },
    "deepseek-reasoner": {
        "api_key": os.getenv("DEEPSEEK_API_KEY"),
        "base_url": "https://api.deepseek.com/v1",
        "model": "deepseek-reasoner"
    },
    "moonshot-kimi-k2": {
        "api_key": os.getenv("MOONSHOT_API_KEY"),
        "base_url": "https://api.moonshot.cn/v1",
        "model": "moonshot-v1-1t"
    }
}

# 数据模型
class CustomerCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: Optional[str] = Field(None, regex=r'^[\w\.-]+@[\w\.-]+\.\w+$')
    phone: Optional[str] = Field(None, min_length=10, max_length=20)
    tags: List[str] = Field(default_factory=list)
    progress: float = Field(default=0.0, ge=0.0, le=100.0)
    latest_notes: Optional[str] = Field(None, max_length=1000)
    folder_id: Optional[int] = None

class CustomerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[str] = Field(None, regex=r'^[\w\.-]+@[\w\.-]+\.\w+$')
    phone: Optional[str] = Field(None, min_length=10, max_length=20)
    tags: Optional[List[str]] = None
    progress: Optional[float] = Field(None, ge=0.0, le=100.0)
    latest_notes: Optional[str] = Field(None, max_length=1000)
    folder_id: Optional[int] = None

class CustomerResponse(BaseModel):
    id: int
    name: str
    email: Optional[str]
    phone: Optional[str]
    tags: List[str]
    progress: float
    latest_notes: Optional[str]
    folder_id: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class FolderCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    order: int = Field(default=0)
    parent_id: Optional[int] = None

class FolderUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    order: Optional[int] = None
    parent_id: Optional[int] = None

class FolderResponse(BaseModel):
    id: int
    name: str
    order: int
    parent_id: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AIAnalysisRequest(BaseModel):
    customer_id: int
    analysis_type: str = Field(..., regex=r'^(personality|communication|interests|pain_points|recommendations)$')
    context: Optional[str] = None

class AIAnalysisResponse(BaseModel):
    customer_id: int
    analysis_type: str
    result: Dict[str, Any]
    confidence: float
    model_used: str
    timestamp: datetime

class ReminderCreate(BaseModel):
    customer_id: int
    reminder_time: datetime
    message: str = Field(..., min_length=1, max_length=500)
    reminder_type: str = Field(default="general")

# 应用程序生命周期管理
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时初始化
    logger.info("启动 FastAPI CRM 应用程序")
    
    # 创建数据库表
    Base.metadata.create_all(bind=engine)
    
    # 初始化默认文件夹
    db = next(get_db())
    try:
        default_folders = [
            {"name": "潜在客户", "order": 1},
            {"name": "活跃客户", "order": 2},
            {"name": "已成交", "order": 3},
            {"name": "已流失", "order": 4}
        ]
        
        for folder_data in default_folders:
            existing = db.query(Folder).filter(Folder.name == folder_data["name"]).first()
            if not existing:
                folder = Folder(**folder_data)
                db.add(folder)
        
        db.commit()
        logger.info("默认文件夹初始化完成")
    except Exception as e:
        logger.error(f"初始化默认文件夹失败: {e}")
        db.rollback()
    finally:
        db.close()
    
    yield
    
    # 关闭时清理
    logger.info("关闭 FastAPI CRM 应用程序")

# 创建FastAPI应用
app = FastAPI(
    title="AI CRM 系统",
    description="基于FastAPI的智能客户关系管理系统，集成多个AI模型",
    version="1.0.0",
    lifespan=lifespan
)

# 中间件配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应限制具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "*.example.com"]
)

# 安全配置
security = HTTPBearer()

# 依赖注入
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    # 简化的JWT验证，生产环境需要完整实现
    token = credentials.credentials
    if not token or token != os.getenv("API_TOKEN", "demo-token"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证令牌",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {"user_id": 1, "username": "demo_user"}

# AI服务函数
async def call_ai_model(model_name: str, prompt: str, context: Optional[str] = None) -> Dict[str, Any]:
    """调用指定的AI模型"""
    if model_name not in AI_MODELS:
        raise HTTPException(status_code=400, detail=f"不支持的AI模型: {model_name}")
    
    model_config = AI_MODELS[model_name]
    
    headers = {
        "Authorization": f"Bearer {model_config['api_key']}",
        "Content-Type": "application/json"
    }
    
    messages = [
        {"role": "system", "content": "你是一个专业的CRM客户分析助手，请提供准确、有用的客户洞察。"},
        {"role": "user", "content": prompt}
    ]
    
    if context:
        messages.insert(1, {"role": "user", "content": f"客户背景信息: {context}"})
    
    payload = {
        "model": model_config["model"],
        "messages": messages,
        "max_tokens": 1000,
        "temperature": 0.7
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{model_config['base_url']}/chat/completions",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            result = response.json()
            
            return {
                "content": result["choices"][0]["message"]["content"],
                "model": model_name,
                "usage": result.get("usage", {}),
                "timestamp": datetime.now().isoformat()
            }
    except httpx.HTTPError as e:
        logger.error(f"AI模型调用失败 ({model_name}): {e}")
        raise HTTPException(status_code=500, detail=f"AI服务暂时不可用: {str(e)}")

# Celery任务
@celery_app.task
def send_reminder_task(customer_id: int, message: str, reminder_time: str):
    """发送提醒任务"""
    logger.info(f"发送提醒给客户 {customer_id}: {message} (时间: {reminder_time})")
    # 这里可以集成邮件、短信或推送通知服务
    return {"status": "sent", "customer_id": customer_id, "message": message}

# API路由

@app.get("/")
async def root():
    return {"message": "AI CRM 系统 API", "version": "1.0.0", "status": "运行中"}

@app.get("/health")
async def health_check():
    """健康检查"""
    try:
        # 检查数据库连接
        db = next(get_db())
        db.execute("SELECT 1")
        db.close()
        
        # 检查Redis连接
        redis_client.ping()
        
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "services": {
                "database": "connected",
                "redis": "connected",
                "ai_models": list(AI_MODELS.keys())
            }
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"服务不健康: {str(e)}")

# 客户管理API

@app.post("/customers/", response_model=CustomerResponse)
async def create_customer(
    customer: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """创建新客户"""
    db_customer = Customer(**customer.dict())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    
    logger.info(f"用户 {current_user['username']} 创建了客户: {db_customer.name}")
    return db_customer

@app.get("/customers/", response_model=List[CustomerResponse])
async def list_customers(
    skip: int = 0,
    limit: int = 100,
    folder_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """获取客户列表"""
    query = db.query(Customer)
    
    if folder_id:
        query = query.filter(Customer.folder_id == folder_id)
    
    if search:
        query = query.filter(
            Customer.name.contains(search) |
            Customer.email.contains(search) |
            Customer.phone.contains(search)
        )
    
    customers = query.offset(skip).limit(limit).all()
    return customers

@app.get("/customers/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """获取单个客户详情"""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="客户不存在")
    return customer

@app.put("/customers/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: int,
    customer_update: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """更新客户信息"""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="客户不存在")
    
    update_data = customer_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(customer, field, value)
    
    db.commit()
    db.refresh(customer)
    
    logger.info(f"用户 {current_user['username']} 更新了客户: {customer.name}")
    return customer

@app.delete("/customers/{customer_id}")
async def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """删除客户"""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="客户不存在")
    
    customer_name = customer.name
    db.delete(customer)
    db.commit()
    
    logger.info(f"用户 {current_user['username']} 删除了客户: {customer_name}")
    return {"message": "客户删除成功"}

# 文件夹管理API

@app.post("/folders/", response_model=FolderResponse)
async def create_folder(
    folder: FolderCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """创建新文件夹"""
    db_folder = Folder(**folder.dict())
    db.add(db_folder)
    db.commit()
    db.refresh(db_folder)
    
    logger.info(f"用户 {current_user['username']} 创建了文件夹: {db_folder.name}")
    return db_folder

@app.get("/folders/", response_model=List[FolderResponse])
async def list_folders(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """获取文件夹列表"""
    folders = db.query(Folder).order_by(Folder.order).all()
    return folders

@app.put("/folders/{folder_id}", response_model=FolderResponse)
async def update_folder(
    folder_id: int,
    folder_update: FolderUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """更新文件夹"""
    folder = db.query(Folder).filter(Folder.id == folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="文件夹不存在")
    
    update_data = folder_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(folder, field, value)
    
    db.commit()
    db.refresh(folder)
    
    logger.info(f"用户 {current_user['username']} 更新了文件夹: {folder.name}")
    return folder

@app.delete("/folders/{folder_id}")
async def delete_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """删除文件夹"""
    folder = db.query(Folder).filter(Folder.id == folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="文件夹不存在")
    
    # 检查是否有客户在此文件夹中
    customers_count = db.query(Customer).filter(Customer.folder_id == folder_id).count()
    if customers_count > 0:
        raise HTTPException(status_code=400, detail=f"文件夹中还有 {customers_count} 个客户，无法删除")
    
    folder_name = folder.name
    db.delete(folder)
    db.commit()
    
    logger.info(f"用户 {current_user['username']} 删除了文件夹: {folder_name}")
    return {"message": "文件夹删除成功"}

@app.post("/folders/{folder_id}/dissolve")
async def dissolve_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """解散文件夹 - 将组内所有客户移动到默认分组"""
    folder = db.query(Folder).filter(Folder.id == folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="文件夹不存在")
    
    # 获取默认分组（第一个分组）
    default_folder = db.query(Folder).order_by(Folder.order).first()
    if not default_folder:
        raise HTTPException(status_code=500, detail="系统中没有可用的默认分组")
    
    # 如果要解散的就是默认分组，不允许操作
    if folder_id == default_folder.id:
        raise HTTPException(status_code=400, detail="不能解散默认分组")
    
    # 获取该分组中的所有客户
    customers_in_folder = db.query(Customer).filter(Customer.folder_id == folder_id).all()
    customers_count = len(customers_in_folder)
    
    # 将所有客户移动到默认分组
    for customer in customers_in_folder:
        customer.folder_id = default_folder.id
    
    # 删除空的分组
    folder_name = folder.name
    db.delete(folder)
    db.commit()
    
    logger.info(f"用户 {current_user['username']} 解散了文件夹 '{folder_name}'，将 {customers_count} 个客户移动到默认分组 '{default_folder.name}'")
    
    return {
        "message": f"成功解散分组 '{folder_name}'，{customers_count} 个客户已移动到默认分组 '{default_folder.name}'",
        "dissolved_folder": folder_name,
        "moved_customers_count": customers_count,
        "default_folder": default_folder.name
    }

# AI分析API

@app.post("/ai/analyze", response_model=AIAnalysisResponse)
async def analyze_customer(
    analysis_request: AIAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """AI客户分析"""
    customer = db.query(Customer).filter(Customer.id == analysis_request.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="客户不存在")
    
    # 构建分析提示
    analysis_prompts = {
        "personality": f"分析客户 {customer.name} 的性格特征，基于以下信息：邮箱 {customer.email}，电话 {customer.phone}，标签 {customer.tags}，最新情况 {customer.latest_notes}。请提供性格分析和沟通建议。",
        "communication": f"为客户 {customer.name} 推荐最佳沟通方式和话术，考虑其背景信息和当前进度 {customer.progress}%。",
        "interests": f"基于客户 {customer.name} 的信息，分析其可能的兴趣爱好和关注点。",
        "pain_points": f"识别客户 {customer.name} 可能面临的痛点和挑战，并提供解决方案建议。",
        "recommendations": f"为客户 {customer.name} 提供下一步行动建议，包括跟进策略和时机。"
    }
    
    prompt = analysis_prompts.get(analysis_request.analysis_type)
    if not prompt:
        raise HTTPException(status_code=400, detail="不支持的分析类型")
    
    # 选择AI模型（可以根据分析类型选择不同模型）
    model_name = "grok-4"  # 默认使用Grok-4
    if analysis_request.analysis_type in ["personality", "communication"]:
        model_name = "deepseek-reasoner"  # 使用推理能力更强的模型
    
    try:
        ai_result = await call_ai_model(model_name, prompt, analysis_request.context)
        
        # 解析AI响应
        result = {
            "analysis": ai_result["content"],
            "raw_response": ai_result,
            "customer_info": {
                "name": customer.name,
                "tags": customer.tags,
                "progress": customer.progress
            }
        }
        
        # 缓存结果
        cache_key = f"ai_analysis:{customer.id}:{analysis_request.analysis_type}"
        redis_client.setex(cache_key, 3600, json.dumps(result))  # 缓存1小时
        
        logger.info(f"用户 {current_user['username']} 对客户 {customer.name} 进行了 {analysis_request.analysis_type} 分析")
        
        return AIAnalysisResponse(
            customer_id=customer.id,
            analysis_type=analysis_request.analysis_type,
            result=result,
            confidence=0.85,  # 模拟置信度
            model_used=model_name,
            timestamp=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"AI分析失败: {e}")
        raise HTTPException(status_code=500, detail=f"AI分析失败: {str(e)}")

@app.get("/ai/models")
async def list_ai_models(current_user: dict = Depends(get_current_user)):
    """获取可用的AI模型列表"""
    return {
        "models": [
            {
                "name": name,
                "description": f"{name} - 专业AI模型",
                "capabilities": ["文本生成", "客户分析", "对话理解"]
            }
            for name in AI_MODELS.keys()
        ]
    }

# 提醒系统API

@app.post("/reminders/")
async def create_reminder(
    reminder: ReminderCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """创建客户提醒"""
    customer = db.query(Customer).filter(Customer.id == reminder.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="客户不存在")
    
    # 计算延迟时间
    delay_seconds = (reminder.reminder_time - datetime.now()).total_seconds()
    
    if delay_seconds <= 0:
        raise HTTPException(status_code=400, detail="提醒时间必须是未来时间")
    
    # 添加到Celery任务队列
    task = send_reminder_task.apply_async(
        args=[reminder.customer_id, reminder.message, reminder.reminder_time.isoformat()],
        countdown=delay_seconds
    )
    
    # 保存提醒信息到客户记录
    customer.reminder = {
        "time": reminder.reminder_time.isoformat(),
        "message": reminder.message,
        "type": reminder.reminder_type,
        "task_id": task.id
    }
    db.commit()
    
    logger.info(f"用户 {current_user['username']} 为客户 {customer.name} 设置了提醒")
    
    return {
        "message": "提醒创建成功",
        "task_id": task.id,
        "reminder_time": reminder.reminder_time,
        "customer_name": customer.name
    }

# WebSocket支持（实时更新）

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await websocket.accept()
    logger.info(f"WebSocket连接建立: {client_id}")
    
    try:
        while True:
            # 接收客户端消息
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # 处理不同类型的消息
            if message.get("type") == "ping":
                await websocket.send_text(json.dumps({"type": "pong", "timestamp": datetime.now().isoformat()}))
            
            elif message.get("type") == "subscribe_customer":
                customer_id = message.get("customer_id")
                # 订阅客户更新
                await websocket.send_text(json.dumps({
                    "type": "subscribed",
                    "customer_id": customer_id,
                    "message": f"已订阅客户 {customer_id} 的更新"
                }))
            
            # 可以添加更多实时功能
            
    except Exception as e:
        logger.error(f"WebSocket错误 ({client_id}): {e}")
    finally:
        logger.info(f"WebSocket连接关闭: {client_id}")

# 统计和报表API

@app.get("/stats/dashboard")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """获取仪表板统计数据"""
    total_customers = db.query(Customer).count()
    
    # 按文件夹统计
    folder_stats = db.query(Folder.name, db.func.count(Customer.id).label('count')).outerjoin(Customer, Folder.id == Customer.folder_id).group_by(Folder.id, Folder.name).all()
    
    # 进度统计
    avg_progress = db.query(db.func.avg(Customer.progress)).scalar() or 0
    
    # 最近活动
    recent_customers = db.query(Customer).order_by(Customer.updated_at.desc()).limit(5).all()
    
    return {
        "total_customers": total_customers,
        "average_progress": round(avg_progress, 2),
        "folder_distribution": [
            {"folder": name, "count": count}
            for name, count in folder_stats
        ],
        "recent_activity": [
            {
                "id": customer.id,
                "name": customer.name,
                "progress": customer.progress,
                "updated_at": customer.updated_at.isoformat()
            }
            for customer in recent_customers
        ]
    }

# 批量操作API

@app.post("/customers/batch/move")
async def batch_move_customers(
    customer_ids: List[int],
    target_folder_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """批量移动客户到指定文件夹"""
    # 验证文件夹存在
    folder = db.query(Folder).filter(Folder.id == target_folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="目标文件夹不存在")
    
    # 批量更新
    updated_count = db.query(Customer).filter(Customer.id.in_(customer_ids)).update({Customer.folder_id: target_folder_id}, synchronize_session=False)
    
    db.commit()
    
    logger.info(f"用户 {current_user['username']} 批量移动了 {updated_count} 个客户到文件夹 {folder.name}")
    
    return {
        "message": f"成功移动 {updated_count} 个客户到文件夹 '{folder.name}'",
        "updated_count": updated_count,
        "target_folder": folder.name
    }

@app.post("/customers/batch/update_tags")
async def batch_update_tags(
    customer_ids: List[int],
    tags: List[str],
    operation: str = "add",  # add, remove, replace
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """批量更新客户标签"""
    if operation not in ["add", "remove", "replace"]:
        raise HTTPException(status_code=400, detail="操作类型必须是 add, remove 或 replace")
    
    customers = db.query(Customer).filter(Customer.id.in_(customer_ids)).all()
    updated_count = 0
    
    for customer in customers:
        current_tags = customer.tags or []
        
        if operation == "add":
            new_tags = list(set(current_tags + tags))
        elif operation == "remove":
            new_tags = [tag for tag in current_tags if tag not in tags]
        else:  # replace
            new_tags = tags
        
        customer.tags = new_tags
        updated_count += 1
    
    db.commit()
    
    logger.info(f"用户 {current_user['username']} 批量更新了 {updated_count} 个客户的标签")
    
    return {
        "message": f"成功更新 {updated_count} 个客户的标签",
        "updated_count": updated_count,
        "operation": operation,
        "tags": tags
    }

# 错误处理

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
            "timestamp": datetime.now().isoformat()
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"未处理的异常: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "内部服务器错误",
            "status_code": 500,
            "timestamp": datetime.now().isoformat()
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main_fastapi:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )