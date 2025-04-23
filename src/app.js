require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// 引入API路由
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// 静态文件
app.use('/admin', express.static('public/admin'));

// 使用API路由
app.use('/api', apiRoutes);

// 基础路由
app.get('/', (req, res) => {
  res.send('商家管理系统API已启动');
});

// 测试路由
app.get('/api/test', (req, res) => {
  res.json({ message: '服务器运行正常' });
});

// 政策API路由
app.get('/api/policies', (req, res) => {
  // 模拟数据
  const policies = [
    { id: 1, title: '2025年农业补贴政策', publishDate: '2025-03-15', category: '补贴政策', status: '已发布' },
    { id: 2, title: '耕地保护激励政策', publishDate: '2025-02-20', category: '保护政策', status: '已发布' },
    { id: 3, title: '农村人才引进计划', publishDate: '2025-04-01', category: '人才政策', status: '待审核' }
  ];
  res.json(policies);
});

// 商品API路由
app.get('/api/products', (req, res) => {
  // 模拟数据
  const products = [
    { id: 1, name: '有机大米', price: 15.8, unit: 'kg', stock: 500, farmer: '张农户', status: '在售' },
    { id: 2, name: '绿色蔬菜礼盒', price: 68, unit: '盒', stock: 120, farmer: '李农户', status: '在售' },
    { id: 3, name: '土鸡蛋', price: 24.5, unit: '斤', stock: 200, farmer: '王农户', status: '在售' }
  ];
  res.json(products);
});

// 订单API路由
app.get('/api/orders', (req, res) => {
  // 模拟数据
  const orders = [
    { id: 'ORD20250415001', customer: '张三', amount: 126.5, orderTime: '2025-04-15 10:23', status: '已发货' },
    { id: 'ORD20250414002', customer: '李四', amount: 89.0, orderTime: '2025-04-14 16:45', status: '已付款' },
    { id: 'ORD20250413003', customer: '王五', amount: 230.0, orderTime: '2025-04-13 09:12', status: '待付款' }
  ];
  res.json(orders);
});

// 用户API路由
app.get('/api/users', (req, res) => {
  // 模拟数据
  const users = [
    { id: 1, username: 'admin', role: '管理员', registerDate: '2025-01-15', status: '活跃' },
    { id: 2, username: 'zhangfamer', role: '农户', registerDate: '2025-02-22', status: '活跃' },
    { id: 3, username: 'lixiaoming', role: '客户', registerDate: '2025-03-18', status: '待验证' }
  ];
  res.json(users);
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`管理后台地址: http://localhost:${PORT}/admin`);
});

module.exports = app; 