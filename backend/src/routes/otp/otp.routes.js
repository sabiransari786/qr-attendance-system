/**
 * OTP Routes (otp.routes.js)
 * Handles OTP sending, verification, and password reset
 */

const express = require('express');
const router = express.Router();
const {
  sendOTPToEmail,
  verifyOTP,
  resetPassword
} = require('../../services/otp.service');

/**
 * POST /api/otp/send
 * Send OTP to user email for password reset
 */
router.post('/send', async (req, res) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const result = await sendOTPToEmail(normalizedEmail);

    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Error in OTP send:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP. Please try again later.'
    });
  }
});

/**
 * POST /api/otp/verify
 * Verify OTP sent to email
 */
router.post('/verify', async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validation
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    if (!otp || !otp.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'OTP is required'
      });
    }

    if (otp.toString().length !== 6 || isNaN(otp)) {
      return res.status(400).json({
        success: false,
        message: 'OTP must be 6 digits'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const result = await verifyOTP(normalizedEmail, otp.toString().trim());

    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Error in OTP verify:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP. Please try again later.'
    });
  }
});

/**
 * POST /api/otp/reset-password
 * Reset password after OTP verification
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    // Validation
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    if (!newPassword || !newPassword.trim()) {
      return res.status(400).json({
        success: false,
        message: 'New password is required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const result = await resetPassword(normalizedEmail, newPassword);

    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Error in password reset:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password. Please try again later.'
    });
  }
});

module.exports = router;
