import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationCenter from '../components/NotificationCenter/NotificationCenter';
import TimeTracker from '../components/TimeTracker/TimeTracker';
import ThemeToggle from '../components/ThemeToggle/ThemeToggle';
import QuickAddModal from '../components/QuickAddModal/QuickAddModal';
import StatsDashboard from '../components/StatsDashboard/StatsDashboard';
import FloatingActionButton from '../components/FloatingActionButton/FloatingActionButton';
import axios from 'axios';
import { useHotkeys } from 'react-hotkeys-hook';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filter, setFilter] = useState({ status: '', priority: '' });
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    dueDate: '',
    category: '',
    tags: ''
  });

  // 键盘快捷键
  useHotkeys('ctrl+n, meta+n', (e) => {
    e.preventDefault();
    if (!showModal && !showQuickAdd) handleCreateTask();
  });

  useHotkeys('ctrl+k, meta+k', (e) => {
    e.preventDefault();
    if (!showModal && !showQuickAdd) setShowQuickAdd(true);
  });

  useHotkeys('esc', () => {
    if (showModal) setShowModal(false);
    if (showQuickAdd) setShowQuickAdd(false);
  });

  // 从统计卡片筛选
  const handleStatFilter = useCallback((newFilter) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
  }, []);

  // 任务置顶功能
  const handlePinTask = async (taskId, isPinned) => {
    try {
      await axios.patch(`/api/tasks/${taskId}/pin`, { isPinned: !isPinned });
      fetchTasks();
    } catch (error) {
      console.error('Failed to pin task:', error);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [filter]);

  const fetchTasks = async () => {
    try {
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.priority) params.priority = filter.priority;

      const response = await axios.get('/api/tasks', { params });
      setTasks(response.data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  // 过滤和排序任务
  const filteredTasks = tasks
    .filter(task => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        task.title?.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => {
      // 置顶任务排在最前面
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      let aVal, bVal;
      switch (sortBy) {
        case 'dueDate':
          aVal = a.dueDate || '9999-12-31';
          bVal = b.dueDate || '9999-12-31';
          break;
        case 'priority':
          const priorityWeight = { high: 3, medium: 2, low: 1 };
          aVal = priorityWeight[a.priority] || 0;
          bVal = priorityWeight[b.priority] || 0;
          break;
        case 'status':
          const statusWeight = { pending: 1, 'in-progress': 2, completed: 3 };
          aVal = statusWeight[a.status] || 0;
          bVal = statusWeight[b.status] || 0;
          break;
        default:
          aVal = a.createdAt || '';
          bVal = b.createdAt || '';
      }
      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      status: 'pending',
      priority: 'medium',
      dueDate: '',
      category: '',
      tags: ''
    });
    setShowModal(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      category: task.category?._id || '',
      tags: task.tags ? task.tags.join(', ') : ''
    });
    setShowModal(true);
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('确定要删除这个任务吗？')) {
      try {
        await axios.delete(`/api/tasks/${taskId}`);
        fetchTasks();
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      await axios.patch(`/api/tasks/${taskId}/status`, { status });
      fetchTasks();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const taskData = {
      ...formData,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []
    };

    try {
      if (editingTask) {
        await axios.put(`/api/tasks/${editingTask._id}`, taskData);
      } else {
        await axios.post('/api/tasks', taskData);
      }
      setShowModal(false);
      fetchTasks();
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444'
    };
    return colors[priority] || colors.medium;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#6b7280',
      'in-progress': '#3b82f6',
      completed: '#10b981'
    };
    return colors[status] || colors.pending;
  };

  const handleQuickAdd = async (parsed) => {
    try {
      const taskData = {
        title: parsed.title,
        description: parsed.description,
        status: 'pending',
        priority: parsed.priority,
        dueDate: parsed.dueDate,
        category: parsed.category,
        estimatedMinutes: parsed.estimatedMinutes,
        tags: []
      };
      await axios.post('/api/tasks', taskData);
      fetchTasks();
    } catch (error) {
      console.error('Failed to quick add task:', error);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>任务管理器</h1>
          <div className="user-info">
            <ThemeToggle />
            <NotificationCenter />
            <span>欢迎，{user?.username}</span>
            <button onClick={handleLogout} className="btn btn-secondary">退出登录</button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <StatsDashboard onFilter={handleStatFilter} />

        <div className="controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="搜索任务标题、描述或标签..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filters">
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="filter-select"
            >
              <option value="">所有状态</option>
              <option value="pending">待办</option>
              <option value="in-progress">进行中</option>
              <option value="completed">已完成</option>
            </select>

            <select
              value={filter.priority}
              onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
              className="filter-select"
            >
              <option value="">所有优先级</option>
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="createdAt">创建时间</option>
              <option value="dueDate">截止日期</option>
              <option value="priority">优先级</option>
              <option value="status">状态</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="btn btn-sort"
              title={sortOrder === 'asc' ? '升序' : '降序'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          <button onClick={handleCreateTask} className="btn btn-primary">
            + 新建任务
          </button>
        </div>

        <div className="tasks-grid">
          {filteredTasks.length === 0 ? (
            <div className="empty-state">
              <h3>{tasks.length === 0 ? '暂无任务' : '没有找到匹配的任务'}</h3>
              <p>{tasks.length === 0 ? '创建您的第一个任务开始使用吧！' : '尝试调整搜索或筛选条件'}</p>
            </div>
          ) : (
            filteredTasks.map(task => {
              const priorityText = { low: '低', medium: '中', high: '高' }[task.priority] || task.priority;
              const statusText = { pending: '待办', 'in-progress': '进行中', completed: '已完成' }[task.status] || task.status;
              return (
              <div key={task._id} className={`task-card ${task.isPinned ? 'pinned' : ''}`}>
                <div className="task-header">
                  <button
                    onClick={() => handlePinTask(task._id, task.isPinned)}
                    className={`pin-btn ${task.isPinned ? 'pinned' : ''}`}
                    title={task.isPinned ? '取消置顶' : '置顶任务'}
                  >
                    📌
                  </button>
                  <h3>{task.title}</h3>
                  <div className="task-badges">
                    <span
                      className="badge badge-priority"
                      style={{ backgroundColor: getPriorityColor(task.priority) }}
                    >
                      {priorityText}
                    </span>
                    <span
                      className="badge badge-status"
                      style={{ backgroundColor: getStatusColor(task.status) }}
                    >
                      {statusText}
                    </span>
                  </div>
                </div>

                {task.description && (
                  <p className="task-description">{task.description}</p>
                )}

                <div className="task-meta">
                  {task.category && (
                    <span
                      className="category-tag"
                      style={{ backgroundColor: task.category.color }}
                    >
                      {task.category.name}
                    </span>
                  )}
                  {task.dueDate && (
                    <span className="due-date">
                      截止日期：{new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {task.tags && task.tags.length > 0 && (
                  <div className="task-tags">
                    {task.tags.map((tag, index) => (
                      <span key={index} className="tag">#{tag}</span>
                    ))}
                  </div>
                )}

                <div className="task-actions">
                  <TimeTracker taskId={task.id || task._id} />
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task._id, e.target.value)}
                    className="status-select"
                  >
                    <option value="pending">待办</option>
                    <option value="in-progress">进行中</option>
                    <option value="completed">已完成</option>
                  </select>
                  <button
                    onClick={() => handleEditTask(task)}
                    className="btn btn-small"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task._id)}
                    className="btn btn-small btn-danger"
                  >
                    删除
                  </button>
                </div>
              </div>
              )
            })
          )}
        </div>
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTask ? '编辑任务' : '新建任务'}</h2>
              <button onClick={() => setShowModal(false)} className="close-btn">×</button>
            </div>

            <form onSubmit={handleSubmit} className="task-form">
              <div className="form-group">
                <label>标题 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>状态</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="pending">待办</option>
                    <option value="in-progress">进行中</option>
                    <option value="completed">已完成</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>优先级</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>截止日期</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>分类</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="">无分类</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>标签（用逗号分隔）</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="工作, 紧急, 重要"
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTask ? '更新任务' : '创建任务'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <QuickAddModal
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onSubmit={handleQuickAdd}
        categories={categories}
      />

      <FloatingActionButton onClick={() => setShowQuickAdd(true)} />
    </div>
  );
};

export default Dashboard;
