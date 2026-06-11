const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.post(
  '/register',
  authController.registerValidation,
  authController.register
);

router.post(
  '/login',
  authController.loginValidation,
  authController.login
);

router.get(
  '/verify-email',
  authController.verifyEmail
);

router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

router.post(
  '/refresh',
  authController.refreshToken
);

router.post(
  '/logout',
  authenticate,
  authController.logout
);

router.get(
  '/me',
  authenticate,
  authController.getMe
);

router.post(
  '/change-password',
  authenticate,
  authController.changePassword
);

router.put(
  '/users/:id/role',
  authenticate,
  authorize('admin'),
  authController.updateUserRole
);

module.exports = router;
