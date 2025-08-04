import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api.ts';

// 简单的图标组件
const TagIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const XMarkIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const MagnifyingGlassIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

// 类型定义
interface Tag {
  name: string;
  count: number;
  category: string;
}

interface TagManagerProps {
  selectedCustomerIds: number[];
  onTagsUpdated?: () => void;
  onClose?: () => void;
}

const TagManager: React.FC<TagManagerProps> = ({ 
  selectedCustomerIds, 
  onTagsUpdated, 
  onClose 
}) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'alpha' | 'frequency' | 'category'>('alpha');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // 预定义标签分类
  const tagCategories = {
    '教育背景': ['MBA', '暨南大学', 'EMBA', '清华', '北大', '复旦', '交大', '中山大学'],
    '地区': ['港澳', '深圳', '广州', '上海', '北京', '杭州', '成都', '重庆'],
    '行业': ['餐饮行会', '金融', '科技', '制造', '服务', '房地产', '医疗', '教育'],
    '圈子背景': ['俱乐部', '商会', '协会', '校友会', '行业协会', '投资圈', '创业圈']
  };

  const allCategories = Object.keys(tagCategories);

  useEffect(() => {
    loadTags();
  }, [searchQuery, sortBy]);

  const loadTags = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/tags/search', {
        params: {
          query: searchQuery,
          sort: sortBy,
          limit: 100
        }
      });
      setTags(response.data?.tags || []);
    } catch (error) {
      console.error('加载标签失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = (tagName: string) => {
    if (!tagName.trim()) return;
    
    if (!selectedTags.includes(tagName)) {
      setSelectedTags(prev => [...prev, tagName]);
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagName: string) => {
    setSelectedTags(prev => prev.filter(tag => tag !== tagName));
  };

  const handleQuickAddCategory = (category: string) => {
    const categoryTags = tagCategories[category as keyof typeof tagCategories] || [];
    const newTags = categoryTags.filter(tag => !selectedTags.includes(tag));
    setSelectedTags(prev => [...prev, ...newTags]);
  };

  const handleApplyTags = async () => {
    if (selectedTags.length === 0 || selectedCustomerIds.length === 0) {
      alert('请选择标签和客户');
      return;
    }

    try {
      setLoading(true);
      await apiService.post('/customers/batch-tags', {
        customer_ids: selectedCustomerIds,
        tags: selectedTags,
        operation: 'add'
      });
      
      onTagsUpdated?.();
      onClose?.();
    } catch (error) {
      console.error('批量添加标签失败:', error);
      alert('添加标签失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const filteredTags = tags.filter(tag => {
    if (filterCategory !== 'all' && tag.category !== filterCategory) {
      return false;
    }
    return true;
  });

  const groupedTags = filteredTags.reduce((groups, tag) => {
    const category = tag.category || '其他';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(tag);
    return groups;
  }, {} as Record<string, Tag[]>);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-4/5 max-w-4xl h-4/5 max-h-screen flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">标签管理</h2>
            <p className="text-sm text-gray-600 mt-1">
              为 {selectedCustomerIds.length} 个客户添加标签
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* 左侧：标签选择 */}
          <div className="w-2/3 p-6 border-r border-gray-200 overflow-y-auto">
            {/* 搜索和过滤 */}
            <div className="mb-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索标签..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="alpha">按字母排序</option>
                  <option value="frequency">按使用频率</option>
                  <option value="category">按分类排序</option>
                </select>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">所有分类</option>
                  {allCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* 新建标签 */}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="创建新标签..."
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag(newTagInput)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => handleAddTag(newTagInput)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-1"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>添加</span>
                </button>
              </div>
            </div>

            {/* 快速添加分类 */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">快速添加分类</h3>
              <div className="grid grid-cols-2 gap-2">
                {allCategories.map(category => (
                  <button
                    key={category}
                    onClick={() => handleQuickAddCategory(category)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 text-left"
                  >
                    {category} ({tagCategories[category as keyof typeof tagCategories].length})
                  </button>
                ))}
              </div>
            </div>

            {/* 标签列表 */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">现有标签</h3>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedTags).map(([category, categoryTags]) => (
                    <div key={category}>
                      <h4 className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
                        {category}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {categoryTags.map(tag => (
                          <button
                            key={tag.name}
                            onClick={() => handleAddTag(tag.name)}
                            className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                              selectedTags.includes(tag.name)
                                ? 'bg-blue-100 border-blue-300 text-blue-700'
                                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {tag.name} ({tag.count})
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 右侧：已选标签 */}
          <div className="w-1/3 p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">
              已选标签 ({selectedTags.length})
            </h3>
            
            {selectedTags.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <TagIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">还没有选择标签</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedTags.map(tag => (
                  <div
                    key={tag}
                    className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-md"
                  >
                    <span className="text-sm text-blue-700">{tag}</span>
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="p-1 hover:bg-blue-100 rounded"
                    >
                      <XMarkIcon className="h-3 w-3 text-blue-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 底部操作 */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            将为 {selectedCustomerIds.length} 个客户添加 {selectedTags.length} 个标签
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              取消
            </button>
            <button
              onClick={handleApplyTags}
              disabled={loading || selectedTags.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '处理中...' : '应用标签'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TagManager;