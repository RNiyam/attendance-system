const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Configure SMTP transporter
const createTransporter = () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.warn('SMTP credentials not configured. Email functionality will not work.');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
};

class AuthController {
  // Sign up new user (with OTP support)
  async signup(req, res, next) {
    try {
      const { name, email, password, mobileNumber, otp } = req.body;

      // Validation
      if (!name || (!email && !mobileNumber)) {
        return res.status(400).json({ error: 'Name and either email or mobile number are required' });
      }

      if (email && !password) {
        return res.status(400).json({ error: 'Password is required when using email' });
      }

      if (password && password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }

      // If mobile number is provided, check for verified OTP
      if (mobileNumber) {
        const fiveMinutesAgo = moment().subtract(5, 'minutes').toDate();
        const [verifiedOtpRecords] = await db.execute(
          'SELECT * FROM otp_verifications WHERE mobile_number = ? AND is_verified = TRUE AND verified_at >= ? ORDER BY verified_at DESC LIMIT 1',
          [mobileNumber, fiveMinutesAgo]
        );

        if (verifiedOtpRecords.length === 0) {
          return res.status(400).json({ 
            error: 'Please verify OTP first. OTP verification is required before registration.' 
          });
        }
      }

      // Check if user already exists
      let whereClause = [];
      let params = [];
      
      if (email) {
        whereClause.push('email = ?');
        params.push(email);
      }
      if (mobileNumber) {
        whereClause.push('mobile_number = ?');
        params.push(mobileNumber);
      }

      const [existingUsers] = await db.execute(
        `SELECT * FROM users WHERE ${whereClause.join(' OR ')}`,
        params
      );

      if (existingUsers.length > 0) {
        const existing = existingUsers[0];
        if (email && existing.email === email) {
          return res.status(409).json({ error: 'Email already registered' });
        }
        if (mobileNumber && existing.mobile_number === mobileNumber) {
          return res.status(409).json({ error: 'Mobile number already registered' });
        }
      }

      // Hash password if provided
      let hashedPassword = null;
      if (password) {
        hashedPassword = await bcrypt.hash(password, 10);
      }

      // Generate employee ID
      const [lastEmployee] = await db.execute(
        'SELECT employee_id FROM user_profiles WHERE employee_id IS NOT NULL AND employee_id LIKE "EMP%" ORDER BY employee_id DESC LIMIT 1'
      );
      
      let employeeId;
      if (lastEmployee.length > 0 && lastEmployee[0].employee_id) {
        const lastId = parseInt(lastEmployee[0].employee_id.replace('EMP', ''));
        employeeId = `EMP${String(lastId + 1).padStart(4, '0')}`;
      } else {
        employeeId = 'EMP0001';
      }

      // Create user
      const userFields = ['name'];
      const userValues = [name];
      
      // Add email only if provided (mobile-only signup doesn't need email)
      if (email) {
        userFields.push('email');
        userValues.push(email);
      }
      
      // Add mobile number fields if provided
      if (mobileNumber) {
        userFields.push('mobile_number', 'is_mobile_verified');
        userValues.push(mobileNumber, true);
      }
      
      // Add password only if provided (mobile-only signup doesn't need password)
      if (hashedPassword) {
        userFields.push('password');
        userValues.push(hashedPassword);
      }

      const [result] = await db.execute(
        `INSERT INTO users (${userFields.join(', ')}) VALUES (${userFields.map(() => '?').join(', ')})`,
        userValues
      );

      const userId = result.insertId;

      // Create user profile with employee ID
      await db.execute(
        'INSERT INTO user_profiles (user_id, employee_id) VALUES (?, ?)',
        [userId, employeeId]
      );

      // Generate JWT token
      const token = jwt.sign(
        { userId: userId, email: email || null, role: 'user' },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        token,
        user: {
          id: userId,
          name,
          email: email || null,
          mobileNumber: mobileNumber || null,
          role: 'user'
        },
        employeeId: employeeId
      });
    } catch (error) {
      next(error);
    }
  }

  // Login user (with OTP support)
  async login(req, res, next) {
    try {
      const { email, password, mobileNumber, otp } = req.body;

      // Validation
      if (!email && !mobileNumber) {
        return res.status(400).json({ error: 'Either email or mobile number is required' });
      }

      // If mobile number login, check for verified OTP
      if (mobileNumber) {
        const fiveMinutesAgo = moment().subtract(5, 'minutes').toDate();
        const [verifiedOtpRecords] = await db.execute(
          'SELECT * FROM otp_verifications WHERE mobile_number = ? AND is_verified = TRUE AND verified_at >= ? ORDER BY verified_at DESC LIMIT 1',
          [mobileNumber, fiveMinutesAgo]
        );

        if (verifiedOtpRecords.length === 0) {
          return res.status(400).json({ 
            error: 'Please verify OTP first. OTP verification is required before login.' 
          });
        }
      }

      // Find user
      let [users] = [];
      if (email) {
        [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
      } else if (mobileNumber) {
        [users] = await db.execute('SELECT * FROM users WHERE mobile_number = ?', [mobileNumber]);
      }

      if (users.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials. User not found.' });
      }

      const user = users[0];

      // If mobile number login, OTP is already verified above
      if (mobileNumber) {
        // OTP verified, allow login
      } else {
        // Email login requires password
        if (!password) {
          return res.status(400).json({ error: 'Password is required for email login' });
        }

        if (!user.password) {
          return res.status(401).json({ error: 'Password not set. Please set a password first.' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email || null, role: user.role || 'user' },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email || null,
          mobileNumber: user.mobile_number || null,
          role: user.role || 'user'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get current user (protected route)
  async getCurrentUser(req, res, next) {
    try {
      const userId = req.user.userId;
      const [users] = await db.execute(
        'SELECT id, name, email, mobile_number, role, created_at, onboarding_completed FROM users WHERE id = ?',
        [userId]
      );
      
      if (users.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        success: true,
        user: users[0]
      });
    } catch (error) {
      next(error);
    }
  }

  // Request password reset
  async requestPasswordReset(req, res, next) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      // Find user by email
      const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
      
      // Always return success message (security best practice)
      if (users.length === 0) {
        return res.json({
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent.'
        });
      }

      const user = users[0];

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = moment().add(1, 'hour').toDate();

      // Save reset token
      await db.execute(
        'INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)',
        [email, resetToken, expiresAt]
      );

      // Create reset URL
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth?token=${resetToken}`;

      // Send email
      try {
        const transporter = createTransporter();
        if (transporter) {
          const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: email,
            subject: 'Password Reset Request - Attendify',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #221461 0%, #1a1049 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                  <h1 style="color: white; margin: 0;">Attendify</h1>
                </div>
                <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                  <h2 style="color: #1f2937; margin-top: 0;">Password Reset Request</h2>
                  <p style="color: #4b5563;">Hello ${user.name || 'User'},</p>
                  <p style="color: #4b5563;">You requested to reset your password. Click the button below to reset it:</p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" 
                       style="background-color: #221461; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
                      Reset Password
                    </a>
                  </div>
                  <p style="color: #6b7280; font-size: 14px;">Or copy and paste this link into your browser:</p>
                  <p style="word-break: break-all; color: #4b5563; font-size: 12px; background: white; padding: 10px; border-radius: 5px;">${resetUrl}</p>
                  <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">This link will expire in 1 hour.</p>
                  <p style="color: #9ca3af; font-size: 12px;">If you didn't request this, please ignore this email and your password will remain unchanged.</p>
                </div>
              </div>
            `
          };

          await transporter.sendMail(mailOptions);
          console.log('✅ Password reset email sent successfully!');
        }
      } catch (emailError) {
        console.error('❌ Error sending password reset email:', emailError.message);
      }

      res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    } catch (error) {
      next(error);
    }
  }

  // Reset password with token
  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token and new password are required' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }

      // Find reset token
      const [resetRecords] = await db.execute(
        'SELECT * FROM password_resets WHERE token = ? AND used = FALSE ORDER BY created_at DESC LIMIT 1',
        [token]
      );

      if (resetRecords.length === 0) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      const resetRecord = resetRecords[0];

      // Check if token is expired
      if (moment().isAfter(resetRecord.expires_at)) {
        return res.status(400).json({ error: 'Reset token has expired. Please request a new one.' });
      }

      // Find user by email
      const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [resetRecord.email]);
      if (users.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = users[0];

      // Update password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);

      // Mark token as used
      await db.execute('UPDATE password_resets SET used = TRUE WHERE id = ?', [resetRecord.id]);

      res.json({
        success: true,
        message: 'Password has been reset successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
