import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/auth';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../validators/auth.validator';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/refresh-token', validate(refreshTokenSchema), AuthController.refreshToken);

// Protected routes
router.get('/profile', authenticate, AuthController.getProfile);
router.patch('/profile', authenticate, validate(updateProfileSchema), AuthController.updateProfile);
router.post('/change-password', authenticate, validate(changePasswordSchema), AuthController.changePassword);
router.post('/logout', authenticate, AuthController.logout);

export default router;