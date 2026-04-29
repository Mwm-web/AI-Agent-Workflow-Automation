import React from 'react';
import './FloatingActionButton.css';

const FloatingActionButton = ({ onClick }) => {
  return (
    <button className="fab" onClick={onClick} title="快速添加任务 (Ctrl+K)">
      <span className="fab-icon">+</span>
    </button>
  );
};

export default FloatingActionButton;
