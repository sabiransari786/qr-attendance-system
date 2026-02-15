# 🛡️ Backend Security & Core Systems Implementation Guide

## Overview
This document provides implementation guidelines for the core security and system features required for the QR-based Attendance Tracking System.

---

## 🔒 1. Location Verification System

### Purpose
Verify that students are physically present within the class location radius when marking attendance.

### Database Schema Addition
```sql
-- Add location fields to sessions table
ALTER TABLE `sessions` 
ADD COLUMN `latitude` DECIMAL(10, 8) COMMENT 'Class location latitude',
ADD COLUMN `longitude` DECIMAL(11, 8) COMMENT 'Class location longitude',
ADD COLUMN `location_radius` INT DEFAULT 50 COMMENT 'Allowed radius in meters';
```

### Backend Implementation
```javascript
// backend/src/services/location.service.js

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
};

const verifyLocation = async (sessionId, studentLat, studentLon) => {
  const [sessions] = await pool.query(
    'SELECT latitude, longitude, location_radius FROM sessions WHERE id = ?',
    [sessionId]
  );
  
  if (!sessions.length) {
    throw new Error('Session not found');
  }
  
  const session = sessions[0];
  const distance = calculateDistance(
    session.latitude,
    session.longitude,
    studentLat,
    studentLon
  );
  
  return {
    verified: distance <= session.location_radius,
    distance: Math.round(distance),
    maxDistance: session.location_radius
  };
};

module.exports = { verifyLocation, calculateDistance };
```

### API Endpoint
```javascript
// backend/src/controllers/attendance.controller.js

router.post('/verify-location', async (req, res) => {
  try {
    const { sessionId, latitude, longitude } = req.body;
    
    const result = await verifyLocation(sessionId, latitude, longitude);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});
```

---

## 🔁 2. Device Session Control

### Purpose
Ensure one device per QR rule - prevent attendance proxy/sharing.

### Database Schema
```sql
CREATE TABLE IF NOT EXISTS `qr_device_locks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `session_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `device_id` VARCHAR(255) NOT NULL,
  `ip_address` VARCHAR(50),
  `user_agent` TEXT,
  `locked_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `is_active` BOOLEAN DEFAULT TRUE,
  
  CONSTRAINT `fk_qr_lock_session` FOREIGN KEY (`session_id`) 
    REFERENCES `sessions`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_qr_lock_student` FOREIGN KEY (`student_id`) 
    REFERENCES `users`(`id`) ON DELETE CASCADE,
  
  UNIQUE KEY `unique_session_student` (`session_id`, `student_id`),
  INDEX `idx_device_id` (`device_id`),
  INDEX `idx_locked_at` (`locked_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Backend Implementation
```javascript
// backend/src/services/device-lock.service.js

const checkDeviceLock = async (sessionId, studentId, deviceId) => {
  const [locks] = await pool.query(
    `SELECT * FROM qr_device_locks 
     WHERE session_id = ? AND student_id = ? AND is_active = TRUE`,
    [sessionId, studentId]
  );
  
  if (locks.length > 0) {
    const lock = locks[0];
    if (lock.device_id !== deviceId) {
      return {
        allowed: false,
        message: 'Another device already used for this session',
        lockedDevice: lock.device_id.substring(0, 10) + '...'
      };
    }
    return { allowed: true, existing: true };
  }
  
  return { allowed: true, existing: false };
};

const createDeviceLock = async (sessionId, studentId, deviceId, ipAddress, userAgent) => {
  await pool.query(
    `INSERT INTO qr_device_locks 
     (session_id, student_id, device_id, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?)`,
    [sessionId, studentId, deviceId, ipAddress, userAgent]
  );
};

const releaseDeviceLock = async (sessionId, studentId) => {
  await pool.query(
    `UPDATE qr_device_locks 
     SET is_active = FALSE 
     WHERE session_id = ? AND student_id = ?`,
    [sessionId, studentId]
  );
};

module.exports = { checkDeviceLock, createDeviceLock, releaseDeviceLock };
```

### Middleware Integration
```javascript
// backend/src/middleware/device-check.middleware.js

const deviceCheckMiddleware = async (req, res, next) => {
  try {
    const { sessionId, studentId, deviceId } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    const lockCheck = await checkDeviceLock(sessionId, studentId, deviceId);
    
    if (!lockCheck.allowed) {
      return res.status(403).json({
        success: false,
        message: lockCheck.message
      });
    }
    
    if (!lockCheck.existing) {
      await createDeviceLock(sessionId, studentId, deviceId, ipAddress, userAgent);
    }
    
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Device verification failed'
    });
  }
};
```

---

## ⏱ 3. QR Expiry Engine

### Purpose
Auto-expire QR codes after set time and clean up old locks.

### Backend Implementation
```javascript
// backend/src/services/qr-expiry.service.js

const checkQRExpiry = (qrExpiryTime) => {
  const now = new Date();
  const expiry = new Date(qrExpiryTime);
  
  return {
    expired: now > expiry,
    remainingSeconds: Math.max(0, Math.floor((expiry - now) / 1000))
  };
};

const cleanupExpiredSessions = async () => {
  try {
    // Mark expired sessions as closed
    await pool.query(
      `UPDATE sessions 
       SET status = 'closed' 
       WHERE status = 'active' 
       AND qr_expiry_time < NOW()`
    );
    
    // Release device locks for expired sessions
    await pool.query(
      `UPDATE qr_device_locks 
       SET is_active = FALSE 
       WHERE session_id IN (
         SELECT id FROM sessions 
         WHERE status = 'closed'
       )`
    );
    
    console.log('✓ Expired sessions cleaned up');
  } catch (error) {
    console.error('Error cleaning up sessions:', error);
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupExpiredSessions, 5 * 60 * 1000);

module.exports = { checkQRExpiry, cleanupExpiredSessions };
```

---

## 📊 4. Attendance Calculation Engine

### Purpose
Calculate attendance percentage with proper weighting.

### Backend Implementation
```javascript
// backend/src/services/attendance-calculation.service.js

const calculateAttendance = async (studentId, subjectFilter = null) => {
  let query = `
    SELECT 
      a.status,
      s.subject,
      COUNT(*) as count
    FROM attendance a
    JOIN sessions s ON a.session_id = s.id
    WHERE a.student_id = ?
  `;
  
  const params = [studentId];
  
  if (subjectFilter) {
    query += ' AND s.subject = ?';
    params.push(subjectFilter);
  }
  
  query += ' GROUP BY a.status, s.subject';
  
  const [records] = await pool.query(query, params);
  
  // Weight calculation: Present = 1, Late = 0.5, Absent = 0
  const weights = { present: 1, late: 0.5, absent: 0 };
  
  let totalWeight = 0;
  let maxWeight = 0;
  
  records.forEach(record => {
    const weight = weights[record.status] || 0;
    totalWeight += weight * record.count;
    maxWeight += record.count; // Each class has max weight of 1
  });
  
  const percentage = maxWeight > 0 ? Math.round((totalWeight / maxWeight) * 100) : 0;
  
  return {
    percentage,
    totalClasses: maxWeight,
    present: records.find(r => r.status === 'present')?.count || 0,
    late: records.find(r => r.status === 'late')?.count || 0,
    absent: records.find(r => r.status === 'absent')?.count || 0
  };
};

module.exports = { calculateAttendance };
```

---

## 📝 5. Activity Logs Enhancement

### Database Schema
```sql
-- Ensure activity_logs table exists
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(50),
  `entity_id` INT,
  `ip_address` VARCHAR(50),
  `user_agent` TEXT,
  `metadata` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT `fk_activity_user` FOREIGN KEY (`user_id`) 
    REFERENCES `users`(`id`) ON DELETE CASCADE,
  
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_action` (`action`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Backend Implementation
```javascript
// backend/src/services/activity-log.service.js

const logActivity = async (userId, action, options = {}) => {
  const {
    entityType = null,
    entityId = null,
    ipAddress = null,
    userAgent = null,
    metadata = {}
  } = options;
  
  try {
    await pool.query(
      `INSERT INTO activity_logs 
       (user_id, action, entity_type, entity_id, ip_address, user_agent, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        action,
        entityType,
        entityId,
        ipAddress,
        userAgent,
        JSON.stringify(metadata)
      ]
    );
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

// Common activity types
const ACTIVITIES = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  QR_GENERATED: 'QR_GENERATED',
  QR_SCANNED: 'QR_SCANNED',
  ATTENDANCE_MARKED: 'ATTENDANCE_MARKED',
  ATTENDANCE_FAILED: 'ATTENDANCE_FAILED',
  PROFILE_UPDATED: 'PROFILE_UPDATED',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY'
};

module.exports = { logActivity, ACTIVITIES };
```

### Integration Example
```javascript
// In attendance controller
const { logActivity, ACTIVITIES } = require('../services/activity-log.service');

// After successful attendance
await logActivity(req.user.id, ACTIVITIES.ATTENDANCE_MARKED, {
  entityType: 'session',
  entityId: sessionId,
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  metadata: {
    subject: session.subject,
    location: session.location,
    deviceId: req.body.deviceId
  }
});

// After failed attempt
await logActivity(req.user.id, ACTIVITIES.ATTENDANCE_FAILED, {
  entityType: 'session',
  entityId: sessionId,
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  metadata: {
    reason: 'Device already used',
    attemptedDevice: req.body.deviceId
  }
});
```

---

## 🔐 6. Duplicate Attendance Prevention

### Backend Implementation
```javascript
// backend/src/middleware/duplicate-check.middleware.js

const checkDuplicateAttendance = async (req, res, next) => {
  try {
    const { sessionId, studentId } = req.body;
    
    const [existing] = await pool.query(
      `SELECT * FROM attendance 
       WHERE session_id = ? AND student_id = ?`,
      [sessionId, studentId]
    );
    
    if (existing.length > 0) {
      await logActivity(studentId, ACTIVITIES.ATTENDANCE_FAILED, {
        entityType: 'session',
        entityId: sessionId,
        metadata: { reason: 'Duplicate attendance attempt' }
      });
      
      return res.status(409).json({
        success: false,
        message: 'Attendance already marked for this session'
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking attendance'
    });
  }
};

module.exports = { checkDuplicateAttendance };
```

---

## 🚀 Implementation Checklist

### Phase 1: Database Setup
- [ ] Add location fields to sessions table
- [ ] Create qr_device_locks table
- [ ] Ensure activity_logs table exists
- [ ] Add necessary indexes

### Phase 2: Backend Services
- [ ] Implement location verification service
- [ ] Implement device lock service
- [ ] Implement QR expiry engine with cleanup
- [ ] Implement attendance calculation service
- [ ] Enhance activity logging service

### Phase 3: Middleware
- [ ] Create device check middleware
- [ ] Create duplicate attendance middleware
- [ ] Update attendance controller with all checks

### Phase 4: API Endpoints
- [ ] POST /api/attendance/verify-location
- [ ] POST /api/attendance/mark (with all validations)
- [ ] GET /api/attendance/student/:id/stats
- [ ] GET /api/activity-logs/:userId

### Phase 5: Testing
- [ ] Test location verification (within/outside radius)
- [ ] Test device locking (first device, second device)
- [ ] Test QR expiry (before/after expiry)
- [ ] Test duplicate prevention
- [ ] Test activity logging

---

## 📚 Usage Examples

### Marking Attendance with Full Validation
```javascript
// POST /api/attendance/mark
{
  "sessionId": 123,
  "studentId": 456,
  "deviceId": "device_abc123",
  "latitude": 28.7041,
  "longitude": 77.1025,
  "status": "present"
}

// Response (Success)
{
  "success": true,
  "message": "Attendance marked successfully",
  "data": {
    "attendanceId": 789,
    "locationVerified": true,
    "deviceLocked": true
  }
}

// Response (Error - Wrong Location)
{
  "success": false,
  "message": "You are not within class location (Distance: 250m, Required: <50m)"
}

// Response (Error - Device Blocked)
{
  "success": false,
  "message": "Another device already used for this session"
}
```

---

## 🔧 Configuration

### Environment Variables
```env
# Location Settings
LOCATION_VERIFICATION_ENABLED=true
DEFAULT_LOCATION_RADIUS=50  # meters

# Device Control
DEVICE_LOCKING_ENABLED=true
ALLOW_DEVICE_CHANGE=false

# QR Expiry
QR_EXPIRY_TIME=15  # minutes
AUTO_CLEANUP_ENABLED=true
CLEANUP_INTERVAL=5  # minutes

# Activity Logging
ACTIVITY_LOGGING_ENABLED=true
LOG_RETENTION_DAYS=90
```

---

## 🎯 Security Best Practices

1. **Always validate on backend** - Never trust frontend validations alone
2. **Log all attempts** - Both successful and failed for audit trails
3. **Rate limiting** - Prevent spam attempts
4. **Encrypt sensitive data** - Device IDs, IP addresses
5. **Regular cleanup** - Remove old locks and logs
6. **Monitor suspicious patterns** - Multiple failed attempts, location spoofing

---

## 📊 Monitoring & Analytics

### Key Metrics to Track
- Attendance marking success rate
- Failed attempts by reason (location, device, duplicate)
- Average location accuracy
- QR code usage patterns
- Suspicious activity patterns

### SQL Queries for Analytics
```sql
-- Failed attempts by reason
SELECT 
  JSON_EXTRACT(metadata, '$.reason') as reason,
  COUNT(*) as count
FROM activity_logs
WHERE action = 'ATTENDANCE_FAILED'
AND DATE(created_at) = CURDATE()
GROUP BY reason;

-- Device usage patterns
SELECT 
  student_id,
  COUNT(DISTINCT device_id) as device_count,
  COUNT(*) as session_count
FROM qr_device_locks
WHERE DATE(locked_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY student_id
HAVING device_count > 3;
```

---

## 🆘 Troubleshooting

### Common Issues

**Issue**: Location verification always fails
- Check if HTTPS is enabled (required for geolocation API)
- Verify coordinates are correct (latitude/longitude)
- Check location_radius is reasonable (50-100m recommended)

**Issue**: Device locking not working
- Ensure deviceId is generated and stored in localStorage
- Check if cleanup job is releasing locks prematurely
- Verify unique constraint on qr_device_locks table

**Issue**: QR codes expiring too quickly
- Adjust QR_EXPIRY_TIME in environment variables
- Check server timezone matches expected timezone
- Verify qr_expiry_time is set correctly when generating QR

---

## ✅ Testing Commands

```bash
# Test location verification
curl -X POST http://localhost:5002/api/attendance/verify-location \
  -H "Content-Type: application/json" \
  -d '{"sessionId": 1, "latitude": 28.7041, "longitude": 77.1025}'

# Test device lock
curl -X POST http://localhost:5002/api/attendance/mark \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"sessionId": 1, "studentId": 1, "deviceId": "device_test_123"}'

# View activity logs
curl http://localhost:5002/api/activity-logs/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📝 Notes

- All security checks should run on backend (never frontend only)
- Implement proper error handling and logging
- Test thoroughly before production deployment
- Regular database maintenance and cleanup required
- Monitor logs for suspicious patterns

---

**Last Updated**: February 15, 2026
**Version**: 1.0
**Maintained by**: Development Team
