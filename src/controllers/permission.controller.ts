import { Response } from 'express';
import { AuthRequest } from '../types';
import { PermissionService } from '../services/permission.service';
import { ApiResponseHelper } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';

export class PermissionController {
  // Get all permissions
  static getPermissions = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const result = await PermissionService.getPermissions(req.query);

      return ApiResponseHelper.success(
        res,
        result.data,
        'Permissions retrieved successfully',
        200,
        result.meta
      );
    }
  );

  // Get permission by ID
  static getPermissionById = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const permissionId = req.params.id;
      const result = await PermissionService.getPermissionById(permissionId as string);

      return ApiResponseHelper.success(
        res,
        result,
        'Permission retrieved successfully'
      );
    }
  );

  // Create permission
  static createPermission = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const result = await PermissionService.createPermission(req.body);

      return ApiResponseHelper.created(
        res,
        result,
        'Permission created successfully'
      );
    }
  );

  // Update permission
  static updatePermission = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const permissionId = req.params.id;
      const result = await PermissionService.updatePermission(
        permissionId as string,
        req.body
      );

      return ApiResponseHelper.success(
        res,
        result,
        'Permission updated successfully'
      );
    }
  );

  // Delete permission
  static deletePermission = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const permissionId = req.params.id;
      const result = await PermissionService.deletePermission(permissionId as string);

      return ApiResponseHelper.success(
        res,
        result,
        'Permission deleted successfully'
      );
    }
  );

  // Get permissions grouped by resource
  static getPermissionsByResource = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const result = await PermissionService.getPermissionsByResource();

      return ApiResponseHelper.success(
        res,
        result,
        'Permissions grouped by resource retrieved successfully'
      );
    }
  );

  // Get resource actions
  static getResourceActions = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const { resource } = req.params;
      const result = await PermissionService.getResourceActions(resource as string);

      return ApiResponseHelper.success(
        res,
        result,
        'Resource actions retrieved successfully'
      );
    }
  );
}