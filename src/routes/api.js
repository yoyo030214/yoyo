const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// 模拟数据库
const users = [
  { id: 1, username: 'admin', password: 'admin123', role: '管理员', registerDate: '2025-01-15', status: '活跃' },
  { id: 2, username: 'zhangfamer', password: 'farmer123', role: '农户', registerDate: '2025-02-22', status: '活跃' },
  { id: 3, username: 'lixiaoming', password: 'customer123', role: '客户', registerDate: '2025-03-18', status: '待验证' }
];

const notifications = [
  { id: 1, title: '新订单通知', content: '您有一个新的订单已生成', date: '2025-04-15 14:22:31', read: false },
  { id: 2, title: '商品库存预警', content: '商品"有机大米"库存不足，请及时补货', date: '2025-04-14 09:15:48', read: true },
  { id: 3, title: '系统更新通知', content: '系统将于4月20日凌晨2点进行维护升级', date: '2025-04-13 16:30:22', read: false }
];

const statistics = {
  sales: {
    total: 128560.75,
    today: 2345.50,
    week: 15680.25,
    month: 68920.40
  },
  orders: {
    total: 1260,
    pending: 45,
    shipping: 78,
    completed: 1137
  },
  products: {
    total: 325,
    active: 280,
    outOfStock: 15,
    disabled: 30
  },
  users: {
    total: 1280,
    newToday: 28,
    active: 950,
    farmers: 80
  }
};

// 身份验证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader;

  if (!token) {
    return res.status(401).json({ message: '未授权访问' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: '令牌无效或已过期' });
    }
    
    req.user = user;
    next();
  });
};

// 登录路由
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  const user = users.find(u => u.username === username && u.password === password);
  
  if (!user) {
    return res.status(401).json({ message: '用户名或密码错误' });
  }
  
  // 创建JWT
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role }, 
    process.env.JWT_SECRET || 'your_jwt_secret_key', 
    { expiresIn: '1d' }
  );
  
  // 不返回密码
  const { password: _, ...userWithoutPassword } = user;
  
  res.json({
    success: true,
    token,
    user: userWithoutPassword
  });
});

// 注册路由
router.post('/register', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: '用户名和密码不能为空' });
  }
  
  // 检查用户名是否已存在
  if (users.some(u => u.username === username)) {
    return res.status(409).json({ message: '用户名已存在' });
  }
  
  // 创建新用户
  const newUser = {
    id: users.length + 1,
    username,
    password,
    role: '农户', // 默认为农户角色
    registerDate: new Date().toISOString().split('T')[0],
    status: '待验证'
  };
  
  users.push(newUser);
  
  res.status(201).json({
    success: true,
    message: '注册成功，等待验证'
  });
});

// 注销路由
router.post('/logout', authenticateToken, (req, res) => {
  // 在实际应用中，这里可能需要处理token黑名单等
  res.json({
    success: true,
    message: '已成功登出'
  });
});

// 获取当前用户信息
router.get('/users/current', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  
  if (!user) {
    return res.status(404).json({ message: '用户不存在' });
  }
  
  // 不返回密码
  const { password: _, ...userWithoutPassword } = user;
  
  res.json({
    success: true,
    data: userWithoutPassword
  });
});

// 获取用户列表
router.get('/users', authenticateToken, (req, res) => {
  // 检查权限
  if (req.user.role !== '管理员') {
    return res.status(403).json({ message: '没有权限访问' });
  }
  
  // 转换用户数据，移除密码
  const safeUsers = users.map(user => {
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  });
  
  res.json(safeUsers);
});

// 获取商品列表
router.get('/products', (req, res) => {
  const products = [
    { id: 1, name: '有机大米', price: 15.8, unit: 'kg', stock: 500, farmer: '张农户', status: '在售' },
    { id: 2, name: '绿色蔬菜礼盒', price: 68, unit: '盒', stock: 120, farmer: '李农户', status: '在售' },
    { id: 3, name: '土鸡蛋', price: 24.5, unit: '斤', stock: 200, farmer: '王农户', status: '在售' }
  ];
  
  res.json(products);
});

// 添加商品
router.post('/products', authenticateToken, (req, res) => {
  // 在实际应用中，这里需要处理表单数据和文件上传
  const { name, price, description } = req.body;
  
  // 输入验证
  if (!name || !price) {
    return res.status(400).json({ message: '商品名称和价格不能为空' });
  }
  
  // 创建新商品
  const newProduct = {
    id: Date.now(), // 使用时间戳作为临时ID
    name,
    price: parseFloat(price),
    description: description || '',
    unit: 'kg',
    stock: 100,
    farmer: req.user.username,
    status: '在售',
    createdAt: new Date().toISOString()
  };
  
  // 在实际应用中，这里需要保存到数据库
  
  res.status(201).json({
    success: true,
    message: '商品添加成功',
    data: newProduct
  });
});

// 更新商品
router.put('/products/:id', authenticateToken, (req, res) => {
  const productId = parseInt(req.params.id);
  const { name, price, description, status } = req.body;
  
  // 在实际应用中，这里需要从数据库查找和更新商品
  // 模拟更新
  const updatedProduct = {
    id: productId,
    name: name || '更新后的商品',
    price: price ? parseFloat(price) : 99.9,
    description: description || '商品描述已更新',
    unit: 'kg',
    stock: 200,
    farmer: req.user.username,
    status: status || '在售',
    updatedAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    message: '商品更新成功',
    data: updatedProduct
  });
});

// 删除商品
router.delete('/products/:id', authenticateToken, (req, res) => {
  const productId = parseInt(req.params.id);
  
  // 在实际应用中，这里需要从数据库删除商品
  
  res.json({
    success: true,
    message: '商品删除成功',
    productId
  });
});

// 获取通知
router.get('/notifications', authenticateToken, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  
  // 分页处理
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  const paginatedNotifications = notifications.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    total: notifications.length,
    page,
    pageSize,
    data: paginatedNotifications,
    unreadCount: notifications.filter(n => !n.read).length
  });
});

// 获取统计数据
router.get('/statistics', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: statistics
  });
});

// 获取政策
router.get('/policies', (req, res) => {
  const policies = [
    { id: 1, title: '2025年农业补贴政策', publishDate: '2025-03-15', category: '补贴政策', status: '已发布' },
    { id: 2, title: '耕地保护激励政策', publishDate: '2025-02-20', category: '保护政策', status: '已发布' },
    { id: 3, title: '农村人才引进计划', publishDate: '2025-04-01', category: '人才政策', status: '待审核' }
  ];
  
  res.json(policies);
});

// 获取订单
router.get('/orders', authenticateToken, (req, res) => {
  const orders = [
    { id: 'ORD20250415001', customer: '张三', amount: 126.5, orderTime: '2025-04-15 10:23', status: '已发货' },
    { id: 'ORD20250414002', customer: '李四', amount: 89.0, orderTime: '2025-04-14 16:45', status: '已付款' },
    { id: 'ORD20250413003', customer: '王五', amount: 230.0, orderTime: '2025-04-13 09:12', status: '待付款' }
  ];
  
  res.json(orders);
});

module.exports = router; 