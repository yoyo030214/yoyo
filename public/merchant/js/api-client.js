/**
 * 助农商城会员中心API客户端
 * 提供与后端API交互的方法
 */

const memberApi = {
    // API基础URL
    baseUrl: '/api',
    
    // 用户信息
    user: null,
    
    // 存储认证令牌
    token: localStorage.getItem('member_token'),
    
    /**
     * 发送API请求
     * @param {string} endpoint - API端点
     * @param {string} method - 请求方法
     * @param {object} data - 请求数据
     * @returns {Promise<object>} - 返回API响应
     */
    async request(endpoint, method = 'GET', data = null) {
        const url = this.baseUrl + endpoint;
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // 如果有令牌，添加到请求头
        if (this.token) {
            headers['Authorization'] = this.token;
        }
        
        const options = {
            method,
            headers,
            credentials: 'include'
        };
        
        // 如果有数据且不是GET请求，添加请求体
        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }
        
        // 如果是GET请求且有数据，将数据作为查询参数添加到URL
        let finalUrl = url;
        if (data && method === 'GET') {
            const params = new URLSearchParams();
            Object.keys(data).forEach(key => {
                if (data[key] !== null && data[key] !== undefined) {
                    params.append(key, data[key]);
                }
            });
            const queryString = params.toString();
            if (queryString) {
                finalUrl += '?' + queryString;
            }
        }
        
        try {
            const response = await fetch(finalUrl, options);
            
            // 如果响应不成功，抛出错误
            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    throw new Error(`请求失败，状态码: ${response.status}`);
                }
                throw new Error(errorData.message || `请求失败，状态码: ${response.status}`);
            }
            
            // 如果是204 No Content，返回空对象
            if (response.status === 204) {
                return {};
            }
            
            return await response.json();
        } catch (error) {
            console.error('API请求错误:', error);
            throw error;
        }
    },
    
    /**
     * 会员注册
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @param {string} phone - 手机号
     * @param {string} email - 邮箱(可选)
     * @returns {Promise<object>} - 返回注册结果
     */
    async register(username, password, phone, email = '') {
        const response = await this.request('/member/register', 'POST', { 
            username, 
            password, 
            phone, 
            email 
        });
        
        if (response.token) {
            this.token = response.token;
            localStorage.setItem('member_token', this.token);
            this.user = response.user;
        }
        
        return response;
    },
    
    /**
     * 会员登录
     * @param {string} username - 用户名或手机号
     * @param {string} password - 密码
     * @returns {Promise<object>} - 返回登录结果
     */
    async login(username, password) {
        const response = await this.request('/member/login', 'POST', { username, password });
        
        if (response.token) {
            this.token = response.token;
            localStorage.setItem('member_token', this.token);
            this.user = response.user;
        }
        
        return response;
    },
    
    /**
     * 会员退出登录
     * @returns {Promise<void>}
     */
    async logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('member_token');
    },
    
    /**
     * 检查会员登录状态
     * @returns {boolean} - 返回是否登录
     */
    isLoggedIn() {
        return !!this.token;
    },
    
    /**
     * 获取会员个人信息
     * @returns {Promise<object>} - 返回会员信息
     */
    async getProfile() {
        if (!this.isLoggedIn()) {
            throw new Error('未登录');
        }
        
        const response = await this.request('/member/profile', 'GET');
        return response.data;
    },
    
    /**
     * 更新会员个人信息
     * @param {object} profileData - 会员信息数据
     * @returns {Promise<object>} - 返回更新结果
     */
    async updateProfile(profileData) {
        if (!this.isLoggedIn()) {
            throw new Error('未登录');
        }
        
        const response = await this.request('/member/profile', 'PUT', profileData);
        return response;
    },
    
    /**
     * 获取会员积分历史
     * @returns {Promise<object>} - 返回积分历史记录
     */
    async getPointsHistory() {
        if (!this.isLoggedIn()) {
            throw new Error('未登录');
        }
        
        const response = await this.request('/member/points/history', 'GET');
        return response.data;
    },
    
    /**
     * 获取会员收货地址列表
     * @returns {Promise<Array>} - 返回地址列表
     */
    async getAddresses() {
        if (!this.isLoggedIn()) {
            throw new Error('未登录');
        }
        
        const response = await this.request('/member/addresses', 'GET');
        return response.data;
    },
    
    /**
     * 添加会员收货地址
     * @param {object} addressData - 地址数据
     * @returns {Promise<object>} - 返回添加结果
     */
    async addAddress(addressData) {
        if (!this.isLoggedIn()) {
            throw new Error('未登录');
        }
        
        const response = await this.request('/member/addresses', 'POST', addressData);
        return response;
    },
    
    /**
     * 更新会员收货地址
     * @param {number} addressId - 地址ID
     * @param {object} addressData - 地址数据
     * @returns {Promise<object>} - 返回更新结果
     */
    async updateAddress(addressId, addressData) {
        if (!this.isLoggedIn()) {
            throw new Error('未登录');
        }
        
        const response = await this.request(`/member/addresses/${addressId}`, 'PUT', addressData);
        return response;
    },
    
    /**
     * 删除会员收货地址
     * @param {number} addressId - 地址ID
     * @returns {Promise<object>} - 返回删除结果
     */
    async deleteAddress(addressId) {
        if (!this.isLoggedIn()) {
            throw new Error('未登录');
        }
        
        const response = await this.request(`/member/addresses/${addressId}`, 'DELETE');
        return response;
    },
    
    /**
     * 获取会员收藏列表
     * @returns {Promise<Array>} - 返回收藏列表
     */
    async getFavorites() {
        if (!this.isLoggedIn()) {
            throw new Error('未登录');
        }
        
        const response = await this.request('/member/favorites', 'GET');
        return response.data;
    },
    
    /**
     * 添加收藏
     * @param {number} productId - 商品ID
     * @returns {Promise<object>} - 返回添加结果
     */
    async addFavorite(productId) {
        if (!this.isLoggedIn()) {
            throw new Error('未登录');
        }
        
        const response = await this.request('/member/favorites', 'POST', { productId });
        return response;
    },
    
    /**
     * 删除收藏
     * @param {number} favoriteId - 收藏ID
     * @returns {Promise<object>} - 返回删除结果
     */
    async deleteFavorite(favoriteId) {
        if (!this.isLoggedIn()) {
            throw new Error('未登录');
        }
        
        const response = await this.request(`/member/favorites/${favoriteId}`, 'DELETE');
        return response;
    },
    
    /**
     * 获取会员优惠券列表
     * @param {string} status - 状态筛选(可选)
     * @returns {Promise<Array>} - 返回优惠券列表
     */
    async getCoupons(status = '') {
        if (!this.isLoggedIn()) {
            throw new Error('未登录');
        }
        
        const params = status ? { status } : {};
        const response = await this.request('/member/coupons', 'GET', params);
        return response.data;
    },
    
    /**
     * 领取优惠券
     * @param {number} couponId - 优惠券ID
     * @returns {Promise<object>} - 返回领取结果
     */
    async claimCoupon(couponId) {
        if (!this.isLoggedIn()) {
            throw new Error('未登录');
        }
        
        const response = await this.request('/member/coupons/claim', 'POST', { couponId });
        return response;
    },
    
    /**
     * 获取会员订单列表
     * @param {object} params - 查询参数
     * @returns {Promise<Array>} - 返回订单列表
     */
    async getOrders(params = {}) {
        if (!this.isLoggedIn()) {
            throw new Error('未登录');
        }
        
        const response = await this.request('/member/orders', 'GET', params);
        return response.data;
    },
    
    /**
     * 获取商品列表
     * @param {object} params - 查询参数
     * @returns {Promise<Array>} - 返回商品列表
     */
    async getProducts(params = {}) {
        const response = await this.request('/products', 'GET', params);
        return response;
    },
    
    /**
     * 获取商品详情
     * @param {number} productId - 商品ID
     * @returns {Promise<object>} - 返回商品详情
     */
    async getProductDetail(productId) {
        const response = await this.request(`/products/${productId}`, 'GET');
        return response;
    },
    
    /**
     * 创建订单
     * @param {object} orderData - 订单数据
     * @returns {Promise<object>} - 返回创建结果
     */
    async createOrder(orderData) {
        if (!this.isLoggedIn()) {
            throw new Error('未登录');
        }
        
        const response = await this.request('/member/orders', 'POST', orderData);
        return response;
    }
};

// 导出API对象
window.memberApi = memberApi; 