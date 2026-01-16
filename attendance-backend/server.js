const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import routes
const employeeRoutes = require('./routes/employeeRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const authRoutes = require('./routes/authRoutes');
const onboardingRoutes = require('./routes/onboardingRoutes');
const otpRoutes = require('./routes/otpRoutes');
const profileRoutes = require('./routes/profileRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Import middleware
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;
const FACE_SERVICE_URL = process.env.FACE_SERVICE_URL || 'http://localhost:8000';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'attendance-backend' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/employees', employeeRoutes); // Legacy route for backward compatibility
app.use('/api/attendance', attendanceRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`Face service URL: ${FACE_SERVICE_URL}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
