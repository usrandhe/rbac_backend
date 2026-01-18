import { Response } from 'express';
import { AuthRequest } from '../types';
import { RoleService } from '../services/role.service';
import { ApiResponseHelper } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';

export class RoleController {
  // Get all roles
  static getRoles = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await RoleService.getRoles(req.query);

    return ApiResponseHelper.success(
      res,
      result.data,
      'Roles retrieved successfully',
      200,
      result.meta
    );
  });

  // Get role by ID
  static getRoleById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const roleId = req.params.id;
    const result = await RoleService.getRoleById(roleId as string);

    return ApiResponseHelper.success(res, result, 'Role retrieved successfully');
  });

  // Create role
  static createRole = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await RoleService.createRole(req.body);

    return ApiResponseHelper.created(res, result, 'Role created successfully');
  });

  // Update role
  static updateRole = asyncHandler(async (req: AuthRequest, res: Response) => {
    const roleId = req.params.id;
    const result = await RoleService.updateRole(roleId as string, req.body);

    return ApiResponseHelper.success(res, result, 'Role updated successfully');
  });

  // Delete role
  static deleteRole = asyncHandler(async (req: AuthRequest, res: Response) => {
    const roleId = req.params.id;
    const result = await RoleService.deleteRole(roleId as string);

    return ApiResponseHelper.success(res, result, 'Role deleted successfully');
  });

  // Assign permissions to role
  static assignPermissions = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const roleId = req.params.id;
      const { permissionIds } = req.body;
      const result = await RoleService.assignPermissions(roleId as string, permissionIds);

      return ApiResponseHelper.success(
        res,
        result,
        'Permissions assigned successfully'
      );
    }
  );

  // Add single permission to role
  static addPermission = asyncHandler(async (req: AuthRequest, res: Response) => {
    const roleId = req.params.id;
    const { permissionId } = req.body;
    const result = await RoleService.addPermission(roleId as string, permissionId);

    return ApiResponseHelper.success(res, result, 'Permission added successfully');
  });

  // Remove permission from role
  static removePermission = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const { id: roleId, permissionId } = req.params;
      const result = await RoleService.removePermission(roleId as string, permissionId as string);

      return ApiResponseHelper.success(
        res,
        result,
        'Permission removed successfully'
      );
    }
  );
}