const activityLogService = require('../services/activity-log.service');

const getActivityLogs = async (req, res, next) => {
  try {
    const {
      search,
      role,
      action,
      userId,
      status,
      startDate,
      endDate,
      page,
      limit
    } = req.query;

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.max(Number(limit) || 50, 1);
    const offset = (pageNumber - 1) * limitNumber;

    const result = await activityLogService.getActivityLogs({
      search,
      role,
      action,
      userId: userId ? Number(userId) : undefined,
      status: status ? Number(status) : undefined,
      startDate,
      endDate,
      limit: limitNumber,
      offset
    });

    const totalPages = Math.max(Math.ceil(result.total / limitNumber), 1);

    return res.status(200).json({
      success: true,
      data: {
        logs: result.logs,
        pagination: {
          total: result.total,
          page: pageNumber,
          pages: totalPages,
          limit: limitNumber
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActivityLogs
};
