import { z } from 'zod';

export const getUsersSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    search: z.string().optional(),
  }),
});

export const getUserByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID format'),
  }),
});

export const createUserSchema = z.object({
  body: z.object({
    email: z
      .string({
        error: 'Email is required',
      })
      .email('Invalid email format'),
    password: z
      .string({
        error: 'Password is required',
      })
      .min(8, 'Password must be at least 8 characters'),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    roleIds: z.array(z.uuid('Invalid role ID format')).optional(),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.uuid('Invalid user ID format'),
  }),
  body: z.object({
    email: z.email('Invalid email format').optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    avatarUrl: z.url('Invalid URL format').optional(),
    isActive: z.boolean().optional(),
  }),
});

export const deleteUserSchema = z.object({
  params: z.object({
    id: z.uuid('Invalid user ID format'),
  }),
});

export const assignRolesSchema = z.object({
  params: z.object({
    id: z.uuid('Invalid user ID format'),
  }),
  body: z.object({
    roleIds: z
      .array(z.uuid('Invalid role ID format'))
      .min(1, 'At least one role is required'),
  }),
});

export const removeRoleSchema = z.object({
  params: z.object({
    id: z.uuid('Invalid user ID format'),
    roleId: z.uuid('Invalid role ID format'),
  }),
});