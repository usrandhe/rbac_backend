import { Router } from 'express';
import { PermissionController } from '../controllers/permission.controller';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/auth';
import { requirePermission } from '../middlewares/permission';
import {
  getPermissionsSchema,
  getPermissionByIdSchema,
  createPermissionSchema,
  updatePermissionSchema,
  deletePermissionSchema,
  getResourceActionsSchema,
} from '../validators/permission.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all permissions - requires 'permissions:read' permission
router.get(
  '/',
  requirePermission('permissions:read'),
  validate(getPermissionsSchema),
  PermissionController.getPermissions
);

// Get permissions grouped by resource - requires 'permissions:read' permission
router.get(
  '/grouped',
  requirePermission('permissions:read'),
  PermissionController.getPermissionsByResource
);

// Get permission by ID - requires 'permissions:read' permission
router.get(
  '/:id',
  requirePermission('permissions:read'),
  validate(getPermissionByIdSchema),
  PermissionController.getPermissionById
);

// Create permission - requires 'permissions:create' permission
router.post(
  '/',
  requirePermission('permissions:create'),
  validate(createPermissionSchema),
  PermissionController.createPermission
);

// Update permission - requires 'permissions:update' permission
router.patch(
  '/:id',
  requirePermission('permissions:update'),
  validate(updatePermissionSchema),
  PermissionController.updatePermission
);

// Delete permission - requires 'permissions:delete' permission
router.delete(
  '/:id',
  requirePermission('permissions:delete'),
  validate(deletePermissionSchema),
  PermissionController.deletePermission
);

// Get resource actions - requires 'permissions:read' permission
router.get(
  '/resources/:resource/actions',
  requirePermission('permissions:read'),
  validate(getResourceActionsSchema),
  PermissionController.getResourceActions
);

export default router;
