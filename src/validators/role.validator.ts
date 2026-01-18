import { z } from 'zod';

export const getRolesSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    search: z.string().optional(),
  }),
});

export const getRoleByIdSchema = z.object({
  params: z.object({
    id: z.uuid('Invalid role ID format'),
  }),
});

export const createRoleSchema = z.object({
  body: z.object({
    name: z
      .string({
        error: 'Role name is required',
      })
      .regex(
        /^[a-z_]+$/,
        'Role name must be lowercase and can only contain letters and underscores'
      ),
    description: z.string().optional(),
    permissionIds: z.array(z.uuid('Invalid permission ID format')).optional(),
  }),
});

export const updateRoleSchema = z.object({
  params: z.object({
    id: z.uuid('Invalid role ID format'),
  }),
  body: z.object({
    name: z
      .string()
      .regex(
        /^[a-z_]+$/,
        'Role name must be lowercase and can only contain letters and underscores'
      )
      .optional(),
    description: z.string().optional(),
  }),
});

export const deleteRoleSchema = z.object({
  params: z.object({
    id: z.uuid('Invalid role ID format'),
  }),
});

export const assignPermissionsSchema = z.object({
  params: z.object({
    id: z.uuid('Invalid role ID format'),
  }),
  body: z.object({
    permissionIds: z
      .array(z.uuid('Invalid permission ID format'))
      .min(1, 'At least one permission is required'),
  }),
});

export const addPermissionSchema = z.object({
  params: z.object({
    id: z.uuid('Invalid role ID format'),
  }),
  body: z.object({
    permissionId: z.uuid('Invalid permission ID format'),
  }),
});

export const removePermissionSchema = z.object({
  params: z.object({
    id: z.uuid('Invalid role ID format'),
    permissionId: z.uuid('Invalid permission ID format'),
  }),
});