/**
 * Attendance Request Service
 * 
 * Handles business logic for QR code generation
 * - Location validation
 * - Expiry time calculation
 * - Previous QR invalidation
 */

const AttendanceRequest = require('../models/attendance-request.model');
const { pool } = require('../config');

class AttendanceRequestService {
  /**
   * Generate QR request with location validation
   */
  static async generateQRRequest(data) {
    const {
      faculty_id,
      session_id,
      attendance_value,
      latitude,
      longitude,
      radius_meters,
      duration_minutes
    } = data;

    try {
      // Fetch session + linked course details
      const [sessions] = await pool.execute(
        `SELECT s.id, s.faculty_id, s.status, s.course_id, s.department_id,
                c.faculty_id AS course_faculty_id, c.department_id AS course_dept_id
         FROM sessions s
         LEFT JOIN courses c ON s.course_id = c.id
         WHERE s.id = ?`,
        [session_id]
      );
      const session = sessions[0];

      if (!session) {
        throw new Error('Session not found');
      }

      // Security: Faculty can only generate QR for sessions they own
      if (Number(session.faculty_id) !== Number(faculty_id)) {
        throw new Error('You can only generate QR for your own sessions');
      }

      // -----------------------------------------------------------------------
      // DEPARTMENT VALIDATION
      // Faculty sirf apne department ke courses/sessions ka QR generate kar sakta hai
      // -----------------------------------------------------------------------
      // Fetch faculty's department name and resolve it to departments.id
      const [faculties] = await pool.execute(
        `SELECT u.id, u.department, d.id AS dept_id
         FROM users u
         LEFT JOIN departments d ON d.name = u.department
         WHERE u.id = ? AND u.role = 'faculty'`,
        [faculty_id]
      );
      const faculty = faculties[0];

      if (!faculty) {
        throw new Error('Faculty record not found');
      }

      // If the session has a department set, it must match the faculty's department
      if (session.department_id && faculty.dept_id) {
        if (Number(session.department_id) !== Number(faculty.dept_id)) {
          throw new Error(
            `Department mismatch: This session belongs to a different department. ` +
            `You can only generate QR for sessions in your own department (${faculty.department}).`
          );
        }
      }

      // If the session has a linked course, that course's department must also match
      if (session.course_id && session.course_dept_id && faculty.dept_id) {
        if (Number(session.course_dept_id) !== Number(faculty.dept_id)) {
          throw new Error(
            `Course department mismatch: This course does not belong to your department (${faculty.department}).`
          );
        }
      }

      // If session has a course, the course must be assigned to this faculty
      if (session.course_id && session.course_faculty_id !== null &&
          Number(session.course_faculty_id) !== Number(faculty_id)) {
        throw new Error('This course is not assigned to you');
      }

      if (session.status !== 'active') {
        throw new Error('Session is not active');
      }

      // Validate attendance value
      if (![1, 2, 3].includes(attendance_value)) {
        throw new Error('Invalid attendance value. Must be 1, 2, or 3');
      }

      // Validate radius
      if (![10, 20, 50].includes(radius_meters)) {
        throw new Error('Invalid radius. Must be 10, 20, or 50 meters');
      }

      // Validate duration
      if (![1, 2, 5].includes(duration_minutes) && duration_minutes < 1) {
        throw new Error('Invalid duration. Must be 1, 2, 5 minutes or custom (>0)');
      }

      // Validate location
      if (!this.isValidLocation(latitude, longitude)) {
        throw new Error('Invalid location coordinates');
      }

      // Invalidate previous active requests for this session
      await AttendanceRequest.invalidateSessionRequests(session_id, faculty_id);

      // Calculate expiry time
      const now = new Date();
      const expiryTime = new Date(now.getTime() + duration_minutes * 60000);

      // Create new request
      const requestData = {
        faculty_id,
        session_id,
        attendance_value,
        latitude,
        longitude,
        radius_meters,
        expires_at: expiryTime
      };

      const result = await AttendanceRequest.create(requestData);

      return {
        success: true,
        request_id: result.request_id,
        expires_at: expiryTime,
        duration_minutes,
        radius_meters,
        attendance_value
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate QR request
   */
  static async validateQRRequest(request_id, student_latitude, student_longitude) {
    try {
      const request = await AttendanceRequest.getByRequestId(request_id);

      if (!request) {
        return {
          valid: false,
          reason: 'QR code not found or expired'
        };
      }

      // Check if expired
      const now = new Date();
      if (new Date(request.expires_at) <= now) {
        await AttendanceRequest.updateStatus(request_id, 'expired');
        return {
          valid: false,
          reason: 'QR code has expired'
        };
      }

      // Skip location check if:
      // 1. Student location unavailable (sent as 0,0)
      // 2. SKIP_LOCATION_CHECK env var is set (dev/testing)
      const locationUnavailable =
        (student_latitude === 0 && student_longitude === 0) ||
        student_latitude === null || student_longitude === null;
      const skipLocationCheck =
        process.env.SKIP_LOCATION_CHECK === 'true' || locationUnavailable;

      if (!skipLocationCheck) {
        const distance = this.calculateDistance(
          request.latitude,
          request.longitude,
          student_latitude,
          student_longitude
        );

        if (distance > request.radius_meters) {
          return {
            valid: false,
            reason: `You are ${distance.toFixed(1)}m away from the classroom (allowed: ${request.radius_meters}m)`
          };
        }

        return {
          valid: true,
          request_id,
          attendance_value: request.attendance_value,
          session_id: request.session_id,
          faculty_id: request.faculty_id,
          distance: distance.toFixed(1)
        };
      }

      // Location unavailable — skip distance check, still allow attendance
      return {
        valid: true,
        request_id,
        attendance_value: request.attendance_value,
        session_id: request.session_id,
        faculty_id: request.faculty_id,
        distance: null,
        locationNote: locationUnavailable ? 'Location unavailable, distance check skipped' : 'Distance check disabled'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get attendance count for a request
   */
  static async getAttendanceCount(request_id) {
    try {
      // Get session_id from the QR request
      const [rows] = await pool.execute(
        'SELECT session_id FROM attendance_request WHERE request_id = ?',
        [request_id]
      );
      if (!rows[0]) return 0;
      const session_id = rows[0].session_id;

      // Count actual attendance records (present or late) for this session — today only
      const [countRows] = await pool.execute(
        "SELECT COUNT(*) as cnt FROM attendance WHERE session_id = ? AND status IN ('present', 'late') AND DATE(marked_at) = CURDATE()",
        [session_id]
      );
      return countRows[0]?.cnt || 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Record attendance acceptance
   */
  static async recordAcceptance(request_id) {
    try {
      await AttendanceRequest.incrementAcceptedCount(request_id);
      return await AttendanceRequest.getAcceptedCount(request_id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get faculty's recent requests
   */
  static async getFacultyRequests(faculty_id) {
    try {
      return await AttendanceRequest.getByFacultyId(faculty_id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate location coordinates
   */
  static isValidLocation(latitude, longitude) {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    return !isNaN(lat) && !isNaN(lng) && 
           lat >= -90 && lat <= 90 && 
           lng >= -180 && lng <= 180;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   * Returns distance in meters
   */
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c * 1000; // Convert to meters
    return Math.round(distance);
  }
}

module.exports = AttendanceRequestService;
