const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { pool, initDB } = require('./config/db');
const { startAllCrons } = require('./cron/reminderCron');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection and Initialization
initDB()
  .then(() => {
    console.log('Database initialized successfully');
    return pool.getConnection();
  })
  .then(connection => {
    console.log('MySQL Connected');
    connection.release();
  })
  .catch(err => console.log('MySQL Error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/time-entries', require('./routes/timeEntries'));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Task Manager API is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Start cron jobs
  startAllCrons();
});
