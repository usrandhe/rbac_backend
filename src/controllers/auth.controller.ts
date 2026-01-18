import { Response } from 'express';
import { AuthRequest } from '../types';
import { AuthService } from '../services/auth.service';
import { ApiResponseHelper } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';

export class AuthController {
  // Register
  static register = asyncHandler(async (req: AuthRequest, res: Response) => {
    console.log(req.body);
    const result = await AuthService.register(req.body);

    return ApiResponseHelper.created(res, result, 'User registered successfully');
  });

  // Login
  static login = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);

    return ApiResponseHelper.success(res, result, 'Login successful');
  });

  // Refresh token
  static refreshToken = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { refreshToken } = req.body;
    const result = await AuthService.refreshToken(refreshToken);

    return ApiResponseHelper.success(res, result, 'Token refreshed successfully');
  });

  // Get profile
  static getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const result = await AuthService.getProfile(userId);

    return ApiResponseHelper.success(res, result, 'Profile retrieved successfully');
  });

  // Update profile
  static updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const result = await AuthService.updateProfile(userId, req.body);

    return ApiResponseHelper.success(res, result, 'Profile updated successfully');
  });

  // Change password
  static changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;
    const result = await AuthService.changePassword(userId, currentPassword, newPassword);

    return ApiResponseHelper.success(res, result, 'Password changed successfully');
  });

  // Logout (client-side token removal, optional server-side session cleanup)
  static logout = asyncHandler(async (req: AuthRequest, res: Response) => {
    // In a production app, you might want to blacklist the token
    // or clear the session from the database
    
    return ApiResponseHelper.success(
      res,
      null,
      'Logout successful. Please remove token from client.'
    );
  });
}