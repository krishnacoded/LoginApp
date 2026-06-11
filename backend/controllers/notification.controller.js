const notificationService = require('../services/notification.service');
const ApiResponse = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const result = await notificationService.getAll(req.user.id, req.query);
    return ApiResponse.success(res, result);
  } catch (error) { next(error); }
};

const markRead = async (req, res, next) => {
  try {
    await notificationService.markRead(req.params.id, req.user.id);
    return ApiResponse.success(res, null, 'Notification marked as read');
  } catch (error) { next(error); }
};

const markAllRead = async (req, res, next) => {
  try {
    await notificationService.markAllRead(req.user.id);
    return ApiResponse.success(res, null, 'All notifications marked as read');
  } catch (error) { next(error); }
};

const deleteNotification = async (req, res, next) => {
  try {
    await notificationService.delete(req.params.id, req.user.id);
    return ApiResponse.success(res, null, 'Notification deleted');
  } catch (error) { next(error); }
};

const createNotification = async (userId, type, title, message, data = {}, actionUrl = null) => {
  return await notificationService.create(userId, type, title, message, data, actionUrl);
};

module.exports = { getAll, markRead, markAllRead, deleteNotification, createNotification };