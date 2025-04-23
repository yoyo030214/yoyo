# 商家管理系统

一个简单的商家后台管理系统，用于管理商品和订单。

## 功能

- 商家登录/注册
- 商品管理 (添加、编辑、删除、列表)
- 实时表单验证
- 图片上传与预览
- 响应式设计

## 技术栈

- 前端: HTML, CSS, JavaScript, Bootstrap 5
- 后端: Node.js, Express
- 数据库: MongoDB

## 安装

1. 克隆仓库
```bash
git clone <仓库地址>
cd merchant-admin
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
创建`.env`文件并添加以下配置：
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/merchant-admin
JWT_SECRET=your_jwt_secret
```

4. 启动应用
```bash
npm start
```

或使用控制脚本:
```bash
./control.sh start
```

5. 访问应用
- 管理后台: http://localhost:3000/admin
- 登录页面: http://localhost:3000/admin/login.html

## 项目结构

```
merchant-admin/
├── public/               # 静态资源
│   ├── admin/            # 管理后台页面
│   │   ├── js/           # JavaScript文件
│   │   ├── css/          # CSS样式文件
│   │   └── img/          # 图片资源
├── src/                  # 源代码
│   ├── config/           # 配置文件
│   ├── controllers/      # 控制器
│   ├── models/           # 数据模型
│   ├── routes/           # 路由
│   └── app.js            # 应用入口
├── control.sh            # 控制脚本
├── monitor.py            # 监控脚本
└── package.json          # 项目信息
```

## 使用说明

1. 通过登录页面进入系统
2. 在产品管理页面可以查看和管理所有商品
3. 使用添加/编辑商品表单来管理商品信息和图片

## 许可证

MIT 