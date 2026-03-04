const { pool } = require('../config');

const MAX_LIMIT = 200;

const toSqlDateTime = (value, endOfDay = false) => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

const buildFilters = ({ search, role, action, userId, status, startDate, endDate }) => {
  let where = 'WHERE 1=1';
  const params = [];

  if (role) {
    where += ' AND l.user_role = ?';
    params.push(role);
  }

  if (action) {
    where += ' AND l.action = ?';
    params.push(action);
  }

  if (userId) {
    where += ' AND l.user_id = ?';
    params.push(userId);
  }

  if (status) {
    where += ' AND l.status_code = ?';
    params.push(status);
  }

  if (search) {
    const like = `%${search}%`;
    where += ' AND (l.action LIKE ? OR l.path LIKE ? OR u.name LIKE ? OR u.email LIKE ?)';
    params.push(like, like, like, like);
  }

  if (startDate) {
    where += ' AND l.created_at >= ?';
    params.push(startDate);
  }

  if (endDate) {
    where += ' AND l.created_at <= ?';
    params.push(endDate);
  }

  return { where, params };
};

const createActivityLog = async ({
  userId,
  userRole,
  action,
  entityType,
  entityId,
  method,
  path,
  statusCode,
  ipAddress,
  userAgent,
  metadata,
  durationMs
}) => {
  const hasMetadata = metadata && typeof metadata === 'object' && Object.keys(metadata).length > 0;
  let metadataJson = null;

  if (hasMetadata) {
    try {
      metadataJson = JSON.stringify(metadata);
    } catch (error) {
      metadataJson = null;
    }
  }

  await pool.query(
    `INSERT INTO activity_logs
      (user_id, user_role, action, entity_type, entity_id, method, path, status_code, ip_address, user_agent, metadata, duration_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    , [
      userId || null,
      userRole || null,
      action,
      entityType || null,
      entityId || null,
      method,
      path,
      statusCode,
      ipAddress || null,
      userAgent || null,
      metadataJson,
      durationMs || null
    ]
  );
};

const getActivityLogs = async ({
  search,
  role,
  action,
  userId,
  status,
  startDate,
  endDate,
  limit,
  offset
}) => {
  const safeLimit = Math.min(Number(limit) || 50, MAX_LIMIT);
  const safeOffset = Number(offset) || 0;
  const normalizedStart = toSqlDateTime(startDate);
  const normalizedEnd = toSqlDateTime(endDate, true);

  const { where, params } = buildFilters({
    search,
    role,
    action,
    userId,
    status,
    startDate: normalizedStart,
    endDate: normalizedEnd
  });

  const [rows] = await pool.query(
    `SELECT
      l.id,
      l.user_id,
      l.user_role,
      l.action,
      l.entity_type,
      l.entity_id,
      l.method,
      l.path,
      l.status_code,
      l.ip_address,
      l.user_agent,
      l.metadata,
      l.duration_ms,
      l.created_at,
      u.name AS user_name,
      u.email AS user_email
     FROM activity_logs l
     LEFT JOIN users u ON u.id = l.user_id
     ${where}
     ORDER BY l.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, safeLimit, safeOffset]
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM activity_logs l
     LEFT JOIN users u ON u.id = l.user_id
     ${where}`,
    params
  );

  const total = countRows?.[0]?.total || 0;

  const logs = rows.map((row) => {
    let metadata = null;
    if (row.metadata) {
      try {
        metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
      } catch (error) {
        metadata = null;
      }
    }
    return {
      ...row,
      metadata
    };
  });

  return {
    logs,
    total
  };
};

module.exports = {
  createActivityLog,
  getActivityLogs
};
