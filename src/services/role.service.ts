import prisma from '../lib/prisma';
import { PaginationParams } from '../types';
import { PaginationUtils } from '../utils/pagination';
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
} from '../utils/errors';

export class RoleService {
  // Get all roles with pagination
  static async getRoles(params: PaginationParams) {
    const { page, limit, sortBy, sortOrder, search } =
      PaginationUtils.parsePaginationParams(params);

    // Build where clause for search
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    // Get total count
    const total = await prisma.role.count({ where });

    // Get roles with permissions
    const roles = await prisma.role.findMany({
      where,
      skip: PaginationUtils.getSkip(page, limit),
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            userRoles: true,
            rolePermissions: true
          },
        },
      },
    });

    // Format roles
    const formattedRoles = roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions: role.rolePermissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        resource: rp.permission.resource,
        action: rp.permission.action,
        description: rp.permission.description,
      })),
      userCount: role._count.userRoles,
      permissionCount: role._count.rolePermissions,
    }));

    return PaginationUtils.createPaginatedResponse(
      formattedRoles,
      total,
      page,
      limit
    );
  }

  // Get role by ID
  static async getRoleById(roleId: string) {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundError('Role not found');
    }

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions: role.rolePermissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        resource: rp.permission.resource,
        action: rp.permission.action,
        description: rp.permission.description,
      })),
      users: role.userRoles.map((ur) => ({
        id: ur.user.id,
        email: ur.user.email,
        name: `${ur.user.firstName || ''} ${ur.user.lastName || ''}`.trim(),
        isActive: ur.user.isActive,
        assignedAt: ur.assignedAt,
      })),
    };
  }

  // Create role
  static async createRole(data: {
    name: string;
    description?: string;
    permissionIds?: string[];
  }) {
    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { name: data.name },
    });

    if (existingRole) {
      throw new ConflictError('Role with this name already exists');
    }

    // Validate role name format (lowercase, underscore separated)
    if (!/^[a-z_]+$/.test(data.name)) {
      throw new BadRequestError(
        'Role name must be lowercase and can only contain letters and underscores'
      );
    }

    // Verify permissions exist if provided
    if (data.permissionIds && data.permissionIds.length > 0) {
      const permissions = await prisma.permission.findMany({
        where: { id: { in: data.permissionIds } },
      });

      if (permissions.length !== data.permissionIds.length) {
        throw new BadRequestError('One or more permission IDs are invalid');
      }
    }

    // Create role with permissions
    const role = await prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
        rolePermissions: data.permissionIds
          ? {
              create: data.permissionIds.map((permissionId) => ({
                permissionId,
              })),
            }
          : undefined,
      },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions: role.rolePermissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        resource: rp.permission.resource,
        action: rp.permission.action,
      })),
    };
  }

  // Update role
  static async updateRole(
    roleId: string,
    data: {
      name?: string;
      description?: string;
    }
  ) {
    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!existingRole) {
      throw new NotFoundError('Role not found');
    }

    // Prevent updating system roles
    const systemRoles = ['super_admin', 'admin', 'manager', 'user'];
    if (systemRoles.includes(existingRole.name)) {
      throw new ForbiddenError('Cannot update system roles');
    }

    // If updating name, check for conflicts
    if (data.name && data.name !== existingRole.name) {
      // Validate name format
      if (!/^[a-z_]+$/.test(data.name)) {
        throw new BadRequestError(
          'Role name must be lowercase and can only contain letters and underscores'
        );
      }

      const nameExists = await prisma.role.findUnique({
        where: { name: data.name },
      });

      if (nameExists) {
        throw new ConflictError('Role name already exists');
      }
    }

    // Update role
    const role = await prisma.role.update({
      where: { id: roleId },
      data,
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions: role.rolePermissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        resource: rp.permission.resource,
        action: rp.permission.action,
      })),
    };
  }

  // Delete role
  static async deleteRole(roleId: string) {
    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundError('Role not found');
    }

    // Prevent deleting system roles
    const systemRoles = ['super_admin', 'admin', 'manager', 'user'];
    if (systemRoles.includes(role.name)) {
      throw new ForbiddenError('Cannot delete system roles');
    }

    // Check if role is assigned to users
    if (role._count.userRoles > 0) {
      throw new ForbiddenError(
        `Cannot delete role. It is assigned to ${role._count.userRoles} user(s)`
      );
    }

    // Delete role (cascade will handle role_permissions)
    await prisma.role.delete({
      where: { id: roleId },
    });

    return { message: 'Role deleted successfully' };
  }

  // Assign permissions to role
  static async assignPermissions(roleId: string, permissionIds: string[]) {
    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundError('Role not found');
    }

    // Verify permissions exist
    const permissions = await prisma.permission.findMany({
      where: { id: { in: permissionIds } },
    });

    if (permissions.length !== permissionIds.length) {
      throw new BadRequestError('One or more permission IDs are invalid');
    }

    // Remove existing permissions
    await prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    // Assign new permissions
    await prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({
        roleId,
        permissionId,
      })),
    });

    // Return updated role
    return this.getRoleById(roleId);
  }

  // Add single permission to role
  static async addPermission(roleId: string, permissionId: string) {
    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundError('Role not found');
    }

    // Check if permission exists
    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      throw new NotFoundError('Permission not found');
    }

    // Check if already assigned
    const existing = await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });

    if (existing) {
      throw new ConflictError('Permission already assigned to this role');
    }

    // Add permission
    await prisma.rolePermission.create({
      data: {
        roleId,
        permissionId,
      },
    });

    return { message: 'Permission added successfully' };
  }

  // Remove permission from role
  static async removePermission(roleId: string, permissionId: string) {
    // Check if role has this permission
    const rolePermission = await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });

    if (!rolePermission) {
      throw new NotFoundError('Role does not have this permission');
    }

    // Remove permission
    await prisma.rolePermission.delete({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });

    return { message: 'Permission removed successfully' };
  }
}