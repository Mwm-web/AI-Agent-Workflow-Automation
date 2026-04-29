import React, { useState, useEffect } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useQuickAdd } from '../../hooks/useQuickAdd';
import './QuickAddModal.css';

const QuickAddModal = ({ isOpen, onClose, onSubmit, categories = [] }) => {
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState(null);
  const { parseInput } = useQuickAdd();

  // 快捷键 Ctrl/Cmd + K 打开
  useHotkeys('ctrl+k, meta+k', (e) => {
    e.preventDefault();
    onClose();
  });

  useEffect(() => {
    if (input.trim()) {
      setParsed(parseInput(input));
    } else {
      setParsed(null);
    }
  }, [input, parseInput]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (parsed?.title) {
      onSubmit(parsed);
      setInput('');
      onClose();
    }
  };

  const handleClose = () => {
    setInput('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="quickadd-overlay" onClick={handleClose} />
      <div className="quickadd-modal">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className="quickadd-input"
            placeholder="输入任务... 例如：明天下午3点开会 #工作 高优先级"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
          />
          
          {parsed && (
            <div className="quickadd-preview">
              <div className="preview-title">{parsed.title}</div>
              <div className="preview-tags">
                {parsed.dueDate && (
                  <span className="preview-tag">📅 {parsed.dueDate}</span>
                )}
                {parsed.priority !== 'medium' && (
                  <span className={`preview-tag priority-${parsed.priority}`}>
                    {parsed.priority === 'high' ? '🔴 高' : '🟢 低'}
                  </span>
                )}
                {parsed.category && (
                  <span className="preview-tag"># {parsed.category}</span>
                )}
                {parsed.estimatedMinutes && (
                  <span className="preview-tag">
                    ⏱️ {parsed.estimatedMinutes >= 60 
                      ? `${Math.floor(parsed.estimatedMinutes / 60)}小时` 
                      : `${parsed.estimatedMinutes}分钟`}
                  </span>
                )}
              </div>
            </div>
          )}
          
          <div className="quickadd-footer">
            <span className="quickadd-hint">按 Enter 创建，ESC 关闭</span>
            <button type="submit" className="btn btn-primary" disabled={!parsed?.title}>
              创建任务
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default QuickAddModal;
