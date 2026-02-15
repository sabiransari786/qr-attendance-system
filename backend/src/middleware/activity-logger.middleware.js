const activityLogService = require('../services/activity-log.service');

const IGNORED_PATHS = new Set([
  '/api/health'
]);

const getActionInfo = (req) => {
  const path = req.path || '';
  const method = req.method.toUpperCase();

  if (path.startsWith('/api/auth/login')) {
    return { action: 'AUTH_LOGIN', entityType: 'user' };
  }
  if (path.startsWith('/api/auth/logout')) {
    return { action: 'AUTH_LOGOUT', entityType: 'user' };
  }
  if (path.startsWith('/api/auth/register')) {
    return { action: 'AUTH_REGISTER', entityType: 'user' };
  }
  if (path.startsWith('/api/auth/upload-photo')) {
    return { action: 'PROFILE_PHOTO_UPLOAD', entityType: 'user' };
  }
  if (path.startsWith('/api/auth/admin/users') && method === 'GET') {
    return { action: 'ADMIN_USER_LIST', entityType: 'user' };
  }
  if (path.includes('/api/auth/admin/users') && method === 'PATCH' && path.endsWith('/role')) {
    return { action: 'ADMIN_USER_ROLE_UPDATE', entityType: 'user' };
  }
  if (path.includes('/api/auth/admin/users') && method === 'PATCH' && path.endsWith('/status')) {
    return { action: 'ADMIN_USER_STATUS_UPDATE', entityType: 'user' };
  }
  if (path.includes('/api/auth/admin/users') && method === 'DELETE') {
    return { action: 'ADMIN_USER_DELETE', entityType: 'user' };
  }
  if (path.startsWith('/api/attendance/mark')) {
    return { action: 'ATTENDANCE_MARK', entityType: 'attendance' };
  }
  if (path.startsWith('/api/attendance/report')) {
    return { action: 'ATTENDANCE_REPORT', entityType: 'attendance' };
  }
  if (path.startsWith('/api/session') && method === 'POST') {
    return { action: 'SESSION_CREATE', entityType: 'session' };
  }
  if (path.includes('/api/session') && method === 'PUT' && path.endsWith('/close')) {
    return { action: 'SESSION_CLOSE', entityType: 'session' };
  }
  if (path.startsWith('/api/otp')) {
    return { action: 'OTP_FLOW', entityType: 'otp' };
  }

  return { action: `${method} ${path}`, entityType: null };
};

const resolveEntityId = (req) => {
  if (req.params?.sessionId) {
    return String(req.params.sessionId);
  }
  if (req.params?.userId) {
    return String(req.params.userId);
  }
  if (req.params?.id) {
    return String(req.params.id);
  }
  return null;
};

const activityLogger = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }

  if (IGNORED_PATHS.has(req.path)) {
    return next();
  }

  const startTime = Date.now();

  res.on('finish', async () => {
    try {
      const durationMs = Date.now() - startTime;
      const actionInfo = getActionInfo(req);
      const override = req.activityLogContext || {};
      const ipHeader = req.headers['x-forwarded-for'];
      const ipAddress = Array.isArray(ipHeader)
        ? ipHeader[0]
        : typeof ipHeader === 'string'
          ? ipHeader.split(',')[0].trim()
          : req.ip;

      const metadata = {
        params: req.params || undefined,
        query: req.query || undefined
      };

      await activityLogService.createActivityLog({
        userId: override.userId || req.user?.id,
        userRole: override.userRole || req.user?.role,
        action: override.action || actionInfo.action,
        entityType: override.entityType || actionInfo.entityType,
        entityId: override.entityId || resolveEntityId(req),
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        ipAddress,
        userAgent: req.get('user-agent'),
        metadata,
        durationMs
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Activity log write failed:', error.message);
      }
    }
  });

  return next();
};

module.exports = activityLogger;
