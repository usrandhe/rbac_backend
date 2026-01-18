//import prisma from '../config/database';
import prisma from '../lib/prisma';
import { PaginationParams } from '../types';
import { PaginationUtils } from '../utils/pagination';
import { PasswordUtils } from '../utils/password';
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
} from '../utils/errors';

export class UserService {
  // Get all users with pagination, filtering, and sorting
  static async getUsers(params: PaginationParams, requesterId: string) {
    const { page, limit, sortBy, sortOrder, search } =
      PaginationUtils.parsePaginationParams(params);

    // Build where clause for search
    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    // Get total count
    const total = await prisma.user.count({ where });

    // Get users
    const users = await prisma.user.findMany({
      where,
      skip: PaginationUtils.getSkip(page, limit),
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Sanitize users
    const sanitizedUsers = users.map((user) => this.sanitizeUser(user));

    return PaginationUtils.createPaginatedResponse(
      sanitizedUsers,
      total,
      page,
      limit
    );
  }

  // Get user by ID
  static async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
            assigner: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return this.sanitizeUser(user);
  }

  // Create user
  static async createUser(
    data: {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
      roleIds?: string[];
    },
    createdBy: string
  ) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Validate password
    const passwordValidation = PasswordUtils.validateStrength(data.password);
    if (!passwordValidation.isValid) {
      throw new BadRequestError(passwordValidation.errors.join(', '));
    }

    // Hash password
    const passwordHash = await PasswordUtils.hashPassword(data.password);

    // If no roles specified, use default 'user' role
    let roleIds = data.roleIds || [];
    if (roleIds.length === 0) {
      const defaultRole = await prisma.role.findUnique({
        where: { name: 'user' },
      });
      if (defaultRole) {
        roleIds = [defaultRole.id];
      }
    }

    // Verify roles exist
    if (roleIds.length > 0) {
      const roles = await prisma.role.findMany({
        where: { id: { in: roleIds } },
      });

      if (roles.length !== roleIds.length) {
        throw new BadRequestError('One or more role IDs are invalid');
      }
    }

    // Create user with roles
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        userRoles: {
          create: roleIds.map((roleId) => ({
            roleId,
            assignedBy: createdBy,
          })),
        },
      },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return this.sanitizeUser(user);
  }

  // Update user
  static async updateUser(
    userId: string,
    data: {
      email?: string;
      firstName?: string;
      lastName?: string;
      avatarUrl?: string;
      isActive?: boolean;
    },
    updatedBy: string
  ) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    // If updating email, check for conflicts
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (emailExists) {
        throw new ConflictError('Email already in use');
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return this.sanitizeUser(user);
  }

  // Delete user
  static async deleteUser(userId: string, deletedBy: string) {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Prevent deleting super_admin
    const isSuperAdmin = user.userRoles.some(
      (ur) => ur.role.name === 'super_admin'
    );

    if (isSuperAdmin) {
      throw new ForbiddenError('Cannot delete super admin user');
    }

    // Prevent self-deletion
    if (userId === deletedBy) {
      throw new ForbiddenError('Cannot delete your own account');
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'User deleted successfully' };
  }

  // Assign roles to user
  static async assignRoles(
    userId: string,
    roleIds: string[],
    assignedBy: string
  ) {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify roles exist
    const roles = await prisma.role.findMany({
      where: { id: { in: roleIds } },
    });

    if (roles.length !== roleIds.length) {
      throw new BadRequestError('One or more role IDs are invalid');
    }

    // Remove existing roles
    await prisma.userRole.deleteMany({
      where: { userId },
    });

    // Assign new roles
    await prisma.userRole.createMany({
      data: roleIds.map((roleId) => ({
        userId,
        roleId,
        assignedBy,
      })),
    });

    // Return updated user
    return this.getUserById(userId);
  }

  // Remove role from user
  static async removeRole(userId: string, roleId: string) {
    // Check if user has this role
    const userRole = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
      include: {
        role: true,
      },
    });

    if (!userRole) {
      throw new NotFoundError('User does not have this role');
    }

    // Prevent removing super_admin role
    if (userRole.role.name === 'super_admin') {
      throw new ForbiddenError('Cannot remove super_admin role');
    }

    // Check if user will have at least one role after removal
    const userRolesCount = await prisma.userRole.count({
      where: { userId },
    });

    if (userRolesCount <= 1) {
      throw new BadRequestError('User must have at least one role');
    }

    // Remove role
    await prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    return { message: 'Role removed successfully' };
  }

  // Get user's permissions
  static async getUserPermissions(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Extract unique permissions
    const permissionsSet = new Set<string>();
    const permissionsDetails: any[] = [];

    user.userRoles.forEach((ur) => {
      ur.role.rolePermissions.forEach((rp) => {
        if (!permissionsSet.has(rp.permission.id)) {
          permissionsSet.add(rp.permission.id);
          permissionsDetails.push({
            id: rp.permission.id,
            name: rp.permission.name,
            resource: rp.permission.resource,
            action: rp.permission.action,
            description: rp.permission.description,
            grantedBy: ur.role.name,
          });
        }
      });
    });

    return permissionsDetails;
  }

  // Helper: Sanitize user
  private static sanitizeUser(user: any) {
    const { passwordHash, ...sanitizedUser } = user;

    // Extract roles and permissions
    const roles =
      user.userRoles?.map((ur: any) => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
        assignedAt: ur.assignedAt,
        assignedBy: ur.assigner
          ? {
              id: ur.assigner.id,
              email: ur.assigner.email,
              name: `${ur.assigner.firstName || ''} ${ur.assigner.lastName || ''}`.trim(),
            }
          : null,
      })) || [];

    const permissionsSet = new Set<string>();
    user.userRoles?.forEach((ur: any) => {
      ur.role.rolePermissions?.forEach((rp: any) => {
        permissionsSet.add(rp.permission.name);
      });
    });
    const permissions = Array.from(permissionsSet);

    return {
      ...sanitizedUser,
      userRoles: undefined,
      roles,
      permissions,
    };
  }
}