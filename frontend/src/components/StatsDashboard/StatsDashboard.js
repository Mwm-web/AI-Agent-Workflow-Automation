import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './StatsDashboard.css';

const StatsDashboard = ({ onFilter }) => {
  const [taskStats, setTaskStats] = useState({
    pending: 0,
    inProgress: 0,
    completed: 0,
    total: 0
  });
  const [timeStats, setTimeStats] = useState({
    today: 0,
    thisWeek: 0,
    thisMonth: 0
  });

  useEffect(() => {
    fetchTaskStats();
    fetchTimeStats();
  }, []);

  const fetchTaskStats = async () => {
    try {
      const response = await axios.get('/api/tasks');
      const tasks = response.data;
      setTaskStats({
        pending: tasks.filter(t => t.status === 'pending').length,
        inProgress: tasks.filter(t => t.status === 'in-progress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        total: tasks.length
      });
    } catch (error) {
      console.error('Failed to fetch task stats:', error);
    }
  };

  const fetchTimeStats = async () => {
    try {
      const response = await axios.get('/api/time-entries/stats/summary');
      setTimeStats(response.data);
    } catch (error) {
      console.error('Failed to fetch time stats:', error);
    }
  };

  const formatMinutes = (minutes) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="stats-dashboard">
      <div className="stats-grid">
        <div
          className={`stat-card tasks-pending ${onFilter ? 'clickable' : ''}`}
          onClick={() => onFilter?.({ status: 'pending' })}
        >
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-value">{taskStats.pending}</div>
            <div className="stat-label">待办任务</div>
          </div>
        </div>

        <div
          className={`stat-card tasks-progress ${onFilter ? 'clickable' : ''}`}
          onClick={() => onFilter?.({ status: 'in-progress' })}
        >
          <div className="stat-icon">🔄</div>
          <div className="stat-content">
            <div className="stat-value">{taskStats.inProgress}</div>
            <div className="stat-label">进行中</div>
          </div>
        </div>

        <div
          className={`stat-card tasks-completed ${onFilter ? 'clickable' : ''}`}
          onClick={() => onFilter?.({ status: 'completed' })}
        >
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{taskStats.completed}</div>
            <div className="stat-label">已完成</div>
          </div>
        </div>

        <div className="stat-card time-today">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <div className="stat-value">{formatMinutes(timeStats.today)}</div>
            <div className="stat-label">今日用时</div>
          </div>
        </div>
      </div>

      {taskStats.total > 0 && (
        <div className="progress-section">
          <div className="progress-header">
            <span>完成进度</span>
            <span>{Math.round((taskStats.completed / taskStats.total) * 100)}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(taskStats.completed / taskStats.total) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsDashboard;
