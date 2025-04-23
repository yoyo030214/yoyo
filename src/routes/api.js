const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// 模拟数据库
const users = [
  { id: 1, username: 'admin', password: '123456', role: '管理员', registerDate: '2025-01-15', status: '活跃' },
  { id: 2, username: 'zhangfamer', password: '123456', role: '农户', registerDate: '2025-02-22', status: '活跃' },
  { id: 3, username: 'lixiaoming', password: '123456', role: '客户', registerDate: '2025-03-18', status: '待验证' }
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

// 模拟用户会员系统数据
const members = [
  { 
    id: 1, 
    userId: 'U456789', 
    username: 'zhang123', 
    nickname: '张小农', 
    phone: '13800138000', 
    email: 'zhang@example.com',
    avatar: '/static/images/avatars/user1.jpg',
    level: 2,
    points: 350,
    registerDate: '2025-01-20',
    lastLoginDate: '2025-04-22',
    status: '活跃',
    helpFarmers: 28,
    savedCrops: 120,
    coveredVillages: 5
  },
  { 
    id: 2, 
    userId: 'U567890', 
    username: 'wang456', 
    nickname: '王二农', 
    phone: '13900139000', 
    email: 'wang@example.com',
    avatar: '/static/images/avatars/user2.jpg',
    level: 1,
    points: 120,
    registerDate: '2025-02-15',
    lastLoginDate: '2025-04-20',
    status: '活跃',
    helpFarmers: 10,
    savedCrops: 45,
    coveredVillages: 2
  },
  { 
    id: 3, 
    userId: 'U678901', 
    username: 'li789', 
    nickname: '李三村', 
    phone: '13700137000', 
    email: 'li@example.com',
    avatar: '/static/images/avatars/user3.jpg',
    level: 3,
    points: 580,
    registerDate: '2025-01-05',
    lastLoginDate: '2025-04-21',
    status: '活跃',
    helpFarmers: 45,
    savedCrops: 200,
    coveredVillages: 8
  }
];

// 会员等级体系
const memberLevels = [
  { level: 1, name: '助农新手', pointsNeeded: 0, description: '基础会员权益', discount: 0 },
  { level: 2, name: '助农达人', pointsNeeded: 200, description: '95折会员优惠', discount: 5 },
  { level: 3, name: '助农专家', pointsNeeded: 500, description: '9折会员优惠+免运费', discount: 10 },
  { level: 4, name: '助农大使', pointsNeeded: 1000, description: '85折会员优惠+免运费+专属客服', discount: 15 }
];

// 用户地址数据
const addresses = [
  { 
    id: 1, 
    userId: 1, 
    name: '张小农', 
    phone: '13800138000', 
    province: '江苏省', 
    city: '南京市', 
    district: '鼓楼区', 
    address: '中央路123号', 
    isDefault: true 
  },
  { 
    id: 2, 
    userId: 1, 
    name: '张先生', 
    phone: '13800138001', 
    province: '江苏省', 
    city: '南京市', 
    district: '玄武区', 
    address: '北京东路45号', 
    isDefault: false 
  },
  { 
    id: 3, 
    userId: 2, 
    name: '王二农', 
    phone: '13900139000', 
    province: '浙江省', 
    city: '杭州市', 
    district: '西湖区', 
    address: '西湖文化广场15号', 
    isDefault: true 
  }
];

// 收藏夹数据
const favorites = [
  { id: 1, userId: 1, productId: 1, addTime: '2025-03-15 14:22:31' },
  { id: 2, userId: 1, productId: 3, addTime: '2025-03-16 09:15:48' },
  { id: 3, userId: 2, productId: 2, addTime: '2025-03-14 16:30:22' }
];

// 用户优惠券数据
const coupons = [
  { 
    id: 1, 
    userId: 1, 
    name: '新人优惠券', 
    type: '满减', 
    value: 10, 
    minSpend: 100, 
    startDate: '2025-04-01', 
    endDate: '2025-04-30', 
    status: '未使用' 
  },
  { 
    id: 2, 
    userId: 1, 
    name: '生日特惠券', 
    type: '折扣', 
    value: 20, 
    minSpend: 50, 
    startDate: '2025-04-10', 
    endDate: '2025-05-10', 
    status: '未使用' 
  },
  { 
    id: 3, 
    userId: 2, 
    name: '会员日优惠券', 
    type: '满减', 
    value: 15, 
    minSpend: 120, 
    startDate: '2025-04-05', 
    endDate: '2025-04-15', 
    status: '已使用' 
  }
];

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

// 政策抓取脚本模型
const policyScrapers = [
  { 
    id: 1, 
    name: '农业农村部网站抓取', 
    url: 'https://www.moa.gov.cn/gk/', 
    selector: '.news-list li', 
    interval: 'daily', 
    category: '农业政策',
    lastRun: '2025-04-20',
    status: '活跃'
  },
  { 
    id: 2, 
    name: '地方农业厅网站抓取', 
    url: 'https://nyt.jiangsu.gov.cn/col/col70205/', 
    selector: '.news_item', 
    interval: 'weekly', 
    category: '地方政策',
    lastRun: '2025-04-18',
    status: '活跃'
  },
  { 
    id: 3, 
    name: '农业科技信息网', 
    url: 'https://www.agri.cn/Vkeyword2=政策', 
    selector: '.list-item', 
    interval: 'daily', 
    category: '科技政策',
    lastRun: '2025-04-21',
    status: '暂停'
  }
];

// 获取所有政策抓取脚本
router.get('/policy-scrapers', authenticateToken, (req, res) => {
  // 检查权限（仅管理员可查看）
  if (req.user.role !== '管理员') {
    return res.status(403).json({ message: '没有权限访问' });
  }
  
  res.json({
    success: true,
    data: policyScrapers
  });
});

// 获取单个政策抓取脚本
router.get('/policy-scrapers/:id', authenticateToken, (req, res) => {
  // 检查权限（仅管理员可查看）
  if (req.user.role !== '管理员') {
    return res.status(403).json({ message: '没有权限访问' });
  }
  
  const scraperId = parseInt(req.params.id);
  const scraper = policyScrapers.find(s => s.id === scraperId);
  
  if (!scraper) {
    return res.status(404).json({ message: '抓取脚本不存在' });
  }
  
  res.json({
    success: true,
    data: scraper
  });
});

// 创建政策抓取脚本
router.post('/policy-scrapers', authenticateToken, (req, res) => {
  // 检查权限（仅管理员可创建）
  if (req.user.role !== '管理员') {
    return res.status(403).json({ message: '没有权限创建' });
  }
  
  const { name, url, selector, interval, category } = req.body;
  
  // 输入验证
  if (!name || !url || !selector || !interval || !category) {
    return res.status(400).json({ message: '所有字段都是必填的' });
  }
  
  // 创建新脚本
  const newScraper = {
    id: policyScrapers.length + 1,
    name,
    url,
    selector,
    interval,
    category,
    lastRun: new Date().toISOString().split('T')[0],
    status: '活跃'
  };
  
  policyScrapers.push(newScraper);
  
  res.status(201).json({
    success: true,
    message: '抓取脚本创建成功',
    data: newScraper
  });
});

// 更新政策抓取脚本
router.put('/policy-scrapers/:id', authenticateToken, (req, res) => {
  // 检查权限（仅管理员可更新）
  if (req.user.role !== '管理员') {
    return res.status(403).json({ message: '没有权限更新' });
  }
  
  const scraperId = parseInt(req.params.id);
  const scraperIndex = policyScrapers.findIndex(s => s.id === scraperId);
  
  if (scraperIndex === -1) {
    return res.status(404).json({ message: '抓取脚本不存在' });
  }
  
  const { name, url, selector, interval, category, status } = req.body;
  
  // 更新脚本信息
  const updatedScraper = {
    ...policyScrapers[scraperIndex],
    name: name || policyScrapers[scraperIndex].name,
    url: url || policyScrapers[scraperIndex].url,
    selector: selector || policyScrapers[scraperIndex].selector,
    interval: interval || policyScrapers[scraperIndex].interval,
    category: category || policyScrapers[scraperIndex].category,
    status: status || policyScrapers[scraperIndex].status
  };
  
  policyScrapers[scraperIndex] = updatedScraper;
  
  res.json({
    success: true,
    message: '抓取脚本更新成功',
    data: updatedScraper
  });
});

// 删除政策抓取脚本
router.delete('/policy-scrapers/:id', authenticateToken, (req, res) => {
  // 检查权限（仅管理员可删除）
  if (req.user.role !== '管理员') {
    return res.status(403).json({ message: '没有权限删除' });
  }
  
  const scraperId = parseInt(req.params.id);
  const scraperIndex = policyScrapers.findIndex(s => s.id === scraperId);
  
  if (scraperIndex === -1) {
    return res.status(404).json({ message: '抓取脚本不存在' });
  }
  
  // 删除脚本
  policyScrapers.splice(scraperIndex, 1);
  
  res.json({
    success: true,
    message: '抓取脚本删除成功',
    id: scraperId
  });
});

// 执行政策抓取脚本
router.post('/policy-scrapers/:id/execute', authenticateToken, (req, res) => {
  // 检查权限（仅管理员可执行）
  if (req.user.role !== '管理员') {
    return res.status(403).json({ message: '没有权限执行' });
  }
  
  const scraperId = parseInt(req.params.id);
  const scraper = policyScrapers.find(s => s.id === scraperId);
  
  if (!scraper) {
    return res.status(404).json({ message: '抓取脚本不存在' });
  }
  
  // 模拟执行抓取脚本
  // 在实际应用中，这里会启动一个实际的网页抓取任务
  
  // 更新最后执行时间
  scraper.lastRun = new Date().toISOString().split('T')[0];
  
  res.json({
    success: true,
    message: '抓取脚本执行成功',
    data: {
      scraperId: scraper.id,
      executionTime: new Date().toISOString(),
      status: 'completed',
      results: {
        itemsFound: Math.floor(Math.random() * 20) + 1,
        newPolicies: Math.floor(Math.random() * 5)
      }
    }
  });
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

// 会员注册
router.post('/member/register', (req, res) => {
  const { username, password, phone, email } = req.body;
  
  // 输入验证
  if (!username || !password || !phone) {
    return res.status(400).json({ message: '用户名、密码和手机号不能为空' });
  }
  
  // 检查用户名或手机号是否已存在
  if (members.some(m => m.username === username || m.phone === phone)) {
    return res.status(409).json({ message: '用户名或手机号已存在' });
  }
  
  // 创建新会员
  const newMember = {
    id: members.length + 1,
    userId: 'U' + (100000 + Math.floor(Math.random() * 900000)),
    username,
    nickname: username,
    phone,
    email: email || '',
    avatar: '/static/images/avatars/default.jpg',
    level: 1,
    points: 0,
    registerDate: new Date().toISOString().split('T')[0],
    lastLoginDate: new Date().toISOString().split('T')[0],
    status: '活跃',
    helpFarmers: 0,
    savedCrops: 0,
    coveredVillages: 0
  };
  
  members.push(newMember);
  
  // 创建JWT
  const token = jwt.sign(
    { id: newMember.id, username: newMember.username }, 
    process.env.JWT_SECRET || 'your_jwt_secret_key', 
    { expiresIn: '1d' }
  );
  
  res.status(201).json({
    success: true,
    message: '注册成功',
    token,
    user: {
      id: newMember.id,
      userId: newMember.userId,
      username: newMember.username,
      nickname: newMember.nickname,
      level: newMember.level
    }
  });
});

// 会员登录
router.post('/member/login', (req, res) => {
  const { username, password } = req.body;
  
  // 查找会员
  const member = members.find(m => (m.username === username || m.phone === username) && password === '123456');
  
  if (!member) {
    return res.status(401).json({ message: '用户名或密码错误' });
  }
  
  // 更新最后登录时间
  member.lastLoginDate = new Date().toISOString().split('T')[0];
  
  // 创建JWT
  const token = jwt.sign(
    { id: member.id, username: member.username }, 
    process.env.JWT_SECRET || 'your_jwt_secret_key', 
    { expiresIn: '1d' }
  );
  
  res.json({
    success: true,
    token,
    user: {
      id: member.id,
      userId: member.userId,
      username: member.username,
      nickname: member.nickname,
      level: member.level
    }
  });
});

// 获取会员个人信息
router.get('/member/profile', authenticateToken, (req, res) => {
  const member = members.find(m => m.id === req.user.id);
  
  if (!member) {
    return res.status(404).json({ message: '会员不存在' });
  }
  
  // 获取会员等级信息
  const levelInfo = memberLevels.find(l => l.level === member.level);
  const nextLevel = memberLevels.find(l => l.level === member.level + 1);
  
  // 计算下一等级进度
  let nextLevelPercent = 100;
  let pointsToNextLevel = 0;
  
  if (nextLevel) {
    pointsToNextLevel = nextLevel.pointsNeeded - member.points;
    nextLevelPercent = Math.min(100, Math.floor((member.points - levelInfo.pointsNeeded) / (nextLevel.pointsNeeded - levelInfo.pointsNeeded) * 100));
  }
  
  res.json({
    success: true,
    data: {
      member: {
        id: member.id,
        userId: member.userId,
        username: member.username,
        nickname: member.nickname,
        phone: member.phone,
        email: member.email,
        avatar: member.avatar,
        level: member.level,
        points: member.points,
        registerDate: member.registerDate,
        lastLoginDate: member.lastLoginDate,
        status: member.status,
        helpFarmers: member.helpFarmers,
        savedCrops: member.savedCrops,
        coveredVillages: member.coveredVillages
      },
      levelInfo: {
        ...levelInfo,
        nextLevelPercent,
        pointsToNextLevel,
        nextLevel: nextLevel ? nextLevel.name : null
      }
    }
  });
});

// 更新会员信息
router.put('/member/profile', authenticateToken, (req, res) => {
  const memberId = req.user.id;
  const memberIndex = members.findIndex(m => m.id === memberId);
  
  if (memberIndex === -1) {
    return res.status(404).json({ message: '会员不存在' });
  }
  
  const { nickname, avatar, phone, email } = req.body;
  
  // 更新会员信息
  const updatedMember = {
    ...members[memberIndex],
    nickname: nickname || members[memberIndex].nickname,
    avatar: avatar || members[memberIndex].avatar,
    phone: phone || members[memberIndex].phone,
    email: email || members[memberIndex].email
  };
  
  members[memberIndex] = updatedMember;
  
  res.json({
    success: true,
    message: '会员信息更新成功',
    data: {
      id: updatedMember.id,
      userId: updatedMember.userId,
      username: updatedMember.username,
      nickname: updatedMember.nickname,
      avatar: updatedMember.avatar
    }
  });
});

// 获取会员积分历史
router.get('/member/points/history', authenticateToken, (req, res) => {
  // 模拟积分历史数据
  const pointsHistory = [
    { id: 1, userId: req.user.id, points: 10, type: '购物奖励', description: '购买农产品', date: '2025-04-15' },
    { id: 2, userId: req.user.id, points: 20, type: '签到奖励', description: '连续签到7天', date: '2025-04-10' },
    { id: 3, userId: req.user.id, points: 50, type: '活动奖励', description: '参与农产品推广', date: '2025-04-05' },
    { id: 4, userId: req.user.id, points: -30, type: '积分兑换', description: '兑换优惠券', date: '2025-03-28' }
  ];
  
  res.json({
    success: true,
    data: pointsHistory
  });
});

// 获取会员地址列表
router.get('/member/addresses', authenticateToken, (req, res) => {
  const memberAddresses = addresses.filter(a => a.userId === req.user.id);
  
  res.json({
    success: true,
    data: memberAddresses
  });
});

// 添加会员地址
router.post('/member/addresses', authenticateToken, (req, res) => {
  const { name, phone, province, city, district, address, isDefault } = req.body;
  
  // 输入验证
  if (!name || !phone || !province || !city || !district || !address) {
    return res.status(400).json({ message: '所有字段都是必填的' });
  }
  
  // 如果设置为默认地址，将其他地址设为非默认
  if (isDefault) {
    addresses.forEach(a => {
      if (a.userId === req.user.id) {
        a.isDefault = false;
      }
    });
  }
  
  // 创建新地址
  const newAddress = {
    id: addresses.length + 1,
    userId: req.user.id,
    name,
    phone,
    province,
    city,
    district,
    address,
    isDefault: isDefault || false
  };
  
  addresses.push(newAddress);
  
  res.status(201).json({
    success: true,
    message: '地址添加成功',
    data: newAddress
  });
});

// 更新会员地址
router.put('/member/addresses/:id', authenticateToken, (req, res) => {
  const addressId = parseInt(req.params.id);
  const addressIndex = addresses.findIndex(a => a.id === addressId && a.userId === req.user.id);
  
  if (addressIndex === -1) {
    return res.status(404).json({ message: '地址不存在或不属于该会员' });
  }
  
  const { name, phone, province, city, district, address, isDefault } = req.body;
  
  // 如果设置为默认地址，将其他地址设为非默认
  if (isDefault) {
    addresses.forEach(a => {
      if (a.userId === req.user.id && a.id !== addressId) {
        a.isDefault = false;
      }
    });
  }
  
  // 更新地址
  const updatedAddress = {
    ...addresses[addressIndex],
    name: name || addresses[addressIndex].name,
    phone: phone || addresses[addressIndex].phone,
    province: province || addresses[addressIndex].province,
    city: city || addresses[addressIndex].city,
    district: district || addresses[addressIndex].district,
    address: address || addresses[addressIndex].address,
    isDefault: isDefault !== undefined ? isDefault : addresses[addressIndex].isDefault
  };
  
  addresses[addressIndex] = updatedAddress;
  
  res.json({
    success: true,
    message: '地址更新成功',
    data: updatedAddress
  });
});

// 删除会员地址
router.delete('/member/addresses/:id', authenticateToken, (req, res) => {
  const addressId = parseInt(req.params.id);
  const addressIndex = addresses.findIndex(a => a.id === addressId && a.userId === req.user.id);
  
  if (addressIndex === -1) {
    return res.status(404).json({ message: '地址不存在或不属于该会员' });
  }
  
  // 不允许删除默认地址
  if (addresses[addressIndex].isDefault) {
    return res.status(400).json({ message: '不能删除默认地址，请先设置其他地址为默认' });
  }
  
  // 删除地址
  addresses.splice(addressIndex, 1);
  
  res.json({
    success: true,
    message: '地址删除成功'
  });
});

// 获取会员收藏列表
router.get('/member/favorites', authenticateToken, (req, res) => {
  const memberFavorites = favorites.filter(f => f.userId === req.user.id);
  
  // 获取收藏商品详情
  const favoriteProducts = memberFavorites.map(f => {
    const product = products.find(p => p.id === f.productId);
    return {
      id: f.id,
      productId: f.productId,
      addTime: f.addTime,
      product: product || { id: f.productId, name: '商品已下架', price: 0 }
    };
  });
  
  res.json({
    success: true,
    data: favoriteProducts
  });
});

// 添加收藏
router.post('/member/favorites', authenticateToken, (req, res) => {
  const { productId } = req.body;
  
  if (!productId) {
    return res.status(400).json({ message: '商品ID不能为空' });
  }
  
  // 检查商品是否存在
  const product = products.find(p => p.id === parseInt(productId));
  
  if (!product) {
    return res.status(404).json({ message: '商品不存在' });
  }
  
  // 检查是否已收藏
  if (favorites.some(f => f.userId === req.user.id && f.productId === parseInt(productId))) {
    return res.status(409).json({ message: '该商品已经在收藏夹中' });
  }
  
  // 添加收藏
  const newFavorite = {
    id: favorites.length + 1,
    userId: req.user.id,
    productId: parseInt(productId),
    addTime: new Date().toISOString().replace('T', ' ').substring(0, 19)
  };
  
  favorites.push(newFavorite);
  
  res.status(201).json({
    success: true,
    message: '收藏成功',
    data: {
      id: newFavorite.id,
      productId: newFavorite.productId,
      addTime: newFavorite.addTime
    }
  });
});

// 删除收藏
router.delete('/member/favorites/:id', authenticateToken, (req, res) => {
  const favoriteId = parseInt(req.params.id);
  const favoriteIndex = favorites.findIndex(f => f.id === favoriteId && f.userId === req.user.id);
  
  if (favoriteIndex === -1) {
    return res.status(404).json({ message: '收藏不存在或不属于该会员' });
  }
  
  // 删除收藏
  favorites.splice(favoriteIndex, 1);
  
  res.json({
    success: true,
    message: '取消收藏成功'
  });
});

// 获取会员优惠券列表
router.get('/member/coupons', authenticateToken, (req, res) => {
  const status = req.query.status; // 可选状态筛选：未使用、已使用、已过期
  let memberCoupons = coupons.filter(c => c.userId === req.user.id);
  
  // 如果有状态筛选
  if (status) {
    memberCoupons = memberCoupons.filter(c => c.status === status);
  }
  
  res.json({
    success: true,
    data: memberCoupons
  });
});

// 领取优惠券
router.post('/member/coupons/claim', authenticateToken, (req, res) => {
  const { couponId } = req.body;
  
  // 模拟系统优惠券
  const systemCoupons = [
    { 
      id: 101, 
      name: '新人优惠券', 
      type: '满减', 
      value: 10, 
      minSpend: 100, 
      startDate: '2025-04-01', 
      endDate: '2025-05-31'
    },
    { 
      id: 102, 
      name: '会员专享券', 
      type: '折扣', 
      value: 15, 
      minSpend: 50, 
      startDate: '2025-04-01', 
      endDate: '2025-04-30'
    }
  ];
  
  const coupon = systemCoupons.find(c => c.id === parseInt(couponId));
  
  if (!coupon) {
    return res.status(404).json({ message: '优惠券不存在' });
  }
  
  // 检查是否已领取
  if (coupons.some(c => c.userId === req.user.id && c.name === coupon.name)) {
    return res.status(409).json({ message: '该优惠券已领取' });
  }
  
  // 添加优惠券到会员账户
  const newCoupon = {
    id: coupons.length + 1,
    userId: req.user.id,
    name: coupon.name,
    type: coupon.type,
    value: coupon.value,
    minSpend: coupon.minSpend,
    startDate: coupon.startDate,
    endDate: coupon.endDate,
    status: '未使用'
  };
  
  coupons.push(newCoupon);
  
  res.status(201).json({
    success: true,
    message: '优惠券领取成功',
    data: newCoupon
  });
});

// 会员订单列表
router.get('/member/orders', authenticateToken, (req, res) => {
  // 模拟订单数据
  const orders = [
    { 
      id: 'ORD20250420001', 
      userId: req.user.id, 
      totalAmount: 156.8, 
      status: '待付款', 
      createTime: '2025-04-20 10:23:45',
      items: [
        { productId: 1, name: '有机大米', quantity: 2, price: 15.8 },
        { productId: 2, name: '绿色蔬菜礼盒', quantity: 1, price: 68 }
      ]
    },
    { 
      id: 'ORD20250415002', 
      userId: req.user.id, 
      totalAmount: 89.0, 
      status: '已发货', 
      createTime: '2025-04-15 16:45:12',
      items: [
        { productId: 3, name: '土鸡蛋', quantity: 2, price: 24.5 },
        { productId: 1, name: '有机大米', quantity: 1, price: 15.8 }
      ]
    }
  ];
  
  res.json({
    success: true,
    data: orders
  });
});

module.exports = router; 