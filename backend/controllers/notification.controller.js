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

const createManualNotification = async (req, res, next) => {
  try {
    const { userId, type, title, message, actionUrl } = req.body;
    const notif = await notificationService.create(userId, type, title, message, {}, actionUrl);
    return ApiResponse.created(res, notif, 'Notification sent');
  } catch (error) { next(error); }
};

module.exports = { getAll, markRead, markAllRead, deleteNotification, createManualNotification };