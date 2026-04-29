# Task Manager 功能列表

## 已实现功能

### 1. 用户认证
- ✅ 用户注册
- ✅ 用户登录
- ✅ JWT Token 认证
- ✅ 受保护路由

### 2. 任务管理
- ✅ 创建任务
- ✅ 编辑任务
- ✅ 删除任务
- ✅ 任务状态管理（待办/进行中/已完成）
- ✅ 任务优先级（低/中/高）
- ✅ 任务截止日期
- ✅ 任务分类
- ✅ 任务标签

### 3. 任务提醒系统
- ✅ 应用内通知（实时）
- ✅ 邮件提醒（截止前24小时和1小时）
- ✅ 通知中心面板
- ✅ 未读消息红点提示
- ✅ 通知类型：截止提醒、逾期警告、依赖解锁

### 4. 任务依赖系统
- ✅ 添加前置任务依赖
- ✅ 循环依赖检测（防止 A→B→A）
- ✅ 获取任务依赖列表
- ✅ 获取依赖此任务的任务
- ✅ 删除依赖关系

### 5. 时间追踪系统
- ✅ 计时器功能（开始/暂停/停止）
- ✅ 单任务计时限制（自动停止其他计时器）
- ✅ 手动记录时间
- ✅ 时间统计（今日/本周/本月）
- ✅ 页面标题显示当前计时

### 6. 快速添加系统
- ✅ 快捷键支持（Ctrl/Cmd + K）
- ✅ 智能解析自然语言
  - 日期：今天、明天、后天
  - 优先级：高优先级、低优先级
  - 分类：#分类名
  - 预估时间：30分钟、2小时
- ✅ 实时预览解析结果
- ✅ 浮动操作按钮（FAB）

### 7. 统计仪表盘
- ✅ 任务统计卡片
  - 待办任务数
  - 进行中任务数
  - 已完成任务数
- ✅ 时间统计卡片
  - 今日用时
- ✅ 完成进度条

### 8. 主题系统
- ✅ 浅色主题
- ✅ 深色主题
- ✅ 跟随系统主题
- ✅ 主题切换按钮
- ✅ FOUC（闪烁）防护

### 9. 响应式设计
- ✅ 移动端适配
- ✅ 平板适配
- ✅ 桌面端适配

## 技术栈

### 后端
- Node.js
- Express
- MySQL
- JWT
- bcryptjs
- node-cron（定时任务）
- nodemailer（邮件服务）

### 前端
- React
- React Router
- Axios
- CSS Variables（主题系统）
- react-hotkeys-hook（快捷键）
- framer-motion（动画）
- recharts（图表）

## API 端点

### 认证
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

### 任务
- GET /api/tasks
- GET /api/tasks/:id
- POST /api/tasks
- PUT /api/tasks/:id
- DELETE /api/tasks/:id
- PATCH /api/tasks/:id/status
- POST /api/tasks/:id/dependencies
- DELETE /api/tasks/:id/dependencies/:depId
- GET /api/tasks/:id/dependencies
- GET /api/tasks/:id/dependents

### 通知
- GET /api/notifications
- GET /api/notifications/unread-count
- PATCH /api/notifications/:id
- PATCH /api/notifications/mark-all-read
- DELETE /api/notifications/:id

### 时间追踪
- GET /api/time-entries
- GET /api/time-entries/active
- POST /api/time-entries/start
- PATCH /api/time-entries/:id/stop
- GET /api/time-entries/stats/summary

### 分类
- GET /api/categories
- POST /api/categories
- PUT /api/categories/:id
- DELETE /api/categories/:id

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| Ctrl/Cmd + K | 打开快速添加 |
| Enter | 确认创建任务 |
| ESC | 关闭弹窗 |

## 环境变量

### 后端 (.env)
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=taskmanager
JWT_SECRET=your_jwt_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FRONTEND_URL=http://localhost:3000
```
