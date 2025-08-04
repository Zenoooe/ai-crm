# main.py - FastAPI主应用
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import httpx
import json
import os
from dotenv import load_dotenv
import asyncio
from celery import Celery
import redis

from database import get_db, Customer, Folder, Interaction, AIScript, AIInsight, Task, init_default_folders

load_dotenv()

# FastAPI应用初始化
app = FastAPI(
    title="AI-Driven CRM API",
    description="智能客户关系管理系统API",
    version="1.0.0"
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应该限制具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Redis连接
redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

# Celery配置（用于异步任务）
celery_app = Celery(
    'crm_tasks',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/0'
)

# 安全配置
security = HTTPBearer()

# Pydantic模型
class AIConnectionTest(BaseModel):
    model: str
    api_key: str

class ModelUpdateRequest(BaseModel):
    provider: str
    api_key: str

class AISettingsRequest(BaseModel):
    default_model: str
    api_key: str
    temperature: float
class CustomerCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: Optional[str] = None
    phone: Optional[str] = None
    wechat_id: Optional[str] = None
    company: Optional[str] = None
    position: Optional[str] = None
    industry: Optional[str] = None
    age_group: Optional[str] = None
    tags: List[str] = []
    folder_id: Optional[int] = None
    priority: int = Field(default=2, ge=1, le=3)
    social_profiles: Dict[str, str] = {}
    business_info: Dict[str, Any] = {}

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    wechat_id: Optional[str] = None
    company: Optional[str] = None
    position: Optional[str] = None
    industry: Optional[str] = None
    age_group: Optional[str] = None
    tags: Optional[List[str]] = None
    folder_id: Optional[int] = None
    priority: Optional[int] = None
    progress: Optional[float] = None
    latest_notes: Optional[str] = None
    social_profiles: Optional[Dict[str, str]] = None
    business_info: Optional[Dict[str, Any]] = None

class FolderCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    parent_id: Optional[int] = None
    folder_type: str = Field(default='custom')
    color: str = Field(default='#2196f3')
    icon: str = Field(default='folder')

class InteractionCreate(BaseModel):
    customer_id: int
    interaction_type: str = Field(..., regex='^(call|email|wechat|meeting|note)$')
    content: str = Field(..., min_length=1)
    interaction_date: datetime
    duration: Optional[int] = None
    attachments: List[Dict[str, str]] = []

class AIScriptRequest(BaseModel):
    customer_id: int
    script_type: str = Field(..., regex='^(opening|objection_handling|closing|follow_up)$')
    methodology: str = Field(default='consultative')
    scenario: Optional[str] = None
    context: Dict[str, Any] = {}

class TaskCreate(BaseModel):
    customer_id: int
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    task_type: str = Field(..., regex='^(call|email|meeting|follow_up|research)$')
    priority: int = Field(default=2, ge=1, le=3)
    due_date: Optional[datetime] = None
    reminder_time: Optional[datetime] = None

# AI服务类
class AIService:
    """AI服务集成类 - 支持多种AI模型"""
    
    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.google_api_key = os.getenv("GOOGLE_API_KEY")
        self.baidu_api_key = os.getenv("BAIDU_API_KEY")
        self.moonshot_api_key = os.getenv("MOONSHOT_API_KEY")
        self.deepseek_api_key = os.getenv("DEEPSEEK_API_KEY")
        self.grok_api_key = os.getenv("GROK_API_KEY")
    
    async def analyze_customer_profile(self, customer: Customer, interactions: List[Interaction]) -> Dict[str, Any]:
        """分析客户画像"""
        # 构建分析提示
        interaction_history = "\n".join([
            f"{i.interaction_date}: {i.interaction_type} - {i.content[:200]}..."
            for i in interactions[-10:]  # 最近10次互动
        ])
        
        prompt = f"""
        请分析以下客户信息，生成详细的客户画像：
        
        客户基本信息：
        - 姓名：{customer.name}
        - 公司：{customer.company}
        - 职位：{customer.position}
        - 行业：{customer.industry}
        - 年龄段：{customer.age_group}
        
        最近互动记录：
        {interaction_history}
        
        请从以下维度分析：
        1. 性格特征
        2. 沟通风格
        3. 兴趣爱好
        4. 痛点需求
        5. 决策风格
        6. 购买意向评分（0-100）
        
        请以JSON格式返回分析结果。
        """
        
        # 调用AI API（这里使用OpenAI作为示例）
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.openai_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "gpt-4",
                        "messages": [
                            {"role": "system", "content": "你是一个专业的客户分析师，擅长从互动记录中分析客户特征。"},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.7,
                        "max_tokens": 1000
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    content = result['choices'][0]['message']['content']
                    
                    # 尝试解析JSON
                    try:
                        analysis = json.loads(content)
                        return analysis
                    except json.JSONDecodeError:
                        # 如果不是有效JSON，返回文本分析
                        return {"analysis": content}
                else:
                    raise HTTPException(status_code=500, detail="AI分析服务暂时不可用")
                    
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"AI分析失败: {str(e)}")
    
    async def generate_sales_script(self, customer: Customer, script_request: AIScriptRequest) -> str:
        """生成销售话术"""
        # 获取客户AI画像
        ai_profile = customer.ai_profile or {}
        
        prompt = f"""
        请为以下客户生成{script_request.script_type}类型的销售话术：
        
        客户信息：
        - 姓名：{customer.name}
        - 公司：{customer.company}
        - 职位：{customer.position}
        - 行业：{customer.industry}
        
        客户画像：
        - 性格特征：{ai_profile.get('personality', '未知')}
        - 沟通风格：{ai_profile.get('communication_style', '未知')}
        - 兴趣点：{', '.join(ai_profile.get('interests', []))}
        - 痛点：{', '.join(ai_profile.get('pain_points', []))}
        
        销售方法论：{script_request.methodology}
        使用场景：{script_request.scenario or '常规销售对话'}
        
        请生成一段专业、个性化的销售话术，长度控制在200-500字。
        """
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.openai_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "gpt-4",
                        "messages": [
                            {"role": "system", "content": "你是一个专业的销售培训师，擅长根据客户特征生成个性化销售话术。"},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.8,
                        "max_tokens": 800
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return result['choices'][0]['message']['content']
                else:
                    raise HTTPException(status_code=500, detail="话术生成服务暂时不可用")
                    
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"话术生成失败: {str(e)}")
    
    async def analyze_interaction_sentiment(self, content: str) -> Dict[str, Any]:
        """分析互动情感"""
        prompt = f"""
        请分析以下对话内容的情感倾向：
        
        内容：{content}
        
        请返回：
        1. 情感分类：positive/neutral/negative
        2. 情感分数：-1到1之间的数值
        3. 关键情感词汇
        4. 简要分析
        
        请以JSON格式返回。
        """
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.openai_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "gpt-3.5-turbo",
                        "messages": [
                            {"role": "system", "content": "你是一个情感分析专家。"},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.3,
                        "max_tokens": 300
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    content = result['choices'][0]['message']['content']
                    try:
                        return json.loads(content)
                    except json.JSONDecodeError:
                        return {"sentiment": "neutral", "score": 0.0, "analysis": content}
                else:
                    return {"sentiment": "neutral", "score": 0.0}
                    
        except Exception as e:
            return {"sentiment": "neutral", "score": 0.0, "error": str(e)}

# 初始化AI服务
ai_service = AIService()

# 依赖注入
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """获取当前用户（简化版，实际应该验证JWT）"""
    # 这里应该验证JWT token，返回用户信息
    # 为了演示，直接返回模拟用户
    return {"user_id": "demo_user", "username": "demo"}

# API路由

@app.get("/")
async def root():
    return {"message": "AI-Driven CRM API", "version": "1.0.0"}

# 客户管理API
@app.get("/api/customers", response_model=List[Dict[str, Any]])
async def get_customers(
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
            Customer.company.contains(search) |
            Customer.email.contains(search)
        )
    
    customers = query.offset(skip).limit(limit).all()
    
    return [
        {
            "id": c.id,
            "name": c.name,
            "email": c.email,
            "phone": c.phone,
            "company": c.company,
            "position": c.position,
            "industry": c.industry,
            "tags": c.tags,
            "progress": c.progress,
            "priority": c.priority,
            "ai_score": c.ai_score,
            "created_at": c.created_at,
            "updated_at": c.updated_at
        }
        for c in customers
    ]

@app.post("/api/customers", response_model=Dict[str, Any])
async def create_customer(
    customer_data: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """创建新客户"""
    customer = Customer(
        name=customer_data.name,
        email=customer_data.email,
        phone=customer_data.phone,
        wechat_id=customer_data.wechat_id,
        company=customer_data.company,
        position=customer_data.position,
        industry=customer_data.industry,
        age_group=customer_data.age_group,
        tags=customer_data.tags,
        folder_id=customer_data.folder_id,
        priority=customer_data.priority,
        social_profiles=customer_data.social_profiles,
        business_info=customer_data.business_info
    )
    
    db.add(customer)
    db.commit()
    db.refresh(customer)
    
    return {
        "id": customer.id,
        "name": customer.name,
        "message": "客户创建成功"
    }

@app.get("/api/customers/{customer_id}", response_model=Dict[str, Any])
async def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """获取客户详情"""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="客户不存在")
    
    # 获取互动记录
    interactions = db.query(Interaction).filter(Interaction.customer_id == customer_id).order_by(Interaction.interaction_date.desc()).limit(10).all()
    
    return {
        "id": customer.id,
        "name": customer.name,
        "email": customer.email,
        "phone": customer.phone,
        "wechat_id": customer.wechat_id,
        "company": customer.company,
        "position": customer.position,
        "industry": customer.industry,
        "age_group": customer.age_group,
        "tags": customer.tags,
        "progress": customer.progress,
        "latest_notes": customer.latest_notes,
        "priority": customer.priority,
        "ai_profile": customer.ai_profile,
        "ai_score": customer.ai_score,
        "social_profiles": customer.social_profiles,
        "business_info": customer.business_info,
        "photos": customer.photos,
        "reminder": customer.reminder,
        "interactions": [
            {
                "id": i.id,
                "type": i.interaction_type,
                "content": i.content,
                "date": i.interaction_date,
                "sentiment": i.sentiment,
                "summary": i.summary
            }
            for i in interactions
        ],
        "created_at": customer.created_at,
        "updated_at": customer.updated_at
    }

@app.put("/api/customers/{customer_id}", response_model=Dict[str, Any])
async def update_customer(
    customer_id: int,
    customer_data: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """更新客户信息"""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="客户不存在")
    
    # 更新字段
    for field, value in customer_data.dict(exclude_unset=True).items():
        setattr(customer, field, value)
    
    customer.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(customer)
    
    return {"message": "客户信息更新成功"}

# 文件夹管理API
@app.get("/api/folders", response_model=List[Dict[str, Any]])
async def get_folders(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """获取文件夹列表"""
    folders = db.query(Folder).order_by(Folder.order).all()
    
    return [
        {
            "id": f.id,
            "name": f.name,
            "order": f.order,
            "parent_id": f.parent_id,
            "folder_type": f.folder_type,
            "color": f.color,
            "icon": f.icon,
            "customer_count": len(f.customers)
        }
        for f in folders
    ]

@app.post("/api/folders", response_model=Dict[str, Any])
async def create_folder(
    folder_data: FolderCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """创建新文件夹"""
    folder = Folder(
        name=folder_data.name,
        parent_id=folder_data.parent_id,
        folder_type=folder_data.folder_type,
        color=folder_data.color,
        icon=folder_data.icon
    )
    
    db.add(folder)
    db.commit()
    db.refresh(folder)
    
    return {
        "id": folder.id,
        "name": folder.name,
        "message": "文件夹创建成功"
    }

# 互动记录API
@app.post("/api/interactions", response_model=Dict[str, Any])
async def create_interaction(
    interaction_data: InteractionCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """创建互动记录"""
    # 创建互动记录
    interaction = Interaction(
        customer_id=interaction_data.customer_id,
        interaction_type=interaction_data.interaction_type,
        content=interaction_data.content,
        interaction_date=interaction_data.interaction_date,
        duration=interaction_data.duration,
        attachments=interaction_data.attachments
    )
    
    db.add(interaction)
    db.commit()
    db.refresh(interaction)
    
    # 异步分析情感
    background_tasks.add_task(analyze_interaction_async, interaction.id, interaction_data.content)
    
    return {
        "id": interaction.id,
        "message": "互动记录创建成功，正在进行AI分析"
    }

async def analyze_interaction_async(interaction_id: int, content: str):
    """异步分析互动情感"""
    db = next(get_db())
    try:
        # 分析情感
        sentiment_result = await ai_service.analyze_interaction_sentiment(content)
        
        # 更新互动记录
        interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
        if interaction:
            interaction.sentiment = sentiment_result.get('sentiment', 'neutral')
            interaction.sentiment_score = sentiment_result.get('score', 0.0)
            interaction.summary = sentiment_result.get('analysis', '')[:500]  # 限制长度
            db.commit()
    
    except Exception as e:
        print(f"情感分析失败: {e}")
    finally:
        db.close()

# AI功能API
@app.post("/api/ai/analyze-profile/{customer_id}", response_model=Dict[str, Any])
async def analyze_customer_profile(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """AI分析客户画像"""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="客户不存在")
    
    # 获取互动记录
    interactions = db.query(Interaction).filter(Interaction.customer_id == customer_id).order_by(Interaction.interaction_date.desc()).all()
    
    # AI分析
    analysis = await ai_service.analyze_customer_profile(customer, interactions)
    
    # 更新客户AI画像
    customer.ai_profile = analysis
    customer.ai_score = analysis.get('opportunity_score', 0)
    customer.updated_at = datetime.utcnow()
    db.commit()
    
    return {
        "customer_id": customer_id,
        "analysis": analysis,
        "message": "客户画像分析完成"
    }

@app.post("/api/ai/generate-script", response_model=Dict[str, Any])
async def generate_sales_script(
    script_request: AIScriptRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """生成销售话术"""
    customer = db.query(Customer).filter(Customer.id == script_request.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="客户不存在")
    
    # 生成话术
    script_content = await ai_service.generate_sales_script(customer, script_request)
    
    # 保存话术
    script = AIScript(
        customer_id=script_request.customer_id,
        title=f"{script_request.script_type}话术 - {customer.name}",
        content=script_content,
        script_type=script_request.script_type,
        methodology=script_request.methodology,
        scenario=script_request.scenario,
        context=script_request.context,
        ai_model="gpt-4",
        confidence_score=0.85
    )
    
    db.add(script)
    db.commit()
    db.refresh(script)
    
    return {
        "script_id": script.id,
        "content": script_content,
        "message": "销售话术生成成功"
    }

# 任务管理API
@app.post("/api/tasks", response_model=Dict[str, Any])
async def create_task(
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """创建任务"""
    task = Task(
        customer_id=task_data.customer_id,
        title=task_data.title,
        description=task_data.description,
        task_type=task_data.task_type,
        priority=task_data.priority,
        due_date=task_data.due_date,
        reminder_time=task_data.reminder_time
    )
    
    db.add(task)
    db.commit()
    db.refresh(task)
    
    return {
        "id": task.id,
        "title": task.title,
        "message": "任务创建成功"
    }

@app.get("/api/tasks", response_model=List[Dict[str, Any]])
async def get_tasks(
    customer_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """获取任务列表"""
    query = db.query(Task)
    
    if customer_id:
        query = query.filter(Task.customer_id == customer_id)
    
    if status:
        query = query.filter(Task.status == status)
    
    tasks = query.order_by(Task.due_date.asc()).all()
    
    return [
        {
            "id": t.id,
            "customer_id": t.customer_id,
            "title": t.title,
            "description": t.description,
            "task_type": t.task_type,
            "status": t.status,
            "priority": t.priority,
            "due_date": t.due_date,
            "reminder_time": t.reminder_time,
            "ai_generated": t.ai_generated,
            "created_at": t.created_at
        }
        for t in tasks
    ]

@app.put("/api/tasks/{task_id}", response_model=Dict[str, Any])
async def update_task(
    task_id: int,
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """更新任务"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")
    
    # 更新任务字段
    update_data = task_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)
    
    task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(task)
    
    return {
        "id": task.id,
        "title": task.title,
        "message": "任务更新成功"
    }

@app.delete("/api/tasks/{task_id}")
async def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """删除任务"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")
    
    task_title = task.title
    db.delete(task)
    db.commit()
    
    return {"message": f"任务 '{task_title}' 删除成功"}

# 文件上传API
@app.post("/api/upload/avatar/{customer_id}")
async def upload_avatar(
    customer_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """上传客户头像"""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="客户不存在")
    
    # 验证文件类型
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="只支持图片文件")
    
    # 保存文件（这里简化处理，实际应该使用云存储）
    file_path = f"uploads/avatars/{customer_id}_{file.filename}"
    
    # 更新客户照片信息
    if not customer.photos:
        customer.photos = []
    
    customer.photos.append({
        "url": file_path,
        "type": "profile",
        "source": "upload",
        "uploadedAt": datetime.utcnow().isoformat()
    })
    
    customer.updated_at = datetime.utcnow()
    db.commit()
    
    return {
        "message": "头像上传成功",
        "file_path": file_path
    }

@app.post("/api/test-ai-connection", response_model=Dict[str, Any])
async def test_ai_connection(
    test_request: AIConnectionTest,
    current_user: dict = Depends(get_current_user)
):
    """测试AI API连接"""
    try:
        # 根据模型类型选择不同的API端点
        model_configs = {
            'grok-4': {'base_url': 'https://api.x.ai/v1', 'model': 'grok-beta'},
            'deepseek-reasoner': {'base_url': 'https://api.deepseek.com', 'model': 'deepseek-reasoner'},
            'moonshot-kimi-k2': {'base_url': 'https://api.moonshot.cn/v1', 'model': 'moonshot-v1-128k'},
            'openai-gpt4': {'base_url': 'https://api.openai.com/v1', 'model': 'gpt-4-turbo-preview'},
            'gemini-pro': {'base_url': 'https://generativelanguage.googleapis.com/v1beta', 'model': 'gemini-pro'}
        }
        
        config = model_configs.get(test_request.model)
        if not config:
            return {"success": False, "error": "不支持的模型类型"}
        
        # 对于Gemini API，使用不同的测试方法
        if test_request.model == 'gemini-pro':
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{config['base_url']}/models",
                    params={"key": test_request.api_key},
                    timeout=10.0
                )
                if response.status_code == 200:
                    return {"success": True, "message": "API连接成功"}
                else:
                    return {"success": False, "error": f"API连接失败: {response.status_code}"}
        else:
            # 对于OpenAI兼容的API
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{config['base_url']}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {test_request.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": config['model'],
                        "messages": [{"role": "user", "content": "Hello"}],
                        "max_tokens": 5
                    },
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    return {"success": True, "message": "API连接成功"}
                else:
                    error_detail = response.text if response.text else f"HTTP {response.status_code}"
                    return {"success": False, "error": f"API连接失败: {error_detail}"}
                    
    except httpx.TimeoutException:
        return {"success": False, "error": "连接超时"}
    except Exception as e:
        return {"success": False, "error": f"连接错误: {str(e)}"}

@app.post("/api/update-models", response_model=Dict[str, Any])
async def update_available_models(
    update_request: ModelUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    """更新可用模型列表"""
    try:
        provider_configs = {
            'xai': {'base_url': 'https://api.x.ai/v1'},
            'deepseek': {'base_url': 'https://api.deepseek.com'},
            'moonshot': {'base_url': 'https://api.moonshot.cn/v1'},
            'openai': {'base_url': 'https://api.openai.com/v1'},
            'gemini': {'base_url': 'https://generativelanguage.googleapis.com/v1beta'}
        }
        
        config = provider_configs.get(update_request.provider)
        if not config:
            return {"success": False, "error": "不支持的服务提供商"}
        
        async with httpx.AsyncClient() as client:
            if update_request.provider == 'gemini':
                response = await client.get(
                    f"{config['base_url']}/models",
                    params={"key": update_request.api_key},
                    timeout=15.0
                )
            else:
                response = await client.get(
                    f"{config['base_url']}/models",
                    headers={"Authorization": f"Bearer {update_request.api_key}"},
                    timeout=15.0
                )
            
            if response.status_code == 200:
                data = response.json()
                models = []
                
                if update_request.provider == 'gemini':
                    models = [model['name'].split('/')[-1] for model in data.get('models', [])]
                else:
                    models = [model['id'] for model in data.get('data', [])]
                
                return {"success": True, "models": models}
            else:
                return {"success": False, "error": f"获取模型列表失败: {response.status_code}"}
                
    except httpx.TimeoutException:
        return {"success": False, "error": "请求超时"}
    except Exception as e:
        return {"success": False, "error": f"更新失败: {str(e)}"}

@app.post("/api/settings/ai", response_model=Dict[str, Any])
async def save_ai_settings(
    settings: AISettingsRequest,
    current_user: dict = Depends(get_current_user)
):
    """保存AI设置"""
    try:
        # 这里可以将设置保存到数据库或配置文件
        # 目前只返回成功状态
        return {"success": True, "message": "AI设置保存成功"}
    except Exception as e:
        return {"success": False, "error": f"保存失败: {str(e)}"}

# 初始化数据
@app.on_event("startup")
async def startup_event():
    """应用启动时初始化数据"""
    db = next(get_db())
    try:
        init_default_folders(db)
        print("默认文件夹初始化完成")
    except Exception as e:
        print(f"初始化失败: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)