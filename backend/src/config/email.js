/**
 * Email Configuration (email.js)
 * Nodemailer setup for sending OTP emails
 */

const nodemailer = require('nodemailer');

// Create transporter for email sending
// Support both Gmail and Mailtrap based on .env configuration
const transporter = nodemailer.createTransport(
  process.env.EMAIL_SERVICE === 'mailtrap' 
    ? {
        // Mailtrap Configuration (for testing)
        host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
        port: process.env.EMAIL_PORT || 2525,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      }
    : {
        // Gmail Configuration (for production)
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      }
);

/**
 * Send OTP to user email
 * @param {string} email - User email address
 * @param {string} otp - 6-digit OTP
 * @param {string} userName - User name (optional)
 */
const sendOTPEmail = async (email, otp, userName = 'User') => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@attendancetracker.com',
      to: email,
      subject: 'Password Reset OTP - QR Attendance System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #319CB5 0%, #14B8A6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">QR Attendance System</h1>
            <p style="margin: 10px 0 0; font-size: 14px; opacity: 0.9;">Password Reset Request</p>
          </div>
          
          <div style="background: #f7fbff; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid rgba(148, 201, 242, 0.3);">
            <p style="color: #1d3342; font-size: 16px; margin: 0 0 20px;">Hi ${userName},</p>
            
            <p style="color: #496072; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
              We received a request to reset your password. Use the OTP below to proceed with your password reset.
            </p>
            
            <div style="background: white; border: 2px solid #5aa8f5; padding: 20px; text-align: center; border-radius: 8px; margin: 30px 0;">
              <p style="margin: 0; color: #6f8ea6; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Your OTP Code</p>
              <p style="margin: 15px 0 0; color: #319CB5; font-size: 36px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${otp}
              </p>
            </div>
            
            <p style="color: #6f8ea6; font-size: 13px; margin: 0 0 20px;">
              <strong>Valid for 10 minutes only.</strong> If you didn't request this reset, please ignore this email.
            </p>
            
            <p style="color: #496072; font-size: 14px; line-height: 1.6; margin: 30px 0 0;">
              Best regards,<br/>
              <strong>QR Attendance System Team</strong>
            </p>
          </div>
          
          <div style="background: #f0f5fa; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid rgba(148, 201, 242, 0.2); border-top: none;">
            <p style="color: #6f8ea6; font-size: 12px; margin: 0;">
              © 2024 QR Attendance System. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    // Only send actual email if credentials are configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      try {
        const info = await transporter.sendMail(mailOptions);
        console.log('📧 OTP Email sent successfully!');
        console.log(`   To: ${email}`);
        console.log(`   Service: ${process.env.EMAIL_SERVICE || 'Gmail'}`);
        return true;
      } catch (sendError) {
        console.log('📧 OTP Email (DEV MODE - Could not send):');
        console.log(`   To: ${email}`);
        console.log(`   Error: ${sendError.message}`);
        console.log(`   OTP Code: ${otp}`);
        return true; // Still return success for demo purposes
      }
    } else {
      console.log('📧 OTP Email (DEV MODE - No credentials):');
      console.log(`To: ${email}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log(`OTP Code: ${otp}`);
      return true;
    }
  } catch (error) {
    console.error('❌ Error in sendOTPEmail:', error.message);
    throw error;
  }
};

/**
 * Send password reset confirmation email
 */
const sendPasswordResetConfirmation = async (email, userName = 'User') => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@attendancetracker.com',
      to: email,
      subject: 'Password Reset Successful - QR Attendance System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #319CB5 0%, #14B8A6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">QR Attendance System</h1>
            <p style="margin: 10px 0 0; font-size: 14px; opacity: 0.9;">Password Reset Successful</p>
          </div>
          
          <div style="background: #f7fbff; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid rgba(148, 201, 242, 0.3);">
            <p style="color: #1d3342; font-size: 16px; margin: 0 0 20px;">Hi ${userName},</p>
            
            <p style="color: #2e7d32; font-size: 16px; margin: 0 0 20px;">
              ✓ Your password has been successfully reset!
            </p>
            
            <p style="color: #496072; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
              You can now log in with your new password. If you didn't make this change, please contact support immediately.
            </p>
            
            <p style="color: #496072; font-size: 14px; line-height: 1.6; margin: 30px 0 0;">
              Best regards,<br/>
              <strong>QR Attendance System Team</strong>
            </p>
          </div>
          
          <div style="background: #f0f5fa; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid rgba(148, 201, 242, 0.2); border-top: none;">
            <p style="color: #6f8ea6; font-size: 12px; margin: 0;">
              © 2024 QR Attendance System. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    // Only send actual email if credentials are configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      try {
        await transporter.sendMail(mailOptions);
        console.log('📧 Password reset confirmation email sent');
        console.log(`   To: ${email}`);
        console.log(`   Service: ${process.env.EMAIL_SERVICE || 'Gmail'}`);
      } catch (sendError) {
        console.log('📧 Password Reset Confirmation (DEV MODE - Could not send):');
        console.log(`   To: ${email}`);
        console.log(`   Error: ${sendError.message}`);
      }
    } else {
      console.log('📧 Password Reset Confirmation (DEV MODE - No credentials):');
      console.log(`To: ${email}`);
      console.log(`Subject: ${mailOptions.subject}`);
    }
    return true;
  } catch (error) {
    console.error('❌ Error sending confirmation email:', error.message);
    throw error;
  }
};

/**
 * Send teacher credentials email after admin creates a teacher account
 * @param {string} email - Teacher's email address
 * @param {string} name - Teacher's full name
 * @param {string} teacherId - Teacher ID
 * @param {string} department - Department name
 * @param {string} password - Plain text password (before hashing)
 */
const sendTeacherCredentialsEmail = async (email, name, teacherId, department, password) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@attendancetracker.com',
      to: email,
      subject: 'Your Teacher Account Created - QR Attendance System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #319CB5 0%, #14B8A6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">QR Attendance System</h1>
            <p style="margin: 10px 0 0; font-size: 14px; opacity: 0.9;">Welcome to the Team!</p>
          </div>
          
          <div style="background: #f7fbff; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid rgba(148, 201, 242, 0.3);">
            <p style="color: #1d3342; font-size: 16px; margin: 0 0 20px;">Hi ${name},</p>
            
            <p style="color: #496072; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
              Your teacher account has been created by the administrator. Below are your login credentials. Please keep them safe and change your password after first login.
            </p>
            
            <div style="background: white; border: 2px solid #5aa8f5; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 5px; color: #6f8ea6; font-size: 13px; font-weight: bold; width: 120px;">Full Name</td>
                  <td style="padding: 10px 5px; color: #1d3342; font-size: 14px;">${name}</td>
                </tr>
                <tr style="border-top: 1px solid #e8f0f8;">
                  <td style="padding: 10px 5px; color: #6f8ea6; font-size: 13px; font-weight: bold;">Email</td>
                  <td style="padding: 10px 5px; color: #1d3342; font-size: 14px;">${email}</td>
                </tr>
                <tr style="border-top: 1px solid #e8f0f8;">
                  <td style="padding: 10px 5px; color: #6f8ea6; font-size: 13px; font-weight: bold;">Teacher ID</td>
                  <td style="padding: 10px 5px; color: #319CB5; font-size: 16px; font-weight: bold; letter-spacing: 1px;">${teacherId}</td>
                </tr>
                <tr style="border-top: 1px solid #e8f0f8;">
                  <td style="padding: 10px 5px; color: #6f8ea6; font-size: 13px; font-weight: bold;">Department</td>
                  <td style="padding: 10px 5px; color: #1d3342; font-size: 14px;">${department || 'Not Assigned'}</td>
                </tr>
                <tr style="border-top: 1px solid #e8f0f8;">
                  <td style="padding: 10px 5px; color: #6f8ea6; font-size: 13px; font-weight: bold;">Password</td>
                  <td style="padding: 10px 5px; color: #e74c3c; font-size: 16px; font-weight: bold; font-family: 'Courier New', monospace; letter-spacing: 2px;">${password}</td>
                </tr>
              </table>
            </div>
            
            <div style="background: #fff8e1; border-left: 4px solid #ffc107; padding: 12px 15px; border-radius: 4px; margin: 20px 0;">
              <p style="color: #856404; font-size: 13px; margin: 0;">
                ⚠️ <strong>Important:</strong> Please change your password after your first login for security purposes. Do not share your credentials with anyone.
              </p>
            </div>
            
            <p style="color: #496072; font-size: 14px; line-height: 1.6; margin: 30px 0 0;">
              Best regards,<br/>
              <strong>QR Attendance System Team</strong>
            </p>
          </div>
          
          <div style="background: #f0f5fa; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid rgba(148, 201, 242, 0.2); border-top: none;">
            <p style="color: #6f8ea6; font-size: 12px; margin: 0;">
              © 2024 QR Attendance System. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      try {
        await transporter.sendMail(mailOptions);
        console.log('📧 Teacher credentials email sent successfully!');
        console.log(`   To: ${email}`);
        console.log(`   Teacher ID: ${teacherId}`);
        return true;
      } catch (sendError) {
        console.log('📧 Teacher Credentials Email (DEV MODE - Could not send):');
        console.log(`   To: ${email}`);
        console.log(`   Error: ${sendError.message}`);
        return false;
      }
    } else {
      console.log('📧 Teacher Credentials Email (DEV MODE - No credentials):');
      console.log(`   To: ${email}`);
      console.log(`   Teacher ID: ${teacherId}`);
      console.log(`   Password: ${password}`);
      return true;
    }
  } catch (error) {
    console.error('❌ Error in sendTeacherCredentialsEmail:', error.message);
    return false;
  }
};

module.exports = {
  transporter,
  sendOTPEmail,
  sendPasswordResetConfirmation,
  sendTeacherCredentialsEmail
};
