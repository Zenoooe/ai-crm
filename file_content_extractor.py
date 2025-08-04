import os
import logging
from typing import List, Dict, Optional
import sqlite3
from config import api_config

# 设置日志
logger = logging.getLogger(__name__)

try:
    import PyPDF2
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False
    logger.warning("PyPDF2 not available. PDF text extraction will be disabled.")

try:
    from PIL import Image
    import pytesseract
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False
    logger.warning("PIL or pytesseract not available. OCR functionality will be disabled.")

try:
    import docx
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False
    logger.warning("python-docx not available. DOCX text extraction will be disabled.")

class FileContentExtractor:
    """文件内容提取器，支持PDF、图片OCR、DOCX等格式"""
    
    def __init__(self):
        self.supported_formats = {
            'pdf': self.extract_pdf_text,
            'txt': self.extract_txt_text,
            'docx': self.extract_docx_text,
            'doc': self.extract_doc_text,
            'png': self.extract_image_text,
            'jpg': self.extract_image_text,
            'jpeg': self.extract_image_text,
            'gif': self.extract_image_text,
            'webp': self.extract_image_text
        }
    
    def extract_pdf_text(self, file_path: str) -> str:
        """提取PDF文件的文本内容"""
        if not PDF_AVAILABLE:
            return "PDF文本提取功能不可用，请安装PyPDF2库"
        
        try:
            text = ""
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page_num in range(len(pdf_reader.pages)):
                    page = pdf_reader.pages[page_num]
                    text += page.extract_text() + "\n"
            
            # 清理文本
            text = text.strip()
            if not text:
                return "PDF文件中未找到可提取的文本内容"
            
            return text[:5000]  # 限制文本长度
        except Exception as e:
            logger.error(f"PDF文本提取失败: {e}")
            return f"PDF文本提取失败: {str(e)}"
    
    def extract_image_text(self, file_path: str) -> str:
        """使用OCR提取图片中的文本"""
        if not OCR_AVAILABLE:
            return "图片OCR功能不可用，请安装PIL和pytesseract库"
        
        try:
            # 打开图片
            image = Image.open(file_path)
            
            # 使用OCR提取文本
            text = pytesseract.image_to_string(image, lang='chi_sim+eng')
            
            # 清理文本
            text = text.strip()
            if not text:
                return "图片中未识别到文本内容"
            
            return text[:3000]  # 限制文本长度
        except Exception as e:
            logger.error(f"图片OCR提取失败: {e}")
            return f"图片OCR提取失败: {str(e)}"
    
    def extract_txt_text(self, file_path: str) -> str:
        """提取TXT文件内容"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                text = file.read()
            
            if not text.strip():
                return "TXT文件为空"
            
            return text[:5000]  # 限制文本长度
        except UnicodeDecodeError:
            try:
                with open(file_path, 'r', encoding='gbk') as file:
                    text = file.read()
                return text[:5000]
            except Exception as e:
                logger.error(f"TXT文件读取失败: {e}")
                return f"TXT文件读取失败: {str(e)}"
        except Exception as e:
            logger.error(f"TXT文件读取失败: {e}")
            return f"TXT文件读取失败: {str(e)}"
    
    def extract_docx_text(self, file_path: str) -> str:
        """提取DOCX文件内容"""
        if not DOCX_AVAILABLE:
            return "DOCX文本提取功能不可用，请安装python-docx库"
        
        try:
            doc = docx.Document(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            
            if not text.strip():
                return "DOCX文件中未找到文本内容"
            
            return text[:5000]  # 限制文本长度
        except Exception as e:
            logger.error(f"DOCX文本提取失败: {e}")
            return f"DOCX文本提取失败: {str(e)}"
    
    def extract_doc_text(self, file_path: str) -> str:
        """提取DOC文件内容（简单处理）"""
        return "DOC格式文件需要转换为DOCX格式才能提取文本内容"
    
    def extract_file_content(self, file_path: str, file_extension: str) -> Dict[str, str]:
        """提取文件内容"""
        if not os.path.exists(file_path):
            return {
                'success': False,
                'content': '',
                'error': '文件不存在'
            }
        
        file_extension = file_extension.lower()
        if file_extension not in self.supported_formats:
            return {
                'success': False,
                'content': '',
                'error': f'不支持的文件格式: {file_extension}'
            }
        
        try:
            extract_func = self.supported_formats[file_extension]
            content = extract_func(file_path)
            
            return {
                'success': True,
                'content': content,
                'error': ''
            }
        except Exception as e:
            logger.error(f"文件内容提取失败: {e}")
            return {
                'success': False,
                'content': '',
                'error': str(e)
            }
    
    def get_customer_file_contents(self, customer_id: int) -> List[Dict[str, str]]:
        """获取客户所有上传文件的内容"""
        conn = sqlite3.connect(api_config.database['sqlite_path'])
        cursor = conn.cursor()
        
        try:
            # 获取客户的所有项目文件
            cursor.execute('''
                SELECT id, filename, file_path, file_extension, file_type
                FROM project_files
                WHERE customer_id = ?
                ORDER BY upload_time DESC
            ''', (customer_id,))
            
            files = cursor.fetchall()
            file_contents = []
            
            for file_record in files:
                file_id, filename, file_path, file_extension, file_type = file_record
                
                # 提取文件内容
                result = self.extract_file_content(file_path, file_extension)
                
                file_contents.append({
                    'file_id': file_id,
                    'filename': filename,
                    'file_type': file_type,
                    'file_extension': file_extension,
                    'content': result['content'],
                    'success': result['success'],
                    'error': result.get('error', '')
                })
            
            return file_contents
        
        except Exception as e:
            logger.error(f"获取客户文件内容失败: {e}")
            return []
        finally:
            conn.close()
    
    def format_file_contents_for_ai(self, file_contents: List[Dict[str, str]]) -> str:
        """格式化文件内容供AI分析使用"""
        if not file_contents:
            return ""
        
        formatted_content = "\n\n**客户上传的项目文件内容**：\n"
        
        for file_info in file_contents:
            if file_info['success'] and file_info['content']:
                formatted_content += f"\n--- {file_info['filename']} ({file_info['file_type']}) ---\n"
                formatted_content += file_info['content'][:2000]  # 限制每个文件的内容长度
                formatted_content += "\n"
            elif not file_info['success']:
                formatted_content += f"\n--- {file_info['filename']} (提取失败: {file_info['error']}) ---\n"
        
        formatted_content += "\n**重要提示**：以上文件内容包含了客户项目的重要信息，请在分析中充分考虑这些内容，特别是其中的需求、痛点、预算、时间要求等关键信息。\n"
        
        return formatted_content

# 创建全局实例
file_extractor = FileContentExtractor()