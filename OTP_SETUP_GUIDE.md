# OTP System Setup Guide

## Overview
OTP (One-Time Password) system is now integrated for password reset functionality. Users receive a 6-digit OTP via email for secure password reset.

## Setup Instructions

### 1. Database Setup
First, create the OTP verification table in your MySQL database:

```bash
# Option A: Using MySQL CLI
mysql -u root -p your_database < database/otp_table.sql

# Option B: Manually run in MySQL Workbench or phpMyAdmin
# Open database/otp_table.sql and execute the SQL script
```

### 2. Environment Variables (.env file)

Add the following email configuration to your `.env` file in the backend directory:

```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
NODE_ENV=development
```

### 3. Gmail SMTP Setup (For Email OTP)

#### Step-by-step Gmail Setup:

1. **Enable 2-Factor Authentication:**
   - Go to Google Account: https://myaccount.google.com
   - Click "Security" in the left menu
   - Scroll down to "2-Step Verification" and enable it

2. **Generate App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer" (or your device)
   - Google will generate a 16-character password
   - Copy this password to your `.env` file as `EMAIL_PASSWORD`

3. **Example .env configuration:**
   ```env
   EMAIL_USER=myemail@gmail.com
   EMAIL_PASSWORD=abcd efgh ijkl mnop
   ```

### 4. Alternative Email Providers

#### Microsoft Office 365:
```javascript
// In backend/src/config/email.js - update transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});
```

#### SendGrid:
```bash
npm install @sendgrid/mail
```

### 5. API Endpoints

#### Send OTP
```
POST /api/otp/send
Content-Type: application/json

{
  "email": "user@example.com"
}

Response:
{
  "success": true,
  "message": "OTP sent to your email. Valid for 10 minutes.",
  "userId": "user-id"
}
```

#### Verify OTP
```
POST /api/otp/verify
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}

Response:
{
  "success": true,
  "message": "OTP verified successfully",
  "userId": "user-id"
}
```

#### Reset Password
```
POST /api/otp/reset-password
Content-Type: application/json

{
  "email": "user@example.com",
  "newPassword": "newPassword123",
  "confirmPassword": "newPassword123"
}

Response:
{
  "success": true,
  "message": "Password reset successfully. You can now log in with your new password."
}
```

## Frontend Implementation

### Forgot Password Flow

1. **Step 1: Email Entry**
   - User enters email address
   - OTP is sent to email (valid for 10 minutes)

2. **Step 2: OTP Verification**
   - User receives 6-digit OTP in email
   - User enters OTP (auto-formatted)
   - 60-second countdown for resend option

3. **Step 3: Password Reset**
   - User creates new password
   - Password reset confirmation email is sent
   - User redirected to login

### Component Path
- Frontend: `frontend/src/pages/ForgotPassword.jsx`
- Styling: `frontend/src/styles/auth.css`

## Features

✅ **Security:**
- OTP valid for only 10 minutes
- Automatic expiry cleanup
- Secure password hashing with bcrypt
- Email confirmation after reset

✅ **User Experience:**
- Clear 3-step process
- Resend OTP functionality
- Countdown timer for resend
- Helpful error messages
- Light/Dark theme support

✅ **Backend:**
- Email sending via Nodemailer
- OTP storage with expiration
- Automatic cleanup of expired OTPs
- Validation on all steps

## Testing

### Test Credentials (Development)
Use any email address - the system will attempt to send OTP. For testing without actual email:

1. Check backend console for OTP (during development)
2. Or use a test email service like Mailtrap or MailHog

### Mailtrap Setup (Recommended for Testing)
1. Create account at https://mailtrap.io
2. Get SMTP credentials
3. Update `.env` with Mailtrap credentials
4. All emails will be captured in Mailtrap inbox

```env
# Mailtrap Configuration
EMAIL_USER=your-mailtrap-username
EMAIL_PASSWORD=your-mailtrap-password
```

## Troubleshooting

### Issue: "Failed to send OTP"
**Solution:**
- Check `.env` file has correct EMAIL_USER and EMAIL_PASSWORD
- Verify Gmail has app password generated
- Check backend logs for specific error

### Issue: "OTP has expired"
**Solution:**
- OTP is valid for 10 minutes
- User needs to request new OTP
- Click "Resend OTP" button

### Issue: Email not received
**Solution:**
- Check spam/junk folder
- Verify email is in your account
- Check Mailtrap inbox (if using Mailtrap)
- Verify EMAIL_USER is correct in .env

## Files Modified/Created

**Backend:**
- ✅ `backend/src/config/email.js` - Email configuration
- ✅ `backend/src/services/otp.service.js` - OTP logic
- ✅ `backend/src/routes/otp/otp.routes.js` - OTP endpoints
- ✅ `database/otp_table.sql` - Database schema
- ✅ `backend/src/app.js` - Route integration

**Frontend:**
- ✅ `frontend/src/pages/ForgotPassword.jsx` - Forgot password with OTP
- ✅ `frontend/src/styles/auth.css` - CSS styling

## Next Steps

1. ✅ Run SQL migration to create OTP table
2. ✅ Configure email in `.env`
3. ✅ Test forgot password flow
4. ✅ Verify emails are being received
5. ✅ Customize email templates (optional)

## Email Template Customization

Edit `backend/src/config/email.js` to customize OTP email template:
- Logo/branding
- Colors
- Message content
- Company information

Current email includes:
- Branded header
- User name
- 6-digit OTP prominently displayed
- Expiration time (10 minutes)
- Security notice
- Company footer

## Security Best Practices

✅ **Implemented:**
- OTP automatically expires after 10 minutes
- Only verified OTPs allow password reset
- Password hashing with bcrypt
- Email confirmation after reset
- Input validation on all fields

✅ **Recommendations:**
- Monitor OTP attempts for brute force
- Add rate limiting on OTP send endpoint
- Use HTTPS in production
- Keep email credentials secure
- Regular security audits

---

**Questions or Issues?** Check the console logs for detailed error messages.
