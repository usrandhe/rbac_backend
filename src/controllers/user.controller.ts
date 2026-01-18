import { Response } from 'express';
import { AuthRequest } from '../types';
import { UserService } from '../services/user.service';
import { ApiResponseHelper } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';

export class UserController {
  // Get all users
  static getUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await UserService.getUsers(req.query, req.user!.id);

    return ApiResponseHelper.success(
      res,
      result.data,
      'Users retrieved successfully',
      200,
      result.meta
    );
  });

  // Get user by ID
  static getUserById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.params.id;
    const result = await UserService.getUserById(userId as string);

    return ApiResponseHelper.success(res, result, 'User retrieved successfully');
  });

  // Create user
  static createUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await UserService.createUser(req.body, req.user!.id);

    return ApiResponseHelper.created(res, result, 'User created successfully');
  });

  // Update user
  static updateUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.params.id;
    const result = await UserService.updateUser(userId as string, req.body, req.user!.id);

    return ApiResponseHelper.success(res, result, 'User updated successfully');
  });

  // Delete user
  static deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.params.id;
    const result = await UserService.deleteUser(userId as string, req.user!.id);

    return ApiResponseHelper.success(res, result, 'User deleted successfully');
  });

  // Assign roles to user
  static assignRoles = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.params.id;
    const { roleIds } = req.body;
    const result = await UserService.assignRoles(userId as string, roleIds, req.user!.id);

    return ApiResponseHelper.success(res, result, 'Roles assigned successfully');
  });

  // Remove role from user
  static removeRole = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id: userId, roleId } = req.params;
    const result = await UserService.removeRole(userId as string, roleId as string);

    return ApiResponseHelper.success(res, result, 'Role removed successfully');
  });

  // Get user permissions
  static getUserPermissions = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const userId = req.params.id;
      const result = await UserService.getUserPermissions(userId as string);

      return ApiResponseHelper.success(
        res,
        result,
        'User permissions retrieved successfully'
      );
    }
  );
}