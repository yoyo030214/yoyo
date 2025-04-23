/**
 * 商品列表处理脚本
 * 负责商品列表页面的加载、分页、搜索和操作
 */

// 全局变量
let currentPage = 1;
let totalPages = 1;
let pageSize = 10;
let products = [];
let searchKeyword = '';
let statusFilter = '';

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化页面
    initPage();
    
    // 绑定搜索按钮事件
    document.getElementById('searchBtn').addEventListener('click', function() {
        searchKeyword = document.getElementById('searchInput').value.trim();
        currentPage = 1;
        loadProducts();
    });
    
    // 绑定搜索输入框回车事件
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchKeyword = this.value.trim();
            currentPage = 1;
            loadProducts();
        }
    });
    
    // 绑定状态筛选事件
    document.getElementById('statusFilter').addEventListener('change', function() {
        statusFilter = this.value;
        currentPage = 1;
        loadProducts();
    });
    
    // 绑定添加商品按钮事件
    document.getElementById('addProductBtn').addEventListener('click', function() {
        window.location.href = 'product-form.html';
    });
    
    // 绑定批量操作按钮事件
    document.getElementById('batchActionBtn').addEventListener('click', handleBatchAction);
    
    // 绑定全选复选框事件
    document.getElementById('selectAll').addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('.product-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
        });
        updateBatchActionButton();
    });
});

/**
 * 初始化页面
 */
function initPage() {
    // 加载商品数据
    loadProducts();
    
    // 初始化分页控件
    initPagination();
}

/**
 * 加载商品数据
 */
async function loadProducts() {
    try {
        // 显示加载状态
        showLoading(true);
        
        // 准备查询参数
        const params = {
            page: currentPage,
            limit: pageSize
        };
        
        // 添加搜索关键词（如果有）
        if (searchKeyword) {
            params.keyword = searchKeyword;
        }
        
        // 添加状态筛选（如果有）
        if (statusFilter) {
            params.status = statusFilter;
        }
        
        // 发送API请求获取商品列表
        const response = await MerchantAPI.getProducts(params);
        
        // 更新全局数据
        products = response.data || [];
        totalPages = response.pagination ? response.pagination.totalPages : 1;
        
        // 渲染商品列表
        renderProductList(products);
        
        // 更新分页控件
        updatePagination();
        
        // 隐藏加载状态
        showLoading(false);
    } catch (error) {
        // 处理错误
        showLoading(false);
        showAlert('加载商品列表失败: ' + error.message, 'danger');
        console.error('加载商品列表失败:', error);
    }
}

/**
 * 渲染商品列表
 * @param {Array} products - 商品数据数组
 */
function renderProductList(products) {
    const tableBody = document.getElementById('productTableBody');
    
    // 清空现有内容
    tableBody.innerHTML = '';
    
    // 检查是否有数据
    if (!products || products.length === 0) {
        // 显示无数据提示
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">暂无商品数据</td>
            </tr>
        `;
        return;
    }
    
    // 渲染每个商品行
    products.forEach(product => {
        const row = document.createElement('tr');
        
        // 设置商品状态显示样式
        let statusClass = 'badge bg-secondary';
        let statusText = '未知';
        
        switch (product.status) {
            case 'active':
                statusClass = 'badge bg-success';
                statusText = '上架中';
                break;
            case 'inactive':
                statusClass = 'badge bg-warning text-dark';
                statusText = '已下架';
                break;
            case 'out_of_stock':
                statusClass = 'badge bg-danger';
                statusText = '缺货';
                break;
        }
        
        // 设置行内容
        row.innerHTML = `
            <td>
                <input type="checkbox" class="product-checkbox" data-id="${product.id}">
            </td>
            <td>${product.id}</td>
            <td class="product-name">
                <div class="d-flex align-items-center">
                    ${product.image ? `<img src="${product.image}" class="product-thumbnail me-2" alt="${product.name}">` : ''}
                    <span>${product.name}</span>
                </div>
            </td>
            <td>¥${parseFloat(product.price).toFixed(2)}</td>
            <td>${product.stock}</td>
            <td><span class="${statusClass}">${statusText}</span></td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button type="button" class="btn btn-primary edit-btn" data-id="${product.id}">
                        <i class="bi bi-pencil"></i> 编辑
                    </button>
                    <button type="button" class="btn btn-danger delete-btn" data-id="${product.id}">
                        <i class="bi bi-trash"></i> 删除
                    </button>
                </div>
            </td>
        `;
        
        // 添加到表格
        tableBody.appendChild(row);
    });
    
    // 绑定操作按钮事件
    bindActionButtons();
    
    // 绑定商品复选框事件
    bindCheckboxEvents();
}

/**
 * 绑定表格中的操作按钮事件
 */
function bindActionButtons() {
    // 绑定编辑按钮
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            window.location.href = `product-form.html?id=${productId}`;
        });
    });
    
    // 绑定删除按钮
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            confirmDeleteProduct(productId);
        });
    });
}

/**
 * 绑定商品复选框事件
 */
function bindCheckboxEvents() {
    document.querySelectorAll('.product-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', updateBatchActionButton);
    });
}

/**
 * 更新批量操作按钮状态
 */
function updateBatchActionButton() {
    const selectedCount = document.querySelectorAll('.product-checkbox:checked').length;
    const batchActionBtn = document.getElementById('batchActionBtn');
    const batchActionDropdown = document.getElementById('batchActionDropdown');
    
    if (selectedCount > 0) {
        batchActionBtn.textContent = `批量操作 (${selectedCount})`;
        batchActionBtn.disabled = false;
        batchActionDropdown.classList.remove('disabled');
    } else {
        batchActionBtn.textContent = '批量操作';
        batchActionBtn.disabled = true;
        batchActionDropdown.classList.add('disabled');
    }
}

/**
 * 处理批量操作
 */
function handleBatchAction() {
    const selectedAction = document.getElementById('batchActionSelect').value;
    const selectedIds = getSelectedProductIds();
    
    if (!selectedAction || selectedIds.length === 0) {
        return;
    }
    
    switch (selectedAction) {
        case 'delete':
            confirmBatchDelete(selectedIds);
            break;
        case 'active':
            updateProductsStatus(selectedIds, 'active');
            break;
        case 'inactive':
            updateProductsStatus(selectedIds, 'inactive');
            break;
    }
}

/**
 * 获取选中的商品ID数组
 * @returns {Array} 选中的商品ID数组
 */
function getSelectedProductIds() {
    const selectedIds = [];
    document.querySelectorAll('.product-checkbox:checked').forEach(checkbox => {
        selectedIds.push(checkbox.getAttribute('data-id'));
    });
    return selectedIds;
}

/**
 * 确认删除商品
 * @param {string} productId - 商品ID
 */
function confirmDeleteProduct(productId) {
    if (confirm('确定要删除该商品吗？此操作无法撤销。')) {
        deleteProduct(productId);
    }
}

/**
 * 确认批量删除商品
 * @param {Array} productIds - 商品ID数组
 */
function confirmBatchDelete(productIds) {
    if (confirm(`确定要删除选中的 ${productIds.length} 个商品吗？此操作无法撤销。`)) {
        batchDeleteProducts(productIds);
    }
}

/**
 * 删除单个商品
 * @param {string} productId - 商品ID
 */
async function deleteProduct(productId) {
    try {
        // 显示加载状态
        showLoading(true);
        
        // 发送删除请求
        await MerchantAPI.deleteProduct(productId);
        
        // 成功后重新加载列表
        showAlert('商品删除成功', 'success');
        loadProducts();
    } catch (error) {
        // 处理错误
        showLoading(false);
        showAlert('删除商品失败: ' + error.message, 'danger');
        console.error('删除商品失败:', error);
    }
}

/**
 * 批量删除商品
 * @param {Array} productIds - 商品ID数组
 */
async function batchDeleteProducts(productIds) {
    try {
        // 显示加载状态
        showLoading(true);
        
        // 使用Promise.all并行处理所有删除请求
        await Promise.all(productIds.map(id => MerchantAPI.deleteProduct(id)));
        
        // 成功后重新加载列表
        showAlert(`成功删除 ${productIds.length} 个商品`, 'success');
        loadProducts();
    } catch (error) {
        // 处理错误
        showLoading(false);
        showAlert('批量删除商品失败: ' + error.message, 'danger');
        console.error('批量删除商品失败:', error);
    }
}

/**
 * 更新商品状态
 * @param {Array} productIds - 商品ID数组
 * @param {string} status - 目标状态
 */
async function updateProductsStatus(productIds, status) {
    try {
        // 显示加载状态
        showLoading(true);
        
        // 获取状态文本
        let statusText = '更新';
        switch (status) {
            case 'active':
                statusText = '上架';
                break;
            case 'inactive':
                statusText = '下架';
                break;
        }
        
        // 使用Promise.all并行处理所有更新请求
        await Promise.all(productIds.map(id => {
            const formData = new FormData();
            formData.append('status', status);
            return MerchantAPI.updateProduct(id, formData);
        }));
        
        // 成功后重新加载列表
        showAlert(`成功${statusText} ${productIds.length} 个商品`, 'success');
        loadProducts();
    } catch (error) {
        // 处理错误
        showLoading(false);
        showAlert(`商品${statusText}失败: ` + error.message, 'danger');
        console.error(`商品${statusText}失败:`, error);
    }
}

/**
 * 初始化分页控件
 */
function initPagination() {
    // 上一页按钮
    document.getElementById('prevPageBtn').addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            loadProducts();
        }
    });
    
    // 下一页按钮
    document.getElementById('nextPageBtn').addEventListener('click', function() {
        if (currentPage < totalPages) {
            currentPage++;
            loadProducts();
        }
    });
}

/**
 * 更新分页控件
 */
function updatePagination() {
    const paginationInfo = document.getElementById('paginationInfo');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    
    // 更新分页信息
    paginationInfo.textContent = `第 ${currentPage} 页，共 ${totalPages} 页`;
    
    // 更新按钮状态
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;
}

/**
 * 显示加载状态
 * @param {boolean} isLoading - 是否显示加载状态
 */
function showLoading(isLoading) {
    const loadingSpinner = document.getElementById('loadingSpinner');
    
    if (isLoading) {
        loadingSpinner.classList.remove('d-none');
    } else {
        loadingSpinner.classList.add('d-none');
    }
}

/**
 * 显示提示消息
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型(success, info, warning, danger)
 */
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    
    // 创建警告元素
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type} alert-dismissible fade show`;
    alertElement.setAttribute('role', 'alert');
    
    // 设置消息内容
    alertElement.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // 添加到容器
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alertElement);
    
    // 自动关闭（5秒后）
    setTimeout(function() {
        if (alertElement.parentNode) {
            const bsAlert = new bootstrap.Alert(alertElement);
            bsAlert.close();
        }
    }, 5000);
} 