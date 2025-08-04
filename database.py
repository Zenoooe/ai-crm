# database.py (ORM Setup)
from sqlalchemy import create_engine, Column, Integer, String, JSON, Float, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./crm_database.db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Customer(Base):
    """客户模型 - 支持改进方案中的所有功能"""
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    email = Column(String, index=True)
    phone = Column(String, index=True)
    wechat_id = Column(String)
    company = Column(String, index=True)
    position = Column(String)
    industry = Column(String, index=True)
    age_group = Column(String)  # "25-35", "35-45", "45+"
    
    # 标签系统 - 支持拖拽分类
    tags = Column(JSON, default=list)  # e.g., ["MBA", "港澳", "决策者"]
    
    # 进度管理
    progress = Column(Float, default=0.0)  # 进度条 (0-100)
    latest_notes = Column(Text)  # 最新情况 (富文本)
    
    # 提醒系统
    reminder = Column(JSON)  # {"time": isoformat, "term": str, "type": "call|meeting|follow_up"}
    
    # 文件夹分类 - 支持拖拽
    folder_id = Column(Integer, ForeignKey('folders.id'))
    
    # 优先级
    priority = Column(Integer, default=2)  # 1=高, 2=中, 3=低
    
    # AI分析结果
    ai_profile = Column(JSON)  # {"personality": str, "communication_style": str, "interests": [], "pain_points": []}
    ai_score = Column(Float, default=0.0)  # AI评分 (0-100)
    
    # 社交媒体信息
    social_profiles = Column(JSON)  # {"linkedin": url, "weibo": url, "xiaohongshu": url}
    
    # 业务信息
    business_info = Column(JSON)  # {"company_size": str, "revenue": str, "decision_maker": bool, "budget": str}
    
    # 照片和文件
    photos = Column(JSON, default=list)  # [{"url": str, "type": "profile|event|searched", "source": str}]
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    folder = relationship("Folder", back_populates="customers")
    interactions = relationship("Interaction", back_populates="customer")

class Folder(Base):
    """文件夹模型 - 支持拖拽排序和树状结构"""
    __tablename__ = "folders"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    order = Column(Integer, default=0)  # 拖拽顺序
    parent_id = Column(Integer, ForeignKey('folders.id'))  # 树状结构支持
    folder_type = Column(String, default='custom')  # 'industry', 'position', 'age', 'custom'
    color = Column(String, default='#2196f3')  # 文件夹颜色
    icon = Column(String, default='folder')  # 图标名称
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    customers = relationship("Customer", back_populates="folder")
    parent = relationship("Folder", remote_side=[id])

class Interaction(Base):
    """互动记录模型 - 支持时间线和AI分析"""
    __tablename__ = "interactions"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey('customers.id'), nullable=False)
    
    # 互动类型
    interaction_type = Column(String, nullable=False)  # 'call', 'email', 'wechat', 'meeting', 'note'
    
    # 内容
    content = Column(Text, nullable=False)
    summary = Column(Text)  # AI生成的摘要
    
    # 情感分析
    sentiment = Column(String)  # 'positive', 'neutral', 'negative'
    sentiment_score = Column(Float)  # -1 to 1
    
    # 关键信息提取
    key_points = Column(JSON, default=list)  # AI提取的关键点
    action_items = Column(JSON, default=list)  # 待办事项
    
    # 时间信息
    interaction_date = Column(DateTime, nullable=False)
    duration = Column(Integer)  # 持续时间（分钟）
    
    # 附件
    attachments = Column(JSON, default=list)  # 文件附件
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    customer = relationship("Customer", back_populates="interactions")

class AIScript(Base):
    """AI话术模型 - 支持多种销售方法论"""
    __tablename__ = "ai_scripts"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey('customers.id'))
    
    # 话术信息
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    script_type = Column(String, nullable=False)  # 'opening', 'objection_handling', 'closing', 'follow_up'
    
    # 销售方法论
    methodology = Column(String)  # 'straight_line', 'sandler', 'challenger', 'consultative'
    
    # 场景和上下文
    scenario = Column(String)  # 使用场景
    context = Column(JSON)  # 上下文信息
    
    # AI生成信息
    ai_model = Column(String)  # 使用的AI模型
    confidence_score = Column(Float)  # 置信度
    
    # 使用统计
    usage_count = Column(Integer, default=0)
    success_rate = Column(Float, default=0.0)
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AIInsight(Base):
    """AI洞察模型 - 存储AI分析结果"""
    __tablename__ = "ai_insights"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey('customers.id'))
    
    # 洞察类型
    insight_type = Column(String, nullable=False)  # 'personality', 'opportunity', 'risk', 'recommendation'
    
    # 洞察内容
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    confidence = Column(Float)  # 置信度 0-1
    
    # 数据来源
    data_sources = Column(JSON, default=list)  # 数据来源列表
    
    # AI模型信息
    ai_model = Column(String)
    model_version = Column(String)
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)  # 洞察过期时间

class Task(Base):
    """任务模型 - 支持提醒和跟进"""
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey('customers.id'))
    
    # 任务信息
    title = Column(String, nullable=False)
    description = Column(Text)
    task_type = Column(String, nullable=False)  # 'call', 'email', 'meeting', 'follow_up', 'research', 'lead_generation'
    
    # 状态和优先级
    status = Column(String, default='pending')  # 'pending', 'in_progress', 'completed', 'cancelled'
    priority = Column(Integer, default=2)  # 1=高, 2=中, 3=低
    
    # 时间信息
    due_date = Column(DateTime)
    reminder_time = Column(DateTime)
    completed_at = Column(DateTime)
    
    # AI建议
    ai_generated = Column(Boolean, default=False)
    ai_reasoning = Column(Text)  # AI生成任务的原因
    
    # 获客任务特有字段
    lead_template_id = Column(Integer, ForeignKey('lead_templates.id'))  # 关联获客模板
    target_count = Column(Integer)  # 目标数量（如接触50位MBA人士）
    actual_count = Column(Integer, default=0)  # 实际完成数量
    lead_source = Column(String)  # 获客渠道（linkedin, maimai, xiaohongshu等）
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    lead_template = relationship("LeadTemplate", back_populates="tasks")

class LeadTemplate(Base):
    """获客模板模型 - 预设的获客流程模板"""
    __tablename__ = "lead_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # 模板名称
    description = Column(Text)  # 模板描述
    category = Column(String, nullable=False)  # 模板分类（MBA专业人士、企业高管等）
    
    # 模板配置
    daily_tasks = Column(JSON)  # 每日任务配置
    # 例如: [
    #   {"task_type": "contact_mba", "title": "接触MBA人士", "target_count": 50, "description": "通过LinkedIn等平台接触MBA专业人士"},
    #   {"task_type": "content_maintenance", "title": "维护社交媒体内容", "platforms": ["linkedin", "maimai", "xiaohongshu"]},
    #   {"task_type": "reply_posts", "title": "回复自媒体内容", "target_count": 20}
    # ]
    
    success_metrics = Column(JSON)  # 成功指标
    optimization_rules = Column(JSON)  # 优化规则
    
    # 状态
    is_active = Column(Boolean, default=True)
    usage_count = Column(Integer, default=0)
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    tasks = relationship("Task", back_populates="lead_template")
    statistics = relationship("LeadStatistics", back_populates="template")

class LeadStatistics(Base):
    """获客统计模型 - 记录获客活动的统计数据"""
    __tablename__ = "lead_statistics"
    
    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey('lead_templates.id'))
    date = Column(DateTime, nullable=False)  # 统计日期
    
    # 统计数据
    tasks_completed = Column(Integer, default=0)  # 完成任务数
    tasks_total = Column(Integer, default=0)  # 总任务数
    contacts_made = Column(Integer, default=0)  # 新增联系人数
    wechat_added = Column(Integer, default=0)  # 新增微信好友数
    content_posted = Column(Integer, default=0)  # 发布内容数
    replies_made = Column(Integer, default=0)  # 回复数量
    events_attended = Column(Integer, default=0)  # 参加活动数
    
    # 质量指标
    conversion_rate = Column(Float, default=0.0)  # 转化率
    engagement_rate = Column(Float, default=0.0)  # 互动率
    quality_score = Column(Float, default=0.0)  # 质量评分
    
    # 反馈和优化
    user_feedback = Column(Text)  # 用户反馈
    ai_suggestions = Column(JSON)  # AI优化建议
    optimization_applied = Column(JSON)  # 已应用的优化
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    template = relationship("LeadTemplate", back_populates="statistics")

# 创建所有表
Base.metadata.create_all(bind=engine)

def get_db():
    """获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 初始化默认文件夹
def init_default_folders(db):
    """初始化默认文件夹结构"""
    default_folders = [
        # 行业分类
        {"name": "互联网科技", "folder_type": "industry", "color": "#2196f3", "icon": "computer"},
        {"name": "金融服务", "folder_type": "industry", "color": "#4caf50", "icon": "account_balance"},
        {"name": "制造业", "folder_type": "industry", "color": "#ff9800", "icon": "precision_manufacturing"},
        {"name": "教育培训", "folder_type": "industry", "color": "#9c27b0", "icon": "school"},
        
        # 职级分类
        {"name": "C级高管", "folder_type": "position", "color": "#f44336", "icon": "business_center"},
        {"name": "VP/总监", "folder_type": "position", "color": "#ff5722", "icon": "supervisor_account"},
        {"name": "经理级别", "folder_type": "position", "color": "#795548", "icon": "manage_accounts"},
        
        # 年龄分类
        {"name": "25-35岁", "folder_type": "age", "color": "#00bcd4", "icon": "young_person"},
        {"name": "35-45岁", "folder_type": "age", "color": "#607d8b", "icon": "person"},
        {"name": "45岁以上", "folder_type": "age", "color": "#9e9e9e", "icon": "elderly"},
    ]
    
    for folder_data in default_folders:
        existing = db.query(Folder).filter(Folder.name == folder_data["name"]).first()
        if not existing:
            folder = Folder(**folder_data)
            db.add(folder)
    
    db.commit()

# 初始化默认获客模板
def init_default_lead_templates(db):
    """初始化默认获客模板"""
    default_templates = [
        {
            "name": "MBA专业人士获客流程",
            "description": "针对MBA背景专业人士的系统化获客流程，包含多渠道接触和内容维护",
            "category": "MBA专业人士",
            "daily_tasks": [
                {
                    "task_type": "contact_mba",
                    "title": "接触MBA人士",
                    "target_count": 50,
                    "description": "通过LinkedIn、脉脉等平台主动接触MBA专业人士",
                    "priority": 1,
                    "estimated_time": 120  # 分钟
                },
                {
                    "task_type": "content_maintenance",
                    "title": "维护社交媒体内容",
                    "platforms": ["linkedin", "maimai", "xiaohongshu"],
                    "description": "更新和维护LinkedIn、脉脉、小红书的个人资料和内容",
                    "priority": 2,
                    "estimated_time": 60
                },
                {
                    "task_type": "reply_posts",
                    "title": "回复自媒体内容",
                    "target_count": 20,
                    "description": "在各自媒体平台找到相关内容进行有价值的回复互动",
                    "priority": 2,
                    "estimated_time": 90
                },
                {
                    "task_type": "prospect_research",
                    "title": "挖掘潜在客户",
                    "description": "通过各种渠道研究和识别潜在的高价值客户",
                    "priority": 1,
                    "estimated_time": 90
                },
                {
                    "task_type": "content_creation",
                    "title": "整理自媒体视频创作",
                    "description": "规划和准备自媒体视频内容，提升个人品牌影响力",
                    "priority": 3,
                    "estimated_time": 120
                },
                {
                    "task_type": "networking_events",
                    "title": "参加行业活动",
                    "description": "参加相关行业活动，扩展人脉网络",
                    "priority": 2,
                    "estimated_time": 180
                },
                {
                    "task_type": "new_contacts",
                    "title": "新认识联系人",
                    "target_count": 30,
                    "description": "每天新认识30人并获取微信联系方式",
                    "priority": 1,
                    "estimated_time": 150
                }
            ],
            "success_metrics": {
                "daily_contacts": 50,
                "daily_new_wechat": 30,
                "weekly_conversion_rate": 0.05,
                "monthly_qualified_leads": 100
            },
            "optimization_rules": {
                "low_conversion_threshold": 0.02,
                "high_engagement_threshold": 0.1,
                "adjust_contact_strategy": True,
                "focus_high_performing_channels": True
            }
        },
        {
            "name": "企业高管获客流程",
            "description": "针对企业高管的精准获客策略，注重质量和深度接触",
            "category": "企业高管",
            "daily_tasks": [
                {
                    "task_type": "executive_research",
                    "title": "高管背景研究",
                    "target_count": 20,
                    "description": "深度研究目标企业高管的背景、兴趣和业务需求",
                    "priority": 1,
                    "estimated_time": 180
                },
                {
                    "task_type": "personalized_outreach",
                    "title": "个性化接触",
                    "target_count": 15,
                    "description": "基于研究结果进行高度个性化的接触",
                    "priority": 1,
                    "estimated_time": 120
                },
                {
                    "task_type": "thought_leadership",
                    "title": "思想领导力内容",
                    "description": "创建和分享行业洞察，建立专业权威",
                    "priority": 2,
                    "estimated_time": 90
                },
                {
                    "task_type": "executive_events",
                    "title": "高端活动参与",
                    "description": "参加高端商务活动和行业峰会",
                    "priority": 1,
                    "estimated_time": 240
                }
            ],
            "success_metrics": {
                "daily_quality_contacts": 15,
                "weekly_meaningful_conversations": 10,
                "monthly_executive_meetings": 20
            },
            "optimization_rules": {
                "focus_quality_over_quantity": True,
                "personalization_threshold": 0.8,
                "follow_up_frequency": "weekly"
            }
        }
    ]
    
    for template_data in default_templates:
        existing = db.query(LeadTemplate).filter(LeadTemplate.name == template_data["name"]).first()
        if not existing:
            template = LeadTemplate(**template_data)
            db.add(template)
    
    db.commit()