import React, { useState } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import './NotificationCenter.css';

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const getIconByType = (type) => {
    switch (type) {
      case 'deadline_approaching': return '⏰';
      case 'deadline_passed': return '⚠️';
      case 'dependency_unlocked': return '🔓';
      default: return '📌';
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  return (
    <div className="notification-center">
      <button className="notification-trigger" onClick={() => setIsOpen(!isOpen)}>
        <span className="notification-icon">🔔</span>
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <>
          <div className="notification-overlay" onClick={() => setIsOpen(false)} />
          <div className="notification-dropdown">
            <div className="notification-header">
              <h3>通知</h3>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="mark-all-read">全部已读</button>
              )}
            </div>
            <div className="notification-list">
              {notifications.length === 0 ? (
                <div className="notification-empty">
                  <span>📭</span>
                  <p>暂无通知</p>
                </div>
              ) : (
                notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <span className="notification-type-icon">{getIconByType(notification.type)}</span>
                    <div className="notification-content">
                      <p className="notification-message">{notification.message}</p>
                      <span className="notification-time">
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <button
                      className="notification-delete"
                      onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;
