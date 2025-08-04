import React, { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { apiService } from '../../services/api.ts';

// 简单的图标组件
const FolderIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const StarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const StarIconSolid = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const TagIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const PencilIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const ArrowsRightLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

// 类型定义
interface Folder {
  id: number;
  name: string;
  order: number;
  color?: string;
  icon?: string;
  customer_count?: number;
  parent_id?: number;
  folder_type?: string;
}

interface Customer {
  id: number;
  name: string;
  company?: string;
  tags: string[];
  priority: number;
  folder_id?: number;
  starred?: boolean;
}

interface Tag {
  name: string;
  count: number;
  category: string;
}

interface FolderManagerProps {
  onFolderSelect?: (folderId: number | null) => void;
  selectedFolderId?: number | null;
}

const FolderManager: React.FC<FolderManagerProps> = ({ 
  onFolderSelect, 
  selectedFolderId 
}) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    folderId?: number;
    type: 'folder' | 'customer';
    targetId?: number;
  }>({ show: false, x: 0, y: 0, type: 'folder' });
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'starred' | 'high'>('all');
  
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // 颜色选项
  const colorOptions = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ];

  // 图标选项
  const iconOptions = [
    '📁', '🏢', '👥', '⭐', '🎯', '📊', '💼', '🔥'
  ];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu({ show: false, x: 0, y: 0, type: 'folder' });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [foldersRes, customersRes, tagsRes] = await Promise.all([
        apiService.get('/folders'),
        apiService.get('/customers'),
        apiService.get('/tags/search')
      ]);
      
      setFolders(foldersRes.data || []);
      setCustomers(customersRes.data || []);
      setTags(tagsRes.data?.tags || []);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination, type } = result;

    if (type === 'folder') {
      // 文件夹拖拽排序
      const newFolders = Array.from(folders);
      const [reorderedFolder] = newFolders.splice(source.index, 1);
      newFolders.splice(destination.index, 0, reorderedFolder);

      // 更新本地状态
      setFolders(newFolders);

      // 更新服务器
      try {
        await apiService.put('/folders/update', {
          id: reorderedFolder.id,
          new_order: destination.index
        });
      } catch (error) {
        console.error('更新文件夹排序失败:', error);
        // 回滚
        setFolders(folders);
      }
    } else if (type === 'customer') {
      // 客户拖拽到文件夹
      const customerId = parseInt(result.draggableId);
      const targetFolderId = destination.droppableId === 'unassigned' ? null : parseInt(destination.droppableId);

      try {
        await apiService.post('/customers/move', {
          customer_ids: [customerId],
          folder_id: targetFolderId
        });
        
        // 更新本地状态
        setCustomers(prev => prev.map(customer => 
          customer.id === customerId 
            ? { ...customer, folder_id: targetFolderId || undefined }
            : customer
        ));
      } catch (error) {
        console.error('移动客户失败:', error);
      }
    }
  };

  const handleContextMenu = (event: React.MouseEvent, type: 'folder' | 'customer', id: number) => {
    event.preventDefault();
    setContextMenu({
      show: true,
      x: event.clientX,
      y: event.clientY,
      type,
      targetId: id
    });
  };

  const handleAddFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const response = await apiService.post('/folders', {
        name: newFolderName,
        order: folders.length,
        color: colorOptions[0],
        icon: iconOptions[0]
      });
      
      setFolders(prev => [...prev, response.data]);
      setNewFolderName('');
      setShowAddFolder(false);
    } catch (error) {
      console.error('创建文件夹失败:', error);
    }
  };

  const handleDeleteFolder = async (folderId: number) => {
    if (!window.confirm('确定要删除这个文件夹吗？文件夹中的客户将移动到未分组。')) return;

    try {
      await apiService.delete(`/folders/${folderId}`);
      setFolders(prev => prev.filter(f => f.id !== folderId));
      setContextMenu({ show: false, x: 0, y: 0, type: 'folder' });
    } catch (error) {
      console.error('删除文件夹失败:', error);
    }
  };

  const handleMergeFolders = async () => {
    if (selectedItems.length < 2) {
      alert('请选择至少两个文件夹进行合并');
      return;
    }

    const targetFolderId = selectedItems[0];
    const sourceFolderIds = selectedItems.slice(1);

    try {
      await apiService.post('/folders/merge', {
        target_folder_id: targetFolderId,
        source_folder_ids: sourceFolderIds
      });
      
      // 重新加载数据
      loadData();
      setSelectedItems([]);
      setContextMenu({ show: false, x: 0, y: 0, type: 'folder' });
    } catch (error) {
      console.error('合并文件夹失败:', error);
    }
  };

  const handleBatchAddTags = async (customerIds: number[], tags: string[]) => {
    try {
      await apiService.post('/customers/batch-tags', {
        customer_ids: customerIds,
        tags,
        operation: 'add'
      });
      
      // 更新本地状态
      setCustomers(prev => prev.map(customer => 
        customerIds.includes(customer.id)
          ? { ...customer, tags: [...new Set([...customer.tags, ...tags])] }
          : customer
      ));
    } catch (error) {
      console.error('批量添加标签失败:', error);
    }
  };

  const handleToggleStarred = async (customerId: number) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    try {
      await apiService.put(`/customers/${customerId}`, {
        starred: !customer.starred
      });
      
      setCustomers(prev => prev.map(c => 
        c.id === customerId ? { ...c, starred: !c.starred } : c
      ));
    } catch (error) {
      console.error('更新星标状态失败:', error);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    // 文件夹过滤
    if (selectedFolderId !== null && customer.folder_id !== selectedFolderId) {
      return false;
    }
    if (selectedFolderId === null && customer.folder_id !== null && customer.folder_id !== undefined) {
      return false;
    }

    // 搜索过滤
    if (searchQuery && !customer.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !customer.company?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // 标签过滤
    if (tagFilter.length > 0 && !tagFilter.some(tag => customer.tags.includes(tag))) {
      return false;
    }

    // 优先级过滤
    if (priorityFilter === 'starred' && !customer.starred) {
      return false;
    }
    if (priorityFilter === 'high' && customer.priority < 8) {
      return false;
    }

    return true;
  });

  const getCustomerCountForFolder = (folderId: number | null) => {
    return customers.filter(c => c.folder_id === folderId).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 搜索和过滤栏 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2 mb-3">
          <input
            type="text"
            placeholder="搜索客户..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setShowAddFolder(true)}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-1"
          >
            <PlusIcon className="h-4 w-4" />
            <span>文件夹</span>
          </button>
        </div>
        
        {/* 优先级过滤 */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">优先级:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="all">全部</option>
            <option value="starred">星标</option>
            <option value="high">高优先级</option>
          </select>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 flex">
          {/* 文件夹列表 */}
          <div className="w-64 border-r border-gray-200 bg-gray-50">
            <div className="p-3">
              <h3 className="text-sm font-medium text-gray-900 mb-2">文件夹</h3>
              
              {/* 未分组 */}
              <div
                className={`p-2 rounded-md cursor-pointer mb-1 flex items-center justify-between ${
                  selectedFolderId === null ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                }`}
                onClick={() => onFolderSelect?.(null)}
              >
                <div className="flex items-center space-x-2">
                  <FolderIcon className="h-4 w-4" />
                  <span className="text-sm">未分组</span>
                </div>
                <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                  {getCustomerCountForFolder(null)}
                </span>
              </div>

              {/* 文件夹列表 */}
              <Droppable droppableId="folders" type="folder">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {folders.map((folder, index) => (
                      <Draggable key={folder.id} draggableId={folder.id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`p-2 rounded-md cursor-pointer mb-1 flex items-center justify-between ${
                              selectedFolderId === folder.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                            } ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                            onClick={() => onFolderSelect?.(folder.id)}
                            onContextMenu={(e) => handleContextMenu(e, 'folder', folder.id)}
                          >
                            <div className="flex items-center space-x-2">
                              <span style={{ color: folder.color }}>
                                {folder.icon || '📁'}
                              </span>
                              <span className="text-sm">{folder.name}</span>
                            </div>
                            <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                              {getCustomerCountForFolder(folder.id)}
                            </span>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </div>

          {/* 客户列表 */}
          <div className="flex-1">
            <Droppable droppableId={selectedFolderId?.toString() || 'unassigned'} type="customer">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="p-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {selectedFolderId === null 
                        ? '未分组客户' 
                        : folders.find(f => f.id === selectedFolderId)?.name || '客户列表'
                      }
                      <span className="ml-2 text-sm text-gray-500">({filteredCustomers.length})</span>
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {filteredCustomers.map((customer, index) => (
                      <Draggable key={customer.id} draggableId={customer.id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow ${
                              snapshot.isDragging ? 'shadow-lg' : ''
                            }`}
                            onContextMenu={(e) => handleContextMenu(e, 'customer', customer.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-medium text-gray-900">{customer.name}</h4>
                                  {customer.starred && (
                                    <StarIconSolid className="h-4 w-4 text-yellow-400" />
                                  )}
                                </div>
                                {customer.company && (
                                  <p className="text-sm text-gray-600">{customer.company}</p>
                                )}
                                {customer.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {customer.tags.map((tag, tagIndex) => (
                                      <span
                                        key={tagIndex}
                                        className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleToggleStarred(customer.id)}
                                  className="p-1 hover:bg-gray-100 rounded"
                                >
                                  {customer.starred ? (
                                    <StarIconSolid className="h-4 w-4 text-yellow-400" />
                                  ) : (
                                    <StarIcon className="h-4 w-4 text-gray-400" />
                                  )}
                                </button>
                                <div className={`w-2 h-2 rounded-full ${
                                  customer.priority >= 8 ? 'bg-red-500' :
                                  customer.priority >= 6 ? 'bg-yellow-500' :
                                  'bg-green-500'
                                }`} />
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          </div>
        </div>
      </DragDropContext>

      {/* 添加文件夹对话框 */}
      {showAddFolder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium mb-4">创建新文件夹</h3>
            <input
              type="text"
              placeholder="文件夹名称"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowAddFolder(false);
                  setNewFolderName('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                取消
              </button>
              <button
                onClick={handleAddFolder}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 右键菜单 */}
      {contextMenu.show && (
        <div
          ref={contextMenuRef}
          className="fixed bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {contextMenu.type === 'folder' && (
            <>
              <button
                onClick={() => {
                  // 编辑文件夹
                  setContextMenu({ show: false, x: 0, y: 0, type: 'folder' });
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <PencilIcon className="h-4 w-4" />
                <span>编辑</span>
              </button>
              <button
                onClick={handleMergeFolders}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <ArrowsRightLeftIcon className="h-4 w-4" />
                <span>合并文件夹</span>
              </button>
              <button
                onClick={() => handleDeleteFolder(contextMenu.targetId!)}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600 flex items-center space-x-2"
              >
                <TrashIcon className="h-4 w-4" />
                <span>删除</span>
              </button>
            </>
          )}
          {contextMenu.type === 'customer' && (
            <>
              <button
                onClick={() => {
                  // 编辑客户
                  setContextMenu({ show: false, x: 0, y: 0, type: 'customer' });
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <PencilIcon className="h-4 w-4" />
                <span>编辑</span>
              </button>
              <button
                onClick={() => {
                  // 添加标签
                  setContextMenu({ show: false, x: 0, y: 0, type: 'customer' });
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <TagIcon className="h-4 w-4" />
                <span>添加标签</span>
              </button>
              <button
                onClick={() => handleToggleStarred(contextMenu.targetId!)}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <StarIcon className="h-4 w-4" />
                <span>切换星标</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default FolderManager;