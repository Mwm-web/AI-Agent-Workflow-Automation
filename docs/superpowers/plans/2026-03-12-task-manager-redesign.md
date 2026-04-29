# Task Manager UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernize the task manager with glassmorphism design, add Kanban/Calendar/Statistics views, and enhance UX with animations.

**Architecture:** Replace vanilla CSS with Ant Design + custom glassmorphism styles. Use Framer Motion for animations. Add react-beautiful-dnd for Kanban drag-and-drop. Use Recharts for data visualization.

**Tech Stack:** React 18, Ant Design 5.x, Framer Motion, Recharts, react-beautiful-dnd, date-fns

---

## File Structure Changes

### New Files
- `frontend/src/components/Layout/` - Layout components
- `frontend/src/components/Kanban/` - Kanban board components
- `frontend/src/components/Calendar/` - Calendar view components
- `frontend/src/components/Statistics/` - Statistics dashboard components
- `frontend/src/components/GlassCard/` - Reusable glassmorphism card
- `frontend/src/styles/glassmorphism.css` - Global glassmorphism styles
- `frontend/src/hooks/useTheme.js` - Dark mode hook
- `frontend/src/utils/format.js` - Date/formatting utilities

### Modified Files
- `frontend/package.json` - Add dependencies
- `frontend/src/App.js` - New routing structure
- `frontend/src/index.css` - Global styles with CSS variables
- `frontend/src/pages/Dashboard.js` - Refactor to use new layout
- `frontend/src/context/AuthContext.js` - Add theme persistence

---

## Chunk 1: Setup Dependencies and Global Styles

### Task 1.1: Install Dependencies

**Files:**
- Modify: `frontend/package.json`

- [ ] **Step 1: Install Ant Design and icons**

```bash
cd frontend && npm install antd @ant-design/icons
```

- [ ] **Step 2: Install animation and chart libraries**

```bash
cd frontend && npm install framer-motion recharts react-beautiful-dnd date-fns
```

- [ ] **Step 3: Verify installation**

Run: `cd frontend && npm list antd framer-motion recharts`
Expected: All packages listed with versions

- [ ] **Step 4: Commit**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "deps: add antd, framer-motion, recharts, react-beautiful-dnd"
```

---

### Task 1.2: Create Global Glassmorphism Styles

**Files:**
- Create: `frontend/src/styles/glassmorphism.css`
- Modify: `frontend/src/index.css`

- [ ] **Step 1: Create glassmorphism CSS file**

Create `frontend/src/styles/glassmorphism.css`:

```css
/* Glassmorphism Design System */
:root {
  /* Primary Gradient */
  --gradient-primary: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%);
  --gradient-hover: linear-gradient(135deg, #7C3AED 0%, #2563EB 100%);

  /* Glass Effect */
  --glass-bg: rgba(255, 255, 255, 0.15);
  --glass-bg-dark: rgba(17, 24, 39, 0.7);
  --glass-border: rgba(255, 255, 255, 0.2);
  --glass-border-dark: rgba(255, 255, 255, 0.1);
  --glass-blur: blur(20px);
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

  /* Colors */
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --text-light: #ffffff;
  --bg-page: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  /* Priority Colors */
  --priority-high: #ef4444;
  --priority-medium: #f59e0b;
  --priority-low: #10b981;

  /* Status Colors */
  --status-pending: #6b7280;
  --status-progress: #3b82f6;
  --status-completed: #10b981;

  /* Spacing */
  --radius-lg: 16px;
  --radius-md: 12px;
  --radius-sm: 8px;
}

/* Dark Mode Overrides */
[data-theme='dark'] {
  --glass-bg: rgba(17, 24, 39, 0.7);
  --glass-border: rgba(255, 255, 255, 0.1);
  --text-primary: #f9fafb;
  --text-secondary: #9ca3af;
  --bg-page: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
}

/* Base Styles */
.glass-page {
  min-height: 100vh;
  background: var(--bg-page);
  background-attachment: fixed;
}

/* Glass Card */
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--glass-shadow);
}

.glass-card-hover {
  transition: all 0.3s ease;
}

.glass-card-hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

/* Glass Sidebar */
.glass-sidebar {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-right: 1px solid var(--glass-border);
}

/* Glass Header */
.glass-header {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-bottom: 1px solid var(--glass-border);
}

/* Priority Badge Styles */
.badge-priority-high {
  background: rgba(239, 68, 68, 0.2);
  color: var(--priority-high);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.badge-priority-medium {
  background: rgba(245, 158, 11, 0.2);
  color: var(--priority-medium);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.badge-priority-low {
  background: rgba(16, 185, 129, 0.2);
  color: var(--priority-low);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

/* Status Badge Styles */
.badge-status-pending {
  background: rgba(107, 114, 128, 0.2);
  color: var(--status-pending);
  border: 1px solid rgba(107, 114, 128, 0.3);
}

.badge-status-progress {
  background: rgba(59, 130, 246, 0.2);
  color: var(--status-progress);
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.badge-status-completed {
  background: rgba(16, 185, 129, 0.2);
  color: var(--status-completed);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

/* Scrollbar Styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
```

- [ ] **Step 2: Update index.css to import glassmorphism styles**

Replace `frontend/src/index.css`:

```css
@import './styles/glassmorphism.css';

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#root {
  min-height: 100vh;
}
```

- [ ] **Step 3: Create styles directory if not exists**

Run: `mkdir -p frontend/src/styles`

- [ ] **Step 4: Commit**

```bash
git add frontend/src/styles/glassmorphism.css frontend/src/index.css
git commit -m "style: add glassmorphism design system with CSS variables"
```

---

## Chunk 2: Layout Components

### Task 2.1: Create Layout Shell

**Files:**
- Create: `frontend/src/components/Layout/AppLayout.js`
- Create: `frontend/src/components/Layout/Sidebar.js`
- Create: `frontend/src/components/Layout/Header.js`
- Create: `frontend/src/components/Layout/index.js`

- [ ] **Step 1: Create Sidebar component**

Create `frontend/src/components/Layout/Sidebar.js`:

```jsx
import React from 'react';
import { Layout, Menu, Switch } from 'antd';
import {
  DashboardOutlined,
  CalendarOutlined,
  BarChartOutlined,
  SettingOutlined,
  BulbOutlined,
  MoonOutlined
} from '@ant-design/icons';

const { Sider } = Layout;

const Sidebar = ({ collapsed, theme, toggleTheme, selectedView, setView }) => {
  const menuItems = [
    {
      key: 'kanban',
      icon: <DashboardOutlined />,
      label: '看板',
    },
    {
      key: 'calendar',
      icon: <CalendarOutlined />,
      label: '日历',
    },
    {
      key: 'statistics',
      icon: <BarChartOutlined />,
      label: '统计',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
  ];

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      className="glass-sidebar"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
      }}
    >
      <div style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: '1px solid var(--glass-border)'
      }}>
        {!collapsed && (
          <h1 style={{
            color: 'var(--text-light)',
            fontSize: 20,
            fontWeight: 700,
            margin: 0,
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            TaskFlow
          </h1>
        )}
        {collapsed && (
          <span style={{ fontSize: 24 }}>🎯</span>
        )}
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedView]}
        items={menuItems}
        onClick={({ key }) => setView(key)}
        style={{
          background: 'transparent',
          borderRight: 'none',
        }}
      />

      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
      }}>
        {!collapsed && (
          <>
            <span style={{ color: 'var(--text-light)', fontSize: 12 }}>
              {theme === 'dark' ? <MoonOutlined /> : <BulbOutlined />}
            </span>
            <Switch
              checked={theme === 'dark'}
              onChange={toggleTheme}
              size="small"
            />
          </>
        )}
        {collapsed && (
          <span
            onClick={toggleTheme}
            style={{
              color: 'var(--text-light)',
              fontSize: 16,
              cursor: 'pointer'
            }}
          >
            {theme === 'dark' ? <MoonOutlined /> : <BulbOutlined />}
          </span>
        )}
      </div>
    </Sider>
  );
};

export default Sidebar;
```

- [ ] **Step 2: Create Header component**

Create `frontend/src/components/Layout/Header.js`:

```jsx
import React from 'react';
import { Layout, Button, Avatar, Dropdown, Space } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined
} from '@ant-design/icons';

const { Header: AntHeader } = Layout;

const Header = ({ collapsed, setCollapsed, user, onLogout }) => {
  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: onLogout,
    },
  ];

  return (
    <AntHeader
      className="glass-header"
      style={{
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={() => setCollapsed(!collapsed)}
        style={{
          fontSize: 16,
          color: 'var(--text-light)',
        }}
      />

      <Space size={16}>
        <Button
          type="text"
          icon={<BellOutlined />}
          style={{
            fontSize: 18,
            color: 'var(--text-light)',
          }}
        />

        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Space style={{ cursor: 'pointer' }}>
            <Avatar icon={<UserOutlined />} style={{ background: 'var(--gradient-primary)' }} />
            <span style={{ color: 'var(--text-light)' }}>
              {user?.username}
            </span>
          </Space>
        </Dropdown>
      </Space>
    </AntHeader>
  );
};

export default Header;
```

- [ ] **Step 3: Create AppLayout component**

Create `frontend/src/components/Layout/AppLayout.js`:

```jsx
import React, { useState, useEffect } from 'react';
import { Layout } from 'antd';
import Sidebar from './Sidebar';
import Header from './Header';

const { Content } = Layout;

const AppLayout = ({ user, onLogout, children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [view, setView] = useState('kanban');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <Layout className="glass-page" style={{ minHeight: '100vh' }}>
      <Sidebar
        collapsed={collapsed}
        theme={theme}
        toggleTheme={toggleTheme}
        selectedView={view}
        setView={setView}
      />
      <Layout style={{ background: 'transparent' }}>
        <Header
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          user={user}
          onLogout={onLogout}
        />
        <Content
          style={{
            margin: 24,
            padding: 24,
            minHeight: 280,
            background: 'transparent',
          }}
        >
          {React.cloneElement(children, { currentView: view })}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
```

- [ ] **Step 4: Create Layout index file**

Create `frontend/src/components/Layout/index.js`:

```jsx
export { default as AppLayout } from './AppLayout';
export { default as Sidebar } from './Sidebar';
export { default as Header } from './Header';
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/Layout/
git commit -m "feat: add glassmorphism layout components with sidebar and header"
```

---

## Chunk 3: Refactor Dashboard with View Switching

### Task 3.1: Update Dashboard to Use New Layout

**Files:**
- Modify: `frontend/src/App.js`
- Modify: `frontend/src/pages/Dashboard.js`

- [ ] **Step 1: Update App.js routing**

Replace `frontend/src/App.js`:

```jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import './index.css';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'var(--bg-page)'
      }}>
        <div className="glass-card" style={{ padding: 40 }}>
          加载中...
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'var(--bg-page)'
      }}>
        <div className="glass-card" style={{ padding: 40 }}>
          加载中...
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/" /> : children;
};

const AppContent = () => {
  const { user, logout } = useAuth();

  return (
    <AppLayout user={user} onLogout={logout}>
      <Dashboard />
    </AppLayout>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/*" element={<PrivateRoute><AppContent /></PrivateRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
```

- [ ] **Step 2: Refactor Dashboard to support view switching**

Replace `frontend/src/pages/Dashboard.js`:

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import KanbanBoard from '../components/Kanban/KanbanBoard';
import CalendarView from '../components/Calendar/CalendarView';
import StatisticsView from '../components/Statistics/StatisticsView';

const Dashboard = ({ currentView }) => {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, categoriesRes] = await Promise.all([
        axios.get('/api/tasks'),
        axios.get('/api/categories')
      ]);
      setTasks(tasksRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshTasks = () => {
    fetchData();
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '60vh'
      }}>
        <motion.div
          className="glass-card"
          style={{ padding: '40px 60px', textAlign: 'center' }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          加载中...
        </motion.div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentView}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        {currentView === 'kanban' && (
          <KanbanBoard
            tasks={tasks}
            categories={categories}
            onTaskUpdate={refreshTasks}
          />
        )}
        {currentView === 'calendar' && (
          <CalendarView
            tasks={tasks}
            categories={categories}
            onTaskUpdate={refreshTasks}
          />
        )}
        {currentView === 'statistics' && (
          <StatisticsView tasks={tasks} />
        )}
        {currentView === 'settings' && (
          <div className="glass-card" style={{ padding: 40 }}>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: 24 }}>
              设置
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              设置功能即将上线...
            </p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default Dashboard;
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/App.js frontend/src/pages/Dashboard.js
git commit -m "refactor: update App routing and Dashboard with view switching"
```

---

## Chunk 4: Kanban Board View

### Task 4.1: Create Kanban Components

**Files:**
- Create: `frontend/src/components/Kanban/KanbanBoard.js`
- Create: `frontend/src/components/Kanban/KanbanColumn.js`
- Create: `frontend/src/components/Kanban/KanbanCard.js`
- Create: `frontend/src/components/Kanban/TaskModal.js`
- Create: `frontend/src/components/Kanban/index.js`

- [ ] **Step 1: Create KanbanCard component**

Create `frontend/src/components/Kanban/KanbanCard.js`:

```jsx
import React from 'react';
import { Card, Tag, Space, Dropdown, Button } from 'antd';
import { MoreOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';

const priorityConfig = {
  high: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', label: '高' },
  medium: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', label: '中' },
  low: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', label: '低' },
};

const KanbanCard = ({ task, onEdit, onDelete }) => {
  const priority = priorityConfig[task.priority] || priorityConfig.medium;

  const menuItems = [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: '编辑',
      onClick: () => onEdit(task),
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: '删除',
      danger: true,
      onClick: () => onDelete(task.id),
    },
  ];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        size="small"
        className="glass-card-hover"
        style={{
          marginBottom: 12,
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: 12,
        }}
        bodyStyle={{ padding: 16 }}
        actions={[
          <Dropdown key="more" menu={{ items: menuItems }} placement="bottomRight">
            <Button type="text" size="small" icon={<MoreOutlined />} />
          </Dropdown>
        ]}
      >
        <div style={{ marginBottom: 8 }}>
          <h4 style={{
            margin: 0,
            color: 'var(--text-primary)',
            fontSize: 14,
            fontWeight: 600,
            lineHeight: 1.4
          }}>
            {task.title}
          </h4>
        </div>

        {task.description && (
          <p style={{
            margin: '8px 0',
            color: 'var(--text-secondary)',
            fontSize: 12,
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {task.description}
          </p>
        )}

        <Space wrap style={{ marginTop: 8 }}>
          <Tag
            style={{
              background: priority.bg,
              color: priority.color,
              border: `1px solid ${priority.color}40`,
              borderRadius: 4,
              fontSize: 11,
              padding: '2px 8px'
            }}
          >
            {priority.label}优先级
          </Tag>

          {task.category && (
            <Tag
              style={{
                background: `${task.category.color}20`,
                color: task.category.color,
                border: `1px solid ${task.category.color}40`,
                borderRadius: 4,
                fontSize: 11,
                padding: '2px 8px'
              }}
            >
              {task.category.name}
            </Tag>
          )}
        </Space>

        {task.dueDate && (
          <div style={{
            marginTop: 8,
            fontSize: 11,
            color: new Date(task.dueDate) < new Date() ? '#ef4444' : 'var(--text-secondary)'
          }}>
            📅 {new Date(task.dueDate).toLocaleDateString('zh-CN')}
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default KanbanCard;
```

- [ ] **Step 2: Create KanbanColumn component**

Create `frontend/src/components/Kanban/KanbanColumn.js`:

```jsx
import React from 'react';
import { Button, Badge } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import KanbanCard from './KanbanCard';

const columnConfig = {
  pending: {
    title: '待办',
    color: '#6b7280',
    gradient: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
  },
  'in-progress': {
    title: '进行中',
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)'
  },
  completed: {
    title: '已完成',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)'
  }
};

const KanbanColumn = ({ status, tasks, onEdit, onDelete, onAdd }) => {
  const config = columnConfig[status];

  return (
    <div
      style={{
        flex: 1,
        minWidth: 300,
        maxWidth: 400,
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 220px)'
      }}
    >
      {/* Column Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          padding: '12px 16px',
          background: config.gradient,
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            color: 'white',
            fontWeight: 600,
            fontSize: 14
          }}>
            {config.title}
          </span>
          <Badge
            count={tasks.length}
            style={{
              backgroundColor: 'rgba(255,255,255,0.3)',
              color: 'white',
              fontSize: 11
            }}
          />
        </div>
        <Button
          type="text"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => onAdd(status)}
          style={{ color: 'white' }}
        />
      </div>

      {/* Cards Container */}
      <motion.div
        layout
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '4px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        {tasks.map(task => (
          <KanbanCard
            key={task.id}
            task={task}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </motion.div>
    </div>
  );
};

export default KanbanColumn;
```

- [ ] **Step 3: Create TaskModal component**

Create `frontend/src/components/Kanban/TaskModal.js`:

```jsx
import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker, Button, Space } from 'antd';
import { motion } from 'framer-motion';
import axios from 'axios';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const TaskModal = ({
  visible,
  onCancel,
  onSuccess,
  editingTask,
  categories,
  defaultStatus = 'pending'
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      if (editingTask) {
        form.setFieldsValue({
          title: editingTask.title,
          description: editingTask.description,
          status: editingTask.status,
          priority: editingTask.priority,
          dueDate: editingTask.dueDate ? dayjs(editingTask.dueDate) : null,
          category: editingTask.category?._id,
          tags: editingTask.tags?.join(', ')
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          status: defaultStatus,
          priority: 'medium'
        });
      }
    }
  }, [visible, editingTask, form, defaultStatus]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const taskData = {
        ...values,
        dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : null,
        tags: values.tags ? values.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      };

      if (editingTask) {
        await axios.put(`/api/tasks/${editingTask.id}`, taskData);
      } else {
        await axios.post('/api/tasks', taskData);
      }

      onSuccess();
      onCancel();
    } catch (error) {
      console.error('Failed to save task:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={520}
      centered
      destroyOnClose
      styles={{
        body: { padding: 0 }
      }}
      style={{
        '--glass-bg': 'rgba(255, 255, 255, 0.95)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        style={{
          background: 'var(--glass-bg)',
          borderRadius: 16,
          padding: 24
        }}
      >
        <h2 style={{
          margin: '0 0 24px 0',
          fontSize: 20,
          fontWeight: 600,
          background: 'var(--gradient-primary)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {editingTask ? '编辑任务' : '新建任务'}
        </h2>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            name="title"
            label="任务标题"
            rules={[{ required: true, message: '请输入任务标题' }]}
          >
            <Input placeholder="输入任务标题" size="large" />
          </Form.Item>

          <Form.Item
            name="description"
            label="任务描述"
          >
            <TextArea
              placeholder="输入任务描述（可选）"
              rows={3}
            />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="status"
              label="状态"
              rules={[{ required: true }]}
            >
              <Select placeholder="选择状态">
                <Option value="pending">待办</Option>
                <Option value="in-progress">进行中</Option>
                <Option value="completed">已完成</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="priority"
              label="优先级"
              rules={[{ required: true }]}
            >
              <Select placeholder="选择优先级">
                <Option value="high">高</Option>
                <Option value="medium">中</Option>
                <Option value="low">低</Option>
              </Select>
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="dueDate"
              label="截止日期"
            >
              <DatePicker
                style={{ width: '100%' }}
                placeholder="选择日期"
              />
            </Form.Item>

            <Form.Item
              name="category"
              label="分类"
            >
              <Select placeholder="选择分类" allowClear>
                {categories.map(cat => (
                  <Option key={cat._id} value={cat._id}>
                    <span style={{ color: cat.color }}>●</span> {cat.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            name="tags"
            label="标签"
          >
            <Input placeholder="用逗号分隔多个标签" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={onCancel} size="large">
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
                style={{
                  background: 'var(--gradient-primary)',
                  border: 'none'
                }}
              >
                {editingTask ? '保存' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </motion.div>
    </Modal>
  );
};

export default TaskModal;
```

- [ ] **Step 4: Create KanbanBoard component**

Create `frontend/src/components/Kanban/KanbanBoard.js`:

```jsx
import React, { useState, useMemo } from 'react';
import { Space, message, Popconfirm } from 'antd';
import axios from 'axios';
import KanbanColumn from './KanbanColumn';
import TaskModal from './TaskModal';

const KanbanBoard = ({ tasks, categories, onTaskUpdate }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [defaultStatus, setDefaultStatus] = useState('pending');

  const columns = useMemo(() => ({
    pending: tasks.filter(t => t.status === 'pending'),
    'in-progress': tasks.filter(t => t.status === 'in-progress'),
    completed: tasks.filter(t => t.status === 'completed')
  }), [tasks]);

  const handleAdd = (status) => {
    setDefaultStatus(status);
    setEditingTask(null);
    setModalVisible(true);
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setModalVisible(true);
  };

  const handleDelete = async (taskId) => {
    try {
      await axios.delete(`/api/tasks/${taskId}`);
      message.success('任务已删除');
      onTaskUpdate();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await axios.patch(`/api/tasks/${taskId}/status`, { status: newStatus });
      onTaskUpdate();
    } catch (error) {
      message.error('状态更新失败');
    }
  };

  return (
    <div>
      <Space
        direction="horizontal"
        size={24}
        style={{ width: '100%', alignItems: 'flex-start' }}
        wrap
      >
        {Object.entries(columns).map(([status, columnTasks]) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={columnTasks}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={handleAdd}
          />
        ))}
      </Space>

      <TaskModal
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onSuccess={onTaskUpdate}
        editingTask={editingTask}
        categories={categories}
        defaultStatus={defaultStatus}
      />
    </div>
  );
};

export default KanbanBoard;
```

- [ ] **Step 5: Create Kanban index file**

Create `frontend/src/components/Kanban/index.js`:

```jsx
export { default as KanbanBoard } from './KanbanBoard';
export { default as KanbanColumn } from './KanbanColumn';
export { default as KanbanCard } from './KanbanCard';
export { default as TaskModal } from './TaskModal';
```

- [ ] **Step 6: Install dayjs dependency**

```bash
cd frontend && npm install dayjs
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/Kanban/
git commit -m "feat: add Kanban board with columns, cards, and task modal"
```

---

## Chunk 5: Calendar View

### Task 5.1: Create Calendar Components

**Files:**
- Create: `frontend/src/components/Calendar/CalendarView.js`
- Create: `frontend/src/components/Calendar/CalendarGrid.js`
- Create: `frontend/src/components/Calendar/CalendarCard.js`
- Create: `frontend/src/components/Calendar/index.js`

- [ ] **Step 1: Create CalendarCard component**

Create `frontend/src/components/Calendar/CalendarCard.js`:

```jsx
import React from 'react';
import { Card, Tag } from 'antd';
import { motion } from 'framer-motion';

const priorityColors = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981'
};

const CalendarCard = ({ task, onClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      onClick={() => onClick(task)}
    >
      <Card
        size="small"
        style={{
          marginBottom: 8,
          borderRadius: 8,
          borderLeft: `3px solid ${priorityColors[task.priority] || '#6b7280'}`,
          background: 'rgba(255, 255, 255, 0.9)',
          cursor: 'pointer'
        }}
        bodyStyle={{ padding: '8px 12px' }}
      >
        <div style={{
          fontSize: 12,
          fontWeight: 500,
          color: '#1f2937',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {task.title}
        </div>
        {task.category && (
          <Tag
            size="small"
            style={{
              marginTop: 4,
              fontSize: 10,
              background: `${task.category.color}20`,
              color: task.category.color,
              border: 'none'
            }}
          >
            {task.category.name}
          </Tag>
        )}
      </Card>
    </motion.div>
  );
};

export default CalendarCard;
```

- [ ] **Step 2: Create CalendarGrid component**

Create `frontend/src/components/Calendar/CalendarGrid.js`:

```jsx
import React, { useState, useMemo } from 'react';
import { Button, Badge, Empty } from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import CalendarCard from './CalendarCard';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday
} from 'date-fns';
import { zhCN } from 'date-fns/locale';

const CalendarGrid = ({ tasks, onDateClick, onTaskClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { locale: zhCN });
    const calendarEnd = endOfWeek(monthEnd, { locale: zhCN });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  const getTasksForDay = (day) => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      return isSameDay(new Date(task.dueDate), day);
    });
  };

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="glass-card" style={{ padding: 24 }}>
      {/* Calendar Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h2 style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 600,
            color: 'var(--text-primary)'
          }}>
            {format(currentDate, 'yyyy年 M月', { locale: zhCN })}
          </h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              icon={<LeftOutlined />}
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              shape="circle"
            />
            <Button
              icon={<RightOutlined />}
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              shape="circle"
            />
          </div>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => onDateClick(new Date())}
          style={{
            background: 'var(--gradient-primary)',
            border: 'none'
          }}
        >
          新建任务
        </Button>
      </div>

      {/* Week Headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 8,
        marginBottom: 12
      }}>
        {weekDays.map(day => (
          <div
            key={day}
            style={{
              textAlign: 'center',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              fontSize: 14,
              padding: '8px 0'
            }}
          >
            周{day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 8
      }}>
        <AnimatePresence mode="wait">
          {calendarDays.map((day, index) => {
            const dayTasks = getTasksForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDate = isToday(day);

            return (
              <motion.div
                key={day.toISOString()}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.01 }}
                onClick={() => onDateClick(day)}
                style={{
                  minHeight: 120,
                  padding: 8,
                  borderRadius: 12,
                  background: isTodayDate
                    ? 'rgba(139, 92, 246, 0.15)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: isTodayDate
                    ? '2px solid #8B5CF6'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  opacity: isCurrentMonth ? 1 : 0.4,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 4
                }}>
                  <span style={{
                    fontWeight: isTodayDate ? 700 : 500,
                    color: isTodayDate ? '#8B5CF6' : 'var(--text-primary)',
                    fontSize: 14
                  }}>
                    {format(day, 'd')}
                  </span>
                  {dayTasks.length > 0 && (
                    <Badge
                      count={dayTasks.length}
                      size="small"
                      style={{ backgroundColor: '#8B5CF6' }}
                    />
                  )}
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4
                }}>
                  {dayTasks.slice(0, 2).map(task => (
                    <CalendarCard
                      key={task.id}
                      task={task}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTaskClick(task);
                      }}
                    />
                  ))}
                  {dayTasks.length > 2 && (
                    <div style={{
                      fontSize: 11,
                      color: 'var(--text-secondary)',
                      textAlign: 'center',
                      padding: '4px 0'
                    }}>
                      +{dayTasks.length - 2} 更多
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CalendarGrid;
```

- [ ] **Step 3: Create CalendarView component**

Create `frontend/src/components/Calendar/CalendarView.js`:

```jsx
import React, { useState } from 'react';
import CalendarGrid from './CalendarGrid';
import TaskModal from '../Kanban/TaskModal';

const CalendarView = ({ tasks, categories, onTaskUpdate }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [defaultDate, setDefaultDate] = useState(null);

  const handleDateClick = (date) => {
    setDefaultDate(date);
    setEditingTask(null);
    setModalVisible(true);
  };

  const handleTaskClick = (task) => {
    setEditingTask(task);
    setModalVisible(true);
  };

  return (
    <div>
      <CalendarGrid
        tasks={tasks}
        onDateClick={handleDateClick}
        onTaskClick={handleTaskClick}
      />

      <TaskModal
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onSuccess={onTaskUpdate}
        editingTask={editingTask}
        categories={categories}
        defaultStatus="pending"
      />
    </div>
  );
};

export default CalendarView;
```

- [ ] **Step 4: Create Calendar index file**

Create `frontend/src/components/Calendar/index.js`:

```jsx
export { default as CalendarView } from './CalendarView';
export { default as CalendarGrid } from './CalendarGrid';
export { default as CalendarCard } from './CalendarCard';
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/Calendar/
git commit -m "feat: add Calendar view with monthly grid and task cards"
```

---

## Chunk 6: Statistics Dashboard

### Task 6.1: Create Statistics Components

**Files:**
- Create: `frontend/src/components/Statistics/StatisticsView.js`
- Create: `frontend/src/components/Statistics/StatCard.js`
- Create: `frontend/src/components/Statistics/Charts.js`
- Create: `frontend/src/components/Statistics/index.js`

- [ ] **Step 1: Create StatCard component**

Create `frontend/src/components/Statistics/StatCard.js`:

```jsx
import React from 'react';
import { Card, Statistic } from 'antd';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, prefix, suffix, color, icon }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className="glass-card"
        style={{
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          borderRadius: 16
        }}
        bodyStyle={{ padding: 24 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24
            }}
          >
            {icon}
          </div>
          <Statistic
            title={title}
            value={value}
            prefix={prefix}
            suffix={suffix}
            valueStyle={{
              color: 'var(--text-primary)',
              fontSize: 28,
              fontWeight: 700
            }}
          />
        </div>
      </Card>
    </motion.div>
  );
};

export default StatCard;
```

- [ ] **Step 2: Create Charts component**

Create `frontend/src/components/Statistics/Charts.js`:

```jsx
import React from 'react';
import { Card } from 'antd';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { motion } from 'framer-motion';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

const StatusPieChart = ({ data }) => (
  <Card
    className="glass-card"
    title="任务状态分布"
    style={{ borderRadius: 16 }}
  >
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: 'rgba(255, 255, 255, 0.95)',
            border: 'none',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  </Card>
);

const WeeklyTrendChart = ({ data }) => (
  <Card
    className="glass-card"
    title="本周任务趋势"
    style={{ borderRadius: 16 }}
  >
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
        <XAxis dataKey="day" stroke="var(--text-secondary)" />
        <YAxis stroke="var(--text-secondary)" />
        <Tooltip
          contentStyle={{
            background: 'rgba(255, 255, 255, 0.95)',
            border: 'none',
            borderRadius: 8
          }}
        />
        <Line
          type="monotone"
          dataKey="created"
          stroke="#8B5CF6"
          strokeWidth={2}
          name="新建"
        />
        <Line
          type="monotone"
          dataKey="completed"
          stroke="#10b981"
          strokeWidth={2}
          name="完成"
        />
      </LineChart>
    </ResponsiveContainer>
  </Card>
);

const PriorityBarChart = ({ data }) => (
  <Card
    className="glass-card"
    title="任务优先级分布"
    style={{ borderRadius: 16 }}
  >
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
        <XAxis dataKey="name" stroke="var(--text-secondary)" />
        <YAxis stroke="var(--text-secondary)" />
        <Tooltip
          contentStyle={{
            background: 'rgba(255, 255, 255, 0.95)',
            border: 'none',
            borderRadius: 8
          }}
        />
        <Bar dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </Card>
);

export { StatusPieChart, WeeklyTrendChart, PriorityBarChart };
```

- [ ] **Step 3: Create StatisticsView component**

Create `frontend/src/components/Statistics/StatisticsView.js`:

```jsx
import React, { useMemo } from 'react';
import { Row, Col, Progress } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  FireOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import StatCard from './StatCard';
import { StatusPieChart, WeeklyTrendChart, PriorityBarChart } from './Charts';
import { format, subDays, startOfWeek } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const StatisticsView = ({ tasks }) => {
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const highPriority = tasks.filter(t => t.priority === 'high').length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Status data for pie chart
    const statusData = [
      { name: '已完成', value: completed },
      { name: '进行中', value: inProgress },
      { name: '待办', value: pending }
    ].filter(d => d.value > 0);

    // Priority data for bar chart
    const priorityData = [
      { name: '高', value: tasks.filter(t => t.priority === 'high').length },
      { name: '中', value: tasks.filter(t => t.priority === 'medium').length },
      { name: '低', value: tasks.filter(t => t.priority === 'low').length }
    ];

    // Weekly trend data
    const today = new Date();
    const weekStart = startOfWeek(today, { locale: zhCN });
    const weekData = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(today, 6 - i);
      const dayTasks = tasks.filter(t => {
        const taskDate = new Date(t.createdAt);
        return taskDate.toDateString() === date.toDateString();
      });
      return {
        day: format(date, 'EEE', { locale: zhCN }),
        created: dayTasks.length,
        completed: dayTasks.filter(t => t.status === 'completed').length
      };
    });

    return {
      total,
      completed,
      inProgress,
      pending,
      highPriority,
      completionRate,
      statusData,
      priorityData,
      weekData
    };
  }, [tasks]);

  return (
    <div>
      {/* Stats Row */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="总任务"
            value={stats.total}
            icon={<FileTextOutlined />}
            color="linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="已完成"
            value={stats.completed}
            icon={<CheckCircleOutlined />}
            color="linear-gradient(135deg, #10B981 0%, #34D399 100%)"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="进行中"
            value={stats.inProgress}
            icon={<ClockCircleOutlined />}
            color="linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="高优先级"
            value={stats.highPriority}
            icon={<FireOutlined />}
            color="linear-gradient(135deg, #EF4444 0%, #F87171 100%)"
          />
        </Col>
      </Row>

      {/* Completion Rate */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card"
        style={{
          padding: 24,
          marginBottom: 24,
          borderRadius: 16
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16
        }}>
          <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>
            任务完成率
          </h3>
          <span style={{
            fontSize: 24,
            fontWeight: 700,
            color: stats.completionRate >= 70 ? '#10b981' : '#f59e0b'
          }}>
            {stats.completionRate}%
          </span>
        </div>
        <Progress
          percent={stats.completionRate}
          strokeColor={{
            '0%': '#8B5CF6',
            '100%': '#3B82F6'
          }}
          trailColor="rgba(0,0,0,0.05)"
          strokeWidth={12}
          showInfo={false}
        />
      </motion.div>

      {/* Charts Row */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <StatusPieChart data={stats.statusData} />
        </Col>
        <Col xs={24} lg={8}>
          <PriorityBarChart data={stats.priorityData} />
        </Col>
        <Col xs={24} lg={8}>
          <WeeklyTrendChart data={stats.weekData} />
        </Col>
      </Row>
    </div>
  );
};

export default StatisticsView;
```

- [ ] **Step 4: Create Statistics index file**

Create `frontend/src/components/Statistics/index.js`:

```jsx
export { default as StatisticsView } from './StatisticsView';
export { default as StatCard } from './StatCard';
export * from './Charts';
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/Statistics/
git commit -m "feat: add Statistics dashboard with charts and metrics"
```

---

## Chunk 7: Update Login/Register Pages

### Task 7.1: Modernize Auth Pages

**Files:**
- Modify: `frontend/src/pages/Login.js`
- Modify: `frontend/src/pages/Register.js`

- [ ] **Step 1: Update Login page with glassmorphism**

Replace `frontend/src/pages/Login.js`:

```jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Checkbox, message, Card } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
      message.success('登录成功！');
      navigate('/');
    } catch (error) {
      message.error(error.response?.data?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-page)',
        padding: 24
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: 420 }}
      >
        <Card
          className="glass-card"
          style={{
            borderRadius: 24,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}
          bodyStyle={{ padding: 40 }}
        >
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              style={{
                width: 80,
                height: 80,
                margin: '0 auto 16px',
                borderRadius: 20,
                background: 'var(--gradient-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 40
              }}
            >
              🎯
            </motion.div>
            <h1 style={{
              fontSize: 28,
              fontWeight: 700,
              margin: 0,
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              TaskFlow
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
              登录您的账户
            </p>
          </div>

          <Form
            name="login"
            onFinish={onFinish}
            autoComplete="off"
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: 'var(--text-secondary)' }} />}
                placeholder="邮箱地址"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: 'var(--text-secondary)' }} />}
                placeholder="密码"
              />
            </Form.Item>

            <Form.Item>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Checkbox>记住我</Checkbox>
                <Link to="/forgot-password" style={{ color: '#8B5CF6' }}>
                  忘记密码？
                </Link>
              </div>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
                style={{
                  background: 'var(--gradient-primary)',
                  border: 'none',
                  height: 48,
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 600
                }}
              >
                登录
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                还没有账户？{' '}
              </span>
              <Link to="/register" style={{ color: '#8B5CF6', fontWeight: 600 }}>
                立即注册
              </Link>
            </div>
          </Form>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;
```

- [ ] **Step 2: Update Register page with glassmorphism**

Replace `frontend/src/pages/Register.js`:

```jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, message, Card } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await register(values.username, values.email, values.password);
      message.success('注册成功！');
      navigate('/');
    } catch (error) {
      message.error(error.response?.data?.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-page)',
        padding: 24
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: 420 }}
      >
        <Card
          className="glass-card"
          style={{
            borderRadius: 24,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}
          bodyStyle={{ padding: 40 }}
        >
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              style={{
                width: 80,
                height: 80,
                margin: '0 auto 16px',
                borderRadius: 20,
                background: 'var(--gradient-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 40
              }}
            >
              🚀
            </motion.div>
            <h1 style={{
              fontSize: 28,
              fontWeight: 700,
              margin: 0,
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              创建账户
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
              开始您的任务管理之旅
            </p>
          </div>

          <Form
            name="register"
            onFinish={onFinish}
            autoComplete="off"
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 3, message: '用户名至少3个字符' }
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: 'var(--text-secondary)' }} />}
                placeholder="用户名"
              />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: 'var(--text-secondary)' }} />}
                placeholder="邮箱地址"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: 'var(--text-secondary)' }} />}
                placeholder="密码"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: '请确认密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: 'var(--text-secondary)' }} />}
                placeholder="确认密码"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
                style={{
                  background: 'var(--gradient-primary)',
                  border: 'none',
                  height: 48,
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 600
                }}
              >
                注册
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                已有账户？{' '}
              </span>
              <Link to="/login" style={{ color: '#8B5CF6', fontWeight: 600 }}>
                立即登录
              </Link>
            </div>
          </Form>
        </Card>
      </motion.div>
    </div>
  );
};

export default Register;
```

- [ ] **Step 3: Delete old CSS files**

```bash
rm frontend/src/pages/Auth.css frontend/src/pages/Dashboard.css
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Login.js frontend/src/pages/Register.js
git rm frontend/src/pages/Auth.css frontend/src/pages/Dashboard.css || true
git commit -m "style: modernize Login and Register pages with glassmorphism"
```

---

## Chunk 8: Final Polish and Testing

### Task 8.1: Add Global Components and Finalize

**Files:**
- Create: `frontend/src/components/GlassCard.js`
- Modify: `frontend/src/index.js`
- Modify: `frontend/src/components/Kanban/KanbanBoard.js` (add drag-and-drop)

- [ ] **Step 1: Create reusable GlassCard component**

Create `frontend/src/components/GlassCard.js`:

```jsx
import React from 'react';
import { motion } from 'framer-motion';

const GlassCard = ({
  children,
  className = '',
  style = {},
  hover = true,
  onClick,
  ...props
}) => {
  return (
    <motion.div
      className={`glass-card ${hover ? 'glass-card-hover' : ''} ${className}`}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { y: -4 } : {}}
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--glass-shadow)',
        ...style
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;
```

- [ ] **Step 2: Update index.js to import Ant Design styles**

Replace `frontend/src/index.js`:

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import 'antd/dist/reset.css';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 3: Test the application**

Run: `cd frontend && npm start`

Expected: Application starts without errors, showing the new glassmorphism design

- [ ] **Step 4: Final commit**

```bash
git add frontend/src/components/GlassCard.js frontend/src/index.js
git commit -m "feat: add GlassCard component and finalize modern design"
```

---

## Summary

This implementation plan transforms the task manager with:

1. **Glassmorphism Design** - Semi-transparent cards with backdrop blur and gradient backgrounds
2. **Kanban Board** - Three-column view with status-based task grouping
3. **Calendar View** - Monthly grid showing tasks by due date
4. **Statistics Dashboard** - Charts and metrics for task analytics
5. **Modern Auth Pages** - Redesigned login/register with animations
6. **Dark Mode Support** - Theme toggle with localStorage persistence

**Dependencies Added:**
- antd @ant-design/icons
- framer-motion
- recharts
- date-fns
- dayjs
