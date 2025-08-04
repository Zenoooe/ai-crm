// CRM应用功能改进
// 这个文件包含了用户要求的所有UI/UX改进功能

// 聊天上下文存储
let chatContext = [];

// 自定义销售方法存储
let customSalesMethodologies = JSON.parse(localStorage.getItem('customSalesMethodologies') || '{}');

// 沟通记录编辑和删除功能

// 创建带有编辑删除功能的沟通记录项
function createCommunicationItemWithActions(communication) {
    const item = document.createElement('div');
    item.className = 'communication-item';
    item.setAttribute('data-comm-id', communication.id);
    
    const date = new Date(communication.created_at).toLocaleString('zh-CN');
    const topics = communication.topics ? communication.topics.split(',') : [];
    
    item.innerHTML = `
        <div class="communication-header">
            <span class="communication-type">${communication.type}</span>
            <span class="communication-date">${date}</span>
            <div class="communication-actions">
                <button class="btn-icon" onclick="editCommunicationRecord(${communication.id})" title="编辑">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon" onclick="deleteCommunicationRecord(${communication.id})" title="删除">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="communication-content" id="comm-content-${communication.id}">${communication.content}</div>
        <div class="communication-topics" id="comm-topics-${communication.id}">
            ${topics.map(topic => `<span class="topic-tag">${topic.trim()}</span>`).join('')}
        </div>
    `;
    
    return item;
}

// 编辑沟通记录
async function editCommunicationRecord(commId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/communication-records/${commId}`);
        if (response.ok) {
            const comm = await response.json();
            
            // 填充编辑表单
            document.getElementById('communicationContent').value = comm.content;
            document.getElementById('communicationType').value = comm.type;
            document.getElementById('communicationTopics').value = comm.topics || '';
            
            // 格式化日期时间 - 保持本地时间，避免时区转换
            const date = new Date(comm.created_at);
            // 获取本地时间的年月日时分，避免UTC转换
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
            document.getElementById('communicationDateTime').value = formattedDate;
            
            // 更改保存按钮为更新模式
            const saveBtn = document.querySelector('.new-communication .btn-primary');
            saveBtn.innerHTML = '<i class="fas fa-save"></i> 更新记录';
            saveBtn.onclick = () => updateCommunicationRecord(commId);
            
            showNotification('记录已加载到编辑区域', 'info');
        }
    } catch (error) {
        console.error('加载沟通记录失败:', error);
        showNotification('加载记录失败', 'error');
    }
}

// 更新沟通记录
async function updateCommunicationRecord(commId) {
    const content = document.getElementById('communicationContent').value.trim();
    const type = document.getElementById('communicationType').value;
    const dateTime = document.getElementById('communicationDateTime').value;
    const topics = document.getElementById('communicationTopics').value.trim();
    
    if (!content || !dateTime) {
        alert('请填写完整的沟通信息');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/communication-records/${commId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: content,
                type: type,
                topics: topics,
                created_at: dateTime
            })
        });
        
        if (response.ok) {
            showNotification('沟通记录已更新', 'success');
            
            // 重置表单和按钮
            document.getElementById('communicationContent').value = '';
            document.getElementById('communicationTopics').value = '';
            document.getElementById('communicationDateTime').value = '';
            
            const saveBtn = document.querySelector('.new-communication .btn-primary');
            saveBtn.innerHTML = '<i class="fas fa-save"></i> 保存记录';
            saveBtn.onclick = saveCommunicationRecord;
            
            // 重新加载沟通记录
            await loadCommunicationRecords(currentCustomer.id);
        } else {
            showNotification('更新失败', 'error');
        }
    } catch (error) {
        console.error('更新沟通记录失败:', error);
        showNotification('更新失败', 'error');
    }
}

// 存储待删除的沟通记录ID
let pendingDeleteCommId = null;

// 删除沟通记录 - 显示确认对话框
function deleteCommunicationRecord(commId) {
    pendingDeleteCommId = commId;
    showConfirmDeleteModal();
}

// 显示确认删除模态框
function showConfirmDeleteModal() {
    document.getElementById('confirmDeleteModal').style.display = 'block';
}

// 关闭确认删除模态框
function closeConfirmDeleteModal() {
    document.getElementById('confirmDeleteModal').style.display = 'none';
    pendingDeleteCommId = null;
}

// 确认删除沟通记录
async function confirmDeleteCommunication() {
    if (!pendingDeleteCommId) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/communication-records/${pendingDeleteCommId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showNotification('沟通记录已删除', 'success');
            await loadCommunicationRecords(currentCustomer.id);
        } else {
            showNotification('删除失败', 'error');
        }
    } catch (error) {
        console.error('删除沟通记录失败:', error);
        showNotification('删除失败', 'error');
    } finally {
        closeConfirmDeleteModal();
    }
}

// 客户信息点击编辑功能

// 设置可编辑字段
function setEditableField(elementId, value, fieldName) {
    const element = document.getElementById(elementId);
    element.textContent = value;
    element.style.cursor = 'pointer';
    element.title = '点击编辑';
    
    // 移除之前的事件监听器
    element.replaceWith(element.cloneNode(true));
    const newElement = document.getElementById(elementId);
    
    newElement.addEventListener('click', function() {
        makeFieldEditable(elementId, fieldName, value);
    });
}

// 使字段可编辑
function makeFieldEditable(elementId, fieldName, currentValue) {
    const element = document.getElementById(elementId);
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentValue === '未设置' || currentValue === '未提供' || currentValue === '未知行业' || currentValue === '未知职位' || currentValue === '未分组' ? '' : currentValue;
    input.className = 'inline-edit-input';
    input.style.cssText = `
        border: 2px solid #007bff;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: inherit;
        font-family: inherit;
        background: white;
        width: 100%;
        box-sizing: border-box;
    `;
    
    // 替换元素
    element.style.display = 'none';
    element.parentNode.insertBefore(input, element.nextSibling);
    input.focus();
    input.select();
    
    // 保存函数
    const saveEdit = async () => {
        const newValue = input.value.trim();
        if (newValue !== currentValue) {
            const success = await updateCustomerFieldImproved(fieldName, newValue);
            if (success) {
                element.textContent = newValue || (fieldName === 'name' ? '未设置' : '未提供');
                currentCustomer[fieldName] = newValue;
            }
        }
        
        // 恢复原始显示
        input.remove();
        element.style.display = '';
    };
    
    // 事件监听
    input.addEventListener('blur', saveEdit);
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            saveEdit();
        }
    });
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            input.remove();
            element.style.display = '';
        }
    });
}

// 改进的客户字段更新函数
async function updateCustomerFieldImproved(fieldName, newValue) {
    if (!currentCustomer) return false;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/customers/${currentCustomer.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                [fieldName]: newValue
            })
        });
        
        if (response.ok) {
            showNotification('客户信息已更新', 'success');
            return true;
        } else {
            showNotification('更新失败', 'error');
            return false;
        }
    } catch (error) {
        console.error('更新客户字段失败:', error);
        showNotification('更新失败', 'error');
        return false;
    }
}

// 头像上传功能

// 设置头像上传功能
function setupAvatarUpload() {
    const avatarContainer = document.querySelector('.customer-avatar');
    const photoElement = document.getElementById('customerPhoto');
    
    if (!avatarContainer) return;
    
    // 创建文件输入
    let fileInput = document.getElementById('avatarFileInput');
    if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'avatarFileInput';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
    }
    
    // 点击上传
    avatarContainer.style.cursor = 'pointer';
    avatarContainer.title = '点击上传头像';
    avatarContainer.onclick = () => fileInput.click();
    
    // 拖拽上传
    avatarContainer.addEventListener('dragover', function(e) {
        e.preventDefault();
        avatarContainer.style.opacity = '0.7';
        avatarContainer.style.border = '2px dashed #007bff';
    });
    
    avatarContainer.addEventListener('dragleave', function(e) {
        e.preventDefault();
        avatarContainer.style.opacity = '1';
        avatarContainer.style.border = 'none';
    });
    
    avatarContainer.addEventListener('drop', function(e) {
        e.preventDefault();
        avatarContainer.style.opacity = '1';
        avatarContainer.style.border = 'none';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleAvatarUpload(files[0]);
        }
    });
    
    // 文件选择处理
    fileInput.onchange = function(e) {
        if (e.target.files.length > 0) {
            handleAvatarUpload(e.target.files[0]);
        }
    };
}

// 处理头像上传
async function handleAvatarUpload(file) {
    if (!file.type.startsWith('image/')) {
        showNotification('请选择图片文件', 'error');
        return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
        showNotification('图片大小不能超过10MB', 'error');
        return;
    }
    
    // 显示上传进度
    showNotification('正在压缩图片...', 'info');
    
    try {
        // 压缩图片
        const compressedBlob = await compressImage(file);
        
        if (!compressedBlob) {
            throw new Error('图片压缩失败');
        }
        
        // 获取原始文件的扩展名
        const originalExtension = file.name.split('.').pop().toLowerCase();
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        const extension = allowedExtensions.includes(originalExtension) ? originalExtension : 'jpg';
        
        // 创建带有正确文件名的File对象
        const compressedFile = new File(
            [compressedBlob], 
            `avatar_${Date.now()}.${extension}`, 
            { type: 'image/jpeg' }
        );
        
        console.log(`原始文件大小: ${(file.size / 1024).toFixed(2)}KB`);
        console.log(`压缩后文件大小: ${(compressedFile.size / 1024).toFixed(2)}KB`);
        
        showNotification('正在上传头像...', 'info');
        
        // 上传图片
        const formData = new FormData();
        formData.append('avatar', compressedFile);
        formData.append('customer_id', currentCustomer.id);
        
        const response = await fetch(`${API_BASE_URL}/api/upload-avatar`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            document.getElementById('customerPhoto').src = result.avatar_url;
            currentCustomer.photo_url = result.avatar_url;
            showNotification('头像上传成功', 'success');
        } else {
            throw new Error(result.message || '头像上传失败');
        }
    } catch (error) {
        console.error('头像上传失败:', error);
        showNotification(`头像上传失败: ${error.message}`, 'error');
    }
}

// 压缩图片
function compressImage(file, maxWidth = 150, maxHeight = 150, quality = 0.6) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            try {
                // 计算新尺寸
                let { width, height } = img;
                
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // 绘制白色背景
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, width, height);
                
                // 绘制圆形裁剪
                ctx.save();
                ctx.beginPath();
                ctx.arc(width/2, height/2, Math.min(width, height)/2, 0, 2 * Math.PI);
                ctx.clip();
                
                // 绘制图片
                ctx.drawImage(img, 0, 0, width, height);
                ctx.restore();
                
                // 转换为blob，使用更低的质量
                canvas.toBlob((blob) => {
                    if (blob) {
                        // 如果文件仍然太大，进一步压缩
                        if (blob.size > 100 * 1024) { // 100KB
                            canvas.toBlob((smallerBlob) => {
                                resolve(smallerBlob || blob);
                            }, 'image/jpeg', 0.3);
                        } else {
                            resolve(blob);
                        }
                    } else {
                        reject(new Error('图片压缩失败'));
                    }
                }, 'image/jpeg', quality);
            } catch (error) {
                reject(error);
            }
        };
        
        img.onerror = function() {
            reject(new Error('图片加载失败'));
        };
        
        img.src = URL.createObjectURL(file);
    });
}

// 改进的导入导出功能

// 改进的导出功能
async function exportCustomersImproved() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/customers/export`);
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `customers_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            showNotification('客户数据导出成功', 'success');
        } else {
            showNotification('导出失败', 'error');
        }
    } catch (error) {
        console.error('导出失败:', error);
        showNotification('导出失败', 'error');
    }
    
    // 隐藏菜单
    const menu = document.getElementById('importExportMenu');
    if (menu) {
        menu.classList.remove('show');
    }
}

// 改进的导入功能
function showImportModalImproved() {
    const modal = document.getElementById('importModal');
    if (modal) {
        modal.style.display = 'block';
    } else {
        // 创建导入模态框
        createImportModal();
    }
    
    // 隐藏菜单
    const menu = document.getElementById('importExportMenu');
    if (menu) {
        menu.classList.remove('show');
    }
}

// 创建导入模态框
function createImportModal() {
    const modalHTML = `
        <div class="modal" id="importModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>批量导入客户</h3>
                    <span class="close" onclick="closeImportModalImproved()">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="import-section">
                        <h4>选择导入文件</h4>
                        <div class="file-upload-area" id="fileUploadArea">
                            <i class="fas fa-cloud-upload-alt fa-3x"></i>
                            <p>拖拽Excel文件到此处或点击选择文件</p>
                            <input type="file" id="importFileInput" accept=".xlsx,.xls,.csv" style="display: none;">
                            <button class="btn btn-secondary" onclick="document.getElementById('importFileInput').click()">
                                选择文件
                            </button>
                        </div>
                        <div class="file-info" id="fileInfo" style="display: none;"></div>
                    </div>
                    <div class="import-preview" id="importPreview" style="display: none;">
                        <h4>数据预览</h4>
                        <div class="preview-table-container">
                            <table class="preview-table" id="previewTable"></table>
                        </div>
                    </div>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeImportModalImproved()">取消</button>
                    <button type="button" class="btn btn-primary" id="confirmImportBtn" onclick="confirmImportImproved()" disabled>
                        确认导入
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    setupImportModal();
}

// 设置导入模态框
function setupImportModal() {
    const fileInput = document.getElementById('importFileInput');
    const uploadArea = document.getElementById('fileUploadArea');
    
    // 文件选择
    fileInput.onchange = function(e) {
        if (e.target.files.length > 0) {
            handleImportFile(e.target.files[0]);
        }
    };
    
    // 拖拽上传
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.style.backgroundColor = '#f0f8ff';
        uploadArea.style.border = '2px dashed #007bff';
    });
    
    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadArea.style.backgroundColor = '';
        uploadArea.style.border = '2px dashed #ddd';
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.style.backgroundColor = '';
        uploadArea.style.border = '2px dashed #ddd';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleImportFile(files[0]);
        }
    });
}

// 处理导入文件
async function handleImportFile(file) {
    const allowedTypes = ['.xlsx', '.xls', '.csv'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
        showNotification('请选择Excel或CSV文件', 'error');
        return;
    }
    
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${API_BASE_URL}/api/customers/import/preview`, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const result = await response.json();
            displayImportPreview(result.data, file.name);
            document.getElementById('confirmImportBtn').disabled = false;
        } else {
            const error = await response.json();
            showNotification(error.message || '文件解析失败', 'error');
        }
    } catch (error) {
        console.error('文件处理失败:', error);
        showNotification('文件处理失败', 'error');
    }
}

// 显示导入预览
function displayImportPreview(data, filename) {
    const fileInfo = document.getElementById('fileInfo');
    const preview = document.getElementById('importPreview');
    const table = document.getElementById('previewTable');
    
    // 显示文件信息
    fileInfo.innerHTML = `
        <div class="file-selected">
            <i class="fas fa-file-excel"></i>
            <span>${filename}</span>
            <span class="file-size">(${data.length} 条记录)</span>
        </div>
    `;
    fileInfo.style.display = 'block';
    
    // 显示数据预览
    if (data.length > 0) {
        const headers = Object.keys(data[0]);
        const headerRow = headers.map(h => `<th>${h}</th>`).join('');
        
        const rows = data.slice(0, 5).map(row => {
            const cells = headers.map(h => `<td>${row[h] || ''}</td>`).join('');
            return `<tr>${cells}</tr>`;
        }).join('');
        
        table.innerHTML = `
            <thead>
                <tr>${headerRow}</tr>
            </thead>
            <tbody>
                ${rows}
                ${data.length > 5 ? `<tr><td colspan="${headers.length}">... 还有 ${data.length - 5} 条记录</td></tr>` : ''}
            </tbody>
        `;
        
        preview.style.display = 'block';
        
        // 保存数据用于导入
        window.importData = data;
    }
}

// 确认导入
async function confirmImportImproved() {
    if (!window.importData || window.importData.length === 0) {
        showNotification('没有可导入的数据', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/customers/import`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                data: window.importData
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            showNotification(`成功导入 ${result.imported} 条客户记录`, 'success');
            closeImportModalImproved();
            if (typeof loadCustomers === 'function') {
                loadCustomers(); // 重新加载客户列表
            }
        } else {
            const error = await response.json();
            showNotification(error.message || '导入失败', 'error');
        }
    } catch (error) {
        console.error('导入失败:', error);
        showNotification('导入失败', 'error');
    }
}

// 关闭导入模态框
function closeImportModalImproved() {
    const modal = document.getElementById('importModal');
    if (modal) {
        modal.style.display = 'none';
        // 清理数据
        window.importData = null;
        document.getElementById('fileInfo').style.display = 'none';
        document.getElementById('importPreview').style.display = 'none';
        document.getElementById('confirmImportBtn').disabled = true;
    }
}

// 自定义销售方法功能

// 显示添加自定义销售方法模态框
function showAddCustomMethodModal() {
    const modalHTML = `
        <div class="modal" id="customMethodModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>添加自定义销售方法</h3>
                    <span class="close" onclick="closeCustomMethodModal()">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>方法名称:</label>
                        <input type="text" id="customMethodName" placeholder="例如: 顾问式销售法" required>
                    </div>
                    <div class="form-group">
                        <label>方法描述:</label>
                        <textarea id="customMethodDescription" placeholder="描述这个销售方法的特点和应用场景..." rows="4"></textarea>
                    </div>
                    <div class="form-group">
                        <label>提示词模板:</label>
                        <textarea id="customMethodPrompt" placeholder="输入该销售方法的AI提示词模板..." rows="6"></textarea>
                    </div>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeCustomMethodModal()">取消</button>
                    <button type="button" class="btn btn-primary" onclick="saveCustomMethod()">保存</button>
                </div>
            </div>
        </div>
    `;
    
    // 移除已存在的模态框
    const existingModal = document.getElementById('customMethodModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('customMethodModal').style.display = 'block';
}

// 保存自定义销售方法
function saveCustomMethod() {
    const name = document.getElementById('customMethodName').value.trim();
    const description = document.getElementById('customMethodDescription').value.trim();
    const prompt = document.getElementById('customMethodPrompt').value.trim();
    
    if (!name) {
        showNotification('请输入方法名称', 'error');
        return;
    }
    
    // 生成唯一键
    const key = 'custom_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // 检查是否已存在
    if (salesMethodologies && salesMethodologies[key] || customSalesMethodologies[key]) {
        showNotification('该销售方法已存在', 'error');
        return;
    }
    
    // 保存到自定义方法
    customSalesMethodologies[key] = name;
    
    // 保存到本地存储
    localStorage.setItem('customSalesMethodologies', JSON.stringify(customSalesMethodologies));
    
    // 如果有描述和提示词，保存到详细信息
    if (description || prompt) {
        const customMethodDetails = JSON.parse(localStorage.getItem('customMethodDetails') || '{}');
        customMethodDetails[key] = {
            description: description,
            prompt: prompt
        };
        localStorage.setItem('customMethodDetails', JSON.stringify(customMethodDetails));
    }
    
    // 重新初始化销售方法选择器
    if (typeof initializeSalesMethodologies === 'function') {
        initializeSalesMethodologies();
    }
    
    showNotification('自定义销售方法已添加', 'success');
    closeCustomMethodModal();
}

// 关闭自定义方法模态框
function closeCustomMethodModal() {
    const modal = document.getElementById('customMethodModal');
    if (modal) {
        modal.remove();
    }
}

// 改进的聊天功能

// 改进的发送AI聊天消息（带上下文）
async function sendAiMessageImproved() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message || !currentCustomer) {
        if (!currentCustomer) {
            alert('请先选择一个客户');
        }
        return;
    }
    
    const aiModel = document.getElementById('aiModelSelector').value;
    const salesMethod = document.getElementById('salesMethodologySelector').value;
    
    // 添加用户消息到聊天窗口和上下文
    addMessageToChatImproved('user', message);
    chatContext.push({ role: 'user', content: message });
    input.value = '';
    
    // 限制上下文长度（保留最近20条消息）
    if (chatContext.length > 20) {
        chatContext = chatContext.slice(-20);
    }
    
    // 显示加载状态
    const loadingMessage = addMessageToChatImproved('assistant', '正在思考中...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                customer_id: currentCustomer.id,
                ai_model: aiModel,
                sales_method: salesMethod,
                context: 'sales_advice',
                chat_history: chatContext.slice(0, -1) // 发送除当前消息外的历史记录
            })
        });
        
        const data = await response.json();
        
        // 移除加载消息
        loadingMessage.remove();
        
        if (data.success) {
            addMessageToChatImproved('assistant', data.response);
            // 添加AI回复到上下文
            chatContext.push({ role: 'assistant', content: data.response });
            // 保存聊天记录
            if (typeof saveChatRecord === 'function') {
                saveChatRecord(message, data.response);
            }
        } else {
            addMessageToChatImproved('assistant', '抱歉，AI服务暂时不可用: ' + data.message);
        }
    } catch (error) {
        console.error('AI聊天失败:', error);
        loadingMessage.remove();
        addMessageToChatImproved('assistant', '抱歉，发生了网络错误');
    }
}

// 改进的添加消息到聊天窗口
function addMessageToChatImproved(role, content) {
    // 优先使用新的聊天窗口
    let messagesContainer = document.getElementById('chatMessages');
    
    // 如果新窗口不存在，使用旧的
    if (!messagesContainer) {
        messagesContainer = document.getElementById('aiChatMessages');
    }
    
    if (!messagesContainer) {
        console.error('找不到聊天消息容器');
        return null;
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;
    
    if (role === 'user') {
        messageDiv.innerHTML = `
            <div class="message-content user-content">
                <p>${content}</p>
            </div>
            <div class="message-avatar user-avatar"><i class="fas fa-user"></i></div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="message-avatar"><i class="fas fa-robot"></i></div>
            <div class="message-content">
                <p>${content}</p>
            </div>
        `;
    }
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return messageDiv;
}

// 清空聊天记录（重写以包含上下文清理）
function clearAiChatImproved() {
    const messagesContainer = document.getElementById('aiChatMessages');
    if (messagesContainer) {
        messagesContainer.innerHTML = '';
    }
    
    // 清空聊天窗口
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.innerHTML = `
            <div class="message ai-message">
                <div class="message-avatar"><i class="fas fa-robot"></i></div>
                <div class="message-content">
                    <p>您好！我是您的AI销售助手。我会根据客户画像、沟通记录和您选择的销售方法论为您提供个性化的销售建议。请告诉我您需要什么帮助？</p>
                </div>
            </div>
        `;
    }
    
    // 清空上下文
    chatContext = [];
    if (typeof aiChatMessages !== 'undefined') {
        aiChatMessages = [];
    }
}

// 改进聊天输入框为可调整大小的文本域
function improveChatInput() {
    const chatInput = document.getElementById('chatInput');
    if (chatInput && chatInput.tagName === 'INPUT') {
        // 创建新的textarea
        const textarea = document.createElement('textarea');
        textarea.id = 'chatInput';
        textarea.placeholder = '输入您的问题或需求... (Shift+Enter换行，Enter发送)';
        textarea.rows = 3;
        textarea.style.cssText = `
            resize: vertical;
            min-height: 60px;
            max-height: 200px;
            font-family: inherit;
            font-size: inherit;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 8px 12px;
            width: 100%;
            box-sizing: border-box;
        `;
        
        // 替换原有input
        chatInput.parentNode.replaceChild(textarea, chatInput);
        
        // 重新绑定事件
        textarea.addEventListener('keypress', function(event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                if (typeof sendAiMessageImproved === 'function') {
                    sendAiMessageImproved();
                } else if (typeof sendAiMessage === 'function') {
                    sendAiMessage();
                }
            }
        });
        
        // 自动调整高度
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 200) + 'px';
        });
    }
}

// 添加清空聊天按钮
function addClearChatButton() {
    const chatPanel = document.querySelector('.ai-chat-panel h3');
    if (chatPanel && !document.getElementById('clearChatBtn')) {
        const clearBtn = document.createElement('button');
        clearBtn.id = 'clearChatBtn';
        clearBtn.className = 'btn btn-sm btn-secondary';
        clearBtn.innerHTML = '<i class="fas fa-trash"></i> 清空对话';
        clearBtn.style.cssText = 'margin-left: 10px; font-size: 12px; padding: 4px 8px;';
        clearBtn.onclick = function() {
            if (confirm('确定要清空当前对话吗？')) {
                clearAiChatImproved();
                if (typeof showNotification === 'function') {
                    showNotification('对话已清空', 'info');
                }
            }
        };
        chatPanel.appendChild(clearBtn);
    }
}

// 改进的客户详情渲染函数
function renderCustomerDetailImproved(customer) {
    // 设置可编辑的客户信息
    setEditableField('customerName', customer.name, 'name');
    setEditableField('customerIndustry', customer.industry || '未知行业', 'industry');
    setEditableField('customerPosition', customer.position || '未知职位', 'position');
    setEditableField('customerPhone', customer.phone || '未提供', 'phone');
    setEditableField('customerWechat', customer.wechat || '未提供', 'wechat');
    setEditableField('customerEmail', customer.email || '未提供', 'email');
    
    // 设置非编辑字段
    const priorityElement = document.getElementById('customerPriority');
    const folderElement = document.getElementById('customerFolder');
    if (priorityElement && typeof getPriorityText === 'function') {
        priorityElement.textContent = getPriorityText(customer.priority);
    }
    if (folderElement) {
        folderElement.textContent = customer.folder || '未分组';
    }
    
    // 设置头像并添加上传功能
    const photoElement = document.getElementById('customerPhoto');
    if (photoElement) {
        if (customer.photo_url) {
            photoElement.src = customer.photo_url;
        } else {
            photoElement.src = '/static/images/default-avatar.png';
        }
    }
    
    // 添加头像上传事件
    setupAvatarUpload();
}

// 初始化所有改进功能
function initializeImprovements() {
    // 改进聊天输入框
    setTimeout(improveChatInput, 100);
    
    // 添加清空聊天按钮
    setTimeout(addClearChatButton, 200);
    
    // 重写原有函数以使用改进版本
    if (typeof window !== 'undefined') {
        // 保存原有函数的引用
        window.originalFunctions = {
            createCommunicationItem: window.createCommunicationItem,
            renderCustomerDetail: window.renderCustomerDetail,
            exportCustomers: window.exportCustomers,
            showImportModal: window.showImportModal,
            sendAiMessage: window.sendAiMessage,
            clearAiChat: window.clearAiChat,
            addMessageToChat: window.addMessageToChat
        };
        
        // 使用改进版本替换原有函数
        window.createCommunicationItem = createCommunicationItemWithActions;
        window.renderCustomerDetail = renderCustomerDetailImproved;
        window.exportCustomers = exportCustomersImproved;
        window.showImportModal = showImportModalImproved;
        window.sendAiMessage = sendAiMessageImproved;
        window.clearAiChat = clearAiChatImproved;
        window.addMessageToChat = addMessageToChatImproved;
        
        // 暴露新函数到全局作用域
        window.editCommunicationRecord = editCommunicationRecord;
        window.updateCommunicationRecord = updateCommunicationRecord;
        window.deleteCommunicationRecord = deleteCommunicationRecord;
        window.showConfirmDeleteModal = showConfirmDeleteModal;
        window.closeConfirmDeleteModal = closeConfirmDeleteModal;
        window.confirmDeleteCommunication = confirmDeleteCommunication;
        window.showAddCustomMethodModal = showAddCustomMethodModal;
        window.saveCustomMethod = saveCustomMethod;
        window.closeCustomMethodModal = closeCustomMethodModal;
        window.closeImportModalImproved = closeImportModalImproved;
        window.confirmImportImproved = confirmImportImproved;
    }
}

// 当DOM加载完成后初始化改进功能
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeImprovements);
} else {
    initializeImprovements();
}

// 导出函数供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeImprovements,
        createCommunicationItemWithActions,
        renderCustomerDetailImproved,
        exportCustomersImproved,
        showImportModalImproved,
        sendAiMessageImproved,
        clearAiChatImproved,
        addMessageToChatImproved,
        editCommunicationRecord,
        updateCommunicationRecord,
        deleteCommunicationRecord,
        showAddCustomMethodModal,
        saveCustomMethod,
        closeCustomMethodModal
    };
}