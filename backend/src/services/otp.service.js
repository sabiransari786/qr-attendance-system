/**
 * OTP Service (otp.service.js)
 * Handles OTP generation, storage, and verification
 */

const { pool } = require('../config/database');

/**
 * Generate a random 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP to email and store in database
 * @param {string} email - User email
 * @returns {Promise<{success: boolean, message: string}>}
 */
const sendOTPToEmail = async (email) => {
  const connection = await pool.getConnection();
  
  try {
    // Check if user exists
    const [users] = await connection.execute(
      'SELECT id, name FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return {
        success: false,
        message: 'User not found with this email'
      };
    }

    const user = users[0];
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

    // Save OTP to database
    await connection.execute(
      'INSERT INTO otp_verification (user_id, email, otp, expires_at, created_at) VALUES (?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE otp = ?, expires_at = ?, created_at = NOW()',
      [user.id, email, otp, expiresAt, otp, expiresAt]
    );

    // Send OTP email
    const { sendOTPEmail } = require('../config/email');
    await sendOTPEmail(email, otp, user.name);

    return {
      success: true,
      message: 'OTP sent to your email. Valid for 10 minutes.',
      userId: user.id
    };
  } catch (error) {
    console.error('Error in sendOTPToEmail:', error);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Verify OTP
 * @param {string} email - User email
 * @param {string} otp - OTP provided by user
 * @returns {Promise<{success: boolean, message: string, userId?: string}>}
 */
const verifyOTP = async (email, otp) => {
  const connection = await pool.getConnection();
  
  try {
    // Get OTP record
    const [otpRecords] = await connection.execute(
      'SELECT user_id, email, otp, expires_at FROM otp_verification WHERE email = ?',
      [email]
    );

    if (otpRecords.length === 0) {
      return {
        success: false,
        message: 'No OTP request found. Please request a new OTP.'
      };
    }

    const otpRecord = otpRecords[0];

    // Check if OTP is expired
    if (new Date() > new Date(otpRecord.expires_at)) {
      // Delete expired OTP
      await connection.execute(
        'DELETE FROM otp_verification WHERE email = ?',
        [email]
      );
      
      return {
        success: false,
        message: 'OTP has expired. Please request a new OTP.'
      };
    }

    // Check if OTP matches
    if (otpRecord.otp !== otp) {
      return {
        success: false,
        message: 'Invalid OTP. Please try again.'
      };
    }

    // OTP is valid - mark as verified
    await connection.execute(
      'UPDATE otp_verification SET verified = 1, verified_at = NOW() WHERE email = ?',
      [email]
    );

    return {
      success: true,
      message: 'OTP verified successfully',
      userId: otpRecord.user_id
    };
  } catch (error) {
    console.error('Error in verifyOTP:', error);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Reset password after OTP verification
 * @param {string} email - User email
 * @param {string} newPassword - New password
 * @returns {Promise<{success: boolean, message: string}>}
 */
const resetPassword = async (email, newPassword) => {
  const connection = await pool.getConnection();
  
  try {
    // Check if OTP was verified
    const [otpRecords] = await connection.execute(
      'SELECT verified FROM otp_verification WHERE email = ? AND verified = 1',
      [email]
    );

    if (otpRecords.length === 0) {
      return {
        success: false,
        message: 'Please verify OTP first'
      };
    }

    // Get user
    const [users] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    const userId = users[0].id;

    // Hash the new password
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await connection.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );

    // Delete OTP record after use
    await connection.execute(
      'DELETE FROM otp_verification WHERE email = ?',
      [email]
    );

    // Send confirmation email
    const { sendPasswordResetConfirmation } = require('../config/email');
    const [userDetails] = await connection.execute(
      'SELECT name FROM users WHERE id = ?',
      [userId]
    );
    
    if (userDetails.length > 0) {
      await sendPasswordResetConfirmation(email, userDetails[0].name);
    }

    return {
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.'
    };
  } catch (error) {
    console.error('Error in resetPassword:', error);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Cleanup expired OTPs (can be run periodically)
 */
const cleanupExpiredOTPs = async () => {
  const connection = await pool.getConnection();
  
  try {
    await connection.execute(
      'DELETE FROM otp_verification WHERE expires_at < NOW()'
    );
    console.log('✓ Expired OTPs cleaned up');
  } catch (error) {
    console.error('Error cleaning up expired OTPs:', error);
  } finally {
    connection.release();
  }
};

module.exports = {
  generateOTP,
  sendOTPToEmail,
  verifyOTP,
  resetPassword,
  cleanupExpiredOTPs
};
