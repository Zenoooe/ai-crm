from flask import Flask, render_template, request, jsonify, session, send_from_directory
from flask_cors import CORS
from datetime import datetime
import json
import os
from werkzeug.utils import secure_filename
import sqlite3
from collections import defaultdict
import logging
import ssl
import subprocess
from config import api_config
from ai_service_manager import ai_service
from file_content_extractor import file_extractor

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_methodology_fallback_content(sales_method, customer_data):
    """根据销售方法论生成不同的fallback内容"""
    name = customer_data.get('name', '客户')
    company = customer_data.get('company', '贵公司')
    industry = customer_data.get('industry', '行业')
    position = customer_data.get('position', '负责人')
    
    # 根据不同销售方法论定制内容
    if sales_method == 'straightLine':  # 华尔街之狼直线销售法
        return {
            'opening': f"{name}您好！我是专业的销售顾问，今天联系您是因为我们有一个能够立即提升{company}业绩的机会。",
            'pain_point': f"作为{industry}的{position}，您一定深知当前市场竞争激烈，成本上升而利润下降的压力。我们发现90%的{industry}企业都面临这个挑战。",
            'solution': f"我们的解决方案专门为{industry}设计，已经帮助类似企业在30天内提升25%的效率，降低15%的成本。这不是理论，是实实在在的结果。",
            'social_proof': f"就在上个月，我们帮助一家与{company}规模相似的{industry}企业实现了月收入增长40%。他们的{position}说这是他们做过的最明智的投资。",
            'next_step': f"我知道您时间宝贵，我只需要15分钟就能向您展示具体如何实现这些结果。明天上午10点还是下午3点对您更方便？"
        }
    elif sales_method == 'spin':  # SPIN销售法
        return {
            'opening': f"{name}您好，我是专业顾问。我想了解一下{company}在{industry}领域的现状，以便为您提供更好的建议。",
            'pain_point': f"请问{company}目前在{industry}运营中，最关心的是哪个方面的问题？是效率提升、成本控制，还是市场拓展？",
            'solution': f"基于您刚才提到的情况，我们有一套专门针对{industry}的解决方案，能够系统性地解决这些问题。",
            'social_proof': f"我们已经帮助多家{industry}企业解决了类似问题，客户反馈非常积极，平均ROI达到300%以上。",
            'next_step': f"我建议我们安排一次深入的需求分析会议，这样我能更好地了解{company}的具体情况，为您定制最适合的方案。"
        }
    elif sales_method == 'challenger':  # 挑战者销售法
        return {
            'opening': f"{name}您好，我想和您分享一个可能会改变您对{industry}传统做法看法的观点。",
            'pain_point': f"大多数{industry}企业都在用同样的方法解决问题，但这种方法在当前市场环境下已经不够有效了。您有没有发现传统方式的局限性？",
            'solution': f"我们发现了一种全新的方法，它颠覆了{industry}的传统思维。这种方法不仅解决了现有问题，还能创造新的竞争优势。",
            'social_proof': f"那些敢于突破传统的{industry}领导者已经通过这种新方法获得了显著的竞争优势，他们的业绩提升了50%以上。",
            'next_step': f"我想向您展示这种新方法的具体应用，以及它如何为{company}创造独特价值。我们可以安排一次战略讨论吗？"
        }
    elif sales_method == 'consultative':  # 顾问式销售法
        return {
            'opening': f"{name}您好，作为{industry}领域的专业顾问，我希望能够了解{company}的发展规划，看看我们如何能够提供支持。",
            'pain_point': f"在与众多{industry}企业合作的过程中，我发现{position}们经常面临战略规划与执行之间的挑战。{company}在这方面有什么感受吗？",
            'solution': f"基于我们在{industry}的深度经验，我们可以为{company}提供从战略规划到执行落地的全方位咨询服务。",
            'social_proof': f"我们已经成功帮助多家{industry}企业实现了战略目标，建立了长期的合作伙伴关系，客户满意度达到98%。",
            'next_step': f"我建议我们先进行一次免费的战略诊断，深入了解{company}的现状和目标，然后为您制定专属的发展建议。"
        }
    elif sales_method == 'solution':  # 解决方案销售法
        return {
            'opening': f"{name}您好，我了解到{company}在{industry}领域的发展，想和您探讨一下业务优化的可能性。",
            'pain_point': f"{industry}企业普遍面临数字化转型、运营效率和成本控制的多重挑战。{company}在这些方面有什么具体的困扰吗？",
            'solution': f"我们为{industry}企业设计了一套综合解决方案，涵盖了从业务流程优化到技术升级的全链条服务。",
            'social_proof': f"这套解决方案已经在多家{industry}企业成功实施，平均帮助客户提升35%的运营效率，降低20%的运营成本。",
            'next_step': f"我想为{company}进行一次全面的业务诊断，识别具体的优化机会，然后为您设计定制化的解决方案。"
        }
    elif sales_method == 'value':  # 价值销售法
        return {
            'opening': f"{name}您好，我想和您讨论一下如何为{company}创造更大的商业价值。",
            'pain_point': f"在当前经济环境下，{industry}企业都在寻找能够带来实际投资回报的解决方案。{company}在投资决策时最看重哪些价值指标？",
            'solution': f"我们的方案不仅能解决问题，更重要的是能为{company}创造可量化的商业价值，实现投资回报最大化。",
            'social_proof': f"我们帮助{industry}企业实现的平均投资回报率达到400%，投资回收期通常在6-12个月内。",
            'next_step': f"我建议我们进行一次价值评估会议，量化分析我们的方案能为{company}带来的具体价值和投资回报。"
        }
    else:  # 默认内容
        return {
            'opening': f"{name}您好，我是来自我们公司的销售顾问，很高兴有机会为您介绍我们的解决方案。",
            'pain_point': f"在{industry}行业中，我们发现很多{position}都面临着效率提升和成本控制的挑战。",
            'solution': "我们的解决方案专门针对这些痛点设计，能够帮助您显著提升工作效率，降低运营成本。",
            'social_proof': "我们已经为多家同行业企业提供了类似服务，客户满意度达到95%以上，平均帮助客户提升30%的工作效率。",
            'next_step': "我建议我们安排一次详细的产品演示，让您更直观地了解我们的解决方案如何帮助您的企业。"
        }

app = Flask(__name__)

# 配置
app.secret_key = api_config.app['secret_key']
app.config['UPLOAD_FOLDER'] = api_config.upload['upload_folder']
app.config['MAX_CONTENT_LENGTH'] = api_config.upload['max_file_size']
app.config['DEBUG'] = api_config.app['debug']

# 启用CORS
CORS(app, origins=api_config.app['cors_origins'])

# 静态文件路由
@app.route('/static/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory('static/uploads', filename)

@app.route('/static/images/<path:filename>')
def static_images(filename):
    return send_from_directory('static/images', filename)

# 确保必要的文件夹存在
for folder in [api_config.upload['upload_folder'], api_config.upload['temp_folder'], 'static/uploads', 'static/css', 'static/js', 'templates']:
    if not os.path.exists(folder):
        os.makedirs(folder)
        logger.info(f"创建文件夹: {folder}")

# 数据库初始化
def init_db():
    """初始化数据库"""
    db_path = api_config.database['sqlite_path']
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    logger.info(f"初始化数据库: {db_path}")
    
    # 客户表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            industry TEXT,
            position TEXT,
            age_group TEXT,
            phone TEXT,
            wechat TEXT,
            email TEXT,
            photo_url TEXT,
            priority INTEGER DEFAULT 2,
            folder TEXT DEFAULT '默认分组',
            sort_order INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 沟通记录表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS communications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER,
            content TEXT,
            communication_type TEXT,
            topics TEXT,
            images TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers (id)
        )
    ''')
    
    # AI分析记录表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ai_analysis (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER,
            profile_analysis TEXT,
            next_contact_suggestion TEXT,
            sales_opportunity TEXT,
            success_probability REAL,
            recommended_approach TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers (id)
        )
    ''')
    
    # 销售话术库表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sales_scripts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT,
            scenario TEXT,
            script_content TEXT,
            effectiveness_score REAL DEFAULT 0.0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 销售方法prompt表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sales_prompts (
            method TEXT PRIMARY KEY,
            prompt TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # AI模型列表表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ai_models (
            provider TEXT PRIMARY KEY,
            models TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 客户任务表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS customer_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_name TEXT NOT NULL,
            description TEXT,
            target_count INTEGER DEFAULT 0,
            category TEXT,
            priority INTEGER DEFAULT 2,
            is_active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 任务执行记录表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS task_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER,
            completed_count INTEGER DEFAULT 0,
            notes TEXT,
            completion_date DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (task_id) REFERENCES customer_tasks (id)
        )
    ''')
    
    # 任务建议表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS task_suggestions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER,
            suggestion_text TEXT NOT NULL,
            suggestion_type TEXT,
            is_applied BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (task_id) REFERENCES customer_tasks (id)
        )
    ''')
    
    # 项目背景表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS customer_backgrounds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER UNIQUE,
            background TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers (id)
        )
    ''')
    
    # 数据库迁移：添加company字段（如果不存在）
    try:
        cursor.execute('ALTER TABLE customers ADD COLUMN company TEXT')
        logger.info("已为customers表添加company字段")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            logger.info("company字段已存在，跳过添加")
        else:
            logger.error(f"添加company字段时出错: {e}")
    
    conn.commit()
    conn.close()

# 智能解析AI响应
def parse_ai_response_intelligently(ai_response, customer_data, interactions):
    """智能解析AI响应，提取四个分析部分"""
    try:
        # 尝试按段落分割AI响应
        sections = ai_response.split('\n\n')
        
        # 初始化分析结果
        analysis = {
            'profile_analysis': '',
            'next_contact_suggestion': '',
            'sales_opportunity': '',
            'success_probability': 0.45,  # 更保守的默认值
            'recommended_approach': '基于AI分析的个性化销售方法',
            'full_analysis': ai_response
        }
        
        # 根据关键词匹配内容
        profile_keywords = ['画像', '特征', '性格', '背景', '客户']
        contact_keywords = ['联系', '跟进', '沟通', '建议', '时间']
        opportunity_keywords = ['机会', '销售', '潜力', '需求', '价值']
        probability_keywords = ['概率', '可能', '成交', '成功']
        
        for section in sections:
            if not section.strip():
                continue
                
            section_lower = section.lower()
            
            # 匹配客户画像
            if any(keyword in section_lower for keyword in profile_keywords) and not analysis['profile_analysis']:
                analysis['profile_analysis'] = section.strip()[:500]
            # 匹配联系建议
            elif any(keyword in section_lower for keyword in contact_keywords) and not analysis['next_contact_suggestion']:
                analysis['next_contact_suggestion'] = section.strip()[:300]
            # 匹配销售机会
            elif any(keyword in section_lower for keyword in opportunity_keywords) and not analysis['sales_opportunity']:
                analysis['sales_opportunity'] = section.strip()[:300]
            # 匹配成交概率
            elif any(keyword in section_lower for keyword in probability_keywords):
                # 尝试提取数字
                import re
                numbers = re.findall(r'\d+(?:\.\d+)?', section)
                if numbers:
                    prob = float(numbers[0])
                    if prob > 1:  # 如果是百分比形式
                        prob = prob / 100
                    analysis['success_probability'] = min(max(prob, 0), 1)
        
        # 如果某些字段为空，使用AI响应的前几段
        if not analysis['profile_analysis'] and len(sections) > 0:
            analysis['profile_analysis'] = sections[0].strip()[:500]
        if not analysis['next_contact_suggestion'] and len(sections) > 1:
            analysis['next_contact_suggestion'] = sections[1].strip()[:300]
        if not analysis['sales_opportunity'] and len(sections) > 2:
            analysis['sales_opportunity'] = sections[2].strip()[:300]
            
        # 确保所有字段都有内容
        if not analysis['profile_analysis']:
            analysis['profile_analysis'] = f"客户{customer_data.get('name', '')}在{customer_data.get('industry', '')}行业担任{customer_data.get('position', '')}职位，基于{len(interactions)}次沟通记录分析，该客户展现出专业的业务素养和明确的需求导向。"
        if not analysis['next_contact_suggestion']:
            analysis['next_contact_suggestion'] = "建议在1-2周内通过电话或邮件进行跟进，重点了解客户当前项目进展和具体需求，选择客户方便的时间进行深入沟通。"
        if not analysis['sales_opportunity']:
            analysis['sales_opportunity'] = "客户在当前业务领域显示出明确的改进需求，存在较好的合作机会。建议重点关注客户的核心痛点，提供针对性的解决方案。"
            
        return analysis
        
    except Exception as e:
        logger.error(f"智能解析AI响应失败: {str(e)}")
        return generate_default_analysis_data(customer_data, interactions)

# 生成默认分析
def generate_default_analysis(customer, communications):
    """生成默认的客户分析"""
    return {
        'profile_analysis': f'客户{customer[1]}在{customer[2]}行业担任{customer[3]}职位，年龄段为{customer[4]}。基于{len(communications)}次沟通记录，该客户展现出专业的业务素养。从沟通频率和内容来看，客户对我们的产品/服务表现出一定的兴趣，具备进一步深入合作的潜力。',
        'next_contact_suggestion': '建议在1-2周内进行跟进联系，优先选择电话沟通方式，时间安排在工作日上午10-11点或下午2-4点。重点了解客户当前项目进展、预算情况和决策时间线，为下一步合作奠定基础。',
        'sales_opportunity': f'基于客户在{customer[2]}行业的职位和沟通表现，存在中等到较高的销售机会。建议重点关注客户的业务痛点和改进需求，提供定制化的解决方案演示，强调ROI和实施可行性。',
        'success_probability': 0.6,
        'recommended_approach': '采用顾问式销售方法，重点了解客户需求，建立信任关系。'
    }

def generate_default_analysis_data(customer_data, interactions):
    """为智能解析失败时生成默认分析数据"""
    return {
        'profile_analysis': f"客户{customer_data.get('name', '')}在{customer_data.get('industry', '')}行业担任{customer_data.get('position', '')}职位，基于{len(interactions)}次沟通记录分析，该客户展现出专业的业务素养和明确的需求导向。",
        'next_contact_suggestion': "建议在1-2周内通过电话或邮件进行跟进，重点了解客户当前项目进展和具体需求。",
        'sales_opportunity': "客户在当前业务领域显示出明确的改进需求，存在较好的合作机会。",
        'success_probability': 0.65,
        'recommended_approach': '基于客户特点的个性化销售方法'
    }

# 使用AI服务生成分析
def generate_ai_analysis(customer_id, background_text=None):
    conn = sqlite3.connect(api_config.database['sqlite_path'])
    cursor = conn.cursor()
    
    # 获取客户信息和沟通记录
    cursor.execute('SELECT * FROM customers WHERE id = ?', (customer_id,))
    customer = cursor.fetchone()
    
    cursor.execute('SELECT * FROM communications WHERE customer_id = ? ORDER BY created_at DESC', (customer_id,))
    communications = cursor.fetchall()
    
    try:
        # 准备客户数据
        customer_data = {
            'name': customer[1],
            'industry': customer[2],
            'position': customer[3],
            'age_group': customer[4],
            'phone': customer[5],
            'priority': customer[9]
        }
        
        # 如果有项目背景信息，将其整合到客户数据中
        if background_text:
            customer_data['project_background'] = background_text
        
        # 获取客户上传的文件内容
        file_contents = file_extractor.get_customer_file_contents(customer_id)
        formatted_file_content = file_extractor.format_file_contents_for_ai(file_contents)
        
        # 如果有文件内容，将其添加到客户数据中
        if formatted_file_content:
            customer_data['uploaded_files_content'] = formatted_file_content
        
        # 准备互动历史
        interactions = []
        for comm in communications:
            interactions.append({
                'created_at': comm[6],
                'content': comm[2],
                'type': comm[3]
            })
        
        # 调用AI服务生成分析，传递包含背景信息的客户数据
        result = ai_service.generate_customer_analysis(customer_data, interactions)
        
        if result.get('success'):
            # 解析AI返回的分析结果
            ai_response = result.get('message', '')
            
            # 尝试解析结构化的AI响应
            try:
                # 使用AI生成详细的四个分析部分
                # 构建更详细的提示，充分利用项目背景信息
                background_section = ""
                if background_text:
                    background_section = f"""
                
                **重要项目背景信息**：
                {background_text}
                
                请特别注意：以上项目背景信息是客户分析的核心依据，必须在所有分析中充分体现和运用。
                """
                
                # 添加文件内容部分
                file_content_section = ""
                if formatted_file_content:
                    file_content_section = f"""
                
                {formatted_file_content}
                
                **重要提示**：以上是客户上传的项目相关文件内容，包含了客户的具体需求、项目细节、预算信息等关键数据。请在分析时重点参考这些文件内容，它们比基本信息更准确、更具体。
                """
                
                detailed_prompt = f"""
                请基于以下信息生成详细的客户分析：
                
                **客户基本信息**：{customer_data}
                **沟通记录**：{interactions}{background_section}{file_content_section}
                
                **重要提示**：
                1. 如果项目背景信息中包含年龄、职位、公司等具体信息，请优先使用项目背景中的信息，忽略客户基本信息中可能过时的数据。
                2. 如果有上传的文件内容，请重点分析文件中的需求、痛点、预算、时间要求等关键信息，这些是最准确的第一手资料。
                3. 文件内容的优先级：上传文件内容 > 项目背景信息 > 基本客户信息。
                
                请务必结合项目背景信息，生成以下详细分析，并用JSON格式返回：
                
                {{
                  "profile_analysis": {{
                    "content": "客户画像分析内容（200-300字）",
                    "time": "最佳联系时间段",
                    "method": "推荐沟通方式",
                    "topics": ["关键话题1", "关键话题2", "关键话题3"],
                    "opportunities": ["机会点1", "机会点2", "机会点3"],
                    "strategies": ["策略1", "策略2", "策略3"],
                    "competition_analysis": "竞争分析和差异化建议"
                  }},
                  "next_contact_suggestion": "下次联系的具体建议",
                  "sales_opportunity": "销售机会评估内容",
                  "success_probability": 0.5
                }}
                
                **各字段要求**：
                1. **profile_analysis.content**：必须优先使用项目背景中的具体信息，分析客户的决策风格、沟通偏好、关注重点
                2. **profile_analysis.time**：基于客户特点推荐的最佳联系时间（如"工作日上午9-11点"）
                3. **profile_analysis.method**：推荐的沟通方式（如"电话+邮件跟进"、"微信语音"等）
                4. **profile_analysis.topics**：与客户沟通的关键话题数组，3-5个要点
                5. **profile_analysis.opportunities**：识别的销售机会点数组，3-5个机会
                6. **profile_analysis.strategies**：针对性销售策略数组，3-5个策略
                7. **profile_analysis.competition_analysis**：竞争环境分析和我方差异化优势
                8. **next_contact_suggestion**：具体的下次联系建议
                9. **sales_opportunity**：销售机会的详细评估
                10. **success_probability**：0-1之间的成交概率（保持理性和保守）
                
                **成交概率评估标准**：
                - 初次接触或了解阶段：0.2-0.4
                - 有明确需求但未确定供应商：0.4-0.6
                - 进入商务谈判或方案讨论：0.6-0.8
                - 只有在客户明确表达购买意向或进入合同阶段时才可能达到0.8以上
                
                请确保返回标准的JSON格式，所有字符串都用双引号包围。
                """
                
                detailed_result = ai_service.chat(detailed_prompt)
                if detailed_result.get('success'):
                    detailed_response = detailed_result.get('message', '')
                    
                    # 尝试解析JSON响应
                    import re
                    import json
                    
                    # 尝试多种JSON提取方法
                    json_patterns = [
                        r'\{[^{}]*"profile_analysis"[^{}]*"success_probability"[^{}]*\}',  # 完整JSON
                        r'\{.*?"profile_analysis".*?"success_probability".*?\}',  # 贪婪匹配
                        r'```json\s*({.*?})\s*```',  # markdown代码块
                        r'({.*?"profile_analysis".*?})'  # 最宽泛匹配
                    ]
                    
                    parsed_analysis = None
                    for pattern in json_patterns:
                        json_match = re.search(pattern, detailed_response, re.DOTALL)
                        if json_match:
                            try:
                                json_str = json_match.group(1) if '```json' in pattern else json_match.group()
                                parsed_analysis = json.loads(json_str)
                                break
                            except (json.JSONDecodeError, ValueError, IndexError):
                                continue
                    
                    if parsed_analysis:
                        # 处理新的结构化profile_analysis
                        profile_data = parsed_analysis.get('profile_analysis', {})
                        
                        # 如果profile_analysis是字符串，保持向后兼容
                        if isinstance(profile_data, str):
                            profile_analysis = profile_data
                            profile_details = {}
                        else:
                            # 新的结构化格式
                            profile_analysis = str(profile_data.get('content', '客户画像分析中...'))
                            profile_details = {
                                'time': str(profile_data.get('time', '工作日上午9-11点')),
                                'method': str(profile_data.get('method', '电话+邮件跟进')),
                                'topics': profile_data.get('topics', ['产品需求', '预算情况', '决策流程']),
                                'opportunities': profile_data.get('opportunities', ['明确需求', '预算充足', '决策权限']),
                                'strategies': profile_data.get('strategies', ['需求挖掘', '价值展示', '关系建立']),
                                'competition_analysis': str(profile_data.get('competition_analysis', '需要进一步了解竞争情况'))
                            }
                        
                        # 获取并验证成交概率
                        raw_probability = parsed_analysis.get('success_probability', 0.45)
                        try:
                            probability = float(raw_probability)
                            # 确保概率在合理范围内
                            if probability > 0.85:
                                logger.warning(f"AI返回过高概率 {probability}，调整为0.75")
                                probability = 0.75
                            elif probability < 0.1:
                                logger.warning(f"AI返回过低概率 {probability}，调整为0.25")
                                probability = 0.25
                            elif probability > 1.0:
                                logger.warning(f"AI返回概率超过1.0: {probability}，调整为0.65")
                                probability = 0.65
                        except (ValueError, TypeError):
                            logger.warning(f"AI返回无效概率值: {raw_probability}，使用默认值0.45")
                            probability = 0.45
                        
                        # 确保所有字段都是正确类型
                        analysis = {
                            'profile_analysis': profile_analysis,
                            'profile_details': profile_details,
                            'next_contact_suggestion': str(parsed_analysis.get('next_contact_suggestion', '建议在1-2周内进行跟进，通过电话或邮件了解项目进展。')),
                            'sales_opportunity': str(parsed_analysis.get('sales_opportunity', '客户显示出明确的购买意向，建议重点跟进。')),
                            'success_probability': probability,
                            'recommended_approach': '基于AI分析的个性化销售方法',
                            'full_analysis': detailed_response
                        }
                    else:
                        # JSON解析失败，使用智能分割
                        analysis = parse_ai_response_intelligently(detailed_response, customer_data, interactions)
                else:
                    # 详细分析失败，使用原始响应
                    analysis = parse_ai_response_intelligently(ai_response, customer_data, interactions)
            except Exception as parse_error:
                logger.warning(f"解析AI响应时出错: {str(parse_error)}，使用智能分割")
                analysis = parse_ai_response_intelligently(ai_response, customer_data, interactions)
            
            logger.info(f"为客户 {customer[1]} 生成AI分析成功")
        else:
            logger.error(f"AI分析生成失败: {result.get('error')}")
            # 返回默认分析
            analysis = generate_default_analysis(customer, communications)
    
    except Exception as e:
        logger.error(f"生成AI分析时发生错误: {str(e)}")
        # 返回默认分析
        analysis = {
            'profile_analysis': f'客户{customer[1]}的基本信息已记录，建议进一步了解其具体需求。',
            'next_contact_suggestion': '建议安排初步沟通，了解客户的具体需求和决策流程。',
            'sales_opportunity': '待进一步评估。',
            'success_probability': 0.5,
            'recommended_approach': '采用标准销售流程。'
        }
    
    # 删除旧的AI分析结果（如果存在）
    cursor.execute('DELETE FROM ai_analysis WHERE customer_id = ?', (customer_id,))
    
    # 保存新的AI分析结果
    cursor.execute('''
        INSERT INTO ai_analysis (customer_id, profile_analysis, next_contact_suggestion, 
                                sales_opportunity, success_probability, recommended_approach)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (customer_id, analysis['profile_analysis'], analysis['next_contact_suggestion'],
          analysis['sales_opportunity'], analysis['success_probability'], analysis['recommended_approach']))
    
    conn.commit()
    conn.close()
    
    return analysis

# 生成销售话术
def generate_sales_script(customer_id, script_type='opening', methodology='straightLine'):
    """使用AI服务生成销售话术"""
    conn = sqlite3.connect(api_config.database['sqlite_path'])
    cursor = conn.cursor()
    
    try:
        # 获取客户信息
        cursor.execute('SELECT * FROM customers WHERE id = ?', (customer_id,))
        customer = cursor.fetchone()
        
        if not customer:
            conn.close()
            return {}
        
        # 获取项目背景信息
        cursor.execute('SELECT background FROM customer_backgrounds WHERE customer_id = ?', (customer_id,))
        background_result = cursor.fetchone()
        project_background = background_result[0] if background_result and background_result[0] else ""
        
        # 准备客户数据
        customer_data = {
            'name': customer[1],
            'company': customer[2],
            'position': customer[3],
            'industry': customer[4],
            'priority': customer[9] if len(customer) > 9 else 2,
            'project_background': project_background
        }
        
        # 调用AI服务生成话术
        result = ai_service.generate_sales_script(
            customer_data, 
            script_type=script_type, 
            methodology=methodology
        )
        
        if result.get('success'):
            ai_response = result.get('message', '')
            try:
                # 解析JSON响应
                scripts = json.loads(ai_response)
            except json.JSONDecodeError:
                logger.error("AI响应不是有效的JSON")
                scripts = {
                    'opening': ai_response,
                    'pain_point': '',
                    'solution': '',
                    'social_proof': '',
                    'next_step': ''
                }
            
            logger.info(f"为客户 {customer[1]} 生成销售话术成功")
            
        else:
            logger.error(f"销售话术生成失败: {result.get('error')}")
            # 返回默认话术
            scripts = {
                'opening': f'您好{customer[1]}，我是来自我们公司的销售顾问。了解到您在{customer[2]}担任{customer[3]}，我们有一些针对您行业的解决方案。',
                'pain_point': '默认痛点挖掘话术',
                'solution': '默认解决方案话术',
                'social_proof': '默认社会证明话术',
                'next_step': '默认下一步行动话术'
            }
    
    except Exception as e:
        logger.error(f"生成销售话术时发生错误: {str(e)}")
        scripts = {
            'opening': '您好，我是销售顾问，很高兴为您介绍我们的产品和服务。',
            'pain_point': '默认痛点挖掘话术',
            'solution': '默认解决方案话术',
            'social_proof': '默认社会证明话术',
            'next_step': '默认下一步行动话术'
        }
    
    finally:
        conn.close()
    
    return scripts

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/customers', methods=['GET', 'POST'])
def handle_customers():
    if request.method == 'GET':
        conn = sqlite3.connect(api_config.database['sqlite_path'])
        cursor = conn.cursor()
        
        folder = request.args.get('folder', '')
        priority = request.args.get('priority', '')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))  # 默认每页20条
        
        # 检查是否有sort_order字段，如果没有则添加
        cursor.execute("PRAGMA table_info(customers)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'sort_order' not in columns:
            cursor.execute('ALTER TABLE customers ADD COLUMN sort_order INTEGER DEFAULT 0')
            # 为现有客户设置默认排序
            cursor.execute('UPDATE customers SET sort_order = id WHERE sort_order = 0')
        
        # 构建查询条件
        query = 'SELECT * FROM customers WHERE 1=1'
        count_query = 'SELECT COUNT(*) FROM customers WHERE 1=1'
        params = []
        
        if folder:
            query += ' AND folder = ?'
            count_query += ' AND folder = ?'
            params.append(folder)
        
        if priority:
            query += ' AND priority = ?'
            count_query += ' AND priority = ?'
            params.append(int(priority))
        
        # 获取总数
        cursor.execute(count_query, params)
        total_count = cursor.fetchone()[0]
        
        # 使用sort_order排序，如果sort_order为0或NULL则使用id排序
        query += ' ORDER BY CASE WHEN sort_order IS NULL OR sort_order = 0 THEN id ELSE sort_order END, id'
        
        # 添加分页
        offset = (page - 1) * per_page
        query += ' LIMIT ? OFFSET ?'
        params.extend([per_page, offset])
        
        cursor.execute(query, params)
        customers = cursor.fetchall()
        
        # 转换为字典格式
        customer_list = []
        for customer in customers:
            # 处理可能的sort_order字段
            sort_order = customer[11] if len(customer) > 11 else customer[0]  # sort_order在索引11位置
            customer_dict = {
                'id': customer[0],
                'name': customer[1],
                'industry': customer[2],
                'position': customer[3],
                'age_group': customer[4],
                'phone': customer[5],
                'wechat': customer[6],
                'email': customer[7],
                'photo_url': customer[8],
                'priority': customer[9],
                'folder': customer[10],
                'sort_order': sort_order,
                'created_at': customer[12] if len(customer) > 12 else None,
                'updated_at': customer[13] if len(customer) > 13 else None,
                'company': customer[14] if len(customer) > 14 else None
            }
            customer_list.append(customer_dict)
        
        conn.close()
        
        # 计算分页信息
        total_pages = (total_count + per_page - 1) // per_page
        
        return jsonify({
            'customers': customer_list,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total_count,
                'total_pages': total_pages,
                'has_next': page < total_pages,
                'has_prev': page > 1
            }
        })
    
    elif request.method == 'POST':
        try:
            data = request.get_json()
            
            # 验证必填字段
            if not data.get('name'):
                return jsonify({'success': False, 'message': '客户姓名不能为空'}), 400
            
            conn = sqlite3.connect(api_config.database['sqlite_path'])
            cursor = conn.cursor()
            
            # 插入新客户
            cursor.execute("""
                INSERT INTO customers (name, industry, position, age_group, phone, wechat, email, priority, folder, company)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                data.get('name'),
                data.get('industry', ''),
                data.get('position', ''),
                data.get('age_group', ''),
                data.get('phone', ''),
                data.get('wechat', ''),
                data.get('email', ''),
                data.get('priority', 2),
                data.get('folder', '默认分组'),
                data.get('company', '')
            ))
            
            customer_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            return jsonify({
                'success': True, 
                'message': '客户添加成功',
                'customer_id': customer_id
            })
            
        except Exception as e:
            logger.error(f"添加客户失败: {str(e)}")
            return jsonify({'success': False, 'message': '添加客户失败'}), 500

@app.route('/api/customer/<int:customer_id>')
@app.route('/api/customers/<int:customer_id>', methods=['GET'])
def get_customer_detail(customer_id):
    conn = sqlite3.connect(api_config.database['sqlite_path'])
    cursor = conn.cursor()
    
    # 获取客户基本信息
    cursor.execute('SELECT * FROM customers WHERE id = ?', (customer_id,))
    customer = cursor.fetchone()
    
    if not customer:
        return jsonify({'error': 'Customer not found'}), 404
    
    # 获取沟通记录
    cursor.execute('SELECT * FROM communications WHERE customer_id = ? ORDER BY created_at DESC', (customer_id,))
    communications = cursor.fetchall()
    
    # 获取最新AI分析
    cursor.execute('SELECT * FROM ai_analysis WHERE customer_id = ? ORDER BY created_at DESC LIMIT 1', (customer_id,))
    ai_analysis = cursor.fetchone()
    
    # 如果没有AI分析，返回空的分析结果
    if not ai_analysis:
        analysis = {
            'profile_analysis': '暂无AI分析，请点击"基于背景重新分析"按钮生成分析。',
            'next_contact_suggestion': '请先生成AI分析。',
            'sales_opportunity': '请先生成AI分析。',
            'success_probability': 0.0,
            'recommended_approach': '请先生成AI分析。'
        }
    else:
        analysis = {
            'profile_analysis': ai_analysis[2],
            'next_contact_suggestion': ai_analysis[3],
            'sales_opportunity': ai_analysis[4],
            'success_probability': ai_analysis[5],
            'recommended_approach': ai_analysis[6]
        }
    
    customer_detail = {
        'id': customer[0],
        'name': customer[1],
        'industry': customer[2],
        'position': customer[3],
        'age_group': customer[4],
        'phone': customer[5],
        'wechat': customer[6],
        'email': customer[7],
        'photo_url': customer[8],
        'priority': customer[9],
        'folder': customer[10],
        'communications': [{
            'id': comm[0],
            'content': comm[2],
            'type': comm[3],
            'topics': comm[4],
            'images': comm[5],
            'created_at': comm[6]
        } for comm in communications],
        'ai_analysis': analysis
    }
    
    conn.close()
    return jsonify(customer_detail)

@app.route('/api/customer', methods=['POST'])
def add_customer():
    data = request.json
    
    conn = sqlite3.connect(api_config.database['sqlite_path'])
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO customers (name, industry, position, age_group, phone, wechat, email, 
                             photo_url, priority, folder)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (data.get('name'), data.get('industry'), data.get('position'), 
          data.get('age_group'), data.get('phone'), data.get('wechat'), 
          data.get('email'), data.get('photo_url'), 
          data.get('priority', 2), data.get('folder', '默认分组')))
    
    customer_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({'id': customer_id, 'message': '客户添加成功'})

@app.route('/api/customers/<int:customer_id>', methods=['PUT', 'DELETE'])
def handle_customer(customer_id):
    """更新或删除客户信息"""
    if request.method == 'DELETE':
        return delete_customer(customer_id)
    else:
        return update_customer_info(customer_id)

def delete_customer(customer_id):
    """删除客户"""
    try:
        conn = sqlite3.connect(api_config.database['sqlite_path'])
        cursor = conn.cursor()
        
        # 检查客户是否存在
        cursor.execute('SELECT name FROM customers WHERE id = ?', (customer_id,))
        customer = cursor.fetchone()
        
        if not customer:
            conn.close()
            return jsonify({'error': '客户不存在'}), 404
        
        customer_name = customer[0]
        
        # 删除相关的沟通记录
        cursor.execute('DELETE FROM communications WHERE customer_id = ?', (customer_id,))
        
        # 删除相关的AI分析记录
        cursor.execute('DELETE FROM ai_analysis WHERE customer_id = ?', (customer_id,))
        
        # 删除客户
        cursor.execute('DELETE FROM customers WHERE id = ?', (customer_id,))
        
        conn.commit()
        conn.close()
        
        logger.info(f"删除客户成功: {customer_name} (ID: {customer_id})")
        return jsonify({'message': '客户删除成功'})
        
    except Exception as e:
        logger.error(f"删除客户失败: {str(e)}")
        return jsonify({'error': '删除客户失败'}), 500

def update_customer_info(customer_id):
    """更新客户信息"""
    data = request.json
    
    conn = sqlite3.connect(api_config.database['sqlite_path'])
    cursor = conn.cursor()
    
    try:
        # 构建更新语句
        update_fields = []
        update_values = []
        
        # 检查哪些字段需要更新
        if 'name' in data:
            update_fields.append('name = ?')
            update_values.append(data['name'])
        if 'industry' in data:
            update_fields.append('industry = ?')
            update_values.append(data['industry'])
        if 'position' in data:
            update_fields.append('position = ?')
            update_values.append(data['position'])
        if 'age_group' in data:
            update_fields.append('age_group = ?')
            update_values.append(data['age_group'])
        if 'phone' in data:
            update_fields.append('phone = ?')
            update_values.append(data['phone'])
        if 'wechat' in data:
            update_fields.append('wechat = ?')
            update_values.append(data['wechat'])
        if 'email' in data:
            update_fields.append('email = ?')
            update_values.append(data['email'])
        if 'priority' in data:
            update_fields.append('priority = ?')
            update_values.append(data['priority'])
        if 'folder' in data:
            update_fields.append('folder = ?')
            update_values.append(data['folder'])
        if 'company' in data:
            update_fields.append('company = ?')
            update_values.append(data['company'])
        
        if not update_fields:
            return jsonify({'success': False, 'message': '没有要更新的字段'})
        
        # 添加更新时间
        update_fields.append('updated_at = CURRENT_TIMESTAMP')
        update_values.append(customer_id)
        
        # 执行更新
        update_sql = f"UPDATE customers SET {', '.join(update_fields)} WHERE id = ?"
        cursor.execute(update_sql, update_values)
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'success': False, 'message': '客户不存在'})
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': '客户信息更新成功'})
        
    except Exception as e:
        conn.close()
        logger.error(f"更新客户信息失败: {e}")
        return jsonify({'success': False, 'message': f'更新失败: {str(e)}'})

@app.route('/api/communication', methods=['POST'])
def add_communication():
    data = request.json
    
    conn = sqlite3.connect(api_config.database['sqlite_path'])
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO communications (customer_id, content, communication_type, topics, images)
        VALUES (?, ?, ?, ?, ?)
    ''', (data.get('customer_id'), data.get('content'), data.get('type'),
          data.get('topics'), data.get('images')))
    
    # 更新客户的最后更新时间
    cursor.execute('UPDATE customers SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
                   (data.get('customer_id'),))
    
    conn.commit()
    conn.close()
    
    # 重新生成AI分析
    generate_ai_analysis(data.get('customer_id'))
    
    return jsonify({'message': '沟通记录添加成功'})

@app.route('/api/sales-script/<int:customer_id>', methods=['GET', 'POST'])
def get_sales_script(customer_id):
    """获取/生成销售话术"""
    try:
        if request.method == 'GET':
            situation = request.args.get('situation', 'initial_contact')
            ai_model = None
            sales_method = None
        else:
            data = request.get_json()
            situation = data.get('situation', 'initial_contact')
            ai_model = data.get('ai_model')
            sales_method = data.get('sales_method')
            advanced_settings = data.get('advanced_settings')
        
        # 获取客户信息
        conn = sqlite3.connect(api_config.database['sqlite_path'])
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM customers WHERE id = ?', (customer_id,))
        customer = cursor.fetchone()
        
        if not customer:
            conn.close()
            return jsonify({'success': False, 'message': '客户不存在'})
        
        # 获取客户的沟通记录
        cursor.execute("""
            SELECT content, created_at FROM communications 
            WHERE customer_id = ? 
            ORDER BY created_at DESC LIMIT 5
        """, (customer_id,))
        records = cursor.fetchall()
        conn.close()
        
        # 构建销售方法提示
        sales_method_prompts = {
            'straight_line': '使用直线销售法：直接、高效、目标导向的销售方式',
            'spin': '使用SPIN销售法：通过情况(Situation)、问题(Problem)、影响(Implication)、需求回报(Need-payoff)问题来引导',
            'challenger': '使用挑战者销售法：教育客户、定制解决方案、控制销售过程',
            'consultative': '使用顾问式销售法：深入了解客户需求，提供专业建议',
            'solution': '使用解决方案销售法：专注于解决客户的具体业务问题',
            'value': '使用价值销售法：强调产品/服务为客户带来的价值和ROI'
        }
        
        # 构建提示词
        communication_history = "\n".join([f"- {record[0][:100]}..." for record in records]) if records else "暂无沟通记录"
        sales_prompt = sales_method_prompts.get(sales_method, '') if sales_method else ''
        
        # 准备客户数据
        customer_data = {
            'name': customer[1],
            'company': customer[2],
            'position': customer[3],
            'industry': customer[4],
            'phone': customer[5],
            'email': customer[7],
            'priority': customer[9] if len(customer) > 9 else 2
        }
        
        # 调用AI服务生成话术
        try:
            logger.info(f"开始生成话术 - 客户: {customer_data['name']}, 方法: {sales_method}, 情况: {situation}")
            
            result = ai_service.generate_sales_script(
                customer_data, 
                script_type=situation, 
                methodology=sales_method or 'straightLine',
                model_name=ai_model,
                advanced_settings=advanced_settings
            )
            
            logger.info(f"AI服务返回结果: {result}")
            
            if result.get('success'):
                ai_response = result.get('message', '')
                logger.info(f"AI原始响应: {ai_response[:300]}...")
                
                # 尝试解析JSON格式的响应
                try:
                    # 清理响应文本，移除可能的markdown标记
                    cleaned_response = ai_response.strip()
                    if cleaned_response.startswith('```json'):
                        cleaned_response = cleaned_response[7:]
                    if cleaned_response.endswith('```'):
                        cleaned_response = cleaned_response[:-3]
                    cleaned_response = cleaned_response.strip()
                    
                    parsed_response = json.loads(cleaned_response)
                    logger.info(f"成功解析JSON: {parsed_response}")
                    
                    # 动态处理字段，不再强制要求固定字段名
                    # 直接返回AI生成的所有字段，让前端灵活处理
                    if parsed_response and isinstance(parsed_response, dict):
                        # 确保至少有一些内容
                        if len(parsed_response) == 0:
                            logger.warning("AI返回空的JSON对象，使用默认内容")
                            default_content = get_methodology_fallback_content(sales_method, customer_data)
                            return jsonify({
                                'success': True,
                                **default_content
                            })
                        
                        # 验证字段内容长度（针对动态字段）
                        for field_name, content in parsed_response.items():
                            if not content or len(str(content).strip()) < 10:
                                logger.warning(f"字段 {field_name} 内容不足: {len(str(content).strip())}字符")
                        
                        return jsonify({
                            'success': True,
                            **parsed_response  # 直接返回所有动态生成的字段
                        })
                    else:
                        logger.warning("解析的JSON不是有效的字典格式")
                        default_content = get_methodology_fallback_content(sales_method, customer_data)
                        return jsonify({
                            'success': True,
                            **default_content
                        })
                    
                except json.JSONDecodeError as e:
                    logger.warning(f"JSON解析失败: {e}, 使用文本分割方式")
                    
                    # 如果AI没有返回JSON，尝试智能分割文本
                    response_text = ai_response.strip()
                    
                    # 尝试多种分割方式
                    sections = []
                    if '\n\n' in response_text:
                        sections = [s.strip() for s in response_text.split('\n\n') if s.strip()]
                    elif '\n' in response_text:
                        sections = [s.strip() for s in response_text.split('\n') if s.strip() and len(s.strip()) > 20]
                    else:
                        # 如果没有明显分割，按句号分割
                        sections = [s.strip() + '。' for s in response_text.split('。') if s.strip() and len(s.strip()) > 20]
                    
                    # 构造完整的5个部分
                    default_sections = get_methodology_fallback_content(sales_method, customer_data)
                    
                    # 用分割的内容替换默认内容
                    field_names = ['opening', 'pain_point', 'solution', 'social_proof', 'next_step']
                    for i, field in enumerate(field_names):
                        if i < len(sections) and len(sections[i]) > 10:
                            default_sections[field] = sections[i]
                    
                    # 如果只有一段内容，将其作为解决方案
                    if len(sections) == 1 and len(sections[0]) > 50:
                        default_sections['solution'] = sections[0]
                    
                    return jsonify({
                        'success': True,
                        'opening': default_sections['opening'],
                        'pain_point': default_sections['pain_point'],
                        'solution': default_sections['solution'],
                        'social_proof': default_sections['social_proof'],
                        'next_step': default_sections['next_step']
                    })
            else:
                error_msg = result.get('error', '生成失败')
                logger.error(f"AI服务返回错误: {error_msg}")
                return jsonify({'success': False, 'message': error_msg})
                
        except Exception as e:
            logger.error(f"话术生成过程中发生异常: {str(e)}")
            return jsonify({'success': False, 'message': f'生成话术时发生错误: {str(e)}'})
            
    except Exception as e:
        logger.error(f"生成销售话术失败: {str(e)}")
        return jsonify({'success': False, 'message': '生成销售话术失败'})

@app.route('/api/folders')
def get_folders():
    db_path = api_config.database['sqlite_path']
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 创建folders表如果不存在
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS folders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 获取所有分组
    cursor.execute('SELECT id, name FROM folders ORDER BY name')
    folders = [{'id': row[0], 'name': row[1]} for row in cursor.fetchall()]
    
    # 如果没有分组，从customers表中获取现有的分组并插入到folders表
    if not folders:
        cursor.execute('SELECT DISTINCT folder FROM customers WHERE folder IS NOT NULL AND folder != ""')
        existing_folders = [row[0] for row in cursor.fetchall()]
        
        for folder_name in existing_folders:
            cursor.execute('INSERT OR IGNORE INTO folders (name) VALUES (?)', (folder_name,))
        
        conn.commit()
        
        # 重新获取分组列表
        cursor.execute('SELECT id, name FROM folders ORDER BY name')
        folders = [{'id': row[0], 'name': row[1]} for row in cursor.fetchall()]
    
    conn.close()
    return jsonify(folders)

@app.route('/api/folders', methods=['POST'])
def create_folder():
    data = request.get_json()
    folder_name = data.get('name', '').strip()
    
    if not folder_name:
        return jsonify({'error': '分组名称不能为空'}), 400
    
    db_path = api_config.database['sqlite_path']
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 创建folders表如果不存在
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS folders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    try:
        cursor.execute('INSERT INTO folders (name) VALUES (?)', (folder_name,))
        folder_id = cursor.lastrowid
        conn.commit()
        
        conn.close()
        return jsonify({
            'success': True,
            'id': folder_id,
            'name': folder_name,
            'message': '分组创建成功'
        })
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': '分组名称已存在'}), 400
    except Exception as e:
        conn.close()
        return jsonify({'error': f'创建分组失败: {str(e)}'}), 500

@app.route('/api/folders/<int:folder_id>/dissolve', methods=['POST'])
def dissolve_folder(folder_id):
    """解散分组 - 将组内所有客户移动到默认分组"""
    db_path = api_config.database['sqlite_path']
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # 检查分组是否存在
        cursor.execute('SELECT name FROM folders WHERE id = ?', (folder_id,))
        folder_result = cursor.fetchone()
        if not folder_result:
            conn.close()
            return jsonify({'error': '分组不存在'}), 404
        
        folder_name = folder_result[0]
        
        # 获取默认分组（名为"默认分组"的分组）
        cursor.execute('SELECT id, name FROM folders WHERE name = ?', ('默认分组',))
        default_folder_result = cursor.fetchone()
        if not default_folder_result:
            # 如果没有"默认分组"，创建一个
            cursor.execute('INSERT INTO folders (name, folder_type, color, icon, "order") VALUES (?, ?, ?, ?, ?)', 
                         ('默认分组', 'custom', '#808080', 'folder', 0))
            default_folder_id = cursor.lastrowid
            default_folder_name = '默认分组'
        else:
            default_folder_id, default_folder_name = default_folder_result
        
        # 如果要解散的就是默认分组，不允许操作
        if folder_id == default_folder_id:
            conn.close()
            return jsonify({'error': '不能解散默认分组'}), 400
        
        # 获取该分组中的所有客户数量
        cursor.execute('SELECT COUNT(*) FROM customers WHERE folder = ?', (folder_name,))
        customers_count = cursor.fetchone()[0]
        
        # 将所有客户移动到默认分组
        cursor.execute('UPDATE customers SET folder = ? WHERE folder = ?', (default_folder_name, folder_name))
        
        # 删除空的分组
        cursor.execute('DELETE FROM folders WHERE id = ?', (folder_id,))
        
        conn.commit()
        conn.close()
        
        logger.info(f"解散了分组 '{folder_name}'，将 {customers_count} 个客户移动到默认分组 '{default_folder_name}'")
        
        return jsonify({
            'success': True,
            'message': f"成功解散分组 '{folder_name}'，{customers_count} 个客户已移动到默认分组 '{default_folder_name}'",
            'dissolved_folder': folder_name,
            'moved_customers_count': customers_count,
            'default_folder': default_folder_name
        })
        
    except Exception as e:
        conn.rollback()
        conn.close()
        logger.error(f"解散分组失败: {str(e)}")
        return jsonify({'error': f'解散分组失败: {str(e)}'}), 500

@app.route('/api/customers/<int:customer_id>/analysis', methods=['GET', 'POST'])
def get_customer_analysis(customer_id):
    """获取或重新生成客户AI分析"""
    if request.method == 'GET':
        analysis = generate_ai_analysis(customer_id)
        return jsonify(analysis)
    
    elif request.method == 'POST':
        # 重新生成分析，支持项目背景
        try:
            data = request.get_json() or {}
            include_background = data.get('includeBackground', False)
            background_text = data.get('background', '')
            
            # 如果包含背景信息，将其传递给AI分析函数
            if include_background and background_text:
                analysis = generate_ai_analysis(customer_id, background_text)
            else:
                analysis = generate_ai_analysis(customer_id)
            
            return jsonify(analysis)
            
        except Exception as e:
            logger.error(f"重新生成AI分析错误: {str(e)}")
            return jsonify({'error': '分析失败'}), 500

@app.route('/api/customers/<int:customer_id>/background', methods=['GET', 'POST'])
def handle_customer_background(customer_id):
    """处理客户项目背景信息"""
    conn = sqlite3.connect(api_config.database['sqlite_path'])
    cursor = conn.cursor()
    
    if request.method == 'GET':
        # 获取项目背景
        try:
            cursor.execute('SELECT background FROM customer_backgrounds WHERE customer_id = ?', (customer_id,))
            result = cursor.fetchone()
            conn.close()
            
            if result:
                return jsonify({'background': result[0]})
            else:
                return jsonify({'background': ''})
        except Exception as e:
            conn.close()
            logger.error(f"获取项目背景错误: {str(e)}")
            return jsonify({'error': '获取项目背景失败'}), 500
    
    elif request.method == 'POST':
        # 保存项目背景
        try:
            data = request.get_json()
            background = data.get('background', '')
            
            # 检查是否已存在记录
            cursor.execute('SELECT id FROM customer_backgrounds WHERE customer_id = ?', (customer_id,))
            existing = cursor.fetchone()
            
            if existing:
                # 更新现有记录
                cursor.execute('''
                    UPDATE customer_backgrounds 
                    SET background = ?, updated_at = CURRENT_TIMESTAMP 
                    WHERE customer_id = ?
                ''', (background, customer_id))
            else:
                # 插入新记录
                cursor.execute('''
                    INSERT INTO customer_backgrounds (customer_id, background) 
                    VALUES (?, ?)
                ''', (customer_id, background))
            
            conn.commit()
            conn.close()
            
            return jsonify({
                'success': True,
                'message': '项目背景保存成功'
            })
            
        except Exception as e:
            conn.close()
            logger.error(f"保存项目背景错误: {str(e)}")
            return jsonify({'error': '保存失败'}), 500

@app.route('/api/customers/<int:customer_id>/scripts', methods=['GET', 'POST'])
def customer_scripts(customer_id):
    """获取或生成客户销售话术"""
    if request.method == 'GET':
        # 获取已生成的话术
        scripts = generate_sales_script(customer_id)
        return jsonify(scripts)
    
    elif request.method == 'POST':
        # 生成新的话术
        try:
            data = request.get_json()
            script_type = data.get('script_type', 'opening')
            methodology = data.get('methodology', 'straightLine')
            
            scripts = generate_sales_script(customer_id, script_type, methodology)
            return jsonify({
                'success': True,
                'scripts': scripts
            })
            
        except Exception as e:
            logger.error(f"生成销售话术错误: {str(e)}")
            return jsonify({'error': '生成话术失败'}), 500

@app.route('/api/ai/models')
def get_available_models():
    """获取可用的AI模型列表"""
    try:
        models = ai_service.get_available_models()
        return jsonify({
            'success': True,
            'models': models
        })
    except Exception as e:
        logger.error(f"获取AI模型列表错误: {str(e)}")
        return jsonify({'error': '获取模型列表失败'}), 500

# AI聊天API
@app.route('/api/ai/chat', methods=['POST'])
def ai_chat():
    """AI聊天接口"""
    try:
        data = request.get_json()
        message = data.get('message')
        customer_id = data.get('customer_id')
        ai_model = data.get('ai_model')
        sales_method = data.get('sales_method')
        context = data.get('context', 'general')
        
        if not message:
            return jsonify({'success': False, 'message': '消息不能为空'})
        
        # 获取客户信息
        conn = sqlite3.connect(api_config.database['sqlite_path'])
        cursor = conn.cursor()
        
        customer_info = ""
        project_background = ""
        if customer_id:
            cursor.execute('SELECT * FROM customers WHERE id = ?', (customer_id,))
            customer = cursor.fetchone()
            if customer:
                customer_info = f"""
                当前客户信息：
                - 姓名：{customer[1]}
                - 公司：{customer[2] or '未知'}
                - 职位：{customer[3] or '未知'}
                - 行业：{customer[4] or '未知'}
                """
                
                # 获取项目背景信息
                cursor.execute('SELECT background FROM customer_backgrounds WHERE customer_id = ?', (customer_id,))
                background_result = cursor.fetchone()
                if background_result and background_result[0]:
                    project_background = f"""
                **重要项目背景信息**：
                {background_result[0]}
                
                请特别注意：以上项目背景信息是分析和建议的核心依据，必须在回答中充分体现和运用。
                """
        
        # 获取最近的沟通记录
        communication_history = ""
        if customer_id:
            cursor.execute("""
                SELECT content, created_at FROM communications 
                WHERE customer_id = ? 
                ORDER BY created_at DESC LIMIT 3
            """, (customer_id,))
            records = cursor.fetchall()
            if records:
                communication_history = "\n最近沟通记录：\n" + "\n".join([f"- {record[0][:100]}..." for record in records])
        
        # 构建销售方法指导
        sales_guidance = ""
        if sales_method:
            # 首先尝试从数据库获取自定义prompt
            cursor.execute('SELECT prompt FROM sales_prompts WHERE method = ?', (sales_method,))
            custom_prompt = cursor.fetchone()
            
            if custom_prompt:
                sales_guidance = f"请使用{sales_method}销售法：{custom_prompt[0]}"
            else:
                # 如果没有自定义prompt，使用默认的
                default_sales_methods = {
                    'straight_line': '请使用直线销售法：直接、高效、目标导向的方式回答',
                    'SPIN': '请使用SPIN销售法：通过提问来了解情况、问题、影响和需求',
                    'Challenger': '请使用挑战者销售法：提供新见解，挑战客户现有想法',
                    'Consultative': '请使用顾问式销售法：作为专业顾问提供建议',
                    'Solution': '请使用解决方案销售法：专注于解决具体业务问题',
                    'BANT': '请使用BANT销售法：关注预算、决策权、需求和时间线',
                    'value': '请使用价值销售法：强调价值和投资回报率'
                }
                sales_guidance = default_sales_methods.get(sales_method, '')
        
        conn.close()
        
        # 构建完整的提示词
        full_prompt = f"""
        你是一个专业的销售顾问AI助手。请根据以下信息回答用户的问题：
        
        {customer_info}
        {project_background}
        {communication_history}
        
        销售方法指导：{sales_guidance}
        
        用户问题：{message}
        
        请提供专业、实用的销售建议，回答要简洁明了，重点突出。特别注意要结合项目背景信息来提供针对性的建议。
        """
        
        # 调用AI服务
        if ai_model:
            ai_response = ai_service.chat_with_model(full_prompt, ai_model)
        else:
            ai_response = ai_service.chat(full_prompt)
        
        # 确保返回正确的数据结构
        if ai_response.get('success'):
            return jsonify({
                'success': True,
                'response': ai_response.get('message', ''),
                'message': ai_response.get('message', ''),
                'model': ai_response.get('model', '')
            })
        else:
            return jsonify({
                'success': False,
                'message': ai_response.get('error', 'AI服务暂时不可用')
            })
        
    except Exception as e:
        logger.error(f"AI聊天失败: {str(e)}")
        return jsonify({'success': False, 'message': 'AI服务暂时不可用'})

# 沟通记录API
@app.route('/api/sales-prompts', methods=['GET', 'POST'])
def handle_sales_prompts():
    """处理销售方法prompt的保存和获取"""
    conn = sqlite3.connect(api_config.database['sqlite_path'])
    cursor = conn.cursor()
    
    try:
        if request.method == 'GET':
            # 获取所有销售方法prompt
            cursor.execute('SELECT method, prompt FROM sales_prompts')
            prompts = {}
            for row in cursor.fetchall():
                prompts[row[0]] = row[1]
            conn.close()
            return jsonify({'success': True, 'prompts': prompts})
            
        elif request.method == 'POST':
            # 保存销售方法prompt
            data = request.json
            method = data.get('method')
            prompt = data.get('prompt')
            
            if not method or not prompt:
                conn.close()
                return jsonify({'success': False, 'message': '方法名和prompt内容不能为空'})
            
            # 使用REPLACE INTO来插入或更新
            cursor.execute('REPLACE INTO sales_prompts (method, prompt, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)', 
                         (method, prompt))
            conn.commit()
            conn.close()
            
            return jsonify({'success': True, 'message': 'Prompt保存成功'})
            
    except Exception as e:
        conn.close()
        logger.error(f"处理销售prompt失败: {e}")
        return jsonify({'success': False, 'message': f'操作失败: {str(e)}'})

@app.route('/api/communication-records', methods=['POST'])
def save_communication_record():
    """保存沟通记录"""
    try:
        data = request.get_json()
        customer_id = data.get('customer_id')
        content = data.get('content')
        record_type = data.get('type', 'manual')
        topics = data.get('topics', '')
        created_at = data.get('created_at')
        
        if not customer_id or not content:
            return jsonify({'success': False, 'message': '客户ID和内容不能为空'})
        
        conn = sqlite3.connect(api_config.database['sqlite_path'])
        cursor = conn.cursor()
        
        # 检查communications表是否存在，如果不存在则创建
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS communications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                communication_type TEXT DEFAULT 'manual',
                topics TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers (id)
            )
        """)
        
        # 插入沟通记录
        if created_at:
            cursor.execute("""
                INSERT INTO communications (customer_id, content, communication_type, topics, created_at)
                VALUES (?, ?, ?, ?, ?)
            """, (customer_id, content, record_type, topics, created_at))
        else:
            cursor.execute("""
                INSERT INTO communications (customer_id, content, communication_type, topics)
                VALUES (?, ?, ?, ?)
            """, (customer_id, content, record_type, topics))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': '沟通记录保存成功'})
        
    except Exception as e:
        logger.error(f"保存沟通记录失败: {str(e)}")
        return jsonify({'success': False, 'message': '保存沟通记录失败'})



@app.route('/api/customers/<int:customer_id>/communications', methods=['GET'])
def get_customer_communications(customer_id):
    """获取客户的沟通记录"""
    try:
        conn = sqlite3.connect(api_config.database['sqlite_path'])
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, content, communication_type, topics, created_at
            FROM communications 
            WHERE customer_id = ?
            ORDER BY created_at DESC
        """, (customer_id,))
        
        records = cursor.fetchall()
        conn.close()
        
        communications = []
        for record in records:
            communications.append({
                'id': record[0],
                'content': record[1],
                'type': record[2],
                'topics': record[3],
                'created_at': record[4]
            })
        
        return jsonify(communications)
        
    except Exception as e:
        logger.error(f"获取沟通记录失败: {str(e)}")
        return jsonify([])

# 客户排序API
@app.route('/api/customers/reorder', methods=['POST'])
def reorder_customers():
    """重新排序客户"""
    try:
        data = request.get_json()
        dragged_id = data.get('dragged_id')
        target_id = data.get('target_id')
        order_number = data.get('order_number')
        
        conn = sqlite3.connect(api_config.database['sqlite_path'])
        cursor = conn.cursor()
        
        # 检查是否有sort_order字段，如果没有则添加
        cursor.execute("PRAGMA table_info(customers)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'sort_order' not in columns:
            cursor.execute('ALTER TABLE customers ADD COLUMN sort_order INTEGER DEFAULT 0')
            # 为现有客户设置默认排序
            cursor.execute('UPDATE customers SET sort_order = id WHERE sort_order = 0')
        
        if order_number is not None:
            # 通过数字设置排序
            customer_id = data.get('customer_id')
            if not customer_id:
                return jsonify({'success': False, 'message': '客户ID不能为空'})
            
            # 获取当前客户的排序位置
            cursor.execute('SELECT sort_order FROM customers WHERE id = ?', (customer_id,))
            current_order = cursor.fetchone()
            if current_order:
                current_order = current_order[0]
                
                if current_order < order_number:
                    # 向下移动
                    cursor.execute("""
                        UPDATE customers 
                        SET sort_order = sort_order - 1 
                        WHERE sort_order > ? AND sort_order <= ?
                    """, (current_order, order_number))
                else:
                    # 向上移动
                    cursor.execute("""
                        UPDATE customers 
                        SET sort_order = sort_order + 1 
                        WHERE sort_order >= ? AND sort_order < ?
                    """, (order_number, current_order))
                
                cursor.execute('UPDATE customers SET sort_order = ? WHERE id = ?', (order_number, customer_id))
        
        elif dragged_id and target_id:
            # 拖拽排序
            # 获取目标客户的排序位置
            cursor.execute('SELECT sort_order FROM customers WHERE id = ?', (target_id,))
            target_order = cursor.fetchone()
            
            if target_order:
                target_order = target_order[0]
                
                # 获取被拖拽客户的当前排序位置
                cursor.execute('SELECT sort_order FROM customers WHERE id = ?', (dragged_id,))
                dragged_order = cursor.fetchone()
                if dragged_order:
                    dragged_order = dragged_order[0]
                    
                    # 如果向下移动，调整中间客户的排序
                    if dragged_order < target_order:
                        cursor.execute("""
                            UPDATE customers 
                            SET sort_order = sort_order - 1 
                            WHERE id != ? AND sort_order > ? AND sort_order <= ?
                        """, (dragged_id, dragged_order, target_order))
                    else:
                        # 如果向上移动，调整中间客户的排序
                        cursor.execute("""
                            UPDATE customers 
                            SET sort_order = sort_order + 1 
                            WHERE id != ? AND sort_order >= ? AND sort_order < ?
                        """, (dragged_id, target_order, dragged_order))
                    
                    # 更新被拖拽客户的排序位置
                    cursor.execute('UPDATE customers SET sort_order = ? WHERE id = ?', (target_order, dragged_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': '排序更新成功'})
        
    except Exception as e:
        logger.error(f"客户排序失败: {str(e)}")
        return jsonify({'success': False, 'message': '排序更新失败'})

@app.route('/api/customers/reorder-by-number', methods=['POST'])
def reorder_customers_by_number():
    """根据指定编号重新排序客户"""
    try:
        data = request.get_json()
        customer_id = data.get('customer_id')
        new_order = data.get('new_order')
        
        if not customer_id or not new_order:
            return jsonify({'success': False, 'message': '参数不完整'})
        
        conn = sqlite3.connect(api_config.database['sqlite_path'])
        cursor = conn.cursor()
        
        # 检查是否有sort_order字段，如果没有则添加
        cursor.execute("PRAGMA table_info(customers)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'sort_order' not in columns:
            cursor.execute('ALTER TABLE customers ADD COLUMN sort_order INTEGER DEFAULT 0')
            # 为现有客户设置默认排序
            cursor.execute('UPDATE customers SET sort_order = id WHERE sort_order = 0')
        
        # 获取所有客户的当前排序
        cursor.execute('SELECT id, sort_order FROM customers ORDER BY sort_order, id')
        all_customers = cursor.fetchall()
        
        # 从列表中移除目标客户
        other_customers = [c for c in all_customers if c[0] != customer_id]
        
        # 计算插入位置 (1-based to 0-based)
        insert_pos = min(max(new_order - 1, 0), len(other_customers))
        
        # 插入目标客户
        new_list = other_customers[:insert_pos] + [(customer_id, new_order)] + other_customers[insert_pos:]
        
        # 分配新的sort_order从1开始
        new_sort_orders = []
        for idx, (cust_id, _) in enumerate(new_list, start=1):
            new_sort_orders.append((cust_id, idx))
        
        # 批量更新排序
        for cust_id, sort_order in new_sort_orders:
            cursor.execute('UPDATE customers SET sort_order = ? WHERE id = ?', (sort_order, cust_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': '排序编号更新成功'})
        
    except Exception as e:
        logger.error(f"按编号排序失败: {str(e)}")
        return jsonify({'success': False, 'message': '排序编号更新失败'})

@app.route('/api/settings/prompts', methods=['GET', 'POST'])
def handle_prompts():
    if request.method == 'GET':
        # 返回所有prompt配置
        prompts = {}
        for method in ['SPIN', 'BANT', 'Challenger', 'Solution', 'Consultative']:
            prompts[method] = session.get(f'prompt_{method}', '')
        return jsonify({'success': True, 'prompts': prompts})
    
    elif request.method == 'POST':
        # 保存prompt配置
        data = request.get_json()
        method = data.get('method')
        content = data.get('content')
        
        if method and content is not None:
            session[f'prompt_{method}'] = content
            return jsonify({'success': True, 'message': 'Prompt保存成功'})
        else:
            return jsonify({'success': False, 'error': '参数不完整'}), 400

@app.route('/api/ai-models', methods=['GET', 'POST'])
def handle_ai_models():
    """处理AI模型列表的保存和获取"""
    conn = sqlite3.connect(api_config.database['sqlite_path'])
    cursor = conn.cursor()
    
    try:
        if request.method == 'GET':
            # 获取保存的模型列表
            cursor.execute('SELECT provider, models FROM ai_models')
            models = {}
            for row in cursor.fetchall():
                models[row[0]] = json.loads(row[1])
            conn.close()
            return jsonify({'success': True, 'models': models})
            
        elif request.method == 'POST':
            # 保存模型列表
            data = request.json
            models = data.get('models')
            
            if not models:
                conn.close()
                return jsonify({'success': False, 'message': '模型列表不能为空'})
            
            # 清空现有数据
            cursor.execute('DELETE FROM ai_models')
            
            # 保存新的模型列表
            for provider, model_list in models.items():
                cursor.execute('INSERT INTO ai_models (provider, models, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)', 
                             (provider, json.dumps(model_list)))
            
            conn.commit()
            conn.close()
            
            return jsonify({'success': True, 'message': '模型列表保存成功'})
            
    except Exception as e:
        conn.close()
        logger.error(f"处理AI模型列表失败: {e}")
        return jsonify({'success': False, 'message': f'操作失败: {str(e)}'})

# 沟通记录编辑删除API
@app.route('/api/communication-records/<int:comm_id>', methods=['GET', 'PUT', 'DELETE'])
def manage_communication_record(comm_id):
    """管理单个沟通记录"""
    try:
        conn = sqlite3.connect(api_config.database['sqlite_path'])
        cursor = conn.cursor()
        
        if request.method == 'GET':
            # 获取单个沟通记录
            cursor.execute("""
                SELECT id, customer_id, content, communication_type, topics, created_at
                FROM communications WHERE id = ?
            """, (comm_id,))
            
            record = cursor.fetchone()
            if not record:
                return jsonify({'success': False, 'message': '记录不存在'})
            
            communication = {
                'id': record[0],
                'customer_id': record[1],
                'content': record[2],
                'type': record[3],
                'topics': record[4],
                'created_at': record[5]
            }
            
            conn.close()
            return jsonify(communication)
            
        elif request.method == 'PUT':
            # 更新沟通记录
            data = request.get_json()
            content = data.get('content')
            record_type = data.get('type')
            topics = data.get('topics', '')
            created_at = data.get('created_at')
            
            if not content:
                return jsonify({'success': False, 'message': '内容不能为空'})
            
            cursor.execute("""
                UPDATE communications 
                SET content = ?, communication_type = ?, topics = ?, created_at = ?
                WHERE id = ?
            """, (content, record_type, topics, created_at, comm_id))
            
            if cursor.rowcount == 0:
                return jsonify({'success': False, 'message': '记录不存在'})
            
            conn.commit()
            conn.close()
            return jsonify({'success': True, 'message': '记录更新成功'})
            
        elif request.method == 'DELETE':
            # 删除沟通记录
            cursor.execute("DELETE FROM communications WHERE id = ?", (comm_id,))
            
            if cursor.rowcount == 0:
                return jsonify({'success': False, 'message': '记录不存在'})
            
            conn.commit()
            conn.close()
            return jsonify({'success': True, 'message': '记录删除成功'})
            
    except Exception as e:
        logger.error(f"管理沟通记录失败: {str(e)}")
        return jsonify({'success': False, 'message': '操作失败'})

# 头像上传API
@app.route('/api/upload-avatar', methods=['POST'])
def upload_avatar():
    """上传客户头像"""
    try:
        if 'avatar' not in request.files:
            return jsonify({'success': False, 'message': '没有选择文件'})
        
        file = request.files['avatar']
        customer_id = request.form.get('customer_id')
        
        if not customer_id:
            return jsonify({'success': False, 'message': '客户ID不能为空'})
        
        if file.filename == '':
            return jsonify({'success': False, 'message': '没有选择文件'})
        
        # 检查文件类型
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
        if not ('.' in file.filename and file.filename.rsplit('.', 1)[1].lower() in allowed_extensions):
            return jsonify({'success': False, 'message': '不支持的文件类型'})
        
        # 生成安全的文件名
        filename = secure_filename(f"avatar_{customer_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{file.filename.rsplit('.', 1)[1].lower()}")
        
        # 确保上传目录存在
        upload_dir = os.path.join('static', 'uploads', 'avatars')
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)
        
        # 保存文件
        file_path = os.path.join(upload_dir, filename)
        file.save(file_path)
        
        # 更新数据库中的头像URL
        avatar_url = f"/static/uploads/avatars/{filename}"
        
        conn = sqlite3.connect(api_config.database['sqlite_path'])
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE customers SET photo_url = ? WHERE id = ?
        """, (avatar_url, customer_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True, 
            'message': '头像上传成功',
            'avatar_url': avatar_url
        })
        
    except Exception as e:
        logger.error(f"头像上传失败: {str(e)}")
        return jsonify({'success': False, 'message': '头像上传失败'})

# 项目图片管理API
@app.route('/api/customers/<int:customer_id>/images', methods=['POST'])
def upload_project_image(customer_id):
    """上传项目图片"""
    try:
        if 'image' not in request.files:
            return jsonify({'success': False, 'message': '没有选择文件'}), 400
        
        file = request.files['image']
        
        if file.filename == '':
            return jsonify({'success': False, 'message': '没有选择文件'}), 400
        
        # 检查文件类型
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
        if not ('.' in file.filename and file.filename.rsplit('.', 1)[1].lower() in allowed_extensions):
            return jsonify({'success': False, 'message': '不支持的文件类型'}), 400
        
        # 检查文件大小 (5MB)
        if len(file.read()) > 5 * 1024 * 1024:
            return jsonify({'success': False, 'message': '文件大小超过5MB限制'}), 400
        
        file.seek(0)  # 重置文件指针
        
        # 生成安全的文件名
        filename = secure_filename(f"project_{customer_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{file.filename.rsplit('.', 1)[1].lower()}")
        
        # 确保上传目录存在
        upload_dir = os.path.join('static', 'uploads', 'projects')
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)
        
        # 保存文件
        file_path = os.path.join(upload_dir, filename)
        file.save(file_path)
        
        # 保存到数据库
        conn = sqlite3.connect(api_config.database['sqlite_path'])
        cursor = conn.cursor()
        
        # 创建项目图片表如果不存在
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS project_images (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER NOT NULL,
                filename TEXT NOT NULL,
                file_path TEXT NOT NULL,
                url TEXT NOT NULL,
                upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers (id)
            )
        ''')
        
        image_url = f"/static/uploads/projects/{filename}"
        cursor.execute('''
            INSERT INTO project_images (customer_id, filename, file_path, url)
            VALUES (?, ?, ?, ?)
        ''', (customer_id, file.filename, file_path, image_url))
        
        image_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        logger.info(f"项目图片上传成功: {filename}")
        return jsonify({
            'success': True,
            'image_id': image_id,
            'filename': file.filename,
            'url': image_url,
            'message': '图片上传成功'
        })
        
    except Exception as e:
        logger.error(f"上传项目图片失败: {str(e)}")
        return jsonify({'success': False, 'message': f'上传失败: {str(e)}'}), 500

@app.route('/api/customers/<int:customer_id>/files', methods=['POST'])
def upload_project_file(customer_id):
    """上传项目文件（图片和文档）"""
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'message': '没有选择文件'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'success': False, 'message': '没有选择文件'}), 400
        
        # 检查文件类型
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'pdf', 'doc', 'docx', 'txt'}
        file_extension = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
        
        if not file_extension or file_extension not in allowed_extensions:
            return jsonify({'success': False, 'message': '不支持的文件类型'}), 400
        
        # 检查文件大小 (2MB)
        file_content = file.read()
        if len(file_content) > 2 * 1024 * 1024:
            return jsonify({'success': False, 'message': '文件大小超过2MB限制'}), 400
        
        file.seek(0)  # 重置文件指针
        
        # 确定文件类型
        file_type = 'image' if file_extension in {'png', 'jpg', 'jpeg', 'gif', 'webp'} else 'document'
        
        # 生成安全的文件名
        filename = secure_filename(f"project_{customer_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{file_extension}")
        
        # 确保上传目录存在
        upload_dir = os.path.join('static', 'uploads', 'projects')
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)
        
        # 保存文件
        file_path = os.path.join(upload_dir, filename)
        file.save(file_path)
        
        # 保存到数据库
        conn = sqlite3.connect(api_config.database['sqlite_path'])
        cursor = conn.cursor()
        
        # 创建项目文件表如果不存在
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS project_files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER NOT NULL,
                filename TEXT NOT NULL,
                file_path TEXT NOT NULL,
                url TEXT NOT NULL,
                file_type TEXT NOT NULL,
                file_extension TEXT NOT NULL,
                upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers (id)
            )
        ''')
        
        file_url = f"/static/uploads/projects/{filename}"
        cursor.execute('''
            INSERT INTO project_files (customer_id, filename, file_path, url, file_type, file_extension)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (customer_id, file.filename, file_path, file_url, file_type, file_extension))
        
        file_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        logger.info(f"项目文件上传成功: {filename}")
        return jsonify({
            'success': True,
            'file_id': file_id,
            'filename': file.filename,
            'url': file_url,
            'file_type': file_type,
            'message': '文件上传成功'
        })
        
    except Exception as e:
        logger.error(f"上传项目文件失败: {str(e)}")
        return jsonify({'success': False, 'message': f'上传失败: {str(e)}'}), 500

@app.route('/api/customers/<int:customer_id>/images', methods=['GET'])
def get_project_images(customer_id):
    """获取客户项目图片列表"""
    try:
        conn = sqlite3.connect(api_config.database['sqlite_path'])
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, filename, file_path, url, upload_time
            FROM project_images
            WHERE customer_id = ?
            ORDER BY upload_time DESC
        ''', (customer_id,))
        
        images = []
        for row in cursor.fetchall():
            images.append({
                'id': row[0],
                'filename': row[1],
                'file_path': row[2],
                'url': row[3],
                'upload_time': row[4]
            })
        
        conn.close()
        
        return jsonify({
            'success': True,
            'images': images
        })
        
    except Exception as e:
        logger.error(f"获取项目图片失败: {str(e)}")
        return jsonify({'success': False, 'message': f'获取图片失败: {str(e)}'}), 500

@app.route('/api/customers/<int:customer_id>/files', methods=['GET'])
def get_project_files(customer_id):
    """获取客户项目文件列表"""
    try:
        conn = sqlite3.connect(api_config.database['sqlite_path'])
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, filename, file_path, url, file_type, file_extension, upload_time
            FROM project_files
            WHERE customer_id = ?
            ORDER BY upload_time DESC
        ''', (customer_id,))
        
        files = []
        for row in cursor.fetchall():
            files.append({
                'id': row[0],
                'filename': row[1],
                'file_path': row[2],
                'url': row[3],
                'file_type': row[4],
                'file_extension': row[5],
                'upload_time': row[6]
            })
        
        conn.close()
        
        return jsonify({
            'success': True,
            'files': files
        })
        
    except Exception as e:
        logger.error(f"获取项目文件失败: {str(e)}")
        return jsonify({'success': False, 'message': f'获取文件失败: {str(e)}'}), 500

@app.route('/api/customers/<int:customer_id>/images/<int:image_id>', methods=['DELETE'])
def delete_project_image(customer_id, image_id):
    """删除项目图片"""
    try:
        conn = sqlite3.connect(api_config.database['sqlite_path'])
        cursor = conn.cursor()
        
        # 获取图片信息
        cursor.execute('''
            SELECT file_path FROM project_images
            WHERE id = ? AND customer_id = ?
        ''', (image_id, customer_id))
        
        result = cursor.fetchone()
        if not result:
            conn.close()
            return jsonify({'success': False, 'message': '图片不存在'}), 404
        
        file_path = result[0]
        
        # 删除数据库记录
        cursor.execute('''
            DELETE FROM project_images
            WHERE id = ? AND customer_id = ?
        ''', (image_id, customer_id))
        
        conn.commit()
        conn.close()
        
        # 删除文件
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as file_error:
            logger.warning(f"删除文件失败: {file_error}")
        
        logger.info(f"项目图片删除成功: {image_id}")
        return jsonify({
            'success': True,
            'message': '图片删除成功'
        })
        
    except Exception as e:
        logger.error(f"删除项目图片失败: {str(e)}")
        return jsonify({'success': False, 'message': f'删除失败: {str(e)}'}), 500

@app.route('/api/customers/<int:customer_id>/files/<int:file_id>', methods=['DELETE'])
def delete_project_file(customer_id, file_id):
    """删除项目文件"""
    try:
        conn = sqlite3.connect(api_config.database['sqlite_path'])
        cursor = conn.cursor()
        
        # 获取文件信息
        cursor.execute('''
            SELECT file_path FROM project_files
            WHERE id = ? AND customer_id = ?
        ''', (file_id, customer_id))
        
        result = cursor.fetchone()
        if not result:
            conn.close()
            return jsonify({'success': False, 'message': '文件不存在'}), 404
        
        file_path = result[0]
        
        # 删除数据库记录
        cursor.execute('''
            DELETE FROM project_files
            WHERE id = ? AND customer_id = ?
        ''', (file_id, customer_id))
        
        conn.commit()
        conn.close()
        
        # 删除文件
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as file_error:
            logger.warning(f"删除文件失败: {file_error}")
        
        logger.info(f"项目文件删除成功: {file_id}")
        return jsonify({
            'success': True,
            'message': '文件删除成功'
        })
        
    except Exception as e:
        logger.error(f"删除项目文件失败: {str(e)}")
        return jsonify({'success': False, 'message': f'删除失败: {str(e)}'}), 500

@app.route('/api/customers/<int:customer_id>/files/content', methods=['GET'])
def get_file_content(customer_id):
    """获取文件内容用于预览"""
    try:
        file_path = request.args.get('file_path')
        if not file_path:
            return jsonify({'success': False, 'message': '缺少文件路径参数'}), 400
        
        # 安全检查：确保文件路径在允许的目录内
        if not file_path.startswith('/static/uploads/projects/') and not file_path.startswith('static/uploads/projects/'):
            return jsonify({'success': False, 'message': '无效的文件路径'}), 400
        
        # 转换为绝对路径
        if file_path.startswith('/'):
            abs_file_path = file_path[1:]  # 移除开头的斜杠
        else:
            abs_file_path = file_path
        
        # 检查文件是否存在
        if not os.path.exists(abs_file_path):
            return jsonify({'success': False, 'message': '文件不存在'}), 404
        
        # 验证文件是否属于指定客户
        conn = sqlite3.connect(api_config.database['sqlite_path'])
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, filename, file_extension FROM project_files
            WHERE customer_id = ? AND (file_path = ? OR url = ?)
        ''', (customer_id, abs_file_path, file_path))
        
        file_record = cursor.fetchone()
        conn.close()
        
        if not file_record:
            return jsonify({'success': False, 'message': '文件不属于指定客户'}), 403
        
        file_id, filename, file_extension = file_record
        
        # 使用文件内容提取器获取内容
        try:
            content = file_extractor.extract_content(abs_file_path)
            
            if content:
                return jsonify({
                    'success': True,
                    'content': content,
                    'filename': filename,
                    'file_extension': file_extension,
                    'file_id': file_id
                })
            else:
                return jsonify({
                    'success': False,
                    'message': '无法提取文件内容或文件为空',
                    'filename': filename,
                    'file_extension': file_extension
                })
                
        except Exception as extract_error:
            logger.error(f"提取文件内容失败: {str(extract_error)}")
            return jsonify({
                'success': False,
                'message': f'提取文件内容失败: {str(extract_error)}',
                'filename': filename,
                'file_extension': file_extension
            }), 500
        
    except Exception as e:
        logger.error(f"获取文件内容失败: {str(e)}")
        return jsonify({'success': False, 'message': f'获取文件内容失败: {str(e)}'}), 500

# 批量导出API
@app.route('/api/customers/export', methods=['GET'])
def export_customers():
    """导出客户数据"""
    try:
        import pandas as pd
        from io import BytesIO, StringIO
        
        # 获取请求参数
        export_format = request.args.get('format', 'csv')
        scope = request.args.get('scope', 'all')
        include_contacts = request.args.get('include_contacts', 'true').lower() == 'true'
        include_communications = request.args.get('include_communications', 'true').lower() == 'true'
        include_analysis = request.args.get('include_analysis', 'true').lower() == 'true'
        
        conn = sqlite3.connect(api_config.database['sqlite_path'])
        
        # 构建基础查询
        base_fields = ['c.id', 'c.name', 'c.industry', 'c.position', 'c.age_group', 'c.priority', 'c.folder', 'c.created_at', 'c.updated_at']
        
        # 根据选项添加字段
        if include_contacts:
            base_fields.extend(['c.phone', 'c.wechat', 'c.email'])
        
        query = f"""
            SELECT {', '.join(base_fields)}
            FROM customers c
            ORDER BY c.created_at DESC
        """
        
        df = pd.read_sql_query(query, conn)
        
        # 如果需要包含沟通记录
        if include_communications:
            comm_query = """
                SELECT customer_id, COUNT(*) as communication_count,
                       MAX(created_at) as last_communication
                FROM communications
                GROUP BY customer_id
            """
            comm_df = pd.read_sql_query(comm_query, conn)
            df = df.merge(comm_df, left_on='id', right_on='customer_id', how='left')
            df['communication_count'] = df['communication_count'].fillna(0)
        
        # 如果需要包含AI分析
        if include_analysis:
            analysis_query = """
                SELECT customer_id, COUNT(*) as analysis_count,
                       MAX(created_at) as last_analysis
                FROM ai_analysis
                GROUP BY customer_id
            """
            analysis_df = pd.read_sql_query(analysis_query, conn)
            df = df.merge(analysis_df, left_on='id', right_on='customer_id', how='left')
            df['analysis_count'] = df['analysis_count'].fillna(0)
        
        conn.close()
        
        # 根据格式返回数据
        if export_format == 'csv':
            output = StringIO()
            df.to_csv(output, index=False, encoding='utf-8-sig')
            output.seek(0)
            
            from flask import Response
            return Response(
                output.getvalue(),
                mimetype='text/csv',
                headers={
                    'Content-Disposition': f'attachment; filename=customers_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
                }
            )
        
        elif export_format == 'json':
            data = {
                'export_time': datetime.now().isoformat(),
                'total_records': len(df),
                'customers': df.to_dict('records')
            }
            
            from flask import Response
            return Response(
                json.dumps(data, ensure_ascii=False, indent=2),
                mimetype='application/json',
                headers={
                    'Content-Disposition': f'attachment; filename=customers_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
                }
            )
        
        else:  # Excel格式
            output = BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df.to_excel(writer, sheet_name='客户数据', index=False)
            
            output.seek(0)
            
            from flask import Response
            return Response(
                output.getvalue(),
                mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                headers={
                    'Content-Disposition': f'attachment; filename=customers_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
                }
            )
        
    except ImportError:
        return jsonify({'success': False, 'message': '缺少pandas或openpyxl库，请安装后重试'})
    except Exception as e:
        logger.error(f"导出客户数据失败: {str(e)}")
        return jsonify({'success': False, 'message': '导出失败'})

# 批量导入预览API
@app.route('/api/customers/import/preview', methods=['POST'])
def preview_import_customers():
    """预览导入的客户数据"""
    try:
        import pandas as pd
        
        if 'file' not in request.files:
            return jsonify({'success': False, 'message': '没有选择文件'})
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'success': False, 'message': '没有选择文件'})
        
        # 检查文件类型
        file_ext = file.filename.rsplit('.', 1)[1].lower()
        
        try:
            if file_ext in ['xlsx', 'xls']:
                df = pd.read_excel(file)
            elif file_ext == 'csv':
                df = pd.read_csv(file, encoding='utf-8')
            else:
                return jsonify({'success': False, 'message': '不支持的文件格式'})
        except Exception as e:
            return jsonify({'success': False, 'message': f'文件解析失败: {str(e)}'})
        
        # 限制预览行数
        preview_data = df.head(100).fillna('').to_dict('records')
        
        return jsonify({
            'success': True,
            'data': preview_data,
            'total_rows': len(df)
        })
        
    except ImportError:
        return jsonify({'success': False, 'message': '缺少pandas库，请安装后重试'})
    except Exception as e:
        logger.error(f"预览导入数据失败: {str(e)}")
        return jsonify({'success': False, 'message': '预览失败'})

# 批量导入API
@app.route('/api/customers/import', methods=['POST'])
def import_customers():
    """批量导入客户数据"""
    try:
        data = request.get_json()
        import_data = data.get('data', [])
        
        if not import_data:
            return jsonify({'success': False, 'message': '没有可导入的数据'})
        
        conn = sqlite3.connect(api_config.database['sqlite_path'])
        cursor = conn.cursor()
        
        imported_count = 0
        
        for row in import_data:
            try:
                # 映射字段（支持中英文字段名）
                name = row.get('name') or row.get('姓名') or row.get('客户姓名')
                industry = row.get('industry') or row.get('行业') or row.get('所属行业')
                position = row.get('position') or row.get('职位') or row.get('职务')
                phone = row.get('phone') or row.get('电话') or row.get('手机号')
                wechat = row.get('wechat') or row.get('微信') or row.get('微信号')
                email = row.get('email') or row.get('邮箱') or row.get('电子邮箱')
                
                if not name:
                    continue  # 跳过没有姓名的记录
                
                # 检查是否已存在（根据姓名和电话）
                cursor.execute("""
                    SELECT id FROM customers 
                    WHERE name = ? AND (phone = ? OR phone IS NULL)
                """, (name, phone))
                
                if cursor.fetchone():
                    continue  # 跳过重复记录
                
                # 插入新客户
                cursor.execute("""
                    INSERT INTO customers (name, industry, position, phone, wechat, email)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (name, industry, position, phone, wechat, email))
                
                imported_count += 1
                
            except Exception as e:
                logger.warning(f"导入单条记录失败: {str(e)}")
                continue
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'成功导入 {imported_count} 条客户记录',
            'imported': imported_count
        })
        
    except Exception as e:
        logger.error(f"批量导入客户失败: {str(e)}")
        return jsonify({'success': False, 'message': '导入失败'})

@app.route('/api/test-ai-connection', methods=['POST'])
def test_ai_connection():
    """测试AI API连接"""
    try:
        data = request.get_json()
        provider = data.get('provider')
        model = data.get('model')
        api_key = data.get('api_key')
        base_url = data.get('base_url')
        
        if not all([provider, model, api_key]):
            return jsonify({'success': False, 'error': '缺少必要参数'})
        
        # 调用AI服务测试连接
        result = ai_service.test_connection(provider, model, api_key, base_url)
        
        if result.get('success'):
            return jsonify({'success': True, 'message': 'API连接成功'})
        else:
            return jsonify({'success': False, 'error': result.get('error', '连接失败')})
            
    except Exception as e:
        logger.error(f"测试AI连接失败: {str(e)}")
        return jsonify({'success': False, 'error': '连接测试失败'})

@app.route('/api/update-models', methods=['POST'])
def update_models():
    """更新AI模型列表"""
    try:
        data = request.get_json()
        provider = data.get('provider')
        api_key = data.get('api_key')
        base_url = data.get('base_url')
        
        if not all([provider, api_key]):
            return jsonify({'success': False, 'error': '缺少必要参数'})
        
        # 调用AI服务获取模型列表
        result = ai_service.get_models_list(provider, api_key, base_url)
        
        if result.get('success'):
            return jsonify({
                'success': True, 
                'models': result.get('models', []),
                'message': f'成功获取{len(result.get("models", []))}个模型'
            })
        else:
            return jsonify({'success': False, 'error': result.get('error', '获取模型列表失败')})
            
    except Exception as e:
        logger.error(f"更新模型列表失败: {str(e)}")
        return jsonify({'success': False, 'error': '更新失败'})

@app.route('/api/settings/ai', methods=['GET', 'POST'])
def handle_ai_settings():
    if request.method == 'GET':
        # 返回AI设置
        settings = {
            'default_model': session.get('default_ai_model', 'xai:grok-3-mini'),
            'temperature': session.get('temperature', 0.7),
            'api_keys': session.get('api_keys', {})
        }
        return jsonify({'success': True, 'settings': settings})
    
    elif request.method == 'POST':
        # 保存AI设置
        data = request.get_json()
        
        if 'default_model' in data:
            session['default_ai_model'] = data['default_model']
        if 'temperature' in data:
            session['temperature'] = float(data['temperature'])
        if 'api_keys' in data:
            session['api_keys'] = data['api_keys']
            
        return jsonify({'success': True, 'message': 'AI设置保存成功'})

@app.route('/api/update-model-mapping', methods=['POST'])
def update_model_mapping():
    """更新AI模型映射表"""
    try:
        data = request.get_json()
        provider = data.get('provider')
        models = data.get('models', [])
        
        if not provider or not models:
            return jsonify({'success': False, 'error': '缺少必要参数'})
        
        # 调用AI服务更新模型映射
        result = ai_service.update_model_mapping(provider, models)
        
        if result.get('success'):
            return jsonify({
                'success': True, 
                'message': f'成功更新{provider}的模型映射',
                'updated_mappings': result.get('updated_mappings', [])
            })
        else:
            return jsonify({'success': False, 'error': result.get('error', '更新模型映射失败')})
            
    except Exception as e:
        logger.error(f"更新模型映射失败: {str(e)}")
        return jsonify({'success': False, 'error': '更新失败'})

# 任务管理API
@app.route('/api/tasks', methods=['GET', 'POST'])
def handle_tasks():
    """处理任务列表的获取和创建"""
    if request.method == 'GET':
        try:
            conn = sqlite3.connect(api_config.database['sqlite_path'])
            cursor = conn.cursor()
            
            # 检查tasks表是否存在，如果不存在则创建
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS tasks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    customer_id INTEGER NOT NULL,
                    title TEXT NOT NULL,
                    description TEXT,
                    task_type TEXT NOT NULL,
                    status TEXT DEFAULT 'pending',
                    priority INTEGER DEFAULT 2,
                    due_date TEXT,
                    reminder_time TEXT,
                    completed_at TEXT,
                    ai_generated BOOLEAN DEFAULT 0,
                    ai_reasoning TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (customer_id) REFERENCES customers (id)
                )
            """)
            
            customer_id = request.args.get('customer_id')
            status = request.args.get('status')
            
            query = 'SELECT * FROM tasks WHERE 1=1'
            params = []
            
            if customer_id:
                query += ' AND customer_id = ?'
                params.append(int(customer_id))
            
            if status:
                query += ' AND status = ?'
                params.append(status)
            
            query += ' ORDER BY due_date ASC'
            
            cursor.execute(query, params)
            tasks = cursor.fetchall()
            
            # 获取列名
            column_names = [description[0] for description in cursor.description]
            
            # 转换为字典格式
            task_list = []
            for task in tasks:
                task_dict = dict(zip(column_names, task))
                task_list.append(task_dict)
            
            conn.close()
            return jsonify(task_list)
            
        except Exception as e:
            logger.error(f"获取任务列表失败: {str(e)}")
            return jsonify({'error': '获取任务列表失败'}), 500
    
    elif request.method == 'POST':
        try:
            data = request.get_json()
            
            # 验证必需字段
            required_fields = ['customer_id', 'title', 'task_type']
            for field in required_fields:
                if field not in data:
                    return jsonify({'error': f'缺少必需字段: {field}'}), 400
            
            conn = sqlite3.connect(api_config.database['sqlite_path'])
            cursor = conn.cursor()
            
            # 检查tasks表是否存在，如果不存在则创建
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS tasks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    customer_id INTEGER NOT NULL,
                    title TEXT NOT NULL,
                    description TEXT,
                    task_type TEXT NOT NULL,
                    status TEXT DEFAULT 'pending',
                    priority INTEGER DEFAULT 2,
                    due_date TEXT,
                    reminder_time TEXT,
                    completed_at TEXT,
                    ai_generated BOOLEAN DEFAULT 0,
                    ai_reasoning TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (customer_id) REFERENCES customers (id)
                )
            """)
            
            # 插入新任务
            cursor.execute("""
                INSERT INTO tasks (customer_id, title, description, task_type, priority, due_date, reminder_time)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                data['customer_id'],
                data['title'],
                data.get('description', ''),
                data['task_type'],
                data.get('priority', 2),
                data.get('due_date'),
                data.get('reminder_time')
            ))
            
            task_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            logger.info(f"创建任务成功: {data['title']} (ID: {task_id})")
            return jsonify({
                'id': task_id,
                'title': data['title'],
                'message': '任务创建成功'
            })
            
        except Exception as e:
            logger.error(f"创建任务失败: {str(e)}")
            return jsonify({'error': '创建任务失败'}), 500

@app.route('/api/tasks/<int:task_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_task(task_id):
    """处理单个任务的获取、更新和删除"""
    if request.method == 'GET':
        try:
            conn = sqlite3.connect(api_config.database['sqlite_path'])
            cursor = conn.cursor()
            
            cursor.execute('SELECT * FROM tasks WHERE id = ?', (task_id,))
            task = cursor.fetchone()
            
            if not task:
                conn.close()
                return jsonify({'error': '任务不存在'}), 404
            
            # 获取列名
            column_names = [description[0] for description in cursor.description]
            task_dict = dict(zip(column_names, task))
            
            conn.close()
            return jsonify(task_dict)
            
        except Exception as e:
            logger.error(f"获取任务失败: {str(e)}")
            return jsonify({'error': '获取任务失败'}), 500
    
    elif request.method == 'PUT':
        try:
            data = request.get_json()
            
            conn = sqlite3.connect(api_config.database['sqlite_path'])
            cursor = conn.cursor()
            
            # 检查任务是否存在
            cursor.execute('SELECT title FROM tasks WHERE id = ?', (task_id,))
            task = cursor.fetchone()
            
            if not task:
                conn.close()
                return jsonify({'error': '任务不存在'}), 404
            
            # 构建更新查询
            update_fields = []
            params = []
            
            for field in ['title', 'description', 'task_type', 'status', 'priority', 'due_date', 'reminder_time']:
                if field in data:
                    update_fields.append(f'{field} = ?')
                    params.append(data[field])
            
            if update_fields:
                update_fields.append('updated_at = CURRENT_TIMESTAMP')
                params.append(task_id)
                
                query = f'UPDATE tasks SET {', '.join(update_fields)} WHERE id = ?'
                cursor.execute(query, params)
                
                conn.commit()
            
            conn.close()
            
            logger.info(f"更新任务成功: ID {task_id}")
            return jsonify({
                'id': task_id,
                'message': '任务更新成功'
            })
            
        except Exception as e:
            logger.error(f"更新任务失败: {str(e)}")
            return jsonify({'error': '更新任务失败'}), 500
    
    elif request.method == 'DELETE':
        try:
            conn = sqlite3.connect(api_config.database['sqlite_path'])
            cursor = conn.cursor()
            
            # 检查任务是否存在
            cursor.execute('SELECT title FROM tasks WHERE id = ?', (task_id,))
            task = cursor.fetchone()
            
            if not task:
                conn.close()
                return jsonify({'error': '任务不存在'}), 404
            
            task_title = task[0]
            
            # 删除任务
            cursor.execute('DELETE FROM tasks WHERE id = ?', (task_id,))
            
            conn.commit()
            conn.close()
            
            logger.info(f"删除任务成功: {task_title} (ID: {task_id})")
            return jsonify({'message': f'任务 "{task_title}" 删除成功'})
            
        except Exception as e:
            logger.error(f"删除任务失败: {str(e)}")
            return jsonify({'error': '删除任务失败'}), 500

# 获客模板管理API
@app.route('/api/lead-templates', methods=['GET', 'POST'])
def handle_lead_templates():
    """处理获客模板的获取和创建"""
    if request.method == 'GET':
        try:
            conn = sqlite3.connect(api_config.database['sqlite_path'])
            cursor = conn.cursor()
            
            # 检查lead_templates表是否存在，如果不存在则创建
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS lead_templates (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    category TEXT NOT NULL,
                    daily_tasks TEXT,
                    success_metrics TEXT,
                    optimization_rules TEXT,
                    is_active BOOLEAN DEFAULT 1,
                    usage_count INTEGER DEFAULT 0,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            category = request.args.get('category')
            
            query = 'SELECT * FROM lead_templates WHERE is_active = 1'
            params = []
            
            if category:
                query += ' AND category = ?'
                params.append(category)
            
            query += ' ORDER BY usage_count DESC, created_at DESC'
            
            cursor.execute(query, params)
            templates = cursor.fetchall()
            
            # 获取列名
            column_names = [description[0] for description in cursor.description]
            
            # 转换为字典格式
            template_list = []
            for template in templates:
                template_dict = dict(zip(column_names, template))
                # 解析JSON字段
                if template_dict['daily_tasks']:
                    template_dict['daily_tasks'] = json.loads(template_dict['daily_tasks'])
                if template_dict['success_metrics']:
                    template_dict['success_metrics'] = json.loads(template_dict['success_metrics'])
                if template_dict['optimization_rules']:
                    template_dict['optimization_rules'] = json.loads(template_dict['optimization_rules'])
                template_list.append(template_dict)
            
            conn.close()
            return jsonify(template_list)
            
        except Exception as e:
            logger.error(f"获取获客模板失败: {str(e)}")
            return jsonify({'error': '获取获客模板失败'}), 500
    
    elif request.method == 'POST':
        try:
            data = request.get_json()
            
            # 验证必需字段
            required_fields = ['name', 'category', 'daily_tasks']
            for field in required_fields:
                if field not in data:
                    return jsonify({'error': f'缺少必需字段: {field}'}), 400
            
            conn = sqlite3.connect(api_config.database['sqlite_path'])
            cursor = conn.cursor()
            
            # 插入新模板
            cursor.execute("""
                INSERT INTO lead_templates (name, description, category, daily_tasks, success_metrics, optimization_rules)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                data['name'],
                data.get('description', ''),
                data['category'],
                json.dumps(data['daily_tasks']),
                json.dumps(data.get('success_metrics', {})),
                json.dumps(data.get('optimization_rules', {}))
            ))
            
            template_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            logger.info(f"创建获客模板成功: {data['name']} (ID: {template_id})")
            return jsonify({
                'id': template_id,
                'name': data['name'],
                'message': '获客模板创建成功'
            })
            
        except Exception as e:
            logger.error(f"创建获客模板失败: {str(e)}")
            return jsonify({'error': '创建获客模板失败'}), 500

@app.route('/api/lead-templates/<int:template_id>/generate-tasks', methods=['POST'])
def generate_daily_tasks(template_id):
    """根据获客模板生成每日任务"""
    try:
        data = request.get_json()
        target_date = data.get('date', datetime.now().strftime('%Y-%m-%d'))
        
        conn = sqlite3.connect(api_config.database['sqlite_path'])
        cursor = conn.cursor()
        
        # 获取模板信息
        cursor.execute('SELECT * FROM lead_templates WHERE id = ? AND is_active = 1', (template_id,))
        template = cursor.fetchone()
        
        if not template:
            conn.close()
            return jsonify({'error': '获客模板不存在或已禁用'}), 404
        
        # 解析模板数据
        column_names = [description[0] for description in cursor.description]
        template_dict = dict(zip(column_names, template))
        daily_tasks = json.loads(template_dict['daily_tasks'])
        
        # 生成任务
        created_tasks = []
        for task_config in daily_tasks:
            # 检查是否已存在相同日期的任务
            cursor.execute("""
                SELECT id FROM tasks 
                WHERE lead_template_id = ? AND task_type = ? AND DATE(created_at) = ?
            """, (template_id, task_config['task_type'], target_date))
            
            existing_task = cursor.fetchone()
            if existing_task:
                continue  # 跳过已存在的任务
            
            # 创建新任务
            cursor.execute("""
                INSERT INTO tasks (
                    customer_id, title, description, task_type, priority, 
                    lead_template_id, target_count, lead_source, ai_generated
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                data.get('customer_id', 0),  # 获客任务可能不关联特定客户
                task_config['title'],
                task_config['description'],
                task_config['task_type'],
                task_config.get('priority', 2),
                template_id,
                task_config.get('target_count'),
                task_config.get('platforms', [None])[0] if task_config.get('platforms') else None,
                True
            ))
            
            task_id = cursor.lastrowid
            created_tasks.append({
                'id': task_id,
                'title': task_config['title'],
                'task_type': task_config['task_type']
            })
        
        # 更新模板使用次数
        cursor.execute('UPDATE lead_templates SET usage_count = usage_count + 1 WHERE id = ?', (template_id,))
        
        conn.commit()
        conn.close()
        
        logger.info(f"生成每日任务成功: 模板ID {template_id}, 创建 {len(created_tasks)} 个任务")
        return jsonify({
            'message': f'成功生成 {len(created_tasks)} 个每日任务',
            'tasks': created_tasks
        })
        
    except Exception as e:
        logger.error(f"生成每日任务失败: {str(e)}")
        return jsonify({'error': '生成每日任务失败'}), 500

# 获客统计API
@app.route('/api/lead-statistics', methods=['GET', 'POST'])
def handle_lead_statistics():
    """处理获客统计的获取和记录"""
    if request.method == 'GET':
        try:
            conn = sqlite3.connect(api_config.database['sqlite_path'])
            cursor = conn.cursor()
            
            # 检查lead_statistics表是否存在，如果不存在则创建
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS lead_statistics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    template_id INTEGER,
                    date TEXT NOT NULL,
                    tasks_completed INTEGER DEFAULT 0,
                    tasks_total INTEGER DEFAULT 0,
                    contacts_made INTEGER DEFAULT 0,
                    wechat_added INTEGER DEFAULT 0,
                    content_posted INTEGER DEFAULT 0,
                    replies_made INTEGER DEFAULT 0,
                    events_attended INTEGER DEFAULT 0,
                    conversion_rate REAL DEFAULT 0.0,
                    engagement_rate REAL DEFAULT 0.0,
                    quality_score REAL DEFAULT 0.0,
                    user_feedback TEXT,
                    ai_suggestions TEXT,
                    optimization_applied TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (template_id) REFERENCES lead_templates (id)
                )
            """)
            
            template_id = request.args.get('template_id')
            start_date = request.args.get('start_date')
            end_date = request.args.get('end_date')
            
            query = 'SELECT * FROM lead_statistics WHERE 1=1'
            params = []
            
            if template_id:
                query += ' AND template_id = ?'
                params.append(int(template_id))
            
            if start_date:
                query += ' AND date >= ?'
                params.append(start_date)
            
            if end_date:
                query += ' AND date <= ?'
                params.append(end_date)
            
            query += ' ORDER BY date DESC'
            
            cursor.execute(query, params)
            statistics = cursor.fetchall()
            
            # 获取列名
            column_names = [description[0] for description in cursor.description]
            
            # 转换为字典格式
            stats_list = []
            for stat in statistics:
                stat_dict = dict(zip(column_names, stat))
                # 解析JSON字段
                if stat_dict['ai_suggestions']:
                    stat_dict['ai_suggestions'] = json.loads(stat_dict['ai_suggestions'])
                if stat_dict['optimization_applied']:
                    stat_dict['optimization_applied'] = json.loads(stat_dict['optimization_applied'])
                stats_list.append(stat_dict)
            
            conn.close()
            return jsonify(stats_list)
            
        except Exception as e:
            logger.error(f"获取获客统计失败: {str(e)}")
            return jsonify({'error': '获取获客统计失败'}), 500
    
    elif request.method == 'POST':
        try:
            data = request.get_json()
            
            # 验证必需字段
            required_fields = ['date']
            for field in required_fields:
                if field not in data:
                    return jsonify({'error': f'缺少必需字段: {field}'}), 400
            
            conn = sqlite3.connect(api_config.database['sqlite_path'])
            cursor = conn.cursor()
            
            # 检查是否已存在相同日期的统计记录
            cursor.execute("""
                SELECT id FROM lead_statistics 
                WHERE template_id = ? AND date = ?
            """, (data.get('template_id'), data['date']))
            
            existing_stat = cursor.fetchone()
            
            if existing_stat:
                # 更新现有记录
                update_fields = []
                params = []
                
                for field in ['tasks_completed', 'tasks_total', 'contacts_made', 'wechat_added', 
                             'content_posted', 'replies_made', 'events_attended', 'conversion_rate',
                             'engagement_rate', 'quality_score', 'user_feedback']:
                    if field in data:
                        update_fields.append(f'{field} = ?')
                        params.append(data[field])
                
                if update_fields:
                    update_fields.append('updated_at = CURRENT_TIMESTAMP')
                    params.append(existing_stat[0])
                    
                    query = f'UPDATE lead_statistics SET {', '.join(update_fields)} WHERE id = ?'
                    cursor.execute(query, params)
                    
                    stat_id = existing_stat[0]
                    message = '获客统计更新成功'
            else:
                # 插入新记录
                cursor.execute("""
                    INSERT INTO lead_statistics (
                        template_id, date, tasks_completed, tasks_total, contacts_made, 
                        wechat_added, content_posted, replies_made, events_attended,
                        conversion_rate, engagement_rate, quality_score, user_feedback
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    data.get('template_id'),
                    data['date'],
                    data.get('tasks_completed', 0),
                    data.get('tasks_total', 0),
                    data.get('contacts_made', 0),
                    data.get('wechat_added', 0),
                    data.get('content_posted', 0),
                    data.get('replies_made', 0),
                    data.get('events_attended', 0),
                    data.get('conversion_rate', 0.0),
                    data.get('engagement_rate', 0.0),
                    data.get('quality_score', 0.0),
                    data.get('user_feedback', '')
                ))
                
                stat_id = cursor.lastrowid
                message = '获客统计记录成功'
            
            conn.commit()
            conn.close()
            
            logger.info(f"{message}: 日期 {data['date']} (ID: {stat_id})")
            return jsonify({
                'id': stat_id,
                'date': data['date'],
                'message': message
            })
            
        except Exception as e:
            logger.error(f"记录获客统计失败: {str(e)}")
            return jsonify({'error': '记录获客统计失败'}), 500

@app.route('/api/lead-statistics/analysis', methods=['GET'])
def get_lead_analysis():
    """获取获客数据分析和AI优化建议"""
    try:
        template_id = request.args.get('template_id')
        days = int(request.args.get('days', 30))  # 默认分析最近30天
        
        conn = sqlite3.connect(api_config.database['sqlite_path'])
        cursor = conn.cursor()
        
        # 获取统计数据
        query = """
            SELECT * FROM lead_statistics 
            WHERE date >= date('now', '-{} days')
        """.format(days)
        
        params = []
        if template_id:
            query += ' AND template_id = ?'
            params.append(int(template_id))
        
        query += ' ORDER BY date DESC'
        
        cursor.execute(query, params)
        statistics = cursor.fetchall()
        
        if not statistics:
            conn.close()
            return jsonify({
                'analysis': '暂无足够数据进行分析',
                'suggestions': ['请先记录一些获客活动数据']
            })
        
        # 计算分析指标
        total_contacts = sum(stat[5] for stat in statistics)  # contacts_made
        total_wechat = sum(stat[6] for stat in statistics)    # wechat_added
        avg_conversion = sum(stat[10] for stat in statistics) / len(statistics)  # conversion_rate
        avg_engagement = sum(stat[11] for stat in statistics) / len(statistics)  # engagement_rate
        avg_quality = sum(stat[12] for stat in statistics) / len(statistics)     # quality_score
        
        # 生成AI建议
        suggestions = []
        
        if avg_conversion < 0.03:
            suggestions.append("转化率偏低，建议优化接触话术和个人资料展示")
        
        if avg_engagement < 0.05:
            suggestions.append("互动率需要提升，建议增加有价值的内容分享")
        
        if total_wechat / max(total_contacts, 1) < 0.6:
            suggestions.append("微信添加成功率较低，建议改进初次接触策略")
        
        if avg_quality < 60:
            suggestions.append("客户质量有待提升，建议更精准地筛选目标客户")
        
        # 趋势分析
        recent_stats = statistics[:7]  # 最近7天
        earlier_stats = statistics[7:14] if len(statistics) > 7 else []  # 前7天
        
        trend_analysis = "数据稳定"
        if recent_stats and earlier_stats:
            recent_avg_conversion = sum(stat[10] for stat in recent_stats) / len(recent_stats)
            earlier_avg_conversion = sum(stat[10] for stat in earlier_stats) / len(earlier_stats)
            
            if recent_avg_conversion > earlier_avg_conversion * 1.1:
                trend_analysis = "转化率呈上升趋势，继续保持当前策略"
            elif recent_avg_conversion < earlier_avg_conversion * 0.9:
                trend_analysis = "转化率有所下降，需要调整获客策略"
        
        conn.close()
        
        return jsonify({
            'period': f'最近{days}天',
            'summary': {
                'total_contacts': total_contacts,
                'total_wechat_added': total_wechat,
                'avg_conversion_rate': round(avg_conversion, 4),
                'avg_engagement_rate': round(avg_engagement, 4),
                'avg_quality_score': round(avg_quality, 2)
            },
            'trend_analysis': trend_analysis,
            'suggestions': suggestions if suggestions else ['当前表现良好，继续保持！']
        })
        
    except Exception as e:
        logger.error(f"获取获客分析失败: {str(e)}")
        return jsonify({'error': '获取获客分析失败'}), 500

# 客户任务管理API
@app.route('/api/customer-tasks', methods=['GET', 'POST'])
def handle_customer_tasks():
    """处理客户任务的获取和创建"""
    if request.method == 'GET':
        try:
            conn = sqlite3.connect(api_config.database['sqlite_path'])
            cursor = conn.cursor()
            
            # 添加is_completed字段（如果不存在）
            try:
                cursor.execute('ALTER TABLE customer_tasks ADD COLUMN is_completed BOOLEAN DEFAULT 0')
                conn.commit()
            except sqlite3.OperationalError:
                # 字段已存在，忽略错误
                pass
            
            cursor.execute('''
                SELECT id, task_name, description, target_count, category, priority, is_active, is_completed, created_at
                FROM customer_tasks 
                WHERE is_active = 1
                ORDER BY priority DESC, created_at DESC
            ''')
            
            tasks = []
            for row in cursor.fetchall():
                task = {
                    'id': row[0],
                    'task_name': row[1],
                    'description': row[2],
                    'target_count': row[3],
                    'category': row[4],
                    'priority': row[5],
                    'is_active': row[6],
                    'is_completed': row[7],
                    'created_at': row[8]
                }
                
                # 获取最近的执行记录
                cursor.execute('''
                    SELECT completed_count, notes, completion_date
                    FROM task_records 
                    WHERE task_id = ? 
                    ORDER BY completion_date DESC 
                    LIMIT 1
                ''', (task['id'],))
                
                recent_record = cursor.fetchone()
                if recent_record:
                    task['last_completed_count'] = recent_record[0]
                    task['last_notes'] = recent_record[1]
                    task['last_completion_date'] = recent_record[2]
                else:
                    task['last_completed_count'] = 0
                    task['last_notes'] = ''
                    task['last_completion_date'] = None
                
                tasks.append(task)
            
            conn.close()
            return jsonify({'tasks': tasks})
            
        except Exception as e:
            logger.error(f"获取客户任务失败: {str(e)}")
            return jsonify({'error': '获取客户任务失败'}), 500
    
    elif request.method == 'POST':
        try:
            data = request.get_json()
            task_name = data.get('task_name')
            description = data.get('description', '')
            target_count = data.get('target_count', 0)
            category = data.get('category', '获客任务')
            priority = data.get('priority', 2)
            
            if not task_name:
                return jsonify({'error': '任务名称不能为空'}), 400
            
            conn = sqlite3.connect(api_config.database['sqlite_path'])
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO customer_tasks (task_name, description, target_count, category, priority)
                VALUES (?, ?, ?, ?, ?)
            ''', (task_name, description, target_count, category, priority))
            
            task_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            return jsonify({
                'message': '任务创建成功',
                'task_id': task_id
            })
            
        except Exception as e:
            logger.error(f"创建客户任务失败: {str(e)}")
            return jsonify({'error': '创建客户任务失败'}), 500

@app.route('/api/customer-tasks/<int:task_id>', methods=['PUT'])
def update_customer_task(task_id):
    """更新客户任务"""
    try:
        data = request.get_json()
        
        conn = sqlite3.connect(api_config.database['sqlite_path'])
        cursor = conn.cursor()
        
        # 检查任务是否存在
        cursor.execute('SELECT task_name FROM customer_tasks WHERE id = ?', (task_id,))
        task = cursor.fetchone()
        
        if not task:
            conn.close()
            return jsonify({'error': '任务不存在'}), 404
        
        # 添加is_completed字段（如果不存在）
        try:
            cursor.execute('ALTER TABLE customer_tasks ADD COLUMN is_completed BOOLEAN DEFAULT 0')
            conn.commit()
        except sqlite3.OperationalError:
            # 字段已存在，忽略错误
            pass
        
        # 构建更新查询
        update_fields = []
        params = []
        
        for field in ['task_name', 'description', 'target_count', 'category', 'priority', 'is_active', 'is_completed']:
            if field in data:
                update_fields.append(f'{field} = ?')
                params.append(data[field])
        
        if update_fields:
            update_fields.append('updated_at = CURRENT_TIMESTAMP')
            params.append(task_id)
            
            query = f'UPDATE customer_tasks SET {', '.join(update_fields)} WHERE id = ?'
            cursor.execute(query, params)
            
            conn.commit()
        
        conn.close()
        
        logger.info(f"更新客户任务成功: ID {task_id}")
        return jsonify({
            'id': task_id,
            'message': '任务更新成功'
        })
        
    except Exception as e:
        logger.error(f"更新客户任务失败: {str(e)}")
        return jsonify({'error': '更新客户任务失败'}), 500

@app.route('/api/customer-tasks/<int:task_id>/records', methods=['POST'])
def add_task_record(task_id):
    """添加任务执行记录"""
    try:
        data = request.get_json()
        completed_count = data.get('completed_count', 0)
        notes = data.get('notes', '')
        completion_date = data.get('completion_date', datetime.now().strftime('%Y-%m-%d'))
        
        conn = sqlite3.connect(api_config.database['sqlite_path'])
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO task_records (task_id, completed_count, notes, completion_date)
            VALUES (?, ?, ?, ?)
        ''', (task_id, completed_count, notes, completion_date))
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': '任务记录添加成功'})
        
    except Exception as e:
        logger.error(f"添加任务记录失败: {str(e)}")
        return jsonify({'error': '添加任务记录失败'}), 500

@app.route('/api/customer-tasks/<int:task_id>/suggestions', methods=['GET', 'POST'])
def handle_task_suggestions(task_id):
    """处理任务建议的获取和生成"""
    if request.method == 'GET':
        try:
            conn = sqlite3.connect(api_config.database['sqlite_path'])
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT id, suggestion_text, suggestion_type, is_applied, created_at
                FROM task_suggestions 
                WHERE task_id = ?
                ORDER BY created_at DESC
            ''', (task_id,))
            
            suggestions = []
            for row in cursor.fetchall():
                suggestions.append({
                    'id': row[0],
                    'suggestion_text': row[1],
                    'suggestion_type': row[2],
                    'is_applied': row[3],
                    'created_at': row[4]
                })
            
            conn.close()
            return jsonify({'suggestions': suggestions})
            
        except Exception as e:
            logger.error(f"获取任务建议失败: {str(e)}")
            return jsonify({'error': '获取任务建议失败'}), 500
    
    elif request.method == 'POST':
        try:
            data = request.get_json()
            feedback = data.get('feedback', '')
            
            # 获取任务信息和历史记录
            conn = sqlite3.connect(api_config.database['sqlite_path'])
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT task_name, description, target_count, category
                FROM customer_tasks 
                WHERE id = ?
            ''', (task_id,))
            
            task_info = cursor.fetchone()
            if not task_info:
                return jsonify({'error': '任务不存在'}), 404
            
            # 获取最近的执行记录
            cursor.execute('''
                SELECT completed_count, notes, completion_date
                FROM task_records 
                WHERE task_id = ?
                ORDER BY completion_date DESC 
                LIMIT 5
            ''', (task_id,))
            
            recent_records = cursor.fetchall()
            
            # 生成AI建议
            prompt = f"""
            基于以下获客任务信息和执行反馈，请提供3-5条具体的优化建议：
            
            任务名称：{task_info[0]}
            任务描述：{task_info[1]}
            目标数量：{task_info[2]}
            任务类别：{task_info[3]}
            
            最近执行记录：
            {chr(10).join([f"日期：{record[2]}，完成数量：{record[0]}，备注：{record[1]}" for record in recent_records])}
            
            用户反馈：{feedback}
            
            请针对获客效率、执行策略、时间安排等方面提供具体可行的建议。
            """
            
            try:
                ai_response = ai_service.get_completion(prompt)
                
                # 解析AI建议并保存
                suggestions_text = ai_response.strip().split('\n')
                suggestions_saved = []
                
                for suggestion in suggestions_text:
                    if suggestion.strip() and len(suggestion.strip()) > 10:
                        cursor.execute('''
                            INSERT INTO task_suggestions (task_id, suggestion_text, suggestion_type)
                            VALUES (?, ?, ?)
                        ''', (task_id, suggestion.strip(), '优化建议'))
                        
                        suggestion_id = cursor.lastrowid
                        suggestions_saved.append({
                            'id': suggestion_id,
                            'suggestion_text': suggestion.strip(),
                            'suggestion_type': '优化建议',
                            'is_applied': False,
                            'created_at': datetime.now().isoformat()
                        })
                
                conn.commit()
                conn.close()
                
                return jsonify({
                    'message': '建议生成成功',
                    'suggestions': suggestions_saved
                })
                
            except Exception as ai_error:
                logger.error(f"AI建议生成失败: {str(ai_error)}")
                # 提供默认建议
                default_suggestions = [
                    "建议设定明确的日程安排，固定每天的获客时间段",
                    "优化接触话术，提高初次沟通的成功率",
                    "建立客户分类体系，针对不同类型客户采用不同策略",
                    "定期回顾和分析获客数据，及时调整策略"
                ]
                
                suggestions_saved = []
                for suggestion in default_suggestions:
                    cursor.execute('''
                        INSERT INTO task_suggestions (task_id, suggestion_text, suggestion_type)
                        VALUES (?, ?, ?)
                    ''', (task_id, suggestion, '默认建议'))
                    
                    suggestion_id = cursor.lastrowid
                    suggestions_saved.append({
                        'id': suggestion_id,
                        'suggestion_text': suggestion,
                        'suggestion_type': '默认建议',
                        'is_applied': False,
                        'created_at': datetime.now().isoformat()
                    })
                
                conn.commit()
                conn.close()
                
                return jsonify({
                    'message': '建议生成成功（使用默认建议）',
                    'suggestions': suggestions_saved
                })
                
        except Exception as e:
            logger.error(f"生成任务建议失败: {str(e)}")
            return jsonify({'error': '生成任务建议失败'}), 500

@app.route('/api/customer-tasks/default', methods=['POST'])
def create_default_tasks():
    """创建默认的获客任务"""
    try:
        default_tasks = [
            {
                'task_name': '每日接触MBA人士',
                'description': '每天主动接触50位MBA人士，通过LinkedIn、脉脉等平台建立联系',
                'target_count': 50,
                'category': '主动获客',
                'priority': 3
            },
            {
                'task_name': '维护社交媒体内容',
                'description': '维护LinkedIn/脉脉/小红书内容，保持专业形象和活跃度',
                'target_count': 3,
                'category': '内容营销',
                'priority': 2
            },
            {
                'task_name': '自媒体互动回复',
                'description': '在各自媒体平台找20条相关内容进行专业回复，提升曝光度',
                'target_count': 20,
                'category': '内容营销',
                'priority': 2
            },
            {
                'task_name': '潜在客户挖掘',
                'description': '通过各种渠道挖掘和识别潜在客户，建立客户档案',
                'target_count': 10,
                'category': '客户开发',
                'priority': 3
            },
            {
                'task_name': '视频内容创作',
                'description': '整理和创作自媒体视频内容，展示专业能力',
                'target_count': 1,
                'category': '内容营销',
                'priority': 1
            },
            {
                'task_name': '参加行业活动',
                'description': '参加相关行业活动，扩展人脉网络',
                'target_count': 1,
                'category': '线下活动',
                'priority': 2
            },
            {
                'task_name': '新增微信联系人',
                'description': '每天新认识30人并成功添加微信，扩大联系网络',
                'target_count': 30,
                'category': '主动获客',
                'priority': 3
            }
        ]
        
        conn = sqlite3.connect(api_config.database['sqlite_path'])
        cursor = conn.cursor()
        
        created_tasks = []
        for task in default_tasks:
            # 检查是否已存在相同名称的任务
            cursor.execute('SELECT id FROM customer_tasks WHERE task_name = ?', (task['task_name'],))
            if cursor.fetchone():
                continue  # 跳过已存在的任务
            
            cursor.execute('''
                INSERT INTO customer_tasks (task_name, description, target_count, category, priority)
                VALUES (?, ?, ?, ?, ?)
            ''', (task['task_name'], task['description'], task['target_count'], task['category'], task['priority']))
            
            created_tasks.append(task['task_name'])
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'message': f'成功创建{len(created_tasks)}个默认任务',
            'created_count': len(created_tasks),
            'created_tasks': created_tasks
        })
        
    except Exception as e:
        logger.error(f"创建默认任务失败: {str(e)}")
        return jsonify({'error': '创建默认任务失败'}), 500

def generate_ssl_certificate():
    """生成自签名SSL证书"""
    cert_dir = 'ssl_certs'
    cert_file = os.path.join(cert_dir, 'cert.pem')
    key_file = os.path.join(cert_dir, 'key.pem')
    
    # 创建证书目录
    if not os.path.exists(cert_dir):
        os.makedirs(cert_dir)
        logger.info(f"创建SSL证书目录: {cert_dir}")
    
    # 检查证书是否已存在
    if os.path.exists(cert_file) and os.path.exists(key_file):
        logger.info("SSL证书已存在，跳过生成")
        return cert_file, key_file
    
    try:
        # 使用openssl生成自签名证书
        cmd = [
            'openssl', 'req', '-x509', '-newkey', 'rsa:4096',
            '-keyout', key_file, '-out', cert_file,
            '-days', '365', '-nodes',
            '-subj', '/C=CN/ST=Beijing/L=Beijing/O=CRM/OU=IT/CN=localhost'
        ]
        
        subprocess.run(cmd, check=True, capture_output=True)
        logger.info(f"成功生成SSL证书: {cert_file}, {key_file}")
        return cert_file, key_file
        
    except subprocess.CalledProcessError as e:
        logger.error(f"生成SSL证书失败: {e}")
        return None, None
    except FileNotFoundError:
        logger.error("未找到openssl命令，请安装OpenSSL")
        return None, None

def create_ssl_context():
    """创建SSL上下文"""
    cert_file, key_file = generate_ssl_certificate()
    
    if cert_file and key_file:
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain(cert_file, key_file)
        return context
    else:
        logger.warning("无法创建SSL上下文，将使用HTTP")
        return None

if __name__ == '__main__':
    init_db()
    
    # 获取配置
    host = api_config.app.get('host', '0.0.0.0')
    port = api_config.app.get('port', 5004)
    enable_https = os.getenv('ENABLE_HTTPS', 'false').lower() == 'true'
    enable_ipv6 = os.getenv('ENABLE_IPV6', 'false').lower() == 'true'
    
    # IPv6支持
    if enable_ipv6:
        host = '::' if host == '0.0.0.0' else host
        logger.info("启用IPv6支持")
    
    # HTTPS支持
    ssl_context = None
    if enable_https:
        ssl_context = create_ssl_context()
        if ssl_context:
            logger.info(f"启用HTTPS服务器，地址: https://{host}:{port}")
        else:
            logger.warning("HTTPS启用失败，回退到HTTP")
    
    if not enable_https or ssl_context is None:
        logger.info(f"启动HTTP服务器，地址: http://{host}:{port}")
    
    # 启动服务器
    try:
        app.run(
            debug=False,
            host=host,
            port=port,
            use_reloader=False,
            ssl_context=ssl_context
        )
    except Exception as e:
        logger.error(f"服务器启动失败: {e}")
        # 如果IPv6失败，尝试IPv4
        if enable_ipv6 and host == '::':
            logger.info("IPv6启动失败，尝试IPv4")
            app.run(
                debug=False,
                host='0.0.0.0',
                port=port,
                use_reloader=False,
                ssl_context=ssl_context
            )