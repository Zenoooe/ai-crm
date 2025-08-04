import React, { useState, useEffect } from 'react';
import FolderManager from '../components/folders/FolderManager.tsx';
import TagManager from '../components/tags/TagManager.tsx';
import { apiService } from '../services/api.ts';

// 简单的图标组件
const TagIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const XMarkIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const FolderManagementPage: React.FC = () => {
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<number[]>([]);
  const [showTagManager, setShowTagManager] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFolderSelect = (folderId: number | null) => {
    setSelectedFolderId(folderId);
    setSelectedCustomerIds([]); // 清空选择的客户
  };

  const handleCustomerSelect = (customerId: number, selected: boolean) => {
    if (selected) {
      setSelectedCustomerIds(prev => [...prev, customerId]);
    } else {
      setSelectedCustomerIds(prev => prev.filter(id => id !== customerId));
    }
  };

  const handleBatchSelectAll = () => {
    // 这里需要获取当前文件夹的所有客户ID
    // 暂时留空，需要从FolderManager组件传递数据
  };

  const handleClearSelection = () => {
    setSelectedCustomerIds([]);
  };

  const handleTagsUpdated = () => {
    setRefreshKey(prev => prev + 1); // 触发数据刷新
    setSelectedCustomerIds([]);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 页面头部 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">文件夹与客户管理</h1>
            <p className="text-sm text-gray-600 mt-1">
              拖拽排序文件夹，批量管理客户标签和优先级
            </p>
          </div>
          
          {/* 批量操作工具栏 */}
          {selectedCustomerIds.length > 0 && (
            <div className="flex items-center space-x-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
              <span className="text-sm text-blue-700">
                已选择 {selectedCustomerIds.length} 个客户
              </span>
              <button
                onClick={() => setShowTagManager(true)}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
              >
                <TagIcon className="h-4 w-4" />
                <span>批量标签</span>
              </button>
              <button
                onClick={handleClearSelection}
                className="p-1 hover:bg-blue-100 rounded"
                title="清空选择"
              >
                <XMarkIcon className="h-4 w-4 text-blue-600" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 overflow-hidden">
        <FolderManager
          key={refreshKey}
          onFolderSelect={handleFolderSelect}
          selectedFolderId={selectedFolderId}
        />
      </div>

      {/* 标签管理弹窗 */}
      {showTagManager && (
        <TagManager
          selectedCustomerIds={selectedCustomerIds}
          onTagsUpdated={handleTagsUpdated}
          onClose={() => setShowTagManager(false)}
        />
      )}

      {/* 快捷键提示 */}
      <div className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-6">
            <span>💡 提示：</span>
            <span>拖拽文件夹可以排序</span>
            <span>拖拽客户可以移动到文件夹</span>
            <span>右键点击可以查看更多操作</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Ctrl+A 全选</span>
            <span>Ctrl+T 批量标签</span>
            <span>Delete 删除选中</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FolderManagementPage;