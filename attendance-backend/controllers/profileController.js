const db = require('../db');
const bcrypt = require('bcryptjs');
const moment = require('moment');

class ProfileController {
  // Update user profile
  async updateProfile(req, res, next) {
    try {
      const {
        fullName,
        email,
        phone,
        phoneNumber,
        username,
        gender,
        dateOfBirth,
        maritalStatus,
        otp
      } = req.body;

      // Support both 'phone' and 'phoneNumber' field names
      const phoneToUpdate = phone || phoneNumber;

      const userId = req.user.userId;

      // Get current user
      const [users] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
      if (users.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const currentUser = users[0];

      // Handle phone verification if phone and OTP are provided AND phone is not already verified
      let phoneVerifiedInRequest = false;
      if (phoneToUpdate && otp && !currentUser.is_mobile_verified) {
        const [otpRecords] = await db.execute(
          'SELECT * FROM otp_verifications WHERE mobile_number = ? AND otp = ? AND is_verified = FALSE ORDER BY created_at DESC LIMIT 1',
          [phoneToUpdate, otp]
        );

        if (otpRecords.length === 0) {
          return res.status(400).json({ error: 'Invalid OTP' });
        }

        const otpRecord = otpRecords[0];

        if (moment().isAfter(otpRecord.expires_at)) {
          return res.status(410).json({ error: 'OTP expired' });
        }

        // Mark OTP as verified
        await db.execute(
          'UPDATE otp_verifications SET is_verified = TRUE, verified_at = NOW() WHERE id = ?',
          [otpRecord.id]
        );
        phoneVerifiedInRequest = true;
      } else if (phoneToUpdate && !otp) {
        // If phone is provided without OTP, check if there's a verified OTP record
        const [verifiedOtpRecords] = await db.execute(
          'SELECT * FROM otp_verifications WHERE mobile_number = ? AND is_verified = TRUE ORDER BY verified_at DESC LIMIT 1',
          [phoneToUpdate]
        );
        
        if (verifiedOtpRecords.length > 0) {
          phoneVerifiedInRequest = true;
        } else if (!currentUser.is_mobile_verified) {
          // Allow saving if OTP was verified in the same session (recent verification)
          const [recentOtpRecords] = await db.execute(
            'SELECT * FROM otp_verifications WHERE mobile_number = ? AND is_verified = TRUE AND verified_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE) ORDER BY verified_at DESC LIMIT 1',
            [phoneToUpdate]
          );
          if (recentOtpRecords.length > 0) {
            phoneVerifiedInRequest = true;
          }
        } else {
          phoneVerifiedInRequest = true; // Already verified
        }
      }

      // Check if username already exists for another user
      if (username) {
        const [existingUsernames] = await db.execute(
          'SELECT id FROM users WHERE username = ? AND id != ?',
          [username, userId]
        );
        if (existingUsernames.length > 0) {
          return res.status(400).json({ error: 'Username already taken' });
        }
      }

      // Check if email already exists for another user
      if (email) {
        const [existingEmails] = await db.execute(
          'SELECT id FROM users WHERE email = ? AND id != ?',
          [email, userId]
        );
        if (existingEmails.length > 0) {
          return res.status(400).json({ error: 'Email already taken' });
        }
      }

      // Build update query
      const updateFields = [];
      const updateValues = [];

      if (fullName) {
        updateFields.push('name = ?');
        updateValues.push(fullName);
        updateFields.push('full_name = ?');
        updateValues.push(fullName);
      }
      if (email) {
        updateFields.push('email = ?');
        updateValues.push(email);
      }
      if (phoneToUpdate && phoneVerifiedInRequest) {
        updateFields.push('mobile_number = ?');
        updateValues.push(phoneToUpdate);
          updateFields.push('is_mobile_verified = TRUE');
      }
      if (username) {
        updateFields.push('username = ?');
        updateValues.push(username);
      }
      if (gender) {
        updateFields.push('gender = ?');
        updateValues.push(gender);
      }
      if (dateOfBirth) {
        updateFields.push('date_of_birth = ?');
        updateValues.push(dateOfBirth);
      }
      if (maritalStatus) {
        updateFields.push('marital_status = ?');
        updateValues.push(maritalStatus);
      }

      // Mark onboarding as completed if required fields are present
      const hasContact = phone || currentUser.mobile_number || currentUser.phone;
      if (currentUser.employeeId && (fullName || currentUser.name) && (currentUser.email || hasContact) && username) {
        updateFields.push('onboarding_completed = TRUE');
      }

      if (updateFields.length > 0) {
        updateValues.push(userId);
        await db.execute(
          `UPDATE users SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
          updateValues
        );
      }

      // Get updated user with profile data
      const [updatedUsers] = await db.execute(
        `SELECT u.id, u.name, u.full_name, u.email, u.mobile_number, u.username, u.profile_photo, u.gender, u.date_of_birth, u.marital_status, u.onboarding_completed,
         up.employee_id
         FROM users u
         LEFT JOIN user_profiles up ON u.id = up.user_id
         WHERE u.id = ?`,
        [userId]
      );

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: updatedUsers[0]
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user profile
  async getProfile(req, res, next) {
    try {
      const userId = req.user.userId;
      const [users] = await db.execute(
        `SELECT u.id, u.name, u.full_name, u.email, u.mobile_number, u.username, u.profile_photo, u.gender, u.date_of_birth, u.marital_status, u.onboarding_completed, u.preferences,
         up.employee_id
         FROM users u
         LEFT JOIN user_profiles up ON u.id = up.user_id
         WHERE u.id = ?`,
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

  // Get user preferences
  async getPreferences(req, res, next) {
    try {
      const userId = req.user.userId;
      const [users] = await db.execute(
        'SELECT preferences FROM users WHERE id = ?',
        [userId]
      );
      
      if (users.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const defaultPreferences = {
        showHoursChart: true,
        showCheckInOutChart: true,
        showStatistics: true
      };

      const preferences = users[0].preferences 
        ? JSON.parse(users[0].preferences) 
        : defaultPreferences;

      res.json({
        success: true,
        preferences: preferences
      });
    } catch (error) {
      next(error);
    }
  }

  // Update user preferences
  async updatePreferences(req, res, next) {
    try {
      const { preferences } = req.body;
      
      if (!preferences || typeof preferences !== 'object') {
        return res.status(400).json({ error: 'Invalid preferences data' });
      }

      const userId = req.user.userId;

      // Get current preferences
      const [users] = await db.execute(
        'SELECT preferences FROM users WHERE id = ?',
        [userId]
      );
      
      if (users.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Merge with existing preferences
      const currentPreferences = users[0].preferences 
        ? JSON.parse(users[0].preferences) 
        : {};
      const updatedPreferences = {
        ...currentPreferences,
        ...preferences
      };

      await db.execute(
        'UPDATE users SET preferences = ?, updated_at = NOW() WHERE id = ?',
        [JSON.stringify(updatedPreferences), userId]
      );

      res.json({
        success: true,
        message: 'Preferences updated successfully',
        preferences: updatedPreferences
      });
    } catch (error) {
      next(error);
    }
  }

  // Change password
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Both current password and new password are required' });
      }

      if (currentPassword === newPassword) {
        return res.status(400).json({ error: 'New password must be different from current password' });
      }

      const userId = req.user.userId;

      // Get user
      const [users] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
      if (users.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = users[0];

      if (!user.password) {
        return res.status(400).json({ error: 'Password change not available. Please set a password first.' });
      }

      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Verify new password is different
      const isNewPasswordSame = await bcrypt.compare(newPassword, user.password);
      if (isNewPasswordSame) {
        return res.status(400).json({ error: 'New password must be different from your current password' });
      }

      // Update password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db.execute('UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?', [hashedPassword, userId]);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProfileController();
