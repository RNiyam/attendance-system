const db = require('../db');

class OnboardingController {
  async completeOnboarding(req, res, next) {
    try {
      const userId = req.user.userId;
      const {
        phoneNumber,
        username,
        gender,
        dateOfBirth,
        maritalStatus,
        profilePhoto
      } = req.body;

      // Validation
      if (!phoneNumber || !username) {
        return res.status(400).json({ error: 'Phone number and username are required' });
      }

      // Generate employee ID if not exists
      const [existingProfile] = await db.execute(
        'SELECT employee_id FROM user_profiles WHERE user_id = ?',
        [userId]
      );

      let employeeId;
      if (existingProfile.length > 0 && existingProfile[0].employee_id) {
        employeeId = existingProfile[0].employee_id;
      } else {
        // Generate new employee ID
        const [lastEmployee] = await db.execute(
          'SELECT employee_id FROM user_profiles WHERE employee_id LIKE "EMP%" ORDER BY employee_id DESC LIMIT 1'
        );
        
        if (lastEmployee.length > 0) {
          const lastId = parseInt(lastEmployee[0].employee_id.replace('EMP', ''));
          employeeId = `EMP${String(lastId + 1).padStart(4, '0')}`;
        } else {
          employeeId = 'EMP0001';
        }
      }

      // Insert or update user profile
      await db.execute(
        `INSERT INTO user_profiles 
         (user_id, phone_number, username, gender, date_of_birth, marital_status, profile_photo, employee_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         phone_number = VALUES(phone_number),
         username = VALUES(username),
         gender = VALUES(gender),
         date_of_birth = VALUES(date_of_birth),
         marital_status = VALUES(marital_status),
         profile_photo = VALUES(profile_photo),
         employee_id = VALUES(employee_id),
         updated_at = NOW()`,
        [userId, phoneNumber, username, gender || null, dateOfBirth || null, maritalStatus || null, profilePhoto || null, employeeId]
      );

      // Mark onboarding as complete
      await db.execute(
        'UPDATE users SET onboarding_completed = TRUE, updated_at = NOW() WHERE id = ?',
        [userId]
      );

      res.json({
        success: true,
        message: 'Onboarding completed successfully',
        employeeId: employeeId
      });
    } catch (error) {
      next(error);
    }
  }

  async getOnboardingStatus(req, res, next) {
    try {
      const userId = req.user.userId;
      
      // Check if user has completed onboarding
      const [users] = await db.execute(
        'SELECT onboarding_completed FROM users WHERE id = ?',
        [userId]
      );
      
      if (users.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const onboardingCompleted = users[0].onboarding_completed || false;
      
      // Determine current step if not completed
      let currentStep = 1;
      if (!onboardingCompleted) {
        const [profiles] = await db.execute(
          'SELECT * FROM user_profiles WHERE user_id = ?',
          [userId]
        );
        
        if (profiles.length > 0) {
          const profile = profiles[0];
          if (profile.phone_number && profile.username) {
            currentStep = 2;
            if (profile.gender && profile.date_of_birth && profile.marital_status) {
              currentStep = 3;
            }
          }
        }
      }
      
      res.json({
        completed: onboardingCompleted,
        currentStep: currentStep
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const userId = req.user.userId;
      
      const [profiles] = await db.execute(
        'SELECT * FROM user_profiles WHERE user_id = ?',
        [userId]
      );
      
      if (profiles.length === 0) {
        return res.json({ profile: null });
      }
      
      res.json({
        profile: profiles[0]
      });
    } catch (error) {
      next(error);
    }
  }

  async getOrGenerateEmployeeId(req, res, next) {
    try {
      const userId = req.user.userId;
      
      // Check if profile exists with employee ID
      const [profiles] = await db.execute(
        'SELECT employee_id FROM user_profiles WHERE user_id = ?',
        [userId]
      );
      
      let employeeId;
      if (profiles.length > 0 && profiles[0].employee_id) {
        employeeId = profiles[0].employee_id;
        console.log(`✅ Found existing Employee ID: ${employeeId} for user ${userId}`);
      } else {
        // Generate new employee ID
        const [lastEmployee] = await db.execute(
          'SELECT employee_id FROM user_profiles WHERE employee_id IS NOT NULL AND employee_id LIKE "EMP%" ORDER BY CAST(SUBSTRING(employee_id, 4) AS UNSIGNED) DESC LIMIT 1'
        );
        
        if (lastEmployee.length > 0 && lastEmployee[0].employee_id) {
          const lastId = parseInt(lastEmployee[0].employee_id.replace('EMP', ''));
          employeeId = `EMP${String(lastId + 1).padStart(4, '0')}`;
        } else {
          employeeId = 'EMP0001';
        }
        
        // Create or update profile with employee ID
        try {
          const [insertResult] = await db.execute(
            `INSERT INTO user_profiles (user_id, employee_id) VALUES (?, ?)
             ON DUPLICATE KEY UPDATE employee_id = VALUES(employee_id)`,
            [userId, employeeId]
          );
          console.log(`✅ Generated and stored Employee ID: ${employeeId} for user ${userId}`);
          
          // Verify it was stored
          const [verify] = await db.execute(
            'SELECT employee_id FROM user_profiles WHERE user_id = ?',
            [userId]
          );
          if (verify.length > 0) {
            console.log(`✅ Verified Employee ID in DB: ${verify[0].employee_id}`);
          }
        } catch (dbError) {
          console.error('Error inserting employee ID:', dbError);
          // Try update if insert fails
          try {
            await db.execute(
              'UPDATE user_profiles SET employee_id = ? WHERE user_id = ?',
              [employeeId, userId]
            );
            console.log(`✅ Updated Employee ID: ${employeeId} for user ${userId}`);
          } catch (updateError) {
            console.error('Error updating employee ID:', updateError);
            throw updateError;
          }
        }
      }
      
      res.json({
        success: true,
        employeeId: employeeId
      });
    } catch (error) {
      console.error('Error in getOrGenerateEmployeeId:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate employee ID',
        details: error.message
      });
    }
  }
}

module.exports = new OnboardingController();
