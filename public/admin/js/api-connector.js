/**
 * 商家管理系统API连接器
 * 提供与后端API交互的方法
 */

const merchantApi = {
    // API基础URL
    baseUrl: '/api',
    
    // 用户信息
    user: null,
    
    // 存储认证令牌
    token: localStorage.getItem('token'),
    
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
            headers['Authorization'] = `Bearer ${this.token}`;
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
        if (data && method === 'GET') {
            const params = new URLSearchParams();
            Object.keys(data).forEach(key => {
                if (data[key] !== null && data[key] !== undefined) {
                    params.append(key, data[key]);
                }
            });
            const queryString = params.toString();
            if (queryString) {
                url += '?' + queryString;
            }
        }
        
        try {
            const response = await fetch(url, options);
            
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
     * 登录
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @returns {Promise<object>} - 返回用户信息
     */
    async login(username, password) {
        const response = await this.request('/auth/login', 'POST', { username, password });
        if (response.token) {
            this.token = response.token;
            localStorage.setItem('token', this.token);
            this.user = response.user;
        }
        return response;
    },
    
    /**
     * 注销
     * @returns {Promise<void>}
     */
    async logout() {
        try {
            await this.request('/auth/logout', 'POST');
        } finally {
            this.token = null;
            this.user = null;
            localStorage.removeItem('token');
        }
    },
    
    /**
     * 检查登录状态
     * @returns {Promise<boolean>} - 返回是否已登录
     */
    async checkLoginStatus() {
        if (!this.token) {
            return false;
        }
        
        try {
            const response = await this.request('/auth/me', 'GET');
            if (response.user) {
                this.user = response.user;
                return true;
            }
            return false;
        } catch (error) {
            this.token = null;
            this.user = null;
            localStorage.removeItem('token');
            return false;
        }
    },
    
    /**
     * 获取商品列表
     * @param {number} page - 页码
     * @param {number} pageSize - 每页数量
     * @param {string} keyword - 搜索关键词
     * @returns {Promise<object>} - 返回商品列表数据
     */
    async getProducts(page = 1, pageSize = 10, keyword = '') {
        return await this.request('/products', 'GET', { page, pageSize, keyword });
    },
    
    /**
     * 获取商品详情
     * @param {string} productId - 商品ID
     * @returns {Promise<object>} - 返回商品详情
     */
    async getProductById(productId) {
        return await this.request(`/products/${productId}`, 'GET');
    },
    
    /**
     * 创建商品
     * @param {object} productData - 商品数据
     * @returns {Promise<object>} - 返回创建的商品
     */
    async createProduct(productData) {
        return await this.request('/products', 'POST', productData);
    },
    
    /**
     * 更新商品
     * @param {string} productId - 商品ID
     * @param {object} productData - 商品数据
     * @returns {Promise<object>} - 返回更新后的商品
     */
    async updateProduct(productId, productData) {
        return await this.request(`/products/${productId}`, 'PUT', productData);
    },
    
    /**
     * 更新商品状态
     * @param {string} productId - 商品ID
     * @param {string} status - 商品状态
     * @returns {Promise<object>} - 返回更新后的商品
     */
    async updateProductStatus(productId, status) {
        return await this.request(`/products/${productId}/status`, 'PATCH', { status });
    },
    
    /**
     * 删除商品
     * @param {string} productId - 商品ID
     * @returns {Promise<void>}
     */
    async deleteProduct(productId) {
        return await this.request(`/products/${productId}`, 'DELETE');
    },
    
    /**
     * 上传商品图片
     * @param {File} file - 图片文件
     * @returns {Promise<object>} - 返回上传后的图片URL
     */
    async uploadProductImage(file) {
        // 创建FormData对象
        const formData = new FormData();
        formData.append('image', file);
        
        const url = this.baseUrl + '/upload/image';
        const headers = {};
        
        // 如果有令牌，添加到请求头
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        const options = {
            method: 'POST',
            headers,
            body: formData,
            credentials: 'include'
        };
        
        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    throw new Error(`上传失败，状态码: ${response.status}`);
                }
                throw new Error(errorData.message || `上传失败，状态码: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('上传图片错误:', error);
            throw error;
        }
    },
    
    /**
     * 获取订单列表
     * @param {number} page - 页码
     * @param {number} pageSize - 每页数量
     * @param {string} status - 订单状态
     * @returns {Promise<object>} - 返回订单列表数据
     */
    async getOrders(page = 1, pageSize = 10, status = '') {
        return await this.request('/orders', 'GET', { page, pageSize, status });
    },
    
    /**
     * 获取订单详情
     * @param {string} orderId - 订单ID
     * @returns {Promise<object>} - 返回订单详情
     */
    async getOrderById(orderId) {
        return await this.request(`/orders/${orderId}`, 'GET');
    },
    
    /**
     * 更新订单状态
     * @param {string} orderId - 订单ID
     * @param {string} status - 订单状态
     * @returns {Promise<object>} - 返回更新后的订单
     */
    async updateOrderStatus(orderId, status) {
        return await this.request(`/orders/${orderId}/status`, 'PATCH', { status });
    },
    
    /**
     * 获取统计数据
     * @param {string} timeRange - 时间范围
     * @returns {Promise<object>} - 返回统计数据
     */
    async getStatistics(timeRange = 'week') {
        return await this.request('/statistics', 'GET', { timeRange });
    }
};

// 如果是开发环境，可以为API添加模拟数据
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('使用模拟数据');
    
    // 覆盖API方法，使用模拟数据
    Object.assign(merchantApi, {
        // 模拟产品数据
        mockProducts: [
            { id: '1', name: '有机蔬菜套餐', price: 39.9, stock: 100, status: '在售', imageUrl: 'img/product-1.jpg' },
            { id: '2', name: '新鲜水果礼盒', price: 89.9, stock: 50, status: '在售', imageUrl: 'img/product-2.jpg' },
            { id: '3', name: '优质大米5kg', price: 49.9, stock: 200, status: '在售', imageUrl: 'img/product-3.jpg' },
            { id: '4', name: '土鸡蛋30枚', price: 29.9, stock: 80, status: '已下架', imageUrl: 'img/product-4.jpg' },
        ],
        
        // 模拟用户数据
        mockUser: { id: '1', username: '示例商家', role: 'merchant' },
        
        // 覆盖登录方法
        async login(username, password) {
            if (username === 'admin' && password === 'admin') {
                this.user = this.mockUser;
                this.token = 'mock-token';
                localStorage.setItem('token', this.token);
                return { user: this.user, token: this.token };
            }
            throw new Error('用户名或密码错误');
        },
        
        // 覆盖检查登录状态方法
        async checkLoginStatus() {
            if (this.token) {
                this.user = this.mockUser;
                return true;
            }
            return false;
        },
        
        // 覆盖获取商品列表方法
        async getProducts(page = 1, pageSize = 10, keyword = '') {
            let filteredProducts = [...this.mockProducts];
            
            // 如果有关键词，筛选商品
            if (keyword) {
                filteredProducts = filteredProducts.filter(product => 
                    product.name.toLowerCase().includes(keyword.toLowerCase())
                );
            }
            
            // 计算分页
            const total = filteredProducts.length;
            const start = (page - 1) * pageSize;
            const end = start + pageSize;
            const products = filteredProducts.slice(start, end);
            
            return {
                products,
                total,
                page,
                pageSize
            };
        },
        
        // 覆盖获取商品详情方法
        async getProductById(productId) {
            const product = this.mockProducts.find(p => p.id === productId);
            if (!product) {
                throw new Error('商品不存在');
            }
            return { product };
        },
        
        // 覆盖创建商品方法
        async createProduct(productData) {
            const newProduct = {
                id: String(this.mockProducts.length + 1),
                ...productData,
                status: '在售'
            };
            this.mockProducts.push(newProduct);
            return { product: newProduct };
        },
        
        // 覆盖更新商品方法
        async updateProduct(productId, productData) {
            const index = this.mockProducts.findIndex(p => p.id === productId);
            if (index === -1) {
                throw new Error('商品不存在');
            }
            
            const updatedProduct = {
                ...this.mockProducts[index],
                ...productData
            };
            this.mockProducts[index] = updatedProduct;
            
            return { product: updatedProduct };
        },
        
        // 覆盖更新商品状态方法
        async updateProductStatus(productId, status) {
            const index = this.mockProducts.findIndex(p => p.id === productId);
            if (index === -1) {
                throw new Error('商品不存在');
            }
            
            this.mockProducts[index].status = status;
            
            return { product: this.mockProducts[index] };
        },
        
        // 覆盖上传商品图片方法
        async uploadProductImage(file) {
            // 模拟上传延迟
            await new Promise(resolve => setTimeout(resolve, 500));
            
            return {
                imageUrl: 'img/product-' + Math.ceil(Math.random() * 4) + '.jpg'
            };
        }
    });
} 