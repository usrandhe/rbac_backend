import { Router } from 'express';
import { RoleController } from '../controllers/role.controller';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/auth';
import { requirePermission } from '../middlewares/permission';
import {
  getRolesSchema,
  getRoleByIdSchema,
  createRoleSchema,
  updateRoleSchema,
  deleteRoleSchema,
  assignPermissionsSchema,
  addPermissionSchema,
  removePermissionSchema,
} from '../validators/role.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all roles - requires 'roles:read' permission
router.get(
  '/',
  requirePermission('roles:read'),
  validate(getRolesSchema),
  RoleController.getRoles
);

// get role by id - requires 'roles:read' permission
router.get(
  '/:id',
  requirePermission('roles:read'),
  validate(getRoleByIdSchema),
  RoleController.getRoleById
);

// Create role - requires 'roles:create' permission
router.post(
  '/',
  requirePermission('roles:create'),
  validate(createRoleSchema),
  RoleController.createRole
);

// Update role - requires 'roles:update' permission
router.patch(
  '/:id',
  requirePermission('roles:update'),
  validate(updateRoleSchema),  
  RoleController.updateRole
);

// Delete role - requires 'roles:delete' permission
router.delete(
  '/:id',
  requirePermission('roles:delete'),
  validate(deleteRoleSchema),
  RoleController.deleteRole
);

// Assign permissions - requires 'roles:update' permission
router.post(
  '/:id/permissions',
  requirePermission('roles:update'),
  validate(assignPermissionsSchema),
  RoleController.assignPermissions
);

// Add single permission - requires 'roles:update' permission
router.post(
  '/:id/permissions/add',
  requirePermission('roles:update'),
  validate(addPermissionSchema),
  RoleController.addPermission
);

// Remove permission - requires 'roles:update' permission
router.delete(
  '/:id/permissions/:permissionId',
  requirePermission('roles:update'),
  validate(removePermissionSchema),
  RoleController.removePermission
);

export default router;
