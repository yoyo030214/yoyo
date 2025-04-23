/**
 * 商品表单脚本
 * 处理商品添加和编辑功能
 */

// 当前编辑的商品ID，如果是新增则为null
let currentProductId = null;

// 图片上传相关变量
let imageFile = null;
let imagePreviewUrl = '';

// 是否有未保存的更改
let hasUnsavedChanges = false;

// 当页面加载完成时初始化
document.addEventListener('DOMContentLoaded', function() {
    // 检查登录状态
    checkLoginStatus();
    
    // 获取URL参数，检查是否为编辑模式
    const urlParams = new URLSearchParams(window.location.search);
    currentProductId = urlParams.get('id');
    
    // 根据模式设置页面标题和按钮文本
    updatePageTitle();
    
    // 绑定表单提交事件
    bindFormEvents();
    
    // 加载商品数据（如果是编辑模式）
    if (currentProductId) {
        loadProductData();
    }
    
    // 绑定实时验证事件
    setupRealTimeValidation();
    
    // 设置页面离开提示
    setupPageLeaveWarning();
});

/**
 * 检查用户登录状态
 */
async function checkLoginStatus() {
    try {
        const isLoggedIn = window.MerchantAPI.isLoggedIn();
        if (!isLoggedIn) {
            // 未登录则跳转到登录页
            window.location.href = '/admin/login.html';
        } else {
            // 更新用户信息
            updateUserInfo();
        }
    } catch (error) {
        showAlert('检查登录状态失败: ' + error.message, 'danger');
    }
}

/**
 * 更新用户信息显示
 */
async function updateUserInfo() {
    try {
        const userInfoElement = document.getElementById('user-info');
        if (userInfoElement) {
            const merchantInfo = await window.MerchantAPI.getCurrentMerchant();
            userInfoElement.textContent = merchantInfo.username || '商家用户';
        }
    } catch (error) {
        console.error('获取用户信息失败:', error);
    }
}

/**
 * 更新页面标题和按钮文本
 */
function updatePageTitle() {
    const pageTitleElement = document.getElementById('page-title');
    const submitButton = document.getElementById('submit-btn');
    
    if (pageTitleElement) {
        pageTitleElement.textContent = currentProductId ? '编辑商品' : '添加商品';
    }
    
    if (submitButton) {
        submitButton.textContent = currentProductId ? '保存修改' : '添加商品';
    }
}

/**
 * 绑定表单事件
 */
function bindFormEvents() {
    // 表单提交事件
    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.addEventListener('submit', handleFormSubmit);
        
        // 监听表单变更以标记未保存更改
        productForm.addEventListener('input', function() {
            hasUnsavedChanges = true;
            updateSubmitButtonState();
        });
    }
    
    // 图片上传事件
    const imageInput = document.getElementById('product-image');
    if (imageInput) {
        imageInput.addEventListener('change', handleImageUpload);
        
        // 添加拖放支持
        setupDragAndDropForImages();
    }
    
    // 返回按钮事件
    const backButton = document.getElementById('back-btn');
    if (backButton) {
        backButton.addEventListener('click', function(e) {
            e.preventDefault();
            if (hasUnsavedChanges && !confirm('您有未保存的更改，确定要离开吗？')) {
                return;
            }
            window.location.href = '/admin/products.html';
        });
    }
    
    // 登出按钮
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // 价格输入优化
    const priceInput = document.getElementById('product-price');
    if (priceInput) {
        priceInput.addEventListener('input', function() {
            let value = this.value.replace(/[^\d.]/g, '');
            
            // 确保只有一个小数点
            const dotIndex = value.indexOf('.');
            if (dotIndex !== -1) {
                const intPart = value.substring(0, dotIndex);
                let decPart = value.substring(dotIndex + 1);
                
                // 限制小数位为两位
                if (decPart.length > 2) {
                    decPart = decPart.substring(0, 2);
                }
                
                value = intPart + '.' + decPart;
            }
            
            this.value = value;
        });
    }
    
    // 库存输入优化
    const stockInput = document.getElementById('product-stock');
    if (stockInput) {
        stockInput.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, '');
        });
    }
}

/**
 * 设置实时表单验证
 */
function setupRealTimeValidation() {
    const productName = document.getElementById('product-name');
    const productPrice = document.getElementById('product-price');
    const productStock = document.getElementById('product-stock');
    const productDescription = document.getElementById('product-description');
    
    if (productName) {
        productName.addEventListener('blur', function() {
            if (!this.value.trim()) {
                showFieldError(this, '商品名称不能为空');
            } else {
                clearFieldError(this);
            }
            updateSubmitButtonState();
        });
    }
    
    if (productPrice) {
        productPrice.addEventListener('blur', function() {
            const price = parseFloat(this.value);
            if (isNaN(price) || price <= 0) {
                showFieldError(this, '请输入有效的价格（大于0）');
            } else {
                clearFieldError(this);
            }
            updateSubmitButtonState();
        });
    }
    
    if (productStock) {
        productStock.addEventListener('blur', function() {
            const stock = parseInt(this.value);
            if (isNaN(stock) || stock < 0) {
                showFieldError(this, '库存不能为负数');
            } else {
                clearFieldError(this);
            }
            updateSubmitButtonState();
        });
    }
    
    if (productDescription) {
        productDescription.addEventListener('input', function() {
            const charCount = this.value.length;
            const maxLength = 500;
            const feedbackElement = this.nextElementSibling;
            
            if (feedbackElement) {
                feedbackElement.textContent = `${charCount}/${maxLength} 字符`;
                
                if (charCount > maxLength) {
                    feedbackElement.classList.add('text-danger');
                } else {
                    feedbackElement.classList.remove('text-danger');
                }
            }
        });
        
        // 触发一次事件以初始化计数器
        productDescription.dispatchEvent(new Event('input'));
    }
}

/**
 * 设置图片拖放功能
 */
function setupDragAndDropForImages() {
    const dropZone = document.querySelector('.image-upload-area');
    if (!dropZone) return;
    
    // 添加拖放相关类
    dropZone.classList.add('drop-zone');
    
    // 添加提示文字
    const promptElement = document.createElement('div');
    promptElement.className = 'drop-zone-prompt';
    promptElement.innerHTML = '<i class="bi bi-cloud-arrow-up"></i><br>点击或拖放图片到此处';
    dropZone.appendChild(promptElement);
    
    // 处理拖放事件
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropZone.classList.add('drop-zone-highlight');
    }
    
    function unhighlight() {
        dropZone.classList.remove('drop-zone-highlight');
    }
    
    dropZone.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files && files.length) {
            // 触发图片上传处理
            const imageInput = document.getElementById('product-image');
            imageInput.files = files;
            imageInput.dispatchEvent(new Event('change'));
        }
    }
    
    // 点击上传区域也触发文件选择
    dropZone.addEventListener('click', function() {
        document.getElementById('product-image').click();
    });
}

/**
 * 设置页面离开警告
 */
function setupPageLeaveWarning() {
    window.addEventListener('beforeunload', function(e) {
        if (hasUnsavedChanges) {
            const message = '您有未保存的更改，确定要离开吗？';
            e.returnValue = message;
            return message;
        }
    });
}

/**
 * 显示字段错误提示
 * @param {HTMLElement} field - 表单字段
 * @param {string} message - 错误信息
 */
function showFieldError(field, message) {
    field.classList.add('is-invalid');
    
    // 查找或创建反馈元素
    let feedbackElement = field.nextElementSibling;
    if (!feedbackElement || !feedbackElement.classList.contains('invalid-feedback')) {
        feedbackElement = document.createElement('div');
        feedbackElement.className = 'invalid-feedback';
        field.parentNode.insertBefore(feedbackElement, field.nextSibling);
    }
    
    feedbackElement.textContent = message;
}

/**
 * 清除字段错误提示
 * @param {HTMLElement} field - 表单字段
 */
function clearFieldError(field) {
    field.classList.remove('is-invalid');
    field.classList.add('is-valid');
    
    const feedbackElement = field.nextElementSibling;
    if (feedbackElement && feedbackElement.classList.contains('invalid-feedback')) {
        feedbackElement.textContent = '';
    }
}

/**
 * 更新提交按钮状态
 */
function updateSubmitButtonState() {
    const submitButton = document.getElementById('submit-btn');
    if (!submitButton) return;
    
    const hasErrors = document.querySelector('.is-invalid');
    
    if (hasErrors) {
        submitButton.disabled = true;
        submitButton.title = '请先修正表单错误';
    } else {
        submitButton.disabled = false;
        submitButton.title = currentProductId ? '保存修改' : '添加商品';
        
        // 如果有更改，突出显示提交按钮
        if (hasUnsavedChanges) {
            submitButton.classList.add('btn-primary');
            submitButton.classList.remove('btn-secondary');
        } else {
            submitButton.classList.add('btn-secondary');
            submitButton.classList.remove('btn-primary');
        }
    }
}

/**
 * 加载商品数据（编辑模式）
 */
async function loadProductData() {
    try {
        // 显示加载状态
        const form = document.getElementById('product-form');
        if (form) {
            form.classList.add('loading');
            
            // 禁用表单
            Array.from(form.elements).forEach(element => {
                element.disabled = true;
            });
        }
        
        // 获取商品详情
        const product = await window.MerchantAPI.getProduct(currentProductId);
        
        // 填充表单数据
        fillFormData(product);
        
    } catch (error) {
        showAlert('加载商品数据失败: ' + error.message, 'danger');
    } finally {
        // 移除加载状态
        const form = document.getElementById('product-form');
        if (form) {
            form.classList.remove('loading');
            
            // 启用表单
            Array.from(form.elements).forEach(element => {
                if (element.id !== 'submit-btn') {
                    element.disabled = false;
                }
            });
        }
    }
}

/**
 * 填充表单数据
 * @param {Object} product - 商品数据对象
 */
function fillFormData(product) {
    // 填充文本字段
    document.getElementById('product-name').value = product.name || '';
    document.getElementById('product-price').value = product.price || '';
    document.getElementById('product-stock').value = product.stock || '';
    document.getElementById('product-description').value = product.description || '';
    
    // 处理状态选择
    const statusSelect = document.getElementById('product-status');
    if (statusSelect) {
        Array.from(statusSelect.options).forEach(option => {
            if (option.value === product.status) {
                option.selected = true;
            }
        });
    }
    
    // 处理图片预览
    if (product.imageUrl) {
        imagePreviewUrl = product.imageUrl;
        updateImagePreview(product.imageUrl);
    }
}

/**
 * 处理图片上传
 * @param {Event} event - 上传事件对象
 */
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 检查文件类型
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        showAlert('请上传有效的图片文件（JPEG, PNG, GIF, WebP）', 'warning');
        return;
    }
    
    // 检查文件大小（限制为2MB）
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
        showAlert('图片大小不能超过2MB', 'warning');
        return;
    }
    
    // 保存文件
    imageFile = file;
    
    // 创建预览
    const reader = new FileReader();
    reader.onload = function(e) {
        imagePreviewUrl = e.target.result;
        updateImagePreview(imagePreviewUrl);
    };
    reader.readAsDataURL(file);
}

/**
 * 更新图片预览
 * @param {string} url - 图片URL
 */
function updateImagePreview(url) {
    const previewContainer = document.getElementById('image-preview');
    if (!previewContainer) return;
    
    // 清空预览容器
    previewContainer.innerHTML = '';
    
    if (url) {
        // 创建预览图片
        const img = document.createElement('img');
        img.src = url;
        img.className = 'img-thumbnail mt-2';
        img.style.maxHeight = '200px';
        
        // 图片加载失败处理
        img.onerror = function() {
            this.src = '/admin/img/image-error.png';
            this.alt = '图片加载失败';
        };
        
        // 添加加载效果
        img.style.opacity = '0';
        img.onload = function() {
            this.style.transition = 'opacity 0.3s';
            this.style.opacity = '1';
        };
        
        previewContainer.appendChild(img);
        
        // 添加图片信息
        const imageInfo = document.createElement('div');
        imageInfo.className = 'image-info small text-muted mt-1';
        
        // 如果是文件对象，显示文件信息
        if (imageFile) {
            const fileSize = formatFileSize(imageFile.size);
            imageInfo.textContent = `${imageFile.name} (${fileSize})`;
        } else {
            // 否则提取URL文件名
            const filename = url.split('/').pop();
            imageInfo.textContent = filename || '已上传图片';
        }
        
        previewContainer.appendChild(imageInfo);
        
        // 添加删除按钮
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'btn btn-sm btn-danger mt-2';
        removeBtn.innerHTML = '<i class="bi bi-trash"></i> 删除图片';
        removeBtn.addEventListener('click', function() {
            imageFile = null;
            imagePreviewUrl = '';
            previewContainer.innerHTML = '';
            document.getElementById('product-image').value = '';
            hasUnsavedChanges = true;
            updateSubmitButtonState();
        });
        previewContainer.appendChild(removeBtn);
    }
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的大小
 */
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
}

/**
 * 处理表单提交
 * @param {Event} event - 提交事件对象
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    
    // 获取表单数据
    const form = document.getElementById('product-form');
    const formData = new FormData(form);
    
    // 验证表单数据
    if (!validateForm(formData)) {
        return;
    }
    
    // 确认操作
    const confirmMessage = currentProductId ? '确定要保存对商品的修改吗？' : '确定要添加这个新商品吗？';
    if (!confirm(confirmMessage)) {
        return;
    }
    
    // 准备商品数据对象
    const productData = new FormData();
    productData.append('name', formData.get('product-name'));
    productData.append('price', parseFloat(formData.get('product-price')));
    productData.append('stock', parseInt(formData.get('product-stock')));
    productData.append('description', formData.get('product-description'));
    productData.append('status', formData.get('product-status'));
    
    try {
        // 禁用提交按钮
        const submitBtn = document.getElementById('submit-btn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> 处理中...';
        }
        
        // 显示加载状态
        form.classList.add('loading');
        showLoadingOverlay();
        
        // 处理图片上传
        if (imageFile) {
            productData.append('image', imageFile);
        } else if (imagePreviewUrl && imagePreviewUrl.startsWith('http')) {
            // 保留原有图片URL
            productData.append('imageUrl', imagePreviewUrl);
        }
        
        // 保存商品数据
        if (currentProductId) {
            // 编辑模式
            await window.MerchantAPI.updateProduct(currentProductId, productData);
            showAlert('商品已成功更新', 'success');
            hasUnsavedChanges = false;
        } else {
            // 新增模式
            await window.MerchantAPI.createProduct(productData);
            showAlert('商品已成功添加', 'success');
            
            // 清空表单
            form.reset();
            imageFile = null;
            imagePreviewUrl = '';
            document.getElementById('image-preview').innerHTML = '';
            hasUnsavedChanges = false;
            
            // 清除所有验证标记
            form.querySelectorAll('.is-valid, .is-invalid').forEach(element => {
                element.classList.remove('is-valid', 'is-invalid');
            });
        }
        
    } catch (error) {
        showAlert('保存商品失败: ' + error.message, 'danger');
    } finally {
        // 恢复提交按钮状态
        const submitBtn = document.getElementById('submit-btn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = currentProductId ? '保存修改' : '添加商品';
        }
        
        // 移除加载状态
        form.classList.remove('loading');
        hideLoadingOverlay();
        
        // 更新提交按钮状态
        updateSubmitButtonState();
    }
}

/**
 * 显示加载遮罩
 */
function showLoadingOverlay() {
    let overlay = document.getElementById('loading-overlay');
    
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">加载中...</span>
            </div>
            <div class="mt-2">处理中，请稍候...</div>
        `;
        document.body.appendChild(overlay);
    }
    
    overlay.style.display = 'flex';
}

/**
 * 隐藏加载遮罩
 */
function hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

/**
 * 验证表单数据
 * @param {FormData} formData - 表单数据
 * @returns {boolean} 验证结果
 */
function validateForm(formData) {
    // 验证商品名称
    const name = formData.get('product-name');
    if (!name || name.trim() === '') {
        showAlert('请输入商品名称', 'warning');
        document.getElementById('product-name').focus();
        return false;
    }
    
    // 验证价格
    const price = formData.get('product-price');
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        showAlert('请输入有效的商品价格', 'warning');
        document.getElementById('product-price').focus();
        return false;
    }
    
    // 验证库存
    const stock = formData.get('product-stock');
    if (!stock || isNaN(parseInt(stock)) || parseInt(stock) < 0) {
        showAlert('请输入有效的库存数量', 'warning');
        document.getElementById('product-stock').focus();
        return false;
    }
    
    return true;
}

/**
 * 处理用户登出
 */
async function handleLogout() {
    try {
        await window.MerchantAPI.logout();
        window.location.href = '/admin/login.html';
    } catch (error) {
        showAlert('登出失败: ' + error.message, 'danger');
    }
}

/**
 * 显示提示信息
 * @param {string} message - 提示消息
 * @param {string} type - 提示类型 (success, danger, warning, info)
 */
function showAlert(message, type = 'info') {
    const alertsContainer = document.getElementById('alerts-container');
    if (!alertsContainer) return;
    
    const alertId = 'alert-' + Date.now();
    const alertHtml = `
    <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
    `;
    
    alertsContainer.innerHTML += alertHtml;
    
    // 3秒后自动关闭
    setTimeout(() => {
        const alertElement = document.getElementById(alertId);
        if (alertElement) {
            // 使用Bootstrap的alert关闭方法
            const bsAlert = new bootstrap.Alert(alertElement);
            bsAlert.close();
        }
    }, 3000);
} 