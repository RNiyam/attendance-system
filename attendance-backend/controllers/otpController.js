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

  axios.request(config)
    .then((response) => {
      console.log("OTP sent via Qikberry:", response.data);
    })
    .catch((error) => {
      console.error("Failed to send OTP via Qikberry:", error.message || error);
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

    // Check recent requests
    const [recentRequests] = await db.execute(
      'SELECT COUNT(*) as count FROM otp_verifications WHERE mobile_number = ? AND created_at >= ?',
      [mobileNumber, oneHourAgo]
    );

    if (recentRequests[0].count >= 5) {
      return res.status(429).json({
        success: false,
        message: 'Too many OTP requests. Try again later.',
        data: null
      });
    }

    const otp = generateOTP();
    const expiresAt = moment().add(1, 'minute').toDate();

    // Insert OTP record
    const [result] = await db.execute(
      'INSERT INTO otp_verifications (mobile_number, otp, expires_at) VALUES (?, ?, ?)',
      [mobileNumber, otp, expiresAt]
    );

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
