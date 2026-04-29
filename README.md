# Task Manager - 全栈任务管理应用

一个功能完整的任务管理系统，使用现代 Web 技术栈构建（MySQL + Express + React + Node.js）。

## 功能特性

### 核心功能
- **用户认证系统**
  - 用户注册和登录
  - JWT 令牌认证
  - 受保护的路由

- **任务管理**
  - 创建、编辑、删除任务
  - 任务状态管理（待办、进行中、已完成）
  - 任务优先级设置（低、中、高）
  - 任务截止日期
  - 任务分类和标签
  - 任务过滤和排序

- **分类管理**
  - 创建自定义分类
  - 为分类设置颜色
  - 按分类组织任务

### 用户体验
- 响应式设计，支持移动端
- 实时状态更新
- 直观的用户界面
- 平滑的动画效果

## 技术栈

### 后端
- **Node.js** - JavaScript 运行时
- **Express.js** - Web 应用框架
- **MySQL** - 关系型数据库
- **mysql2** - MySQL 客户端
- **JWT** - 身份认证
- **bcryptjs** - 密码加密

### 前端
- **React** - UI 框架
- **React Router** - 路由管理
- **Axios** - HTTP 客户端
- **CSS3** - 样式设计

## 项目结构

```
task-manager/
├── backend/
│   ├── config/          # 数据库配置
│   │   └── db.js
│   ├── routes/          # API 路由
│   │   ├── auth.js
│   │   ├── tasks.js
│   │   └── categories.js
│   ├── middleware/      # 中间件
│   │   └── auth.js
│   ├── server.js        # 服务器入口
│   ├── package.json
│   └── .env             # 环境变量
└── frontend/
    ├── src/
    │   ├── components/  # React 组件
    │   ├── pages/       # 页面组件
    │   │   ├── Login.js
    │   │   ├── Register.js
    │   │   └── Dashboard.js
    │   ├── context/     # Context API
    │   │   └── AuthContext.js
    │   ├── App.js
    │   ├── index.js
    │   └── index.css
    ├── public/
    │   └── index.html
    └── package.json
```

## 安装和运行

### 前置要求
- Node.js (v14 或更高版本)
- MySQL (v5.7 或更高版本)
- npm 或 yarn

### 1. 克隆项目
```bash
cd task-manager
```

### 2. 安装后端依赖
```bash
cd backend
npm install
```

### 3. 配置环境变量
编辑后端 `.env` 文件：
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=taskmanager
JWT_SECRET=your_jwt_secret_key_change_this_in_production
NODE_ENV=development
```

**重要：** 请将 `your_mysql_password` 替换为您的 MySQL root 密码

### 4. 启动 MySQL
确保 MySQL 正在运行：
```bash
# Windows
# MySQL 服务通常在后台运行

# 或使用命令行启动
mysql -u root -p
```

### 5. 启动后端服务器
```bash
cd backend
npm start
# 或开发模式
npm run dev
```

后端将自动创建数据库和表，并运行在 `http://localhost:5000`

### 6. 安装前端依赖
```bash
cd frontend
npm install
```

### 7. 启动前端开发服务器
```bash
cd frontend
npm start
```

前端将运行在 `http://localhost:3000`

## 使用说明

### 1. 注册账户
- 访问 `http://localhost:3000/register`
- 填写用户名、邮箱和密码
- 点击"Sign Up"创建账户

### 2. 登录
- 访问 `http://localhost:3000/login`
- 输入邮箱和密码
- 点击"Sign In"登录

### 3. 管理任务
- **创建任务**：点击"+ New Task"按钮
- **编辑任务**：点击任务卡片上的"Edit"按钮
- **删除任务**：点击任务卡片上的"Delete"按钮
- **更新状态**：使用下拉菜单更改任务状态
- **过滤任务**：使用状态和优先级过滤器

## API 端点

### 认证
- `POST /api/auth/register` - 注册新用户
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户

### 任务
- `GET /api/tasks` - 获取所有任务
- `GET /api/tasks/:id` - 获取单个任务
- `POST /api/tasks` - 创建新任务
- `PUT /api/tasks/:id` - 更新任务
- `DELETE /api/tasks/:id` - 删除任务
- `PATCH /api/tasks/:id/status` - 更新任务状态

### 分类
- `GET /api/categories` - 获取所有分类
- `POST /api/categories` - 创建新分类
- `PUT /api/categories/:id` - 更新分类
- `DELETE /api/categories/:id` - 删除分类

## 功能演示

### 任务卡片特性
- 优先级标签（颜色编码）
- 状态标签（待办/进行中/已完成）
- 分类标签
- 截止日期显示
- 标签系统

### 过滤功能
- 按状态过滤（全部/待办/进行中/已完成）
- 按优先级过滤（全部/低/中/高）

### 响应式设计
- 桌面端：网格布局，多列显示
- 移动端：单列布局，优化的触摸交互

## 开发说明

### 添加新功能
1. 后端：在 `routes/` 中添加新的路由
2. 前端：在 `pages/` 或 `components/` 中创建新组件
3. 更新 `App.js` 添加新路由

### 环境变量
生产环境请更新：
- `JWT_SECRET` - 使用强密钥
- `MONGODB_URI` - 使用生产数据库
- `NODE_ENV` - 设置为 `production`

## 许可证

MIT License

## 作者

Created with Claude Code
