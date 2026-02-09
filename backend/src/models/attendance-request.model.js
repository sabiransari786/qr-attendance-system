/**
 * Attendance Request Model
 * 
 * Handles QR code generation requests from faculty
 * Stores request metadata for location-based attendance verification
 */

const { pool } = require('../config');
const { v4: uuidv4 } = require('uuid');

class AttendanceRequestModel {
  /**
   * Create a new attendance request
   */
  static async create(data) {
    const {
      faculty_id,
      session_id,
      attendance_value,
      latitude,
      longitude,
      radius_meters,
      expires_at
    } = data;

    const request_id = uuidv4();

    const query = `
      INSERT INTO attendance_request 
      (request_id, faculty_id, session_id, attendance_value, latitude, longitude, radius_meters, expires_at, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `;

    const [results] = await pool.execute(query, [
      request_id,
      faculty_id,
      session_id,
      attendance_value,
      latitude,
      longitude,
      radius_meters,
      expires_at
    ]);

    return { request_id, id: results.insertId };
  }

  /**
   * Get active request by request_id
   */
  static async getByRequestId(request_id) {
    const query = `
      SELECT * FROM attendance_request 
      WHERE request_id = ? AND status = 'active' AND expires_at > NOW()
    `;

    const [results] = await pool.execute(query, [request_id]);
    return results[0] || null;
  }

  /**
   * Get requests by faculty_id
   */
  static async getByFacultyId(faculty_id, limit = 10) {
    const query = `
      SELECT * FROM attendance_request 
      WHERE faculty_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `;

    const [results] = await pool.execute(query, [faculty_id, limit]);
    return results || [];
  }

  /**
   * Get active requests for a session
   */
  static async getActiveBySessionId(session_id) {
    const query = `
      SELECT * FROM attendance_request 
      WHERE session_id = ? AND status = 'active' AND expires_at > NOW()
      ORDER BY created_at DESC
    `;

    const [results] = await pool.execute(query, [session_id]);
    return results || [];
  }

  /**
   * Invalidate previous requests for a session
   */
  static async invalidateSessionRequests(session_id, faculty_id) {
    const query = `
      UPDATE attendance_request 
      SET status = 'invalidated'
      WHERE session_id = ? AND faculty_id = ? AND status = 'active'
    `;

    const [results] = await pool.execute(query, [session_id, faculty_id]);
    return results;
  }

  /**
   * Update request status
   */
  static async updateStatus(request_id, status) {
    const query = `
      UPDATE attendance_request 
      SET status = ?
      WHERE request_id = ?
    `;

    const [results] = await pool.execute(query, [status, request_id]);
    return results;
  }

  /**
   * Increment accepted count
   */
  static async incrementAcceptedCount(request_id) {
    const query = `
      UPDATE attendance_request 
      SET accepted_count = accepted_count + 1
      WHERE request_id = ?
    `;

    const [results] = await pool.execute(query, [request_id]);
    return results;
  }

  /**
   * Get accepted count for a request
   */
  static async getAcceptedCount(request_id) {
    const query = `
      SELECT accepted_count FROM attendance_request 
      WHERE request_id = ?
    `;

    const [results] = await pool.execute(query, [request_id]);
    return results[0]?.accepted_count || 0;
  }

  /**
   * Mark expired requests
   */
  static async markExpiredRequests() {
    const query = `
      UPDATE attendance_request 
      SET status = 'expired'
      WHERE status = 'active' AND expires_at <= NOW()
    `;

    const [results] = await pool.execute(query, []);
    return results;
  }
}

module.exports = AttendanceRequestModel;
