import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const TimerContext = createContext();

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within TimerProvider');
  }
  return context;
};

export const TimerProvider = ({ children }) => {
  const [activeTimer, setActiveTimer] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchActiveTimer = useCallback(async () => {
    try {
      const response = await axios.get('/api/time-entries/active');
      if (response.data) {
        setActiveTimer(response.data);
        const startTime = new Date(response.data.startTime).getTime();
        const now = Date.now();
        setElapsedSeconds(Math.floor((now - startTime) / 1000));
      } else {
        setActiveTimer(null);
        setElapsedSeconds(0);
      }
    } catch (error) {
      console.error('Failed to fetch active timer:', error);
    }
  }, []);

  const startTimer = async (taskId) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/time-entries/start', { taskId });
      setActiveTimer(response.data);
      setElapsedSeconds(0);
      return response.data;
    } catch (error) {
      console.error('Failed to start timer:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const stopTimer = async () => {
    if (!activeTimer) return;

    try {
      setLoading(true);
      const response = await axios.patch(`/api/time-entries/${activeTimer.id}/stop`);
      setActiveTimer(null);
      setElapsedSeconds(0);
      return response.data;
    } catch (error) {
      console.error('Failed to stop timer:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activeTimer) return;

    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer]);

  useEffect(() => {
    if (activeTimer && elapsedSeconds > 0) {
      const minutes = Math.floor(elapsedSeconds / 60);
      const seconds = elapsedSeconds % 60;
      document.title = `${minutes}:${seconds.toString().padStart(2, '0')} - ${activeTimer.taskTitle}`;
    } else {
      document.title = 'Task Manager';
    }
  }, [activeTimer, elapsedSeconds]);

  useEffect(() => {
    fetchActiveTimer();
  }, [fetchActiveTimer]);

  const formatElapsedTime = () => {
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <TimerContext.Provider value={{
      activeTimer,
      elapsedSeconds,
      elapsedTimeFormatted: formatElapsedTime(),
      loading,
      startTimer,
      stopTimer,
      fetchActiveTimer
    }}>
      {children}
    </TimerContext.Provider>
  );
};
