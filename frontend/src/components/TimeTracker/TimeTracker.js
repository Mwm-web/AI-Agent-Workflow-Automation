import React from 'react';
import { useTimer } from '../../context/TimerContext';
import './TimeTracker.css';

const TimeTracker = ({ taskId }) => {
  const { activeTimer, elapsedTimeFormatted, loading, startTimer, stopTimer } = useTimer();

  const isActive = activeTimer?.taskId === taskId;
  const isOtherActive = activeTimer && activeTimer.taskId !== taskId;

  const handleClick = async () => {
    if (isActive) {
      await stopTimer();
    } else {
      await startTimer(taskId);
    }
  };

  if (isOtherActive) {
    return (
      <button className="time-tracker time-tracker-disabled" disabled title="其他任务正在计时">
        <span className="time-tracker-icon">⏸️</span>
        <span className="time-tracker-text">计时中...</span>
      </button>
    );
  }

  return (
    <button
      className={`time-tracker ${isActive ? 'active' : ''}`}
      onClick={handleClick}
      disabled={loading}
    >
      <span className="time-tracker-icon">{isActive ? '⏹️' : '▶️'}</span>
      <span className="time-tracker-text">{isActive ? elapsedTimeFormatted : '开始计时'}</span>
      {isActive && <span className="time-tracker-pulse" />}
    </button>
  );
};

export default TimeTracker;
