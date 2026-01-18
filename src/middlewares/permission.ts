import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

// Check if user has specific role
export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const hasRole = roles.some((role) => req.user!.roles.includes(role));

    if (!hasRole) {
      throw new ForbiddenError(`Requires one of these roles: ${roles.join(', ')}`);
    }

    next();
  };
};

// Check if user has specific permission
export const requirePermission = (...permissions: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const hasPermission = permissions.some((permission) =>
      req.user!.permissions.includes(permission)
    );

    if (!hasPermission) {
      throw new ForbiddenError(
        `Requires one of these permissions: ${permissions.join(', ')}`
      );
    }

    next();
  };
};

// Check if user has ALL specified permissions
export const requireAllPermissions = (...permissions: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const hasAllPermissions = permissions.every((permission) =>
      req.user!.permissions.includes(permission)
    );

    if (!hasAllPermissions) {
      throw new ForbiddenError(
        `Requires all of these permissions: ${permissions.join(', ')}`
      );
    }

    next();
  };
};

// Check if user is super admin
export const requireSuperAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  if (!req.user.roles.includes('super_admin')) {
    throw new ForbiddenError('Super admin access required');
  }

  next();
};

// Check if user owns the resource or has permission
export const requireOwnerOrPermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    // Check if user is the owner (userId in params matches logged-in user)
    const isOwner = req.params.userId === req.user.id;

    // Check if user has the required permission
    const hasPermission = req.user.permissions.includes(permission);

    if (!isOwner && !hasPermission) {
      throw new ForbiddenError(
        'You can only access your own resources or need specific permission'
      );
    }

    next();
  };
};