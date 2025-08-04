import requests
import json
import logging
from typing import Dict, Any, Optional, List
from config import api_config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AIServiceManager:
    """AI服务管理器 - 统一管理多个AI模型的调用"""
    
    def __init__(self):
        self.config = api_config
        self.default_model = 'deepseek-chat'  # 默认使用DeepSeek Chat（备用）
    
    def get_default_model(self):
        """获取默认模型，优先从Flask session获取用户设置"""
        try:
            from flask import session
            # 从session获取用户设置的默认模型
            user_default = session.get('default_ai_model')
            if user_default:
                return user_default
        except (ImportError, RuntimeError):
            # 如果不在Flask上下文中，使用硬编码默认值
            pass
        return self.default_model
    
    def chat(self, message, context=None):
        """发送聊天消息，使用默认模型"""
        messages = []
        if context:
            messages.append({
                'role': 'system',
                'content': context
            })
        messages.append({
            'role': 'user',
            'content': message
        })
        
        return self.call_ai_model(self.get_default_model(), messages)
    
    def chat_with_model(self, message, model_spec, context=None):
        """使用指定的AI模型发送聊天消息
        
        Args:
            message: 聊天消息
            model_spec: 模型名称，如 'deepseek-reasoner', 'gemini-pro' 等
            context: 上下文信息
        """
        messages = []
        if context:
            messages.append({
                'role': 'system',
                'content': context
            })
        messages.append({
            'role': 'user',
            'content': message
        })
        
        return self.call_ai_model(model_spec, messages)
    
    def get_available_models(self) -> List[Dict[str, Any]]:
        """获取可用的AI模型列表"""
        models = []
        for name, config in self.config.get_available_models().items():
            models.append({
                'id': name,
                'name': config['description'],
                'model': config['model'],
                'available': True
            })
        return models
    
    def _map_model_name(self, frontend_model_name: str) -> str:
        """智能映射前端模型名称到后端配置的模型名称"""
        # 如果已经是后端格式，直接返回
        if ':' not in frontend_model_name:
            return frontend_model_name
        
        # 解析前端格式: provider:model
        try:
            provider, model = frontend_model_name.split(':', 1)
        except ValueError:
            logger.warning(f"无效的模型名称格式: {frontend_model_name}")
            return frontend_model_name
        
        # 精确的模型映射规则：只有特定模型才映射到后端配置
        exact_model_mapping = {
            'deepseek:deepseek-reasoner': 'deepseek-reasoner',
            'deepseek:deepseek-chat': 'deepseek-chat',
            'moonshot:moonshot-v1-1t': 'moonshot-kimi-k2',
            'moonshot:moonshot-v1-8k': 'moonshot-kimi-k2',
            'moonshot:moonshot-v1-32k': 'moonshot-kimi-k2',
            'openai:gpt-4': 'openai-gpt4',
            'openai:gpt-4-turbo': 'openai-gpt4',
            'gemini:gemini-pro': 'gemini-pro',
            'xai:grok-3-mini': 'grok-4',
            'xai:grok-4': 'grok-4'
        }
        
        # 检查是否有精确匹配
        mapped_name = exact_model_mapping.get(frontend_model_name.lower())
        if mapped_name:
            logger.info(f"智能映射模型: {frontend_model_name} -> {mapped_name}")
            return mapped_name
        
        # 如果没有精确匹配，直接返回原始名称（不进行映射）
        logger.info(f"使用原始模型名称: {frontend_model_name}")
        return frontend_model_name

    def _adjust_model_parameters(self, model_name: str, temperature: float, max_tokens: int) -> Dict[str, Any]:
        """根据不同模型的特点调整参数，让每个模型展现其独特性"""
        # 不同模型的特色参数配置
        model_configs = {
            'deepseek-chat': {
                'temperature': 0.7,  # 对话模型，平衡创造性
                'max_tokens': 8192,  # DeepSeek Chat最大支持8192
                'description': '对话专家，回答准确，内容详实'
            },
            'deepseek-reasoner': {
                'temperature': 0.3,  # 推理模型，降低随机性
                'max_tokens': 12000,  # 推理模型通常输出更详细
                'description': '深度推理，逻辑严密，超长内容'
            },
            'moonshot-kimi-k2': {
                'temperature': 0.8,  # 创意模型，增加创造性
                'max_tokens': 16000,  # 长文本处理专家，最大输出
                'description': '创意丰富，表达生动，超长文本'
            },
            'openai-gpt4': {
                'temperature': 0.7,  # 平衡的通用模型
                'max_tokens': 10000,  # 大幅增加输出长度
                'description': '通用均衡，表达自然，详细内容'
            },
            'gemini-pro': {
                'temperature': 0.9,  # Google模型，增加多样性
                'max_tokens': 12000,  # 多模态模型，长内容
                'description': '多元思维，视角独特，丰富内容'
            },
            'grok-4': {
                'temperature': 1.0,  # Grok模型，最大创造性
                'max_tokens': 14000,  # 强大的推理能力，超长输出
                'description': '幽默风趣，思维跳跃，超详细'
            }
        }
        
        config = model_configs.get(model_name, {
            'temperature': temperature,
            'max_tokens': max_tokens,
            'description': '标准配置'
        })
        
        logger.info(f"模型 {model_name} 使用特色配置: {config['description']}, temperature={config['temperature']}, max_tokens={config['max_tokens']}")
        
        return {
            'temperature': config['temperature'],
            'max_tokens': config['max_tokens']
        }

    def _get_model_style_guidance(self, model_name: str) -> str:
        """根据不同模型的特点提供风格指导"""
        if not model_name:
            return ""
            
        style_guides = {
             'deepseek-reasoner': """
特别要求（基于DeepSeek推理模型特点）：
- 请进行深度逻辑分析，提供详细的推理过程和数据支撑
- 每个销售步骤都要有清晰的逻辑支撑、原因说明和实施细节
- 内容要严谨、专业，包含具体的案例分析和数据论证
- 字数要求：每部分至少500字，总字数不少于2500字，内容越详细越好
- 重点突出数据分析、理性说服和深度思考
- 请提供具体的话术示例、应对策略和实施步骤""",
             
             'moonshot-kimi-k2': """
特别要求（基于Moonshot长文本处理特点）：
- 请生成极其丰富详细的内容，充分展现创意和表达能力
- 语言要生动活泼，富有感染力和说服力，使用丰富的修辞手法
- 大量使用比喻、故事、案例等生动的表达方式
- 字数要求：每部分至少600字，总字数不少于3000字，越长越好
- 重点突出情感共鸣、创意表达和生动描述
- 请提供详细的场景描述、对话示例和情感引导技巧""",
             
             'openai-gpt4': """
特别要求（基于GPT-4通用均衡特点）：
- 请保持专业而自然的表达风格，内容要全面详细
- 内容要平衡理性分析和情感诉求，提供完整的解决方案
- 语言要流畅易懂，逻辑清晰，结构完整
- 字数要求：每部分至少400字，总字数不少于2000字，内容要充实
- 重点突出专业性、可操作性和实用性
- 请提供具体的操作指南、话术模板和实施建议""",
             
             'gemini-pro': """
特别要求（基于Gemini多元思维特点）：
- 请从多个角度深入分析客户需求和销售策略
- 内容要有独特的视角和创新思维，提供多维度的解决方案
- 结合行业趋势、市场洞察和前沿理念
- 字数要求：每部分至少550字，总字数不少于2800字，视角要丰富
- 重点突出多维度分析、前瞻性思考和创新策略
- 请提供多种方案选择、趋势分析和创新方法""",
             
             'grok-4': """
特别要求（基于Grok幽默风趣特点）：
- 请在保持专业的同时，大量加入幽默元素和创意表达
- 语言要极具亲和力，容易拉近与客户的距离，风格独特
- 使用轻松幽默的表达方式，但保持专业性和实用性
- 字数要求：每部分至少650字，总字数不少于3200字，风格要突出
- 重点突出人性化沟通、创新表达和独特风格
- 请提供幽默的对话技巧、创意的沟通方式和个性化的表达"""
         }
        
        return style_guides.get(model_name, "")

    def call_ai_model(self, model_name: str, messages: List[Dict[str, str]], 
                      temperature: float = 0.7, max_tokens: int = 16000) -> Dict[str, Any]:
        """调用指定的AI模型"""
        try:
            # 映射模型名称
            mapped_model_name = self._map_model_name(model_name)
            
            model_config = self.config.get_ai_model_config(mapped_model_name)
            if not model_config or not model_config.get('api_key'):
                raise ValueError(f"模型 {mapped_model_name} 不可用或缺少API密钥")
            
            # 根据不同模型调整参数以展现各自特色
            adjusted_params = self._adjust_model_parameters(mapped_model_name, temperature, max_tokens)
            
            # 根据不同的模型调用不同的API
            if mapped_model_name == 'gemini-pro':
                return self._call_gemini(model_config, messages, adjusted_params['temperature'], adjusted_params['max_tokens'])
            else:
                return self._call_openai_compatible(model_config, messages, adjusted_params['temperature'], adjusted_params['max_tokens'])
        
        except Exception as e:
            logger.error(f"调用AI模型 {model_name} 失败: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'message': '抱歉，AI服务暂时不可用，请稍后重试。'
            }
    
    def _call_openai_compatible(self, config: Dict[str, Any], messages: List[Dict[str, str]], 
                               temperature: float, max_tokens: int) -> Dict[str, Any]:
        """调用OpenAI兼容的API"""
        headers = {
            'Authorization': f'Bearer {config["api_key"]}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'model': config['model'],
            'messages': messages,
            'temperature': temperature,
            'max_tokens': max_tokens
        }
        
        response = requests.post(
            f"{config['base_url']}/chat/completions",
            headers=headers,
            json=payload,
            timeout=120  # 增加超时时间到120秒
        )
        
        if response.status_code == 200:
            result = response.json()
            return {
                'success': True,
                'message': result['choices'][0]['message']['content'],
                'usage': result.get('usage', {}),
                'model': config['model']
            }
        else:
            raise Exception(f"API调用失败: {response.status_code} - {response.text}")
    
    def _call_gemini(self, config: Dict[str, Any], messages: List[Dict[str, str]], 
                    temperature: float, max_tokens: int) -> Dict[str, Any]:
        """调用Google Gemini API"""
        # 转换消息格式为Gemini格式
        contents = []
        for msg in messages:
            if msg['role'] == 'user':
                contents.append({
                    'parts': [{'text': msg['content']}]
                })
        
        payload = {
            'contents': contents,
            'generationConfig': {
                'temperature': temperature,
                'maxOutputTokens': max_tokens
            }
        }
        
        response = requests.post(
            f"{config['base_url']}/models/{config['model']}:generateContent?key={config['api_key']}",
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            if 'candidates' in result and result['candidates']:
                content = result['candidates'][0]['content']['parts'][0]['text']
                return {
                    'success': True,
                    'message': content,
                    'model': config['model']
                }
            else:
                raise Exception("Gemini API返回空结果")
        else:
            raise Exception(f"Gemini API调用失败: {response.status_code} - {response.text}")
    
    def generate_customer_analysis(self, customer_data: Dict[str, Any], 
                                 interactions: List[Dict[str, Any]] = None,
                                 model_name: str = None) -> Dict[str, Any]:
        """生成客户分析"""
        if not model_name:
            model_name = self.get_default_model()
        
        # 构建分析提示
        prompt = self._build_analysis_prompt(customer_data, interactions)
        
        messages = [
            {
                'role': 'system',
                'content': '''你是一个专业的CRM销售分析师，擅长客户画像分析和销售策略制定。
                请基于提供的客户信息和互动历史，生成详细的客户分析报告。
                
                分析应包括：
                1. 客户画像总结
                2. 沟通风格偏好
                3. 潜在需求和痛点
                4. 成交概率评估
                5. 下一步行动建议
                
                请用专业但易懂的语言回答，重点突出可执行的销售建议。'''
            },
            {
                'role': 'user',
                'content': prompt
            }
        ]
        
        return self.call_ai_model(model_name, messages, temperature=0.3)
    
    def generate_sales_script(self, customer_data: Dict[str, Any], 
                            script_type: str = 'opening',
                            methodology: str = 'straightLine',
                            model_name: str = None,
                            advanced_settings: Dict[str, Any] = None) -> Dict[str, Any]:
        """生成销售话术"""
        if not model_name:
            model_name = self.get_default_model()
        
        # 构建话术生成提示
        prompt = self._build_script_prompt(customer_data, script_type, methodology, advanced_settings, model_name)
        
        messages = [
            {
                'role': 'system',
                'content': f'''你是一个专业的销售话术专家，精通多种销售方法论。
                当前使用的销售方法论是：{methodology}
                
                请为客户生成专业、个性化的销售话术。话术应该：
                1. 符合所选销售方法论的原则
                2. 针对客户的具体情况定制
                3. 自然流畅，不显生硬
                4. 包含具体的行动指导
                
                请提供3-5个不同的话术选项，每个都要标注使用场景。'''
            },
            {
                'role': 'user',
                'content': prompt
            }
        ]
        
        return self.call_ai_model(model_name, messages, temperature=0.7)
    
    def analyze_conversation(self, conversation_content: str, 
                           customer_data: Dict[str, Any] = None,
                           model_name: str = None) -> Dict[str, Any]:
        """分析对话内容"""
        if not model_name:
            model_name = self.get_default_model()
        
        prompt = f"""请分析以下对话内容：
        
        对话内容：
        {conversation_content}
        
        {f'客户背景：{json.dumps(customer_data, ensure_ascii=False, indent=2)}' if customer_data else ''}
        
        请提供：
        1. 对话情绪分析（积极/中性/消极）
        2. 关键信息提取
        3. 客户兴趣点和痛点
        4. 销售机会评估
        5. 下次跟进建议
        """
        
        messages = [
            {
                'role': 'system',
                'content': '你是一个专业的对话分析师，擅长从销售对话中提取关键信息和洞察。'
            },
            {
                'role': 'user',
                'content': prompt
            }
        ]
        
        return self.call_ai_model(model_name, messages, temperature=0.3)
    
    def _build_analysis_prompt(self, customer_data: Dict[str, Any], 
                              interactions: List[Dict[str, Any]] = None) -> str:
        """构建客户分析提示"""
        prompt = f"""请分析以下客户信息：
        
        客户基本信息：
        - 姓名：{customer_data.get('name', '未知')}
        - 公司：{customer_data.get('company', '未知')}
        - 职位：{customer_data.get('position', '未知')}
        - 行业：{customer_data.get('industry', '未知')}
        - 优先级：{customer_data.get('priority', '中等')}
        """
        
        if interactions:
            prompt += "\n\n最近互动记录：\n"
            for interaction in interactions[-5:]:  # 只取最近5条记录
                prompt += f"- {interaction.get('created_at', '')}：{interaction.get('content', '')}\n"
        
        return prompt
    
    def _build_script_prompt(self, customer_data: Dict[str, Any], 
                           script_type: str, methodology: str,
                           advanced_settings: Dict[str, Any] = None,
                           model_name: str = None) -> str:
        """构建话术生成提示"""
        script_types = {
            'opening': '开场白',
            'discovery': '需求挖掘',
            'needs_discovery': '需求挖掘', 
            'presentation': '方案展示',
            'objection': '异议处理',
            'objection_handling': '异议处理',
            'closing': '成交促成',
            'follow_up': '跟进话术',
            'initial_contact': '初次接触',
            'pain_point_discovery': '痛点挖掘'
        }
        
        methodologies = {
            'straightLine': '华尔街之狼直线销售法',
            'straight_line': '直线销售法',
            'spin': 'SPIN销售法',
            'challenger': '挑战者销售法',
            'consultative': '顾问式销售法',
            'solution': '解决方案销售法',
            'value': '价值销售法',
            'sandler': '桑德拉七步销售法',
            'obppc': 'OBPPC销售模型'
        }
        
        # 根据不同的销售情况定制prompt内容
        situation_guidance = self._get_situation_guidance(script_type, methodology)
        
        # 根据销售情况定制不同的内容重点
        content_focus = self._get_content_focus(script_type)
        
        # 获取销售方法论的详细指导
        methodology_guidance = self._get_methodology_detailed_guidance(methodology)
        
        # 处理高级设置
        advanced_guidance = self._build_advanced_settings_guidance(advanced_settings) if advanced_settings else ""
        
        # 添加模型特色指导
        model_guidance = self._get_model_style_guidance(model_name) if model_name else ""
        
        prompt = f"""🚨 重要提示：请生成超长、超详细的销售话术内容！🚨
        
        {model_guidance}
        
        请为以下客户生成完整的销售话术，必须包含5个部分。
        
        客户信息：
        - 姓名：{customer_data.get('name', '未知')}
        - 公司：{customer_data.get('company', '未知')}
        - 职位：{customer_data.get('position', '未知')}
        - 行业：{customer_data.get('industry', '未知')}
        {f'- 项目背景：{customer_data.get("project_background", "")}' if customer_data.get('project_background') else ''}
        
        销售方法论：{methodologies.get(methodology, methodology)}
        当前销售情况：{script_types.get(script_type, script_type)}
        
        {situation_guidance}
        
        {methodology_guidance}
        
        {content_focus}
        
        {advanced_guidance}
        
        ⚠️ 再次强调：每个部分都必须非常详细，包含具体的话术示例、实施步骤和详细说明！⚠️
        
        请严格按照以下JSON格式返回，确保每个字段都有具体、详细的内容：
        
        """
        
        # 根据销售情况动态调整JSON字段
        json_fields = self._get_dynamic_json_fields(script_type, customer_data)
        prompt += json_fields
        
        prompt += """
        
        重要要求：
        1. 必须返回标准JSON格式，不要添加任何其他文字
        2. 每个字段的内容要具体、实用，不能是空泛的模板
        3. 话术要符合{methodologies.get(methodology, methodology)}的核心原则
        4. 内容要针对{customer_data.get('industry', '行业')}行业特点定制
        5. 语言要专业、自然、有说服力
        6. 特别注意当前销售情况是"{script_types.get(script_type, script_type)}"
        7. 严格按照上述内容重点要求调整各部分的表达方式和侧重点
        
        请直接返回JSON格式的话术内容：
        """
        
        return prompt
    
    def _get_dynamic_json_fields(self, script_type: str, customer_data: Dict[str, Any]) -> str:
        """根据销售情况动态生成JSON字段定义"""
        customer_name = customer_data.get('name', '客户')
        customer_industry = customer_data.get('industry', '行业')
        customer_position = customer_data.get('position', '职位')
        
        if script_type in ['objection_handling', 'objection']:
            return f"""{{
            "objection_acknowledgment": "异议确认和理解话术（至少300字）：首先认真倾听并确认{customer_name}的具体异议，表达理解和共情，避免直接反驳，展现专业的沟通技巧和客户服务意识",
            "objection_analysis": "异议深度分析话术（至少400字）：深入分析异议背后的真实原因和担忧，可能涉及预算、时间、决策权、信任度等方面，结合{customer_industry}行业特点和{customer_position}角色的常见顾虑",
            "evidence_presentation": "证据和案例展示话术（至少500字）：提供具体的数据、案例、证明材料来化解异议，包含同行业成功案例、ROI分析、风险评估、实施保障等详细内容",
            "alternative_solution": "替代方案和灵活处理话术（至少350字）：针对客户的具体异议，提供灵活的解决方案、分阶段实施计划、试用机会、定制化调整等多种选择",
            "objection_close": "异议处理后的推进话术（至少250字）：在化解异议后，重新引导客户关注价值和收益，推动决策进程，明确下一步具体行动"
        }}"""
        elif script_type in ['closing']:
            return f"""{{
            "urgency_creation": "紧迫感营造话术（至少300字）：通过市场趋势、竞争压力、机会窗口等因素，为{customer_name}营造采取行动的紧迫感，结合{customer_industry}行业的时效性特点",
            "value_reinforcement": "价值强化和总结话术（至少400字）：系统性地总结和强化前期沟通中确认的价值点，量化收益和ROI，强调解决方案对{customer_position}工作的积极影响",
            "risk_mitigation": "风险消除和保障话术（至少500字）：详细说明实施保障、售后服务、风险控制措施，消除客户的最后顾虑，提供全面的安全感和信心",
            "decision_facilitation": "决策促进和选择引导话术（至少350字）：帮助客户理清决策要素，提供决策框架和评估标准，引导客户做出积极的购买决定",
            "closing_action": "成交促成和合作启动话术（至少250字）：明确提出合作建议，详细说明签约流程、实施时间表、项目启动安排等具体行动计划"
        }}"""
        elif script_type in ['needs_discovery', 'discovery']:
            return f"""{{
            "situation_inquiry": "现状了解和背景调研话术（至少300字）：深入了解{customer_name}当前的业务现状、组织架构、运营模式，特别关注{customer_industry}行业的特殊性和{customer_position}的具体职责",
            "problem_exploration": "问题挖掘和痛点探索话术（至少400字）：通过开放性和引导性问题，深度挖掘客户面临的业务挑战、运营痛点、发展瓶颈等关键问题",
            "impact_analysis": "影响分析和后果评估话术（至少500字）：帮助客户分析现有问题对业务的具体影响，包括成本损失、效率降低、竞争劣势等多维度后果评估",
            "need_confirmation": "需求确认和优先级排序话术（至少350字）：确认客户的真实需求和期望，帮助客户理清需求的优先级和紧迫性，建立改进的必要性认知",
            "solution_direction": "解决方向和可能性探讨话术（至少250字）：初步探讨解决问题的方向和可能性，为后续的方案介绍做好铺垫和期待管理"
        }}"""
        elif script_type in ['follow_up']:
            return f"""{{
            "relationship_maintenance": "关系维护和问候话术（至少300字）：温暖的问候和关怀，回顾上次沟通的要点，展现对{customer_name}和其{customer_industry}业务的持续关注",
            "value_reminder": "价值提醒和收益强化话术（至少400字）：重新强调解决方案的价值和收益，分享新的行业洞察、成功案例或产品更新，保持客户的兴趣和认知",
            "progress_update": "进展更新和案例分享话术（至少500字）：分享其他客户的实施进展和成功案例，特别是同行业或类似规模的企业案例，增强客户的信心",
            "concern_addressing": "顾虑处理和支持提供话术（至少350字）：主动了解客户的新顾虑或变化，提供额外的支持和解决方案，展现专业的服务态度",
            "next_engagement": "下次互动和推进安排话术（至少250字）：安排下次沟通或会议，明确议题和目标，保持销售进程的连续性和推进力"
        }}"""
        else:  # opening, presentation等其他情况
            return f"""{{
            "opening": "针对{customer_name}的个性化开场白（至少300字）：详细介绍自己、公司背景、专业能力，结合其{customer_industry}背景和{customer_position}特点，包含具体的行业洞察和个人价值主张",
            "pain_point": "基于{customer_industry}行业特点的痛点分析（至少400字）：深入分析{customer_position}可能面临的具体业务痛点、挑战和困扰，包含行业趋势、市场压力、竞争环境等多维度分析",
            "solution": "详细的解决方案介绍话术（至少500字）：针对上述痛点，提供具体、详细的解决方案介绍，包含产品/服务特点、实施方法、预期效果、技术优势等全面说明",
            "social_proof": "丰富的社会证明内容（至少350字）：提供详细的成功案例、客户见证、数据支撑、行业认可等，包含具体的数字、时间、效果描述，增强可信度和说服力",
            "next_step": "明确的下一步行动计划（至少250字）：详细的跟进步骤，包括会议安排、方案演示、试用体验、合作流程等具体安排和时间节点"
        }}"""
    
    def _get_situation_guidance(self, script_type: str, methodology: str) -> str:
        """根据销售情况和方法论提供具体指导"""
        guidance_map = {
            'initial_contact': {
                'general': '这是初次接触客户，重点是建立信任和引起兴趣。开场白要简洁有力，快速展示价值。',
                'spin': '使用SPIN方法，先了解客户的现状(Situation)，然后逐步挖掘问题。',
                'challenger': '采用挑战者方式，提供新的行业洞察来吸引客户注意。',
                'consultative': '以顾问身份出现，展现专业性和对客户行业的深度理解。'
            },
            'opening': {
                'general': '开场白阶段，需要在30秒内抓住客户注意力，建立初步信任。',
                'straightLine': '直接切入主题，明确表达来意和价值主张。',
                'spin': '从了解客户现状开始，避免直接推销。',
                'challenger': '分享行业趋势或挑战客户现有认知。'
            },
            'discovery': {
                 'general': '需求挖掘阶段，重点是深入了解客户痛点和需求。',
                 'spin': '系统性地问SPIN四类问题：情况、问题、影响、需求回报。',
                 'consultative': '像顾问一样深度诊断客户业务问题。',
                 'solution': '专注于发现客户的业务挑战和改进机会。'
             },
             'needs_discovery': {
                 'general': '需求挖掘阶段，重点是深入了解客户痛点和需求。',
                 'spin': '系统性地问SPIN四类问题：情况、问题、影响、需求回报。',
                 'consultative': '像顾问一样深度诊断客户业务问题。',
                 'solution': '专注于发现客户的业务挑战和改进机会。'
             },
            'pain_point_discovery': {
                'general': '痛点挖掘阶段，要让客户意识到问题的严重性和紧迫性。',
                'challenger': '教育客户他们可能没有意识到的问题。',
                'spin': '通过影响性问题让客户感受到问题的后果。',
                'value': '量化问题对客户业务的影响。'
            },
            'presentation': {
                'general': '方案展示阶段，要将解决方案与客户具体需求紧密关联。',
                'solution': '展示综合解决方案如何解决客户的业务问题。',
                'value': '重点强调ROI和业务价值。',
                'consultative': '以专业建议的方式推荐解决方案。'
            },
            'objection_handling': {
                'general': '异议处理阶段，要理解异议背后的真实担忧，并提供有说服力的回应。',
                'challenger': '用数据和案例挑战客户的担忧。',
                'consultative': '站在客户角度分析异议的合理性。',
                'value': '用ROI分析化解价格异议。'
            },
            'closing': {
                'general': '成交促成阶段，要创造紧迫感并明确下一步行动。',
                'straightLine': '直接要求成交，不拖泥带水。',
                'challenger': '基于前面建立的价值认知推动决策。',
                'solution': '强调解决方案的完整性和实施的重要性。'
            },
            'follow_up': {
                'general': '跟进阶段，要保持客户兴趣并推进销售进程。',
                'consultative': '提供额外的专业见解和建议。',
                'value': '分享更多价值证明和成功案例。',
                'challenger': '持续教育客户，强化价值认知。'
            }
        }
        
        situation_guidance = guidance_map.get(script_type, {})
        specific_guidance = situation_guidance.get(methodology, situation_guidance.get('general', ''))
        
        return f"销售情况指导：{specific_guidance}"
    
    def _get_methodology_detailed_guidance(self, methodology: str) -> str:
        """获取销售方法论的详细实施指导"""
        methodology_details = {
            'straightLine': '''
销售方法论详细指导 - 华尔街之狼直线销售法：
核心原则：
1. 直接性：开门见山，不绕弯子，直接表达来意和价值
2. 控制性：主导对话节奏，引导客户按照你的逻辑思考
3. 紧迫性：创造时间压力，强调机会的稀缺性和时效性
4. 确定性：展现绝对的自信，让客户感受到你的专业和权威

话术要求：
- 开场白：30秒内建立权威，直接说明来意
- 痛点挖掘：快速识别核心问题，不要过度分析
- 解决方案：简洁有力地展示价值，避免技术细节
- 成交促成：直接要求决策，不给犹豫时间
- 语言风格：坚定、自信、有说服力''',
            
            'spin': '''
销售方法论详细指导 - SPIN销售法：
核心四步骤：
1. Situation Questions (情况问题)：了解客户现状，建立背景
   - "请介绍一下贵公司目前的...情况？"
   - "您现在是如何处理...的？"

2. Problem Questions (问题问题)：发现痛点和不满
   - "在这个过程中遇到什么困难？"
   - "这种方式有什么不足之处？"

3. Implication Questions (影响问题)：放大问题的后果
   - "这个问题对业务有什么影响？"
   - "如果不解决，可能会导致什么后果？"

4. Need-payoff Questions (需求回报问题)：让客户说出解决方案的价值
   - "如果能解决这个问题，对您意味着什么？"
   - "这样的改进会带来什么好处？"

话术特点：以问题为导向，让客户自己说出需求和价值''',
            
            'challenger': '''
销售方法论详细指导 - 挑战者销售法：
核心三步骤：
1. Teach (教导)：提供新的行业洞察，挑战客户现有认知
   - 分享行业趋势和最佳实践
   - 指出客户可能忽视的问题
   - 用数据和案例支撑观点

2. Tailor (定制)：将洞察与客户具体情况结合
   - 分析客户的独特挑战
   - 展示解决方案的针对性价值
   - 量化改进的潜在收益

3. Take Control (控制)：主导销售进程，推动决策
   - 创造紧迫感
   - 明确下一步行动
   - 不妥协于客户的拖延

话术特点：权威、教育性、数据驱动，敢于挑战客户想法''',
            
            'consultative': '''
销售方法论详细指导 - 顾问式销售法：
核心理念：以顾问身份与客户合作，而非传统的销售关系

实施步骤：
1. 建立信任：展现专业性和对客户行业的深度理解
2. 深度诊断：像医生一样全面了解客户的业务状况
3. 协作分析：与客户一起分析问题的根本原因
4. 共同制定解决方案：让客户参与方案设计过程
5. 长期伙伴关系：关注客户长期成功，而非单次交易

话术特点：
- 使用专业术语和行业洞察
- 提出深度的诊断性问题
- 分享相关经验和最佳实践
- 语调谦逊但专业，避免推销感''',
            
            'solution': '''
销售方法论详细指导 - 解决方案销售法：
核心理念：专注于解决客户的业务问题，而非销售产品

实施框架：
1. 业务问题诊断：
   - 深入了解客户的业务流程
   - 识别效率瓶颈和改进机会
   - 分析问题对业务的影响

2. 综合解决方案设计：
   - 整合多种资源和能力
   - 提供端到端的解决方案
   - 考虑实施的可行性和风险

3. 价值量化：
   - 计算ROI和成本节约
   - 展示业务改进的具体指标
   - 提供实施时间表和里程碑

4. 实施支持：
   - 详细的实施计划
   - 持续的优化和支持
   - 成功案例和参考

话术特点：系统性、全面性、注重业务价值和实施细节''',
            
            'value': '''
销售方法论详细指导 - 价值销售法：
核心理念：始终围绕客户能获得的价值来构建销售对话

价值展示框架：
1. 价值发现：
   - 了解客户的成功指标
   - 识别当前的成本和损失
   - 发现未实现的机会

2. 价值量化：
   - 计算具体的财务收益
   - 分析成本节约的潜力
   - 评估效率提升的价值

3. 价值证明：
   - 提供详细的ROI分析
   - 分享类似客户的成功案例
   - 展示可衡量的业务成果

4. 价值实现：
   - 制定价值实现的路径
   - 设定可追踪的成功指标
   - 承诺持续的价值优化

话术特点：数据驱动、量化分析、强调投资回报和业务成果'''
        }
        
        return methodology_details.get(methodology, f"销售方法论：{methodology}（请按照该方法的核心原则进行话术设计）")
    
    def _get_content_focus(self, script_type: str) -> str:
        """根据销售情况提供内容重点指导"""
        focus_map = {
            'opening': """
内容重点要求：
- opening: 必须是简短有力的自我介绍和价值主张，30秒内抓住注意力
- pain_point: 提出行业普遍问题，引起客户思考，不要过于深入
- solution: 简要概述解决方案的核心价值，激发兴趣而非详细介绍
- social_proof: 提及知名客户或简单数据，建立初步信任
- next_step: 请求短时间会面或电话沟通的机会""",
            
            'needs_discovery': """
内容重点要求：
- opening: 回顾之前接触，表达对客户业务的关注和理解
- pain_point: 深度挖掘具体痛点，使用开放性问题引导客户表达
- solution: 不要详细介绍产品，而是展示理解客户需求的能力
- social_proof: 分享类似客户面临相同挑战的案例
- next_step: 提议深入需求分析会议或现场调研""",
            
            'presentation': """
内容重点要求：
- opening: 确认客户需求，为方案展示做铺垫
- pain_point: 总结之前发现的关键痛点，获得客户确认
- solution: 详细展示解决方案如何解决每个具体痛点，包含功能和效果
- social_proof: 提供详细的成功案例和ROI数据
- next_step: 提议试用、演示或详细方案讨论""",
            
            'objection_handling': """
内容重点要求：
- opening: 理解并认同客户的担忧，表现出专业和耐心
- pain_point: 分析不解决问题的风险和机会成本
- solution: 针对具体异议提供有说服力的回应和替代方案
- social_proof: 分享类似异议客户最终成功的案例
- next_step: 提供试用期、分阶段实施或其他降低风险的方案""",
            
            'closing': """
内容重点要求：
- opening: 总结前期沟通成果，确认客户对价值的认同
- pain_point: 强调不立即行动的机会成本和竞争风险
- solution: 强调解决方案的紧迫性和独特优势
- social_proof: 展示其他客户快速决策后获得的收益
- next_step: 明确要求签约或承诺，提供限时优惠或激励""",
            
            'follow_up': """
内容重点要求：
- opening: 跟进之前的承诺或讨论，展现持续关注
- pain_point: 了解客户当前状况变化，发现新的需求点
- solution: 提供额外价值或优化建议，保持客户兴趣
- social_proof: 分享最新的成功案例或行业趋势
- next_step: 推进到下一个销售阶段或维护客户关系"""
        }
        
        return focus_map.get(script_type, "")
    
    def _build_advanced_settings_guidance(self, advanced_settings: Dict[str, Any]) -> str:
        """构建高级设置指导"""
        if not advanced_settings:
            return ""
        
        guidance_parts = []
        
        # 角色设置处理
        if 'roleSettings' in advanced_settings:
            role_settings = advanced_settings['roleSettings']
            
            # 职业身份
            if 'professionalRole' in role_settings:
                role = role_settings['professionalRole']
                role_guidance = {
                    'brand_consultant': '以品牌升级专家的身份，重点关注品牌价值提升和市场定位优化',
                    'marketing_specialist': '以市场营销专家的身份，专注于营销策略和客户获取',
                    'sales_director': '以销售总监的身份，强调销售流程优化和业绩提升',
                    'business_consultant': '以商业顾问的身份，提供全面的业务发展建议',
                    'strategy_advisor': '以战略顾问的身份，专注于长期战略规划和竞争优势'
                }
                if role in role_guidance:
                    guidance_parts.append(f"专业身份：{role_guidance[role]}")
                elif role_settings.get('customRole'):
                    guidance_parts.append(f"专业身份：以{role_settings['customRole']}的身份提供专业服务")
            
            # 教育背景
            if 'educationBackground' in role_settings:
                education = role_settings['educationBackground']
                education_guidance = {
                    'mba': '运用MBA级别的商业分析能力和战略思维',
                    'master': '展现硕士级别的专业深度和理论基础',
                    'bachelor': '结合本科专业知识提供实用建议',
                    'phd': '运用博士级别的研究能力和深度洞察'
                }
                if education in education_guidance:
                    guidance_parts.append(f"专业水平：{education_guidance[education]}")
                elif role_settings.get('customEducation'):
                    guidance_parts.append(f"专业水平：具备{role_settings['customEducation']}的专业背景")
            
            # 从业经验
            if 'experienceYears' in role_settings:
                experience = role_settings['experienceYears']
                experience_guidance = {
                    '1-3': '以新锐专家的视角，提供创新思路和敏锐洞察',
                    '3-5': '结合丰富的实战经验，提供成熟可靠的解决方案',
                    '5-10': '运用资深专家的深度经验，提供权威性建议',
                    '10+': '以行业领袖的高度，提供战略性指导和前瞻性建议'
                }
                if experience in experience_guidance:
                    guidance_parts.append(f"经验水平：{experience_guidance[experience]}")
            
            # 专业领域
            if 'expertiseArea' in role_settings:
                expertise = role_settings['expertiseArea']
                expertise_guidance = {
                    'brand_strategy': '专注于品牌战略规划和品牌价值提升',
                    'market_analysis': '擅长市场分析和竞争环境评估',
                    'business_optimization': '专长于业务流程优化和效率提升',
                    'digital_transformation': '专注于数字化转型和技术创新应用'
                }
                if expertise in expertise_guidance:
                    guidance_parts.append(f"专业领域：{expertise_guidance[expertise]}")
            
            # 服务范围
            if 'services' in role_settings:
                services = role_settings['services']
                active_services = []
                service_names = {
                    'brandConsulting': '品牌咨询',
                    'strategyPlanning': '战略规划',
                    'marketAnalysis': '市场分析',
                    'businessOptimization': '业务优化',
                    'teamTraining': '团队培训',
                    'digitalTransformation': '数字化转型'
                }
                for service_key, service_name in service_names.items():
                    if services.get(service_key):
                        active_services.append(service_name)
                
                if active_services:
                    guidance_parts.append(f"服务范围：专业提供{' '.join(active_services)}等服务")
            
            # 个人成就
            if role_settings.get('achievements'):
                guidance_parts.append(f"专业成就：{role_settings['achievements']}")
            
            # 价值主张
            if role_settings.get('valueProposition'):
                guidance_parts.append(f"价值主张：{role_settings['valueProposition']}")
        
        # 语言风格设置
        if 'languageStyle' in advanced_settings:
            style = advanced_settings['languageStyle']
            style_guidance = {
                'professional': '使用正式、专业的商务语言，避免口语化表达',
                'friendly': '采用友好、亲切的语调，拉近与客户的距离',
                'confident': '展现自信坚定的专业态度，使用权威性表达',
                'consultative': '以顾问身份出现，提供专业建议和洞察'
            }
            if style in style_guidance:
                guidance_parts.append(f"语言风格：{style_guidance[style]}")
        
        # 话术长度
        if 'scriptLength' in advanced_settings:
            length = advanced_settings['scriptLength']
            length_guidance = {
                1: '保持简洁明了，重点突出核心信息',
                2: '适中长度，平衡信息量和可读性',
                3: '详细全面，提供充分的背景和论证'
            }
            if length in length_guidance:
                guidance_parts.append(f"内容长度：{length_guidance[length]}")
        
        # 创意程度
        if 'creativity' in advanced_settings:
            creativity = advanced_settings['creativity']
            if creativity <= 0.3:
                guidance_parts.append("创意程度：保持传统稳重的表达方式，注重可靠性")
            elif creativity <= 0.7:
                guidance_parts.append("创意程度：适度创新，平衡传统与新颖的表达")
            else:
                guidance_parts.append("创意程度：采用创新独特的表达方式，突出差异化")
        
        # 行业术语
        if advanced_settings.get('industryTerms'):
            guidance_parts.append("专业术语：适当使用行业专业术语，展现专业性")
        
        # 个人签名
        if advanced_settings.get('personalSignature'):
            guidance_parts.append(f"个人特色：{advanced_settings['personalSignature']}")
        
        # 输出格式
        if 'outputFormat' in advanced_settings:
            format_type = advanced_settings['outputFormat']
            format_guidance = {
                'structured': '采用结构化格式，条理清晰',
                'conversational': '使用对话式风格，自然流畅',
                'bullet': '使用要点式表达，简洁明了'
            }
            if format_type in format_guidance:
                guidance_parts.append(f"表达格式：{format_guidance[format_type]}")
        
        # 沟通渠道优化
        if 'channelOptimization' in advanced_settings:
            channel = advanced_settings['channelOptimization']
            channel_guidance = {
                'phone': '针对电话沟通优化，注重语音表达效果',
                'email': '针对邮件沟通优化，注重文字表达清晰',
                'meeting': '针对面对面会议优化，注重互动性',
                'video': '针对视频会议优化，平衡视觉和语音效果'
            }
            if channel in channel_guidance:
                guidance_parts.append(f"沟通渠道：{channel_guidance[channel]}")
        
        # 时间敏感性
        if 'timeSensitivity' in advanced_settings:
            time_sensitivity = advanced_settings['timeSensitivity']
            time_guidance = {
                'urgent': '强调紧迫性，突出立即行动的重要性',
                'normal': '保持正常节奏，适度引导决策',
                'relaxed': '保持耐心，重点建立长期关系'
            }
            if time_sensitivity in time_guidance:
                guidance_parts.append(f"时间节奏：{time_guidance[time_sensitivity]}")
        
        if guidance_parts:
            return "\n\n高级设置指导：\n" + "\n".join([f"- {part}" for part in guidance_parts])
        
        return ""
    
    def test_connection(self, provider: str, model: str, api_key: str, base_url: str = None) -> Dict[str, Any]:
        """测试AI API连接"""
        try:
            headers = {
                'Content-Type': 'application/json'
            }
            
            # 根据不同提供商设置不同的认证方式和测试方法
            if provider.lower() == 'gemini':
                # Gemini使用API key作为查询参数
                test_url = f"{base_url or 'https://generativelanguage.googleapis.com/v1beta'}/models"
                response = requests.get(test_url, params={'key': api_key}, timeout=10)
            elif provider.lower() == 'moonshot':
                # Moonshot使用chat/completions端点进行测试
                headers['Authorization'] = f'Bearer {api_key}'
                test_url = f"{base_url or 'https://api.moonshot.cn/v1'}/chat/completions"
                test_data = {
                    "model": model or "moonshot-v1-8k",
                    "messages": [{"role": "user", "content": "Hello"}],
                    "max_tokens": 5
                }
                response = requests.post(test_url, headers=headers, json=test_data, timeout=10)
            else:
                # 其他提供商使用Bearer token和/models端点
                headers['Authorization'] = f'Bearer {api_key}'
                test_url = f"{base_url or 'https://api.openai.com/v1'}/models"
                response = requests.get(test_url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                return {'success': True, 'message': 'API连接成功'}
            else:
                error_detail = ''
                try:
                    error_data = response.json()
                    error_detail = error_data.get('error', {}).get('message', '')
                except:
                    error_detail = response.text[:200] if response.text else ''
                return {'success': False, 'error': f'API返回错误 {response.status_code}: {error_detail}'}
                
        except requests.exceptions.Timeout:
            return {'success': False, 'error': '连接超时'}
        except requests.exceptions.ConnectionError:
            return {'success': False, 'error': '无法连接到API服务器'}
        except Exception as e:
            return {'success': False, 'error': f'连接测试失败: {str(e)}'}
    
    def get_models_list(self, provider: str, api_key: str, base_url: str = None) -> Dict[str, Any]:
        """获取AI模型列表"""
        try:
            headers = {
                'Content-Type': 'application/json'
            }
            
            # 根据不同提供商设置不同的认证方式和URL
            if provider.lower() == 'gemini':
                models_url = f"{base_url or 'https://generativelanguage.googleapis.com/v1beta'}/models"
                response = requests.get(models_url, params={'key': api_key}, timeout=15)
            else:
                headers['Authorization'] = f'Bearer {api_key}'
                models_url = f"{base_url or 'https://api.openai.com/v1'}/models"
                response = requests.get(models_url, headers=headers, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                models = []
                
                # 解析不同提供商的响应格式
                if provider.lower() == 'gemini':
                    # Gemini API响应格式
                    if 'models' in data:
                        for model in data['models']:
                            model_name = model.get('name', '').replace('models/', '')
                            if model_name:
                                models.append(model_name)
                else:
                    # OpenAI兼容格式
                    if 'data' in data:
                        for model in data['data']:
                            model_id = model.get('id')
                            if model_id:
                                models.append(model_id)
                
                return {'success': True, 'models': models}
            else:
                return {'success': False, 'error': f'获取模型列表失败: {response.status_code}'}
                
        except requests.exceptions.Timeout:
            return {'success': False, 'error': '请求超时'}
        except requests.exceptions.ConnectionError:
            return {'success': False, 'error': '无法连接到API服务器'}
        except Exception as e:
            return {'success': False, 'error': f'获取模型列表失败: {str(e)}'}
    
    def update_model_mapping(self, provider: str, models: List[str]) -> Dict[str, Any]:
        """更新模型映射表"""
        try:
            # 根据提供商确定默认映射的后端模型
            provider_mapping = {
                'xai': 'grok-4',
                'deepseek': 'deepseek-reasoner', 
                'moonshot': 'moonshot-kimi-k2',
                'openai': 'openai-gpt4',
                'gemini': 'gemini-pro'
            }
            
            backend_model = provider_mapping.get(provider.lower())
            if not backend_model:
                return {'success': False, 'error': f'不支持的提供商: {provider}'}
            
            # 为每个新模型创建映射
            updated_mappings = []
            for model in models:
                mapping_key = f"{provider.lower()}:{model}"
                # 检查是否已存在映射
                if mapping_key not in self._map_model_name.__defaults__[0] if hasattr(self._map_model_name, '__defaults__') else {}:
                    # 动态添加新的映射
                    updated_mappings.append({
                        'frontend': mapping_key,
                        'backend': backend_model,
                        'model': model
                    })
            
            # 这里可以将映射保存到配置文件或数据库
            # 目前只是记录日志
            if updated_mappings:
                logger.info(f"更新了{provider}的{len(updated_mappings)}个模型映射")
                for mapping in updated_mappings:
                    logger.info(f"  {mapping['frontend']} -> {mapping['backend']}")
            
            return {
                'success': True,
                'updated_mappings': updated_mappings,
                'message': f'成功更新{len(updated_mappings)}个模型映射'
            }
            
        except Exception as e:
            logger.error(f"更新模型映射失败: {str(e)}")
            return {'success': False, 'error': f'更新模型映射失败: {str(e)}'}

# 全局AI服务管理器实例
ai_service = AIServiceManager()