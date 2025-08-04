# ai_crm_improved.py - AI CRM 改进版主应用程序
# 基于改进方案的完整实现，集成多AI模型、拖拽功能、智能分析等

from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks, WebSocket, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
import httpx
import json
import os
from datetime import datetime, timedelta
import pytz
import asyncio
from contextlib import asynccontextmanager
import redis
from celery import Celery
import logging
from sqlalchemy import create_engine, Column, Integer, String, JSON, Float, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv
import base64
import io
from PIL import Image
import pytesseract
import uuid
import yaml
import redis
from celery import Celery
import bcrypt
import jwt
from passlib.context import CryptContext

# 数据库配置 - 使用SQLite进行开发
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./crm_db.sqlite")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 密码加密配置
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT配置
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-here")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# 数据库模型定义
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    role = Column(String(20), default="user")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    
    def verify_password(self, password: str) -> bool:
        return pwd_context.verify(password, self.password_hash)
    
    @staticmethod
    def hash_password(password: str) -> str:
        return pwd_context.hash(password)

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255))
    phone = Column(String(20))
    wechat_id = Column(String(100))
    company = Column(String(200))
    position = Column(String(100))
    industry = Column(String(100))
    age_group = Column(String(20))
    tags = Column(JSON, default=[])
    progress = Column(Float, default=0.0)
    latest_notes = Column(Text)
    folder_id = Column(Integer)
    priority = Column(Integer, default=2)
    social_profiles = Column(JSON, default={})
    business_info = Column(JSON, default={})
    ai_profile = Column(JSON, default={})
    reminder = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

class Folder(Base):
    __tablename__ = "folders"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    order = Column(Integer, default=0)
    parent_id = Column(Integer)
    folder_type = Column(String(20), default='custom')
    color = Column(String(7), default='#2196f3')
    icon = Column(String(50), default='folder')
    created_at = Column(DateTime, default=datetime.utcnow)

class Interaction(Base):
    __tablename__ = "interactions"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, nullable=False)
    interaction_type = Column(String(50), nullable=False)
    content = Column(Text)
    interaction_date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

class AIScript(Base):
    __tablename__ = "ai_scripts"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    script_type = Column(String(50), nullable=False)
    methodology = Column(String(50))
    scenario = Column(String(200))
    context = Column(JSON)
    ai_model = Column(String(50))
    confidence_score = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

class AIInsight(Base):
    __tablename__ = "ai_insights"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, nullable=False)
    insight_type = Column(String(50), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    confidence = Column(Float)
    ai_model = Column(String(50))
    model_version = Column(String(20))
    data_sources = Column(JSON)
    expires_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    task_type = Column(String(50))
    priority = Column(Integer, default=2)
    status = Column(String(20), default='pending')
    due_date = Column(DateTime)
    ai_generated = Column(Boolean, default=False)
    ai_reasoning = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

class GainReport(Base):
    __tablename__ = "gain_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    circle = Column(String(50), nullable=False)  # 圈子名称
    report_data = Column(JSON, nullable=False)  # 报告数据
    conversion_rate = Column(Float, default=0.0)  # 转化率
    roi = Column(Float, default=0.0)  # ROI
    total_contacts = Column(Integer, default=0)  # 总接触人数
    successful_contacts = Column(Integer, default=0)  # 成功接触人数
    ai_optimized = Column(Boolean, default=False)  # 是否经过AI优化
    optimization_suggestions = Column(JSON)  # AI优化建议
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

class GainStep(Base):
    __tablename__ = "gain_steps"
    
    id = Column(Integer, primary_key=True, index=True)
    circle = Column(String(50), nullable=False)  # 圈子名称
    step_content = Column(String(500), nullable=False)  # 步骤内容
    step_order = Column(Integer, default=0)  # 步骤顺序
    is_completed = Column(Boolean, default=False)  # 是否完成
    completion_date = Column(DateTime)  # 完成日期
    ai_generated = Column(Boolean, default=False)  # 是否AI生成
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

# 数据库依赖函数
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 加载环境变量
load_dotenv()

# 创建数据库表
Base.metadata.create_all(bind=engine)

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
    "ai_crm_tasks",
    broker=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0"),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")
)

# AI模型配置 - 更新为2025年最新模型
AI_MODELS = {
    "grok-4": {
        "api_key": os.getenv("XAI_API_KEY"),
        "base_url": "https://api.x.ai/v1",
        "model": "grok-4",
        "description": "xAI Grok-4 - 最新推理模型"
    },
    "deepseek-reasoner": {
        "api_key": os.getenv("DEEPSEEK_API_KEY"),
        "base_url": "https://api.deepseek.com/v1",
        "model": "deepseek-reasoner",
        "description": "Deepseek Reasoner - 强推理能力"
    },
    "moonshot-kimi-k2": {
        "api_key": os.getenv("MOONSHOT_API_KEY"),
        "base_url": "https://api.moonshot.cn/v1",
        "model": "moonshot-v1-1t",
        "description": "Moonshot Kimi K2 - 1万亿参数MoE模型"
    },
    "openai-gpt4": {
        "api_key": os.getenv("OPENAI_API_KEY"),
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4-turbo-preview",
        "description": "OpenAI GPT-4 Turbo - 通用对话模型"
    },
    "gemini-pro": {
        "api_key": os.getenv("GOOGLE__KEY"),
        "base_url": "https://generativelanguage.googleapis.com/v1beta",
        "model": "gemini-pro",
        "description": "Google Gemini Pro - 多模态AI模型"
    }
}

# 销售方法论配置
SALES_METHODOLOGIES = {
    "straight_line": {
        "name": "华尔街之狼直线销售法",
        "phases": ["开场白", "需求探索", "产品展示", "异议处理", "成交"],
        "prompts": {
            "opening": "基于直线销售法，为{customer_name}({company})创建一个专业的开场白，考虑其{industry}行业背景和{position}职位。",
            "objection_handling": "针对{objection}异议，使用直线销售法的技巧进行回应，客户是{customer_profile}。"
        }
    },
    "sandler": {
        "name": "桑德勒七步销售法",
        "phases": ["建立关系", "确定预算", "确定需求", "确定决策过程", "履行承诺", "成交", "后续服务"],
        "prompts": {
            "relationship": "使用桑德勒销售法建立与{customer_name}的关系，考虑其{personality}性格特征。",
            "budget_qualification": "运用桑德勒法探索{customer_name}的预算情况，已知其公司规模为{company_size}。"
        }
    },
    "challenger": {
        "name": "挑战者销售法",
        "phases": ["教导", "定制", "控制"],
        "prompts": {
            "teach": "使用挑战者销售法，为{customer_name}提供{industry}行业的新洞察和教导内容。",
            "challenge": "基于挑战者销售法，挑战{customer_name}当前的{pain_points}痛点认知。"
        }
    }
}

# 数据模型
class CustomerCreateImproved(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: Optional[str] = Field(None, pattern=r'^[\w\.-]+@[\w\.-]+\.\w+$')
    phone: Optional[str] = Field(None, min_length=10, max_length=20)
    wechat_id: Optional[str] = None
    company: Optional[str] = None
    position: Optional[str] = None
    industry: Optional[str] = None
    age_group: Optional[str] = Field(None, pattern=r'^(25-35|35-45|45\+)$')
    tags: List[str] = Field(default_factory=list)
    progress: float = Field(default=0.0, ge=0.0, le=100.0)
    latest_notes: Optional[str] = Field(None, max_length=2000)
    folder_id: Optional[int] = None
    priority: int = Field(default=2, ge=1, le=3)  # 1=高, 2=中, 3=低
    social_profiles: Optional[Dict[str, str]] = Field(default_factory=dict)
    business_info: Optional[Dict[str, Any]] = Field(default_factory=dict)

class CustomerUpdateImproved(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[str] = Field(None, pattern=r'^[\w\.-]+@[\w\.-]+\.\w+$')
    phone: Optional[str] = Field(None, min_length=10, max_length=20)
    wechat_id: Optional[str] = None
    company: Optional[str] = None
    position: Optional[str] = None
    industry: Optional[str] = None
    age_group: Optional[str] = Field(None, pattern=r'^(25-35|35-45|45\+)$')
    tags: Optional[List[str]] = None
    progress: Optional[float] = Field(None, ge=0.0, le=100.0)
    latest_notes: Optional[str] = Field(None, max_length=2000)
    folder_id: Optional[int] = None
    priority: Optional[int] = Field(None, ge=1, le=3)
    social_profiles: Optional[Dict[str, str]] = None
    business_info: Optional[Dict[str, Any]] = None

class FolderCreateImproved(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    order: int = Field(default=0)
    parent_id: Optional[int] = None
    folder_type: str = Field(default='custom', pattern=r'^(industry|position|age|custom)$')
    color: str = Field(default='#2196f3', pattern=r'^#[0-9a-fA-F]{6}$')
    icon: str = Field(default='folder')

class AIAnalysisRequestImproved(BaseModel):
    customer_id: int
    analysis_type: str = Field(..., pattern=r'^(personality|communication|interests|pain_points|recommendations|profile_complete)$')
    context: Optional[str] = None
    model_preference: Optional[str] = Field(None, pattern=r'^(grok-4|deepseek-reasoner|moonshot-kimi-k2|openai-gpt4|gemini-pro)$')
    include_history: bool = Field(default=True)

# AI销售助手相关的Pydantic模型
class AIRequest(BaseModel):
    model: str = Field(..., pattern=r'^(grok-4|deepseek-reasoner|moonshot-kimi-k2|openai-gpt4|gemini-pro)$')
    prompt: str = Field(..., min_length=1, max_length=2000)
    customer_id: int = Field(..., gt=0)
    context: Optional[str] = Field(None, max_length=1000)
    temperature: Optional[float] = Field(0.7, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(1000, ge=1, le=4000)
    send_message: Optional[bool] = Field(False)
    message_channel: Optional[str] = Field("email", pattern=r'^(email|wechat|linkedin)$')

class AIScriptGenerateRequest(BaseModel):
    customer_id: int
    script_type: str = Field(..., pattern=r'^(opening|objection_handling|closing|follow_up|presentation)$')
    methodology: str = Field(..., pattern=r'^(straight_line|sandler|challenger|consultative)$')
    scenario: Optional[str] = None
    context: Optional[str] = None
    model_preference: Optional[str] = Field(None, pattern=r'^(grok-4|deepseek-reasoner|moonshot-kimi-k2|openai-gpt4)$')

class OCRProcessRequest(BaseModel):
    image_data: str  # base64编码的图片数据
    extract_type: str = Field(default='business_card', pattern=r'^(business_card|document|general)$')
    auto_create_contact: bool = Field(default=True)

class ReminderCreateImproved(BaseModel):
    customer_id: int
    reminder_time: datetime
    message: str = Field(..., min_length=1, max_length=500)
    reminder_type: str = Field(default="general", pattern=r'^(call|meeting|follow_up|general)$')
    auto_generated: bool = Field(default=False)

class DragDropRequest(BaseModel):
    customer_ids: List[int]
    target_folder_id: int
    source_folder_id: Optional[int] = None

class ProgressUpdateRequest(BaseModel):
    customer_id: int
    progress: float = Field(..., ge=0.0, le=100.0)
    notes: Optional[str] = None
    auto_tasks: bool = Field(default=True)  # 是否自动生成任务

# 新增文件夹管理相关模型
class FolderUpdate(BaseModel):
    id: int
    new_order: int
    merge_with: Optional[int] = None
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    color: Optional[str] = Field(None, pattern=r'^#[0-9a-fA-F]{6}$')
    icon: Optional[str] = None

class TagRequest(BaseModel):
    customer_id: int
    tags: List[str]  # e.g., ["MBA", "港澳", "餐饮行会", "俱乐部", "暨南大学"]

class BatchTagRequest(BaseModel):
    customer_ids: List[int]
    tags: List[str]
    operation: str = Field(..., pattern=r'^(add|remove|replace)$')  # 添加、移除或替换标签

class FolderMergeRequest(BaseModel):
    source_folder_ids: List[int]
    target_folder_id: int
    new_folder_name: Optional[str] = None

class NoteRequest(BaseModel):
    customer_id: int
    notes: str = Field(..., max_length=5000)

class ReminderRequest(BaseModel):
    customer_id: int
    time: datetime
    term: str = Field(..., min_length=1, max_length=200)
    reminder_type: str = Field(default="follow_up", pattern=r'^(call|email|meeting|follow_up|custom)$')
    priority: str = Field(default="medium", pattern=r'^(high|medium|low)$')
    notification_methods: List[str] = Field(default=["browser"], description="通知方式: browser, email, sms")
    repeat_type: str = Field(default="none", pattern=r'^(none|daily|weekly|monthly)$')

# 获客流程相关模型
class GainRequest(BaseModel):
    circle: str = Field(..., min_length=1, max_length=50, description="圈子名称，如MBA、港澳等")

class GainReportUpload(BaseModel):
    circle: str = Field(..., min_length=1, max_length=50)
    report_data: Dict[str, Any] = Field(..., description="报告数据，支持JSON格式")
    conversion_rate: Optional[float] = Field(None, ge=0.0, le=100.0)
    total_contacts: Optional[int] = Field(None, ge=0)
    successful_contacts: Optional[int] = Field(None, ge=0)

class GainOptimizeRequest(BaseModel):
    circle: str = Field(..., min_length=1, max_length=50)
    report_data: Dict[str, Any] = Field(..., description="报告数据")
    current_steps: Optional[List[str]] = Field(None, description="当前获客步骤")
    target_improvement: Optional[str] = Field(None, description="目标改进方向")

# 用户认证相关模型
class UserLogin(BaseModel):
    email: str = Field(..., pattern=r'^[\w\.-]+@[\w\.-]+\.\w+$')
    password: str = Field(..., min_length=6)

class UserRegister(BaseModel):
    email: str = Field(..., pattern=r'^[\w\.-]+@[\w\.-]+\.\w+$')
    password: str = Field(..., min_length=6)
    name: str = Field(..., min_length=1, max_length=100)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

# 应用程序生命周期管理
@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用程序启动和关闭时的处理"""
    # 启动时
    logger.info("AI CRM 改进版启动中...")
    
    # 初始化数据库表
    Base.metadata.create_all(bind=engine)
    
    # 初始化默认文件夹
    db = next(get_db())
    try:
        init_default_folders_improved(db)
        logger.info("默认文件夹初始化完成")
    except Exception as e:
        logger.error(f"初始化默认文件夹失败: {e}")
    finally:
        db.close()
    
    # 测试AI模型连接
    for model_name, config in AI_MODELS.items():
        if config.get("api_key"):
            try:
                await test_ai_model_connection(model_name)
                logger.info(f"AI模型 {model_name} 连接成功")
            except Exception as e:
                logger.warning(f"AI模型 {model_name} 连接失败: {e}")
    
    yield
    
    # 关闭时
    logger.info("AI CRM 改进版关闭中...")
    redis_client.close()

# 创建FastAPI应用
app = FastAPI(
    title="AI CRM 改进版系统",
    description="基于FastAPI的智能客户关系管理系统 - 改进版，集成多个AI模型、拖拽功能、智能分析",
    version="2.0.0",
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

# JWT工具函数
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None

# 依赖函数
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    """验证JWT token并获取当前用户"""
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证令牌",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证令牌",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在或已被禁用",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return {
        "user_id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role
    }

# AI模型调用函数
async def call_ai_model(model_name: str, prompt: str, context: Optional[str] = None, system_prompt: Optional[str] = None, temperature: float = 0.7, max_tokens: int = 2000) -> Dict[str, Any]:
    """调用指定的AI模型"""
    if model_name not in AI_MODELS:
        raise HTTPException(status_code=400, detail=f"不支持的AI模型: {model_name}")
    
    config = AI_MODELS[model_name]
    if not config.get("api_key"):
        raise HTTPException(status_code=500, detail=f"AI模型 {model_name} 未配置API密钥")
    
    # 构建消息
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    if context:
        messages.append({"role": "user", "content": f"上下文信息：{context}"})
    messages.append({"role": "user", "content": prompt})
    
    # 调用API
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            # 特殊处理Gemini API
            if model_name == "gemini-pro":
                response = await client.post(
                    f"{config['base_url']}/models/{config['model']}:generateContent?key={config['api_key']}",
                    headers={"Content-Type": "application/json"},
                    json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {
                            "temperature": temperature,
                            "maxOutputTokens": max_tokens
                        }
                    }
                )
                response.raise_for_status()
                result = response.json()
                content = result["candidates"][0]["content"]["parts"][0]["text"]
            else:
                response = await client.post(
                    f"{config['base_url']}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {config['api_key']}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": config["model"],
                        "messages": messages,
                        "temperature": temperature,
                        "max_tokens": max_tokens
                    }
                )
                response.raise_for_status()
                result = response.json()
                content = result["choices"][0]["message"]["content"]
            
            return {
                "success": True,
                "content": content,
                "model": model_name,
                "usage": result.get("usage", {}),
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"AI模型调用失败 {model_name}: {e}")
            return {
                "success": False,
                "error": str(e),
                "model": model_name,
                "timestamp": datetime.utcnow().isoformat()
            }

# 测试AI模型连接
async def test_ai_model_connection(model_name: str) -> bool:
    """测试AI模型连接"""
    result = await call_ai_model(model_name, "Hello, this is a connection test.")
    return result.get("success", False)

# 初始化默认文件夹
def init_default_folders_improved(db: Session):
    """初始化改进版默认文件夹结构"""
    default_folders = [
        # 行业分类
        {"name": "互联网科技", "folder_type": "industry", "color": "#2196f3", "icon": "computer", "order": 1},
        {"name": "金融保险", "folder_type": "industry", "color": "#4caf50", "icon": "account_balance", "order": 2},
        {"name": "制造业", "folder_type": "industry", "color": "#ff9800", "icon": "precision_manufacturing", "order": 3},
        {"name": "教育培训", "folder_type": "industry", "color": "#9c27b0", "icon": "school", "order": 4},
        {"name": "医疗健康", "folder_type": "industry", "color": "#f44336", "icon": "local_hospital", "order": 5},
        
        # 职级分类
        {"name": "C级高管", "folder_type": "position", "color": "#e91e63", "icon": "star", "order": 10},
        {"name": "VP/总监", "folder_type": "position", "color": "#673ab7", "icon": "supervisor_account", "order": 11},
        {"name": "经理级", "folder_type": "position", "color": "#3f51b5", "icon": "manage_accounts", "order": 12},
        {"name": "专员级", "folder_type": "position", "color": "#009688", "icon": "person", "order": 13},
        
        # 年龄分类
        {"name": "25-35岁", "folder_type": "age", "color": "#8bc34a", "icon": "young_person", "order": 20},
        {"name": "35-45岁", "folder_type": "age", "color": "#ffc107", "icon": "person", "order": 21},
        {"name": "45岁以上", "folder_type": "age", "color": "#795548", "icon": "elderly", "order": 22},
        
        # 自定义分类
        {"name": "重点客户", "folder_type": "custom", "color": "#f44336", "icon": "priority_high", "order": 30},
        {"name": "潜在客户", "folder_type": "custom", "color": "#2196f3", "icon": "visibility", "order": 31},
        {"name": "已成交", "folder_type": "custom", "color": "#4caf50", "icon": "check_circle", "order": 32},
    ]
    
    for folder_data in default_folders:
        existing = db.query(Folder).filter(Folder.name == folder_data["name"]).first()
        if not existing:
            folder = Folder(**folder_data)
            db.add(folder)
    
    db.commit()

# Celery任务
@celery_app.task
def send_reminder_task(customer_id: int, message: str, reminder_time: str):
    """发送提醒任务"""
    logger.info(f"发送提醒给客户 {customer_id}: {message} at {reminder_time}")
    # 这里可以集成邮件、短信、微信等通知方式
    return {"status": "sent", "customer_id": customer_id, "message": message}

@celery_app.task
def analyze_customer_background(customer_id: int):
    """后台分析客户信息"""
    logger.info(f"开始分析客户 {customer_id} 的背景信息")
    # 这里可以集成天眼查API、百度搜索等
    return {"status": "completed", "customer_id": customer_id}

# API路由
# 认证相关API
@app.post("/api/auth/login", response_model=Token)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """用户登录"""
    user = db.query(User).filter(User.email == user_data.email).first()
    
    if not user or not user.verify_password(user_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="账户已被禁用",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role
        }
    }

@app.post("/api/auth/register", response_model=Token)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """用户注册"""
    # 检查邮箱是否已存在
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该邮箱已被注册"
        )
    
    # 创建新用户
    new_user = User(
        email=user_data.email,
        name=user_data.name,
        password_hash=User.hash_password(user_data.password),
        role="user",
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": str(new_user.id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "name": new_user.name,
            "role": new_user.role
        }
    }

@app.get("/api/auth/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """获取当前用户信息"""
    return current_user

@app.get("/")
async def root():
    return {"message": "AI CRM 改进版系统 v2.0", "status": "running"}

@app.get("/health")
async def health_check():
    """健康检查"""
    # 检查数据库连接
    try:
        db = next(get_db())
        db.execute("SELECT 1")
        db_status = "healthy"
    except Exception as e:
        db_status = f"error: {e}"
    
    # 检查Redis连接
    try:
        redis_client.ping()
        redis_status = "healthy"
    except Exception as e:
        redis_status = f"error: {e}"
    
    # 检查AI模型状态
    ai_models_status = {}
    for model_name in AI_MODELS.keys():
        try:
            # 简单的连接测试
            ai_models_status[model_name] = "available" if AI_MODELS[model_name].get("api_key") else "no_api_key"
        except Exception as e:
            ai_models_status[model_name] = f"error: {e}"
    
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "database": db_status,
            "redis": redis_status,
            "ai_models": ai_models_status
        }
    }

# 客户管理API - 改进版
@app.post("/api/customers/", response_model=Dict[str, Any])
async def create_customer_improved(
    customer: CustomerCreateImproved,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """创建客户 - 改进版"""
    db_customer = Customer(**customer.dict())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    
    # 异步启动背景分析
    analyze_customer_background.delay(db_customer.id)
    
    return {
        "success": True,
        "customer": {
            "id": db_customer.id,
            "name": db_customer.name,
            "email": db_customer.email,
            "phone": db_customer.phone,
            "company": db_customer.company,
            "tags": db_customer.tags,
            "progress": db_customer.progress,
            "priority": db_customer.priority,
            "folder_id": db_customer.folder_id,
            "created_at": db_customer.created_at.isoformat()
        },
        "message": "客户创建成功，正在进行背景分析"
    }

# 拖拽功能API
@app.post("/api/customers/drag-drop")
async def drag_drop_customers(
    request: DragDropRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """拖拽客户到文件夹"""
    try:
        # 验证目标文件夹存在
        target_folder = db.query(Folder).filter(Folder.id == request.target_folder_id).first()
        if not target_folder:
            raise HTTPException(status_code=404, detail="目标文件夹不存在")
        
        # 批量更新客户文件夹
        updated_count = 0
        for customer_id in request.customer_ids:
            customer = db.query(Customer).filter(Customer.id == customer_id).first()
            if customer:
                customer.folder_id = request.target_folder_id
                customer.updated_at = datetime.utcnow()
                updated_count += 1
        
        db.commit()
        
        return {
            "success": True,
            "updated_count": updated_count,
            "target_folder": target_folder.name,
            "message": f"成功移动 {updated_count} 个客户到 {target_folder.name}"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"拖拽操作失败: {str(e)}")

# 进度更新API
@app.put("/api/customers/{customer_id}/progress")
async def update_customer_progress(
    customer_id: int,
    request: ProgressUpdateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """更新客户进度"""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="客户不存在")
    
    old_progress = customer.progress
    customer.progress = request.progress
    customer.updated_at = datetime.utcnow()
    
    if request.notes:
        customer.latest_notes = request.notes
    
    # 自动生成任务
    if request.auto_tasks:
        if request.progress >= 80 and old_progress < 80:
            # 进度达到80%，生成成交任务
            task = Task(
                customer_id=customer_id,
                title="准备成交",
                description="客户进度已达80%，准备最终成交",
                task_type="closing",
                priority=1,
                due_date=datetime.utcnow() + timedelta(days=3),
                ai_generated=True,
                ai_reasoning="基于客户进度自动生成的成交任务"
            )
            db.add(task)
        elif request.progress >= 50 and old_progress < 50:
            # 进度达到50%，生成跟进任务
            task = Task(
                customer_id=customer_id,
                title="深度跟进",
                description="客户进度已达50%，需要深度跟进",
                task_type="follow_up",
                priority=2,
                due_date=datetime.utcnow() + timedelta(days=7),
                ai_generated=True,
                ai_reasoning="基于客户进度自动生成的跟进任务"
            )
            db.add(task)
    
    db.commit()
    
    return {
        "success": True,
        "customer_id": customer_id,
        "old_progress": old_progress,
        "new_progress": request.progress,
        "message": "进度更新成功"
    }

# AI分析API - 改进版
@app.post("/api/ai/analyze-customer")
async def analyze_customer_improved(
    request: AIAnalysisRequestImproved,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """AI客户分析 - 改进版"""
    customer = db.query(Customer).filter(Customer.id == request.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="客户不存在")
    
    # 选择AI模型
    model_name = request.model_preference or "grok-4"
    
    # 构建分析上下文
    context = f"""
客户基本信息：
- 姓名：{customer.name}
- 公司：{customer.company or '未知'}
- 职位：{customer.position or '未知'}
- 行业：{customer.industry or '未知'}
- 年龄段：{customer.age_group or '未知'}
- 标签：{', '.join(customer.tags) if customer.tags else '无'}
- 当前进度：{customer.progress}%
- 最新备注：{customer.latest_notes or '无'}
"""
    
    # 如果包含历史记录
    if request.include_history:
        interactions = db.query(Interaction).filter(
            Interaction.customer_id == request.customer_id
        ).order_by(Interaction.interaction_date.desc()).limit(5).all()
        
        if interactions:
            context += "\n\n最近互动记录：\n"
            for interaction in interactions:
                context += f"- {interaction.interaction_date.strftime('%Y-%m-%d')}: {interaction.interaction_type} - {interaction.content[:100]}...\n"
    
    # 根据分析类型构建提示词
    analysis_prompts = {
        "personality": f"基于以上客户信息，分析客户的性格特征、决策风格和沟通偏好。请提供具体的性格分析和建议的沟通策略。",
        "communication": f"分析该客户的沟通风格和偏好，建议最佳的沟通方式、时间和频率。",
        "interests": f"基于客户信息推断其可能的兴趣点、关注领域和业务需求。",
        "pain_points": f"分析客户可能面临的痛点、挑战和需要解决的问题。",
        "recommendations": f"基于客户当前状态和进度，提供下一步行动建议和销售策略。",
        "profile_complete": f"对客户进行全面画像分析，包括性格、沟通风格、兴趣、痛点和行动建议。"
    }
    
    prompt = analysis_prompts.get(request.analysis_type, analysis_prompts["profile_complete"])
    if request.context:
        prompt += f"\n\n额外上下文：{request.context}"
    
    # 调用AI模型
    ai_result = await call_ai_model(
        model_name=model_name,
        prompt=prompt,
        context=context,
        system_prompt="你是一个专业的销售顾问和客户分析专家，擅长分析客户心理和制定销售策略。请提供专业、实用的分析和建议。"
    )
    
    if ai_result["success"]:
        # 保存分析结果
        insight = AIInsight(
            customer_id=request.customer_id,
            insight_type=request.analysis_type,
            title=f"{request.analysis_type.title()}分析",
            description=ai_result["content"],
            confidence=0.85,  # 可以根据模型返回调整
            ai_model=model_name,
            model_version="v2.0",
            data_sources=["customer_profile", "interaction_history"],
            expires_at=datetime.utcnow() + timedelta(days=30)
        )
        db.add(insight)
        
        # 更新客户AI画像
        if not customer.ai_profile:
            customer.ai_profile = {}
        
        customer.ai_profile[request.analysis_type] = ai_result["content"]
        customer.ai_profile["last_analysis"] = datetime.utcnow().isoformat()
        customer.ai_profile["model_used"] = model_name
        
        db.commit()
        
        return {
            "success": True,
            "customer_id": request.customer_id,
            "analysis_type": request.analysis_type,
            "result": ai_result["content"],
            "model_used": model_name,
            "confidence": 0.85,
            "timestamp": datetime.utcnow().isoformat(),
            "insight_id": insight.id
        }
    else:
        raise HTTPException(status_code=500, detail=f"AI分析失败: {ai_result['error']}")

# AI话术生成API
@app.post("/api/ai/generate-script")
async def generate_sales_script(
    request: AIScriptGenerateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """生成销售话术"""
    customer = db.query(Customer).filter(Customer.id == request.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="客户不存在")
    
    # 选择AI模型
    model_name = request.model_preference or "grok-4"
    
    # 获取销售方法论
    methodology = SALES_METHODOLOGIES.get(request.methodology)
    if not methodology:
        raise HTTPException(status_code=400, detail="不支持的销售方法论")
    
    # 构建客户画像
    customer_profile = f"""
客户：{customer.name}
公司：{customer.company or '未知'}
职位：{customer.position or '未知'}
行业：{customer.industry or '未知'}
性格特征：{customer.ai_profile.get('personality', '未分析') if customer.ai_profile else '未分析'}
沟通风格：{customer.ai_profile.get('communication', '未分析') if customer.ai_profile else '未分析'}
兴趣点：{customer.ai_profile.get('interests', '未分析') if customer.ai_profile else '未分析'}
痛点：{customer.ai_profile.get('pain_points', '未分析') if customer.ai_profile else '未分析'}
当前进度：{customer.progress}%
"""
    
    # 构建话术生成提示词
    system_prompt = f"""
你是一个专业的销售话术专家，精通{methodology['name']}。
请根据客户信息和销售场景，生成专业、个性化的销售话术。
话术应该：
1. 符合{methodology['name']}的核心原则
2. 针对客户的具体情况个性化定制
3. 自然、真诚、专业
4. 包含具体的话术示例和使用建议
"""
    
    prompt = f"""
请为以下客户生成{request.script_type}类型的销售话术：

{customer_profile}

销售方法论：{methodology['name']}
话术类型：{request.script_type}
使用场景：{request.scenario or '常规销售场景'}

请提供：
1. 具体的话术内容
2. 使用时机和注意事项
3. 可能的客户反应和应对策略
"""
    
    if request.context:
        prompt += f"\n\n额外上下文：{request.context}"
    
    # 调用AI模型
    ai_result = await call_ai_model(
        model_name=model_name,
        prompt=prompt,
        system_prompt=system_prompt
    )
    
    if ai_result["success"]:
        # 保存话术
        script = AIScript(
            customer_id=request.customer_id,
            title=f"{methodology['name']} - {request.script_type}",
            content=ai_result["content"],
            script_type=request.script_type,
            methodology=request.methodology,
            scenario=request.scenario or "常规销售场景",
            context={"customer_profile": customer_profile, "additional_context": request.context},
            ai_model=model_name,
            confidence_score=0.85
        )
        db.add(script)
        db.commit()
        
        return {
            "success": True,
            "customer_id": request.customer_id,
            "script_type": request.script_type,
            "methodology": request.methodology,
            "content": ai_result["content"],
            "model_used": model_name,
            "script_id": script.id,
            "timestamp": datetime.utcnow().isoformat()
        }
    else:
        raise HTTPException(status_code=500, detail=f"话术生成失败: {ai_result['error']}")

# OCR名片识别API
@app.post("/api/ocr/process")
async def process_ocr(
    request: OCRProcessRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """OCR图片处理"""
    try:
        # 解码base64图片
        image_data = base64.b64decode(request.image_data)
        image = Image.open(io.BytesIO(image_data))
        
        # OCR识别
        ocr_text = pytesseract.image_to_string(image, lang='chi_sim+eng')
        
        if not ocr_text.strip():
            raise HTTPException(status_code=400, detail="未能识别到文字内容")
        
        # 使用AI解析名片信息
        parse_prompt = f"""
请从以下OCR识别的文字中提取名片信息，返回JSON格式：

{ocr_text}

请提取以下信息（如果存在）：
- name: 姓名
- company: 公司名称
- position: 职位
- phone: 电话号码
- email: 邮箱地址
- wechat: 微信号
- address: 地址
- industry: 行业（推测）

请只返回JSON格式的结果，不要包含其他文字。
"""
        
        ai_result = await call_ai_model(
            model_name="grok-4",
            prompt=parse_prompt,
            system_prompt="你是一个专业的名片信息提取专家，擅长从OCR文字中准确提取结构化信息。"
        )
        
        if ai_result["success"]:
            try:
                # 解析AI返回的JSON
                parsed_info = json.loads(ai_result["content"])
                
                # 自动创建联系人
                if request.auto_create_contact and parsed_info.get("name"):
                    customer = Customer(
                        name=parsed_info.get("name"),
                        email=parsed_info.get("email"),
                        phone=parsed_info.get("phone"),
                        wechat_id=parsed_info.get("wechat"),
                        company=parsed_info.get("company"),
                        position=parsed_info.get("position"),
                        industry=parsed_info.get("industry"),
                        tags=["OCR导入"],
                        progress=0.0,
                        priority=2
                    )
                    db.add(customer)
                    db.commit()
                    db.refresh(customer)
                    
                    return {
                        "success": True,
                        "ocr_text": ocr_text,
                        "parsed_info": parsed_info,
                        "customer_created": True,
                        "customer_id": customer.id,
                        "message": "名片识别成功，已自动创建联系人"
                    }
                else:
                    return {
                        "success": True,
                        "ocr_text": ocr_text,
                        "parsed_info": parsed_info,
                        "customer_created": False,
                        "message": "名片识别成功"
                    }
            except json.JSONDecodeError:
                # AI返回的不是有效JSON，返回原始文本
                return {
                    "success": True,
                    "ocr_text": ocr_text,
                    "parsed_info": {"raw_text": ai_result["content"]},
                    "customer_created": False,
                    "message": "OCR识别成功，但信息解析不完整"
                }
        else:
            return {
                "success": True,
                "ocr_text": ocr_text,
                "parsed_info": {"raw_text": ocr_text},
                "customer_created": False,
                "message": "OCR识别成功，AI解析失败"
            }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR处理失败: {str(e)}")

# 提醒系统API
@app.post("/api/reminders/")
async def create_reminder_improved(
    reminder: ReminderCreateImproved,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """创建提醒 - 改进版"""
    customer = db.query(Customer).filter(Customer.id == reminder.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="客户不存在")
    
    # 更新客户提醒信息
    customer.reminder = {
        "time": reminder.reminder_time.isoformat(),
        "message": reminder.message,
        "type": reminder.reminder_type,
        "auto_generated": reminder.auto_generated
    }
    db.commit()
    
    # 计算延迟时间
    delay_seconds = (reminder.reminder_time - datetime.utcnow()).total_seconds()
    
    if delay_seconds > 0:
        # 安排后台任务
        background_tasks.add_task(
            send_reminder_task.apply_async,
            args=[reminder.customer_id, reminder.message, reminder.reminder_time.isoformat()],
            countdown=int(delay_seconds)
        )
    
    return {
        "success": True,
        "customer_id": reminder.customer_id,
        "reminder_time": reminder.reminder_time.isoformat(),
        "message": reminder.message,
        "type": reminder.reminder_type,
        "delay_seconds": delay_seconds
    }

# 统计仪表板API
@app.get("/api/dashboard/stats")
async def get_dashboard_stats_improved(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """获取仪表板统计数据 - 改进版"""
    # 基础统计
    total_customers = db.query(Customer).count()
    high_priority = db.query(Customer).filter(Customer.priority == 1).count()
    
    # 进度统计
    progress_stats = {
        "0-25": db.query(Customer).filter(Customer.progress >= 0, Customer.progress < 25).count(),
        "25-50": db.query(Customer).filter(Customer.progress >= 25, Customer.progress < 50).count(),
        "50-75": db.query(Customer).filter(Customer.progress >= 50, Customer.progress < 75).count(),
        "75-100": db.query(Customer).filter(Customer.progress >= 75, Customer.progress <= 100).count()
    }
    
    # 文件夹分布
    folder_stats = []
    folders = db.query(Folder).all()
    for folder in folders:
        customer_count = db.query(Customer).filter(Customer.folder_id == folder.id).count()
        folder_stats.append({
            "folder_name": folder.name,
            "folder_type": folder.folder_type,
            "customer_count": customer_count,
            "color": folder.color
        })
    
    # AI使用统计
    ai_scripts_count = db.query(AIScript).count()
    ai_insights_count = db.query(AIInsight).count()
    
    # 任务统计
    pending_tasks = db.query(Task).filter(Task.status == 'pending').count()
    completed_tasks = db.query(Task).filter(Task.status == 'completed').count()
    
    return {
        "total_customers": total_customers,
        "high_priority_customers": high_priority,
        "progress_distribution": progress_stats,
        "folder_distribution": folder_stats,
        "ai_usage": {
            "scripts_generated": ai_scripts_count,
            "insights_created": ai_insights_count
        },
        "tasks": {
            "pending": pending_tasks,
            "completed": completed_tasks
        },
        "timestamp": datetime.utcnow().isoformat()
    }

# AI销售助手API
@app.post("/api/ai/sales-assistant")
async def ai_sales_assistant(
    request: AIRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """AI销售助手 - 生成销售回应和发送消息"""
    customer = db.query(Customer).filter(Customer.id == request.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="客户不存在")
    
    # 构建客户上下文
    customer_context = f"""
客户信息：
- 姓名：{customer.name}
- 公司：{customer.company or '未知'}
- 职位：{customer.position or '未知'}
- 行业：{customer.industry or '未知'}
- 当前进度：{customer.progress}%
- 优先级：{customer.priority}
- 标签：{', '.join(customer.tags) if customer.tags else '无'}
- 最新备注：{customer.latest_notes or '无'}
"""
    
    if request.context:
        customer_context += f"\n\n额外上下文：{request.context}"
    
    # 系统提示词
    system_prompt = """
你是一个专业的AI销售助手，擅长：
1. 分析客户需求和痛点
2. 生成个性化的销售回应
3. 提供专业的销售建议
4. 制定跟进策略

请根据客户信息和用户请求，提供专业、个性化的销售建议或回应。
回应应该：
- 针对客户的具体情况
- 专业且有说服力
- 自然真诚
- 包含具体的行动建议
"""
    
    # 调用AI模型
    ai_result = await call_ai_model(
        model_name=request.model,
        prompt=request.prompt,
        context=customer_context,
        system_prompt=system_prompt,
        temperature=request.temperature,
        max_tokens=request.max_tokens
    )
    
    if not ai_result["success"]:
        raise HTTPException(status_code=500, detail=f"AI生成失败: {ai_result['error']}")
    
    response_data = {
        "success": True,
        "customer_id": request.customer_id,
        "model_used": request.model,
        "generated_content": ai_result["content"],
        "usage": ai_result.get("usage", {}),
        "timestamp": datetime.utcnow().isoformat()
    }
    
    # 如果需要发送消息
    if request.send_message:
        try:
            message_result = await send_message_to_customer(
                customer=customer,
                content=ai_result["content"],
                channel=request.message_channel
            )
            response_data["message_sent"] = message_result
            
            # 记录互动
            interaction = Interaction(
                customer_id=request.customer_id,
                interaction_type=f"ai_message_{request.message_channel}",
                content=ai_result["content"]
            )
            db.add(interaction)
            db.commit()
            
        except Exception as e:
            logger.error(f"发送消息失败: {e}")
            response_data["message_error"] = str(e)
    
    return response_data

# 消息发送函数
async def send_message_to_customer(customer: Customer, content: str, channel: str) -> Dict[str, Any]:
    """发送消息给客户"""
    if channel == "email" and customer.email:
        # 这里集成邮件发送服务
        return {
            "success": True,
            "channel": "email",
            "recipient": customer.email,
            "message": "邮件发送成功（模拟）"
        }
    elif channel == "wechat" and customer.wechat_id:
        # 这里集成微信API
        return {
            "success": True,
            "channel": "wechat",
            "recipient": customer.wechat_id,
            "message": "微信消息发送成功（模拟）"
        }
    elif channel == "linkedin":
        # 这里集成LinkedIn API
        return {
            "success": True,
            "channel": "linkedin",
            "recipient": customer.name,
            "message": "LinkedIn消息发送成功（模拟）"
        }
    else:
        raise Exception(f"不支持的消息渠道或客户缺少联系方式: {channel}")

# AI模型比较API
@app.post("/api/ai/compare-models")
async def compare_ai_models(
    prompt: str,
    customer_id: int,
    models: List[str] = ["grok-4", "deepseek-reasoner", "gemini-pro"],
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """比较多个AI模型的回应"""
    try:
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="客户不存在")
        
        # 构建客户上下文
        context = f"客户信息：{customer.name}，公司：{customer.company or '未知'}，职位：{customer.position or '未知'}，行业：{customer.industry or '未知'}"
        
        results = []
        for model in models:
            try:
                response = await call_ai_model(
                    model_name=model,
                    prompt=prompt,
                    context=context,
                    temperature=0.7,
                    max_tokens=1000
                )
                
                results.append({
                    "model": model,
                    "content": response.get("content", ""),
                    "confidence": response.get("confidence", 0.8),
                    "response_time": response.get("response_time", 0),
                    "success": True
                })
            except Exception as e:
                results.append({
                    "model": model,
                    "content": f"模型调用失败: {str(e)}",
                    "confidence": 0.0,
                    "response_time": 0,
                    "success": False
                })
        
        return {
            "success": True,
            "customer_id": customer_id,
            "prompt": prompt,
            "results": results,
            "comparison_time": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"AI模型比较失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI模型比较失败: {str(e)}")

# 文件夹管理API
@app.put("/api/folders/update")
async def update_folder(
    update: FolderUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """更新文件夹（拖拽排序、合并等）"""
    try:
        folder = db.query(Folder).filter(Folder.id == update.id).first()
        if not folder:
            raise HTTPException(status_code=404, detail="文件夹不存在")
        
        # 更新排序
        folder.order = update.new_order
        
        # 更新其他属性
        if update.name:
            folder.name = update.name
        if update.color:
            folder.color = update.color
        if update.icon:
            folder.icon = update.icon
        
        # 处理合并操作
        if update.merge_with:
            merge_folder = db.query(Folder).filter(Folder.id == update.merge_with).first()
            if not merge_folder:
                raise HTTPException(status_code=404, detail="目标合并文件夹不存在")
            
            # 将当前文件夹的所有客户移动到目标文件夹
            customers = db.query(Customer).filter(Customer.folder_id == folder.id).all()
            for customer in customers:
                customer.folder_id = merge_folder.id
                customer.updated_at = datetime.utcnow()
            
            # 删除当前文件夹
            folder_name = folder.name
            db.delete(folder)
            db.commit()
            
            return {
                "success": True,
                "message": f"文件夹 '{folder_name}' 已合并到 '{merge_folder.name}'",
                "merged_customers": len(customers),
                "target_folder": merge_folder.name
            }
        
        db.commit()
        
        return {
            "success": True,
            "message": "文件夹更新成功",
            "folder": {
                "id": folder.id,
                "name": folder.name,
                "order": folder.order,
                "color": folder.color,
                "icon": folder.icon
            }
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"文件夹更新失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"文件夹更新失败: {str(e)}")

@app.post("/api/folders/merge")
async def merge_folders(
    request: FolderMergeRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """合并多个文件夹"""
    try:
        # 验证目标文件夹存在
        target_folder = db.query(Folder).filter(Folder.id == request.target_folder_id).first()
        if not target_folder:
            raise HTTPException(status_code=404, detail="目标文件夹不存在")
        
        # 验证源文件夹存在
        source_folders = db.query(Folder).filter(Folder.id.in_(request.source_folder_ids)).all()
        if len(source_folders) != len(request.source_folder_ids):
            raise HTTPException(status_code=404, detail="部分源文件夹不存在")
        
        total_moved = 0
        merged_folder_names = []
        
        # 移动所有客户到目标文件夹
        for folder in source_folders:
            customers = db.query(Customer).filter(Customer.folder_id == folder.id).all()
            for customer in customers:
                customer.folder_id = request.target_folder_id
                customer.updated_at = datetime.utcnow()
            
            total_moved += len(customers)
            merged_folder_names.append(folder.name)
            
            # 删除源文件夹
            db.delete(folder)
        
        # 如果提供了新名称，更新目标文件夹名称
        if request.new_folder_name:
            target_folder.name = request.new_folder_name
        
        db.commit()
        
        return {
            "success": True,
            "message": f"成功合并 {len(source_folders)} 个文件夹",
            "merged_folders": merged_folder_names,
            "target_folder": target_folder.name,
            "moved_customers": total_moved
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"文件夹合并失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"文件夹合并失败: {str(e)}")

# Tag管理API
@app.post("/api/customers/add-tags")
async def add_tags(
    request: TagRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """为客户添加标签"""
    try:
        customer = db.query(Customer).filter(Customer.id == request.customer_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="客户不存在")
        
        # 获取现有标签
        existing_tags = customer.tags or []
        
        # 添加新标签（去重）
        new_tags = list(set(existing_tags + request.tags))
        customer.tags = new_tags
        customer.updated_at = datetime.utcnow()
        
        db.commit()
        
        return {
            "success": True,
            "customer_id": request.customer_id,
            "tags": new_tags,
            "added_tags": [tag for tag in request.tags if tag not in existing_tags]
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"添加标签失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"添加标签失败: {str(e)}")

@app.post("/api/customers/batch-tags")
async def batch_manage_tags(
    request: BatchTagRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """批量管理客户标签"""
    try:
        customers = db.query(Customer).filter(Customer.id.in_(request.customer_ids)).all()
        if len(customers) != len(request.customer_ids):
            raise HTTPException(status_code=404, detail="部分客户不存在")
        
        updated_customers = []
        
        for customer in customers:
            existing_tags = customer.tags or []
            
            if request.operation == "add":
                # 添加标签
                new_tags = list(set(existing_tags + request.tags))
            elif request.operation == "remove":
                # 移除标签
                new_tags = [tag for tag in existing_tags if tag not in request.tags]
            elif request.operation == "replace":
                # 替换标签
                new_tags = request.tags
            else:
                raise HTTPException(status_code=400, detail="无效的操作类型")
            
            customer.tags = new_tags
            customer.updated_at = datetime.utcnow()
            updated_customers.append({
                "id": customer.id,
                "name": customer.name,
                "tags": new_tags
            })
        
        db.commit()
        
        return {
            "success": True,
            "operation": request.operation,
            "affected_customers": len(customers),
            "customers": updated_customers
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"批量标签管理失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"批量标签管理失败: {str(e)}")

@app.get("/api/tags/search")
async def search_tags(
    query: str = "",
    sort: str = "alpha",
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """搜索和排序标签"""
    try:
        # 获取所有客户的标签
        customers = db.query(Customer).all()
        all_tags = set()
        
        for customer in customers:
            if customer.tags:
                all_tags.update(customer.tags)
        
        # 过滤标签
        if query:
            filtered_tags = [tag for tag in all_tags if query.lower() in tag.lower()]
        else:
            filtered_tags = list(all_tags)
        
        # 排序
        if sort == "alpha":
            filtered_tags.sort()
        elif sort == "frequency":
            # 按使用频率排序
            tag_counts = {}
            for customer in customers:
                if customer.tags:
                    for tag in customer.tags:
                        tag_counts[tag] = tag_counts.get(tag, 0) + 1
            
            filtered_tags.sort(key=lambda x: tag_counts.get(x, 0), reverse=True)
        
        # 限制结果数量
        filtered_tags = filtered_tags[:limit]
        
        # 获取每个标签的使用统计
        tag_stats = []
        for tag in filtered_tags:
            count = sum(1 for customer in customers if customer.tags and tag in customer.tags)
            tag_stats.append({
                "name": tag,
                "count": count,
                "category": get_tag_category(tag)  # 分类标签
            })
        
        return {
            "success": True,
            "query": query,
            "sort": sort,
            "total_tags": len(all_tags),
            "filtered_count": len(filtered_tags),
            "tags": tag_stats
        }
        
    except Exception as e:
        logger.error(f"标签搜索失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"标签搜索失败: {str(e)}")

def get_tag_category(tag: str) -> str:
    """根据标签内容判断分类"""
    education_tags = ["MBA", "暨南大学", "清华", "北大", "复旦", "交大"]
    region_tags = ["港澳", "深圳", "广州", "上海", "北京"]
    industry_tags = ["餐饮行会", "金融", "科技", "制造", "服务"]
    social_tags = ["俱乐部", "商会", "协会"]
    
    if any(edu in tag for edu in education_tags):
        return "教育背景"
    elif any(region in tag for region in region_tags):
        return "地区"
    elif any(industry in tag for industry in industry_tags):
        return "行业"
    elif any(social in tag for social in social_tags):
        return "圈子背景"
    else:
        return "其他"

# 客户详情增强API
@app.post("/api/customers/{customer_id}/notes", response_model=dict)
async def update_customer_notes(
    customer_id: int, 
    request: NoteRequest, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """更新客户备注"""
    try:
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="客户不存在")
        
        # 更新客户备注
        customer.latest_notes = request.notes
        customer.updated_at = datetime.utcnow()
        db.commit()
        
        return {
            "status": "success", 
            "message": "客户备注更新成功",
            "customer_id": customer_id,
            "notes": request.notes,
            "updated_at": customer.updated_at.isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"更新客户备注失败: {str(e)}")

@app.post("/api/customers/{customer_id}/reminders", response_model=dict)
async def set_customer_reminder(
    customer_id: int, 
    request: ReminderRequest, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """为客户设置提醒"""
    try:
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="客户不存在")
        
        # 处理时区
        if request.time.tzinfo is None:
            # 如果没有时区信息，假设为本地时区
            local_tz = pytz.timezone('Asia/Shanghai')
            reminder_time = local_tz.localize(request.time)
        else:
            reminder_time = request.time
        
        # 验证提醒时间不能是过去时间
        current_time = datetime.now(pytz.timezone('Asia/Shanghai'))
        if reminder_time <= current_time:
            raise HTTPException(status_code=400, detail="提醒时间不能是过去时间")
        
        # 创建提醒数据
        reminder_data = {
            "time": reminder_time.isoformat(),
            "term": request.term,
            "type": request.reminder_type,
            "priority": request.priority,
            "notification_methods": request.notification_methods,
            "repeat_type": request.repeat_type,
            "created_at": datetime.utcnow().isoformat(),
            "status": "active",
            "created_by": current_user.get("user_id", "system")
        }
        
        # 更新客户提醒信息
        customer.reminder = json.dumps(reminder_data)
        customer.updated_at = datetime.utcnow()
        db.commit()
        
        # 发送异步任务到Celery
        send_reminder_task.delay(
            customer_id, 
            request.term, 
            reminder_time.isoformat()
        )
        
        return {
            "status": "success", 
            "message": "提醒设置成功",
            "customer_id": customer_id,
            "reminder_time": reminder_time.isoformat(),
            "term": request.term,
            "priority": request.priority,
            "notification_methods": request.notification_methods,
            "repeat_type": request.repeat_type
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"设置提醒失败: {str(e)}")

@app.get("/api/customers/{customer_id}/reminders", response_model=dict)
async def get_customer_reminders(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """获取客户提醒信息"""
    try:
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="客户不存在")
        
        reminder_data = None
        if customer.reminder:
            try:
                reminder_data = json.loads(customer.reminder)
            except json.JSONDecodeError:
                logger.warning(f"客户 {customer_id} 的提醒数据格式错误")
        
        return {
            "status": "success",
            "customer_id": customer_id,
            "reminder": reminder_data
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取提醒信息失败: {str(e)}")

@app.delete("/api/customers/{customer_id}/reminders", response_model=dict)
async def delete_customer_reminder(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """删除客户提醒"""
    try:
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="客户不存在")
        
        customer.reminder = None
        customer.updated_at = datetime.utcnow()
        db.commit()
        
        return {
            "status": "success",
            "message": "提醒删除成功",
            "customer_id": customer_id
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"删除提醒失败: {str(e)}")

# 获客流程与优化模块API
@app.get("/api/gain-steps")
async def get_gain_steps(
    circle: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """获取指定圈子的获客步骤模板"""
    try:
        # 从YAML文件加载模板
        with open('gain_templates.yaml', 'r', encoding='utf-8') as f:
            templates = yaml.safe_load(f)
        
        # 获取指定圈子的步骤，如果不存在则使用默认步骤
        steps = templates.get(circle, templates.get('default', []))
        
        # 查询数据库中是否有该圈子的自定义步骤
        db_steps = db.query(GainStep).filter(
            GainStep.circle == circle
        ).order_by(GainStep.step_order).all()
        
        if db_steps:
            # 如果数据库中有自定义步骤，使用数据库中的步骤
            steps = [{
                "id": step.id,
                "content": step.step_content,
                "order": step.step_order,
                "completed": step.is_completed,
                "ai_generated": step.ai_generated,
                "completion_date": step.completion_date.isoformat() if step.completion_date else None
            } for step in db_steps]
        else:
            # 使用模板步骤
            steps = [{
                "id": None,
                "content": step,
                "order": idx,
                "completed": False,
                "ai_generated": False,
                "completion_date": None
            } for idx, step in enumerate(steps)]
        
        return {
            "status": "success",
            "circle": circle,
            "steps": steps,
            "total_steps": len(steps)
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="获客模板文件未找到")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取获客步骤失败: {str(e)}")

@app.post("/api/optimize-gain")
async def optimize_gain(
    request: GainOptimizeRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """基于报告数据优化获客流程"""
    try:
        # 获取当前圈子的步骤
        current_steps_response = await get_gain_steps(request.circle, db, current_user)
        current_steps = [step["content"] for step in current_steps_response["steps"]]
        
        # 分析报告数据
        conversion_rate = request.report_data.get('conversion', 0)
        total_contacts = request.report_data.get('total_contacts', 0)
        successful_contacts = request.report_data.get('successful_contacts', 0)
        
        # 基于数据生成优化建议
        optimization_suggestions = []
        optimized_steps = current_steps.copy()
        
        # 转化率低于10%的优化建议
        if conversion_rate < 10:
            optimization_suggestions.append("转化率偏低，建议增加小红书互动频次")
            optimized_steps.append("优化建议: 增加小红书互动")
            
        # 接触人数不足的优化建议
        if total_contacts < 30:
            optimization_suggestions.append("接触人数不足，建议扩大目标群体范围")
            optimized_steps.append("优化建议: 扩大目标群体范围")
            
        # 成功率低的优化建议
        if total_contacts > 0 and (successful_contacts / total_contacts) < 0.2:
            optimization_suggestions.append("成功率偏低，建议优化沟通话术")
            optimized_steps.append("优化建议: 优化沟通话术")
        
        # 使用AI生成更详细的优化建议
        ai_prompt = f"""
        基于以下获客数据为{request.circle}圈子提供优化建议：
        - 转化率: {conversion_rate}%
        - 总接触人数: {total_contacts}
        - 成功接触人数: {successful_contacts}
        - 当前步骤: {', '.join(current_steps)}
        
        请提供3-5个具体的优化建议，每个建议应该是可执行的行动步骤。
        """
        
        try:
            ai_response = await call_ai_model(
                model_name="grok-4",
                prompt=ai_prompt,
                temperature=0.7,
                max_tokens=1000
            )
            
            if ai_response.get("success"):
                ai_suggestions = ai_response["content"].split('\n')
                ai_suggestions = [s.strip() for s in ai_suggestions if s.strip() and not s.strip().startswith('#')]
                optimization_suggestions.extend(ai_suggestions[:3])  # 取前3个AI建议
        except Exception as e:
            logger.warning(f"AI优化建议生成失败: {str(e)}")
        
        # 保存优化报告到数据库
        gain_report = GainReport(
            circle=request.circle,
            report_data=request.report_data,
            conversion_rate=conversion_rate,
            total_contacts=total_contacts,
            successful_contacts=successful_contacts,
            ai_optimized=True,
            optimization_suggestions=optimization_suggestions
        )
        db.add(gain_report)
        db.commit()
        
        return {
            "status": "success",
            "circle": request.circle,
            "original_steps": current_steps,
            "optimized_steps": optimized_steps,
            "optimization_suggestions": optimization_suggestions,
            "performance_analysis": {
                "conversion_rate": conversion_rate,
                "total_contacts": total_contacts,
                "successful_contacts": successful_contacts,
                "success_rate": (successful_contacts / total_contacts * 100) if total_contacts > 0 else 0
            },
            "report_id": gain_report.id
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"优化获客流程失败: {str(e)}")

@app.post("/api/gain-reports")
async def upload_gain_report(
    request: GainReportUpload,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """上传获客报告数据"""
    try:
        # 计算ROI和其他指标
        conversion_rate = request.conversion_rate or 0
        if request.total_contacts and request.successful_contacts:
            conversion_rate = (request.successful_contacts / request.total_contacts) * 100
        
        # 创建报告记录
        gain_report = GainReport(
            circle=request.circle,
            report_data=request.report_data,
            conversion_rate=conversion_rate,
            total_contacts=request.total_contacts or 0,
            successful_contacts=request.successful_contacts or 0,
            roi=request.report_data.get('roi', 0),
            ai_optimized=False
        )
        
        db.add(gain_report)
        db.commit()
        
        return {
            "status": "success",
            "message": "获客报告上传成功",
            "report_id": gain_report.id,
            "circle": request.circle,
            "metrics": {
                "conversion_rate": conversion_rate,
                "total_contacts": request.total_contacts,
                "successful_contacts": request.successful_contacts
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"上传获客报告失败: {str(e)}")

@app.get("/api/gain-reports/{circle}")
async def get_gain_reports(
    circle: str,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """获取指定圈子的获客报告历史"""
    try:
        reports = db.query(GainReport).filter(
            GainReport.circle == circle
        ).order_by(GainReport.created_at.desc()).limit(limit).all()
        
        report_data = []
        for report in reports:
            report_data.append({
                "id": report.id,
                "circle": report.circle,
                "conversion_rate": report.conversion_rate,
                "roi": report.roi,
                "total_contacts": report.total_contacts,
                "successful_contacts": report.successful_contacts,
                "ai_optimized": report.ai_optimized,
                "optimization_suggestions": report.optimization_suggestions,
                "created_at": report.created_at.isoformat(),
                "report_data": report.report_data
            })
        
        # 计算趋势分析
        if len(report_data) >= 2:
            latest = report_data[0]
            previous = report_data[1]
            trend_analysis = {
                "conversion_rate_change": latest["conversion_rate"] - previous["conversion_rate"],
                "roi_change": latest["roi"] - previous["roi"],
                "contacts_change": latest["total_contacts"] - previous["total_contacts"]
            }
        else:
            trend_analysis = None
        
        return {
            "status": "success",
            "circle": circle,
            "reports": report_data,
            "total_reports": len(report_data),
            "trend_analysis": trend_analysis
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取获客报告失败: {str(e)}")

# WebSocket连接 - 实时更新
@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """WebSocket连接处理实时更新"""
    await websocket.accept()
    logger.info(f"WebSocket客户端 {client_id} 已连接")
    
    try:
        while True:
            # 等待客户端消息
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # 处理不同类型的消息
            if message.get("type") == "ping":
                await websocket.send_text(json.dumps({
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat()
                }))
            elif message.get("type") == "subscribe_customer":
                customer_id = message.get("customer_id")
                # 这里可以实现客户更新的实时推送
                await websocket.send_text(json.dumps({
                    "type": "subscribed",
                    "customer_id": customer_id,
                    "message": f"已订阅客户 {customer_id} 的更新"
                }))
    
    except Exception as e:
        logger.error(f"WebSocket错误: {e}")
    finally:
        logger.info(f"WebSocket客户端 {client_id} 已断开")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "ai_crm_improved:app",
        host="0.0.0.0",
        port=8001,  # 使用不同端口避免冲突
        reload=True,
        log_level="info"
    )