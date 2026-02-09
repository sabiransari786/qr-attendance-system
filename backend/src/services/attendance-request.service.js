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
      // Validate session exists and is active
      const [sessions] = await pool.execute(
        'SELECT id, faculty_id, status FROM sessions WHERE id = ?',
        [session_id]
      );
      const session = sessions[0];

      if (!session) {
        throw new Error('Session not found');
      }

      if (Number(session.faculty_id) !== Number(faculty_id)) {
        throw new Error('You can only generate QR for your own sessions');
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

      // Validate location
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
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get attendance count for a request
   */
  static async getAttendanceCount(request_id) {
    try {
      return await AttendanceRequest.getAcceptedCount(request_id);
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
