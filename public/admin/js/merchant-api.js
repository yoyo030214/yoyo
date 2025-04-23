/**
 * 商家管理系统API接口
 * 封装与后端API的所有交互
 */

// API基础URL
const API_BASE_URL = '/api/merchant';

// 请求超时时间(毫秒)
const REQUEST_TIMEOUT = 30000;

/**
 * 通用API请求方法
 * @param {string} endpoint - API端点路径
 * @param {string} method - HTTP方法(GET, POST, PUT, DELETE等)
 * @param {Object} data - 请求数据
 * @param {boolean} isFormData - 是否为FormData格式
 * @returns {Promise} - 返回请求Promise
 */
async function apiRequest(endpoint, method = 'GET', data = null, isFormData = false) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // 设置请求头
    const headers = {
        'Authorization': `Bearer ${getAuthToken()}`
    };
    
    // 如果不是FormData则设置Content-Type
    if (!isFormData && method !== 'GET') {
        headers['Content-Type'] = 'application/json';
    }
    
    // 设置请求选项
    const options = {
        method: method,
        headers: headers,
        credentials: 'include',
    };
    
    // 添加请求体(如果有)
    if (data) {
        if (method === 'GET') {
            // 对于GET请求，将数据添加到URL参数
            const params = new URLSearchParams(data);
            url = `${url}?${params.toString()}`;
        } else if (isFormData) {
            // 如果是FormData则直接使用
            options.body = data;
        } else {
            // 否则将数据转为JSON
            options.body = JSON.stringify(data);
        }
    }
    
    try {
        // 设置请求超时
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('请求超时')), REQUEST_TIMEOUT);
        });
        
        // 发送请求
        const responsePromise = fetch(url, options);
        const response = await Promise.race([responsePromise, timeoutPromise]);
        
        // 解析响应
        const responseData = await response.json();
        
        // 检查API响应状态
        if (!response.ok) {
            throw new Error(responseData.message || '请求失败');
        }
        
        return responseData;
    } catch (error) {
        console.error('API请求错误:', error);
        throw error;
    }
}

/**
 * 从localStorage获取认证令牌
 * @returns {string} 认证令牌
 */
function getAuthToken() {
    return localStorage.getItem('auth_token') || '';
}

/**
 * 设置认证令牌到localStorage
 * @param {string} token - 认证令牌
 */
function setAuthToken(token) {
    localStorage.setItem('auth_token', token);
}

/**
 * 清除认证令牌
 */
function clearAuthToken() {
    localStorage.removeItem('auth_token');
}

/**
 * 检查用户是否已登录
 * @returns {boolean} 是否已登录
 */
function isLoggedIn() {
    const token = getAuthToken();
    return !!token;
}

/**
 * 商家登录
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise} - 返回登录Promise
 */
async function login(username, password) {
    const response = await apiRequest('/auth/login', 'POST', { username, password });
    
    if (response.token) {
        setAuthToken(response.token);
        return response;
    }
    
    throw new Error('登录失败');
}

/**
 * 商家登出
 * @returns {Promise} - 返回登出Promise
 */
async function logout() {
    try {
        await apiRequest('/auth/logout', 'POST');
    } finally {
        clearAuthToken();
    }
}

/**
 * 获取当前登录商家信息
 * @returns {Promise} - 返回商家信息Promise
 */
async function getCurrentMerchant() {
    return await apiRequest('/profile', 'GET');
}

/**
 * 更新商家信息
 * @param {Object} merchantData - 商家数据
 * @returns {Promise} - 返回更新Promise
 */
async function updateMerchantProfile(merchantData) {
    return await apiRequest('/profile', 'PUT', merchantData);
}

/**
 * 获取商品列表
 * @param {Object} params - 查询参数
 * @returns {Promise} - 返回商品列表Promise
 */
async function getProducts(params = {}) {
    return await apiRequest('/products', 'GET', params);
}

/**
 * 获取单个商品详情
 * @param {number} productId - 商品ID
 * @returns {Promise} - 返回商品详情Promise
 */
async function getProduct(productId) {
    return await apiRequest(`/products/${productId}`, 'GET');
}

/**
 * 创建新商品
 * @param {FormData} productData - 商品数据(FormData格式)
 * @returns {Promise} - 返回创建Promise
 */
async function createProduct(productData) {
    return await apiRequest('/products', 'POST', productData, true);
}

/**
 * 更新商品信息
 * @param {number} productId - 商品ID
 * @param {FormData} productData - 商品数据(FormData格式)
 * @returns {Promise} - 返回更新Promise
 */
async function updateProduct(productId, productData) {
    return await apiRequest(`/products/${productId}`, 'PUT', productData, true);
}

/**
 * 删除商品
 * @param {number} productId - 商品ID
 * @returns {Promise} - 返回删除Promise
 */
async function deleteProduct(productId) {
    return await apiRequest(`/products/${productId}`, 'DELETE');
}

/**
 * 获取订单列表
 * @param {Object} params - 查询参数
 * @returns {Promise} - 返回订单列表Promise
 */
async function getOrders(params = {}) {
    return await apiRequest('/orders', 'GET', params);
}

/**
 * 获取单个订单详情
 * @param {number} orderId - 订单ID
 * @returns {Promise} - 返回订单详情Promise
 */
async function getOrder(orderId) {
    return await apiRequest(`/orders/${orderId}`, 'GET');
}

/**
 * 更新订单状态
 * @param {number} orderId - 订单ID
 * @param {string} status - 订单状态
 * @returns {Promise} - 返回更新Promise
 */
async function updateOrderStatus(orderId, status) {
    return await apiRequest(`/orders/${orderId}/status`, 'PUT', { status });
}

// 导出API函数
window.MerchantAPI = {
    isLoggedIn,
    login,
    logout,
    getCurrentMerchant,
    updateMerchantProfile,
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    getOrders,
    getOrder,
    updateOrderStatus
}; 