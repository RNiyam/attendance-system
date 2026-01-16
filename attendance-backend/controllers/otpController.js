const db = require('../db');
const moment = require('moment');
const axios = require('axios');

function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function sendOTPSMS(mobileNumber, otp) {
  const apiKey = process.env.QIKBERRY_API_KEY || 'e88cb7d9372c05cd652d3a3a17db6075';
  const sender = process.env.QIKBERRY_SENDER || 'QBERRY';
  const templateId = process.env.QIKBERRY_TEMPLATE_ID || '1707161528616464235';

  const data = JSON.stringify({
    to: `+91${mobileNumber}`,
    sender: sender,
    service: "SI",
    template_id: templateId,
    message: `Dear Customer ${otp} is the OTP generated for your transaction. Note- Do not disclose the OTP to anyone - Qikberry`
  });

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://rest.qikberry.ai/v1/sms/messages',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Connection': 'keep-alive',
      'Content-Type': 'application/json',
    },
    data: data
  };

  console.log(`[OTP] Attempting to send OTP to +91${mobileNumber} via Qikberry...`);
  console.log(`[OTP] OTP Value: ${otp}`);
  console.log(`[OTP] Using API Key: ${apiKey.substring(0, 10)}...`);
  console.log(`[OTP] Sender: ${sender}, Template ID: ${templateId}`);
  console.log(`[OTP] Message: ${data}`);

  axios.request(config)
    .then((response) => {
      console.log("[OTP] ✅ Successfully sent via Qikberry:", JSON.stringify(response.data, null, 2));
      console.log(`[OTP] 📱 OTP ${otp} should be delivered to +91${mobileNumber}`);
      if (response.data && response.data.error) {
        console.error("[OTP] ❌ Qikberry returned error:", response.data.error);
      }
      // Check delivery status
      if (response.data && response.data.data && response.data.data[0]) {
        console.log(`[OTP] Message ID: ${response.data.data[0].message_id}`);
        console.log(`[OTP] Status: ${response.data.message || 'Accepted for delivery'}`);
      }
    })
    .catch((error) => {
      console.error("[OTP] ❌ Failed to send OTP via Qikberry:");
      console.error("[OTP] Error message:", error.message);
      console.error("[OTP] Error response:", error.response?.data || 'No response data');
      console.error("[OTP] Error status:", error.response?.status || 'No status');
      console.error("[OTP] Full error:", JSON.stringify(error.response?.data || error.message, null, 2));
    });
}

exports.sendOtp = async (req, res) => {
  const { mobileNumber } = req.body;

  try {
    // Validate mobile number
    if (!mobileNumber || !/^[0-9]{10}$/.test(mobileNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mobile number. Please provide a 10-digit mobile number.',
        data: null
      });
    }

    const oneHourAgo = moment().subtract(1, 'hour').toDate();

    // Check recent requests - only count unverified and non-expired OTPs
    // This allows users to retry if previous OTPs expired or weren't verified
    const [recentRequests] = await db.execute(
      `SELECT COUNT(*) as count FROM otp_verifications 
       WHERE mobile_number = ? 
       AND created_at >= ? 
       AND is_verified = FALSE 
       AND expires_at > NOW()`,
      [mobileNumber, oneHourAgo]
    );

    // Increased limit to 10 requests per hour for better UX
    if (recentRequests[0].count >= 10) {
      return res.status(429).json({
        success: false,
        message: 'Too many OTP requests. Please wait a few minutes before trying again.',
        data: null
      });
    }
    
    // Clean up old expired and verified OTPs for this mobile number (older than 24 hours)
    // This helps keep the database clean
    const oneDayAgo = moment().subtract(24, 'hours').toDate();
    await db.execute(
      'DELETE FROM otp_verifications WHERE mobile_number = ? AND created_at < ? AND (is_verified = TRUE OR expires_at < NOW())',
      [mobileNumber, oneDayAgo]
    ).catch(err => {
      console.error('Error cleaning up old OTPs:', err);
      // Don't fail the request if cleanup fails
    });

    const otp = generateOTP();
    const expiresAt = moment().add(1, 'minute').toDate();

    console.log(`[OTP] Generated OTP: ${otp} for mobile: ${mobileNumber}`);
    console.log(`[OTP] OTP expires at: ${expiresAt}`);

    // Insert OTP record
    const [result] = await db.execute(
      'INSERT INTO otp_verifications (mobile_number, otp, expires_at) VALUES (?, ?, ?)',
      [mobileNumber, otp, expiresAt]
    );

    console.log(`[OTP] OTP saved to database with ID: ${result.insertId}`);
    console.log(`[OTP] Sending OTP ${otp} to +91${mobileNumber}...`);

    sendOTPSMS(mobileNumber, otp);

    return res.json({
      success: true,
      message: 'OTP sent successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      data: null
    });
  }
};

exports.verifyOtp = async (req, res) => {
  const { mobileNumber, otp } = req.body;

  try {
    // Validate inputs
    if (!mobileNumber || !/^[0-9]{10}$/.test(mobileNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mobile number.',
        data: null
      });
    }

    if (!otp || !/^[0-9]{4}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP format.',
        data: null
      });
    }

    // Find OTP record
    const [records] = await db.execute(
      'SELECT * FROM otp_verifications WHERE mobile_number = ? AND otp = ? AND is_verified = FALSE ORDER BY created_at DESC LIMIT 1',
      [mobileNumber, otp]
    );

    if (records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
        data: null
      });
    }

    const record = records[0];

    if (moment().isAfter(record.expires_at)) {
      return res.status(410).json({
        success: false,
        message: 'OTP expired',
        data: null
      });
    }

    // Mark as verified
    await db.execute(
      'UPDATE otp_verifications SET is_verified = TRUE, verified_at = NOW() WHERE id = ?',
      [record.id]
    );

    return res.json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        id: record.id,
        verifiedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      data: null
    });
  }
};
