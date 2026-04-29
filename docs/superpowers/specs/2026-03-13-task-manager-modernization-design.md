# Task Manager 功能扩展与页面现代化设计文档

**日期**: 2026-03-13
**版本**: 1.0
**状态**: 待实施

---

## 1. 项目概述

### 1.1 当前状态
- 全栈任务管理应用（MySQL + Express + React + Node.js）
- 已实现：用户认证、任务 CRUD、分类管理、标签系统、基础响应式

### 1.2 目标
- 添加 4 个核心生产力功能
- 全面升级 UI/UX 现代化

---

## 2. 新功能设计

### 2.1 任务提醒系统

#### 功能描述
为用户提供多渠道的任务提醒机制，防止遗漏重要任务。

#### 具体实现
1. **应用内通知**
   - 通知中心面板（顶部导航栏铃铛图标）
   - 未读消息红点计数
   - 通知列表：显示任务标题、截止时间、提醒时间
   - 通知类型：截止提醒、逾期警告、依赖解锁通知

2. **邮件提醒**
   - 截止前 24 小时发送邮件提醒
   - 截止前 1 小时发送紧急提醒
   - 使用 nodemailer 发送邮件
   - 邮件模板：任务标题、描述、截止时间、直达链接

3. **提醒设置**
   - 用户可设置默认提醒时间（个人偏好设置页面）
   - 单个任务可覆盖默认设置

#### 数据库变更
```sql
-- 新增提醒设置表
CREATE TABLE reminder_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  default_reminder_hours INT DEFAULT 24,
  email_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 新增通知记录表
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  task_id INT,
  type ENUM('deadline_approaching', 'deadline_passed', 'dependency_unlocked'),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- 添加索引优化查询性能
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read, created_at);
CREATE INDEX idx_notifications_task ON notifications(task_id);
CREATE INDEX idx_notifications_expires ON notifications(expires_at);
```

#### API 端点
- `GET /api/notifications` - 获取用户通知列表（认证: Bearer Token）
- `PATCH /api/notifications/:id` - 更新通知状态（如：{ "is_read": true }）
- `DELETE /api/notifications/:id` - 删除通知
- `GET /api/reminder-settings` - 获取提醒设置
- `PUT /api/reminder-settings` - 更新提醒设置

---

### 2.2 任务依赖系统

#### 功能描述
建立任务间的依赖关系，实现链式任务管理。

#### 具体实现
1. **依赖关系建立**
   - 创建/编辑任务时可选择前置任务（多选）
   - 前置任务下拉框只显示同用户的未完成任务
   - **循环依赖检测**：使用 DFS 算法在添加依赖前检测循环
   ```javascript
   // 循环依赖检测算法
   function hasCircularDependency(taskId, dependsOnId, pool, visited = new Set()) {
     if (taskId === dependsOnId) return true;
     if (visited.has(dependsOnId)) return false;
     visited.add(dependsOnId);
     // 获取 dependsOnId 的所有前置任务
     const [deps] = await pool.query(
       'SELECT depends_on_task_id FROM task_dependencies WHERE task_id = ?',
       [dependsOnId]
     );
     for (const dep of deps) {
       if (await hasCircularDependency(taskId, dep.depends_on_task_id, pool, visited)) {
         return true;
       }
     }
     return false;
   }
   ```

2. **可视化依赖图**
   - 任务详情页显示依赖关系图
   - 使用 ReactFlow 或自定义 SVG 实现
   - 节点：任务卡片缩略图
   - 边：箭头连线表示依赖方向

3. **链式完成机制**
   - 前置任务完成时，自动通知用户后续任务已解锁
   - 解锁任务在列表中高亮显示（如：绿色边框闪烁）
   - 被阻塞任务显示"等待中"状态和前置任务链接

4. **依赖检查与删除策略**
   - 删除任务前检查是否有后续依赖任务
   - **阻止删除策略**：如有依赖任务，必须先解除依赖或删除依赖任务才能删除
   - 删除任务时级联删除其在 `task_dependencies` 表中的所有记录

#### 数据库变更
```sql
-- 新增任务依赖表
CREATE TABLE task_dependencies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  depends_on_task_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (depends_on_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  UNIQUE KEY unique_dependency (task_id, depends_on_task_id)
);

-- 添加索引优化依赖查询
CREATE INDEX idx_dependencies_task ON task_dependencies(task_id);
CREATE INDEX idx_dependencies_depends_on ON task_dependencies(depends_on_task_id);
```

#### API 端点（均需 Bearer Token 认证）
- `POST /api/tasks/:id/dependencies` - 添加依赖关系
  - 请求体: `{ "dependsOnTaskId": 123 }`
  - 返回: 201 Created 或 400（循环依赖错误）
- `DELETE /api/tasks/:id/dependencies/:depId` - 移除依赖关系
- `GET /api/tasks/:id/dependencies` - 获取任务的前置依赖列表
- `GET /api/tasks/:id/dependents` - 获取依赖此任务的任务列表
- `GET /api/tasks/:id/dependency-graph` - 获取依赖图数据（限制最多 50 个节点）

---

### 2.3 时间追踪系统

#### 功能描述
记录任务实际花费时间，帮助用户了解时间分配。

#### 具体实现
1. **计时器功能**
   - 任务卡片上的开始/暂停/停止按钮
   - 运行中计时器显示在页面标题（方便切换标签页查看）
   - 计时器状态持久化（刷新页面不丢失）
   - **单一计时器约束**：使用数据库事务确保同一时刻只能运行一个计时器
   ```javascript
   // 开始计时的事务处理
   async function startTimer(taskId, userId) {
     const connection = await pool.getConnection();
     try {
       await connection.beginTransaction();
       // 1. 停止用户其他运行中的计时器
       await connection.query(
         `UPDATE time_entries SET end_time = NOW()
          WHERE user_id = ? AND end_time IS NULL`,
         [userId]
       );
       // 2. 创建新计时器
       const [result] = await connection.query(
         `INSERT INTO time_entries (task_id, user_id, start_time) VALUES (?, ?, NOW())`,
         [taskId, userId]
       );
       await connection.commit();
       return result.insertId;
     } catch (error) {
       await connection.rollback();
       throw error;
     } finally {
       connection.release();
     }
   }
   ```

2. **手动记录**
   - 编辑任务时可手动输入用时（小时:分钟格式）
   - 支持添加多个时间段（如：分段工作）

3. **时间统计**
   - 仪表盘显示今日/本周/本月总用时
   - 按分类统计时间分布（饼图）
   - 按日期显示时间趋势（折线图）
   - 任务详情页显示历史时间记录

#### 数据库变更
```sql
-- 新增时间记录表（duration 通过计算得出，不存储冗余）
CREATE TABLE time_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  user_id INT NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 添加索引优化时间查询
CREATE INDEX idx_time_entries_task ON time_entries(task_id);
CREATE INDEX idx_time_entries_user_time ON time_entries(user_id, start_time);
CREATE INDEX idx_time_entries_active ON time_entries(user_id, end_time);

-- 任务表添加预估时间字段
ALTER TABLE tasks ADD COLUMN estimated_minutes INT NULL;
```

#### API 端点（均需 Bearer Token 认证）
- `POST /api/time-entries/start` - 开始计时
  - 请求体: `{ "taskId": 123 }`
  - 事务：自动停止其他运行中的计时器
- `PATCH /api/time-entries/:id/stop` - 停止计时
  - 返回: { id, taskId, startTime, endTime, durationMinutes }
- `GET /api/time-entries/active` - 获取当前运行的计时器
- `GET /api/time-entries` - 获取时间记录列表（支持按任务、日期范围过滤）
- `POST /api/time-entries` - 手动添加时间记录
  - 请求体: `{ "taskId": 123, "startTime": "ISO", "endTime": "ISO", "description": "" }`
- `DELETE /api/time-entries/:id` - 删除时间记录
- `GET /api/time-entries/stats` - 获取时间统计（今日/本周/本月）
  - 支持 `?timezone=Asia/Shanghai` 参数进行时区转换

---

### 2.4 快速添加系统

#### 功能描述
通过快捷键和智能解析快速创建任务。

#### 具体实现
1. **全局快捷键**
   - `Cmd/Ctrl + K` 打开快速添加弹窗
   - `Cmd/Ctrl + Shift + A` 直接聚焦快速输入框（如果在 dashboard 页面）
   - 快捷键提示显示在界面角落

2. **智能解析**
   输入示例及解析结果：
   - "明天下午3点开会" → 标题：开会，截止时间：明天15:00
   - "下周一提交报告 #工作 高优先级" → 标题：提交报告，分类：工作，优先级：高
   - "每周五健身 重复" → 标题：健身，重复：每周五
   - "完成设计 30分钟" → 标题：完成设计，预估时间：30分钟

3. **快速添加弹窗**
   - 简洁输入框（单行）
   - 实时预览解析结果
   - 回车直接创建
   - `Tab` 键快速编辑解析字段

4. **智能建议**
   - 输入时显示历史任务建议（自动完成）
   - 常用标签快速选择

#### 智能解析规则
```javascript
// 解析规则示例
const rules = {
  date: /(今天|明天|后天|下周一|下周二|\d{1,2}月\d{1,2}日)/,
  time: /(上午|下午|晚上)?(\d{1,2})点(\d{1,2})?分?/,
  priority: /(高优先级|urgent|high priority)/i,
  category: /#(\w+)/,
  estimated: /(\d+)分钟|(\d+)小时/,
  recurring: /(每天|每周[一二三四五六日]|每月\d{1,2}日|重复)/
};
```

#### API 端点
- `POST /api/tasks/quick-create` - 快速创建任务（支持智能解析后的完整数据）
- `GET /api/tasks/suggestions?q={query}` - 获取任务标题建议

---

## 3. 页面现代化设计

### 3.1 设计系统

#### 色彩方案
```css
/* 主色调 - 现代渐变 */
--primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
--primary-solid: #667eea;
--primary-hover: #5a67d8;

/* 功能色 */
--success: #10b981;
--warning: #f59e0b;
--danger: #ef4444;
--info: #3b82f6;

/* 中性色 - 浅色主题 */
--bg-primary: #f8fafc;
--bg-secondary: #ffffff;
--bg-tertiary: #f1f5f9;
--text-primary: #1e293b;
--text-secondary: #64748b;
--text-tertiary: #94a3b8;
--border: #e2e8f0;

/* 中性色 - 深色主题 */
--dark-bg-primary: #0f172a;
--dark-bg-secondary: #1e293b;
--dark-bg-tertiary: #334155;
--dark-text-primary: #f8fafc;
--dark-text-secondary: #cbd5e1;
--dark-text-tertiary: #94a3b8;
--dark-border: #334155;
```

#### 字体
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

#### 圆角与阴影
```css
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 16px;
--radius-xl: 24px;

--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
--shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);
--shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.1);

/* 毛玻璃效果 */
--glass: rgba(255, 255, 255, 0.8);
--glass-border: rgba(255, 255, 255, 0.3);
--glass-blur: blur(20px) saturate(180%);
```

### 3.2 组件设计

#### 新组件列表
1. **NotificationCenter** - 通知中心（下拉面板）
2. **ThemeToggle** - 主题切换按钮
3. **TimerButton** - 计时器按钮（任务卡片上）
4. **QuickAddModal** - 快速添加弹窗
5. **DependencyGraph** - 依赖关系图
6. **TimeStats** - 时间统计面板
7. **Sidebar** - 侧边栏导航
8. **TaskCardV2** - 新版任务卡片
9. **EmptyState** - 空状态插画
10. **Skeleton** - 骨架屏加载

#### TaskCardV2 设计
```
┌─────────────────────────────────────┐
│ ● 高优先级                    02:30 │  ← 计时器显示
├─────────────────────────────────────┤
│ 完成项目设计文档                     │  ← 标题
│ 需要包含架构图和API设计...           │  ← 描述（最多2行）
├─────────────────────────────────────┤
│ 🔴 #设计  📅 明天 18:00             │  ← 分类、截止日期
├─────────────────────────────────────┤
│ ⏱️ 已用时 2.5h | 预估 4h            │  ← 时间追踪
│ 🔓 等待"需求分析"完成               │  ← 依赖状态（如适用）
├─────────────────────────────────────┤
│ [开始] [编辑] [删除]                │  ← 操作按钮
└─────────────────────────────────────┘
```

### 3.3 页面布局

#### 新布局结构
```
┌─────────────────────────────────────────────────────────┐
│  🍔  Logo      🔍 搜索...        🔔  👤  [用户菜单]     │  ← 顶部导航
├──────────┬──────────────────────────────────────────────┤
│          │                                                │
│ 📊 仪表盘  │              主内容区                        │
│ 📋 任务   │              (任务列表/统计/设置)             │
│ 📁 分类   │                                                │
│ 📈 统计   │                                                │
│ ⏱️ 时间   │                                                │
│ ⚙️ 设置   │                                                │
│          │                                                │
└──────────┴──────────────────────────────────────────────┘
   侧边栏(可折叠)           内容区
```

#### 仪表盘首页
```
┌─────────────────────────────────────────────────────────┐
│  早上好，张三 👋                    [+ 快速添加]        │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │  待办    │ │ 进行中   │ │ 今日完成 │ │ 本周用时 │   │  ← 统计卡片
│  │   12    │ │    5    │ │    8    │ │  24.5h  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
├─────────────────────────────────────────────────────────┤
│  📊 本周效率趋势          │  🕐 时间分布（按分类）      │
│  [折线图]                 │  [饼图]                    │
├─────────────────────────────────────────────────────────┤
│  📋 今日任务                                            │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ☐ 完成设计评审                          14:00  │   │
│  │ ☐ 编写API文档                           16:00  │   │
│  │ ☑ 晨会记录                              09:00  │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 3.4 动画与交互

#### 微交互
1. **任务卡片悬停**: 轻微上浮 + 阴影加深 (`transform: translateY(-4px)`)
2. **按钮点击**: 缩放效果 (`transform: scale(0.98)`)
3. **任务完成**: 划线动画 + 淡出效果
4. **新任务添加**: 从顶部滑入动画
5. **加载状态**: 骨架屏脉冲动画

#### 页面过渡
- 路由切换：淡入淡出（200ms）
- 弹窗打开：从中心缩放 + 背景模糊
- 侧边栏折叠：平滑宽度过渡

### 3.5 主题系统

#### 实现方案
使用 CSS 变量 + class 切换实现主题：
```javascript
// ThemeContext.js
const themes = {
  light: 'theme-light',
  dark: 'theme-dark',
  system: 'theme-system' // 跟随系统
};

// 保存用户偏好到 localStorage
// 系统主题变化时自动切换
```

---

## 4. 技术实现

### 4.1 后端

#### 新增依赖
```json
{
  "dependencies": {
    "node-cron": "^3.0.3",
    "nodemailer": "^6.9.7"
  }
}
```

#### 数据库变更（补充）
```sql
-- 定时任务分布式锁表（防止多实例并发）
CREATE TABLE cron_locks (
  lock_name VARCHAR(50) PRIMARY KEY,
  locked_at TIMESTAMP,
  locked_by VARCHAR(100),
  expires_at TIMESTAMP NOT NULL
);

-- 邮件队列表（支持重试机制）
CREATE TABLE email_queue (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP NULL,
  INDEX idx_status_created (status, created_at)
);

-- 用户表添加时区字段
ALTER TABLE users ADD COLUMN timezone VARCHAR(50) DEFAULT 'Asia/Shanghai';
```

#### 定时任务（node-cron）
- 每分钟检查即将到期的任务，发送提醒
- 每小时清理已读的陈旧通知（7天前）
- **分布式锁实现**：
```javascript
// services/cronLock.js
async function acquireLock(lockName, lockDurationSeconds = 60) {
  const connection = await pool.getConnection();
  try {
    await connection.query(
      `INSERT INTO cron_locks (lock_name, locked_at, locked_by, expires_at)
       VALUES (?, NOW(), ?, DATE_ADD(NOW(), INTERVAL ? SECOND))
       ON DUPLICATE KEY UPDATE
       locked_at = IF(expires_at < NOW(), VALUES(locked_at), locked_at),
       locked_by = IF(expires_at < NOW(), VALUES(locked_by), locked_by),
       expires_at = IF(expires_at < NOW(), VALUES(expires_at), expires_at)`,
      [lockName, process.pid, lockDurationSeconds]
    );
    // 检查是否获取到锁
    const [rows] = await connection.query(
      'SELECT locked_by FROM cron_locks WHERE lock_name = ?',
      [lockName]
    );
    return rows[0]?.locked_by === String(process.pid);
  } finally {
    connection.release();
  }
}
```

#### 邮件服务
创建 `services/emailService.js` 封装 nodemailer 发送逻辑，使用队列实现重试机制：

```javascript
// services/emailService.js
class EmailService {
  // 将邮件加入队列
  async queueEmail(userId, email, subject, body) {
    await pool.query(
      'INSERT INTO email_queue (user_id, email, subject, body) VALUES (?, ?, ?, ?)',
      [userId, email, subject, body]
    );
  }

  // 处理队列（由定时任务调用）
  async processQueue() {
    const [emails] = await pool.query(
      `SELECT * FROM email_queue
       WHERE status = 'pending' AND retry_count < max_retries
       ORDER BY created_at ASC
       LIMIT 10`
    );

    for (const email of emails) {
      try {
        await this.send(email.email, email.subject, email.body);
        await pool.query(
          `UPDATE email_queue SET status = 'sent', sent_at = NOW() WHERE id = ?`,
          [email.id]
        );
      } catch (error) {
        await pool.query(
          `UPDATE email_queue SET retry_count = retry_count + 1,
           status = IF(retry_count + 1 >= max_retries, 'failed', 'pending')
           WHERE id = ?`,
          [email.id]
        );
      }
    }
  }

  // 实际发送邮件（nodemailer）
  async send(to, subject, html) {
    // nodemailer 实现...
  }
}
```

### 4.2 前端

#### 新增依赖
```json
{
  "dependencies": {
    "react-hotkeys-hook": "^4.4.1",
    "date-fns": "^2.30.0",
    "recharts": "^2.10.0",
    "framer-motion": "^10.16.0",
    "reactflow": "^11.10.0"
  }
}
```

#### 新增 Hooks
- `useTimer` - 计时器逻辑
- `useNotifications` - 通知管理
- `useTheme` - 主题切换（包含 FOUC 防护）
- `useQuickAdd` - 快速添加解析
- `useHotkeys` - 快捷键绑定

#### 状态管理方案
- **全局状态**：使用 React Context + useReducer
  - `ThemeContext` - 主题状态
  - `NotificationContext` - 通知状态
  - `TimerContext` - 计时器状态（跨页面保持）
- **本地状态**：useState / useReducer
- **服务端状态**：React Query（可选，用于缓存和自动刷新）

#### FOUC 防护（主题闪烁）
在 `public/index.html` 的 `<head>` 中添加内联脚本：
```html
<script>
  (function() {
    const theme = localStorage.getItem('theme') || 'system';
    const isDark = theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.add(isDark ? 'theme-dark' : 'theme-light');
  })();
</script>
```

### 4.3 数据库迁移脚本
创建 `backend/migrations/` 目录，包含所有表结构变更的 SQL 脚本。

---

## 5. 实施顺序

### Phase 1: 基础架构
1. 添加新依赖
2. 创建数据库迁移脚本
3. 设置主题系统
4. 重构项目结构（新增 services、hooks 目录）

### Phase 2: UI 现代化
1. 创建设计系统（CSS 变量）
2. 重写 TaskCardV2 组件
3. 实现侧边栏导航
4. 添加页面过渡动画
5. 实现暗色主题

### Phase 3: 功能实现（按优先级）
1. 快速添加系统
2. 时间追踪系统
3. 通知系统
4. 任务依赖系统

### Phase 4: 仪表盘与统计
1. 创建仪表盘首页
2. 实现统计图表
3. 添加空状态插画

### Phase 5: 优化与测试
1. 响应式优化
2. 性能优化
3. 端到端测试

---

## 6. 成功标准

### 功能标准
- [ ] 用户可以在 3 秒内通过快捷键创建任务
- [ ] 计时器误差不超过 1 秒/小时
- [ ] 提醒通知在设定时间前后 1 分钟内送达
- [ ] 依赖图可以清晰展示 10+ 任务的依赖关系

### 体验标准
- [ ] 首屏加载时间 < 2 秒
- [ ] 交互响应时间 < 100ms
- [ ] Lighthouse 性能评分 > 90
- [ ] 支持完全键盘操作

---

## 7. 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 智能解析准确率不足 | 中 | 中 | 提供手动修正选项，持续优化解析规则 |
| 邮件服务被标记为垃圾邮件 | 中 | 高 | 使用 SMTP 认证，添加退订链接 |
| 依赖图性能问题（大量任务） | 低 | 中 | 限制单次显示节点数，实现虚拟滚动 |
| 主题闪烁（FOUC） | 中 | 低 | 在 HTML head 中内联主题脚本 |

---

## 附录

### A. API 详细规范
（将在实施阶段补充完整请求/响应格式）

### B. 组件 Props 定义
（将在实施阶段补充 TypeScript 接口定义）

### C. 数据库 ERD
（将在实施阶段生成完整实体关系图）
