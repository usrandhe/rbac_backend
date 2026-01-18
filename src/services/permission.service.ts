import prisma from '../lib/prisma';
import { PaginationParams } from '../types';
import { PaginationUtils } from '../utils/pagination';
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
} from '../utils/errors';

export class PermissionService {
  // Get all permissions with pagination
  static async getPermissions(params: PaginationParams) {
    const { page, limit, sortBy, sortOrder, search } =
      PaginationUtils.parsePaginationParams(params);

    // Build where clause for search
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { resource: { contains: search, mode: 'insensitive' as const } },
            { action: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    // Get total count
    const total = await prisma.permission.count({ where });

    // Get permissions
    const permissions = await prisma.permission.findMany({
      where,
      skip: PaginationUtils.getSkip(page, limit),
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        _count: {
          select: {
            rolePermissions: true,
          },
        },
      },
    });

    // Format permissions
    const formattedPermissions = permissions.map((permission) => ({
      id: permission.id,
      name: permission.name,
      resource: permission.resource,
      action: permission.action,
      description: permission.description,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
      roleCount: permission._count.rolePermissions,
    }));

    return PaginationUtils.createPaginatedResponse(
      formattedPermissions,
      total,
      page,
      limit
    );
  }

  // Get permission by ID
  static async getPermissionById(permissionId: string) {
    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
      include: {
        rolePermissions: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });

    if (!permission) {
      throw new NotFoundError('Permission not found');
    }

    return {
      id: permission.id,
      name: permission.name,
      resource: permission.resource,
      action: permission.action,
      description: permission.description,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
      roles: permission.rolePermissions.map((rp) => ({
        id: rp.role.id,
        name: rp.role.name,
        description: rp.role.description,
      })),
    };
  }

  // Create permission
  static async createPermission(data: {
    resource: string;
    action: string;
    description?: string;
  }) {
    // Validate resource and action format (lowercase)
    if (!/^[a-z_]+$/.test(data.resource)) {
      throw new BadRequestError(
        'Resource must be lowercase and can only contain letters and underscores'
      );
    }

    if (!/^[a-z_]+$/.test(data.action)) {
      throw new BadRequestError(
        'Action must be lowercase and can only contain letters and underscores'
      );
    }

    // Generate permission name
    const name = `${data.resource}:${data.action}`;

    // Check if permission exists
    const existingPermission = await prisma.permission.findUnique({
      where: { name },
    });

    if (existingPermission) {
      throw new ConflictError('Permission with this name already exists');
    }

    // Create permission
    const permission = await prisma.permission.create({
      data: {
        name,
        resource: data.resource,
        action: data.action,
        description: data.description,
      },
    });

    return permission;
  }

  // Update permission
  static async updatePermission(
    permissionId: string,
    data: {
      resource?: string;
      action?: string;
      description?: string;
    }
  ) {
    // Check if permission exists
    const existingPermission = await prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!existingPermission) {
      throw new NotFoundError('Permission not found');
    }

    // If updating resource or action, validate and check for conflicts
    let newName = existingPermission.name;

    if (data.resource || data.action) {
      const resource = data.resource || existingPermission.resource;
      const action = data.action || existingPermission.action;

      // Validate format
      if (data.resource && !/^[a-z_]+$/.test(data.resource)) {
        throw new BadRequestError(
          'Resource must be lowercase and can only contain letters and underscores'
        );
      }

      if (data.action && !/^[a-z_]+$/.test(data.action)) {
        throw new BadRequestError(
          'Action must be lowercase and can only contain letters and underscores'
        );
      }

      newName = `${resource}:${action}`;

      // Check for conflicts
      if (newName !== existingPermission.name) {
        const nameExists = await prisma.permission.findUnique({
          where: { name: newName },
        });

        if (nameExists) {
          throw new ConflictError('Permission with this name already exists');
        }
      }
    }

    // Update permission
    const permission = await prisma.permission.update({
      where: { id: permissionId },
      data: {
        name: newName,
        resource: data.resource,
        action: data.action,
        description: data.description,
      },
    });

    return permission;
  }

  // Delete permission
  static async deletePermission(permissionId: string) {
    // Check if permission exists
    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
      include: {
        _count: {
          select: {
            rolePermissions: true,
          },
        },
      },
    });

    if (!permission) {
      throw new NotFoundError('Permission not found');
    }

    // Check if permission is assigned to roles
    if (permission._count.rolePermissions > 0) {
      throw new ForbiddenError(
        `Cannot delete permission. It is assigned to ${permission._count.rolePermissions} role(s)`
      );
    }

    // Delete permission
    await prisma.permission.delete({
      where: { id: permissionId },
    });

    return { message: 'Permission deleted successfully' };
  }

  // Get permissions grouped by resource
  static async getPermissionsByResource() {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });

    // Group by resource
    const grouped = permissions.reduce((acc, permission) => {
      if (!acc[permission.resource]) {
        acc[permission.resource] = [];
      }
      acc[permission.resource].push({
        id: permission.id,
        name: permission.name,
        action: permission.action,
        description: permission.description,
      });
      return acc;
    }, {} as Record<string, any[]>);

    return grouped;
  }

  // Get available actions for a resource
  static async getResourceActions(resource: string) {
    const permissions = await prisma.permission.findMany({
      where: { resource },
      orderBy: { action: 'asc' },
    });

    return permissions.map((p) => ({
      id: p.id,
      action: p.action,
      name: p.name,
      description: p.description,
    }));
  }
}