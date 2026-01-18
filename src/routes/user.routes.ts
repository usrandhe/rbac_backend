import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/auth';
import { requirePermission, requireOwnerOrPermission } from '../middlewares/permission';
import {
  getUsersSchema,
  getUserByIdSchema,
  createUserSchema,
  updateUserSchema,
  deleteUserSchema,
  assignRolesSchema,
  removeRoleSchema,
} from '../validators/user.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all users - requires 'users:read' permission
router.get(
  '/',
  requirePermission('users:read'),
  validate(getUsersSchema),
  UserController.getUsers
);

// Get user by ID - requires 'users:read' permission or being the owner
router.get(
  '/:id',
  validate(getUserByIdSchema),
  requireOwnerOrPermission('users:read'),
  UserController.getUserById
);

// Create user - requires 'users:create' permission
router.post(
  '/',
  requirePermission('users:create'),
  validate(createUserSchema),
  UserController.createUser
);

// Update user - requires 'users:update' permission or being the owner
router.patch(
  '/:id',
  validate(updateUserSchema),
  requireOwnerOrPermission('users:update'),
  UserController.updateUser
);

// Delete user - requires 'users:delete' permission
router.delete(
  '/:id',
  requirePermission('users:delete'),
  validate(deleteUserSchema),
  UserController.deleteUser
);

// Assign roles - requires 'users:update' permission
router.post(
  '/:id/roles',
  requirePermission('users:update'),
  validate(assignRolesSchema),
  UserController.assignRoles
);

// Remove role - requires 'users:update' permission
router.delete(
  '/:id/roles/:roleId',
  requirePermission('users:update'),
  validate(removeRoleSchema),
  UserController.removeRole
);

// Get user permissions - requires 'users:read' permission or being the owner
router.get(
  '/:id/permissions',
  validate(getUserByIdSchema),
  requireOwnerOrPermission('users:read'),
  UserController.getUserPermissions
);

export default router;