import { z } from 'zod';

export const getPermissionsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    search: z.string().optional(),
  }),
});

export const getPermissionByIdSchema = z.object({
  params: z.object({
    id: z.uuid('Invalid permission ID format'),
  }),
});

export const createPermissionSchema = z.object({
  body: z.object({
    resource: z
      .string({
        error: 'Resource is required',
      })
      .regex(
        /^[a-z_]+$/,
        'Resource must be lowercase and can only contain letters and underscores'
      ),
    action: z
      .string({
        error: 'Action is required',
      })
      .regex(
        /^[a-z_]+$/,
        'Action must be lowercase and can only contain letters and underscores'
      ),
    description: z.string().optional(),
  }),
});

export const updatePermissionSchema = z.object({
  params: z.object({
    id: z.uuid('Invalid permission ID format'),
  }),
  body: z.object({
    resource: z
      .string()
      .regex(
        /^[a-z_]+$/,
        'Resource must be lowercase and can only contain letters and underscores'
      )
      .optional(),
    action: z
      .string()
      .regex(
        /^[a-z_]+$/,
        'Action must be lowercase and can only contain letters and underscores'
      )
      .optional(),
    description: z.string().optional(),
  }),
});

export const deletePermissionSchema = z.object({
  params: z.object({
    id: z.uuid('Invalid permission ID format'),
  }),
});

export const getResourceActionsSchema = z.object({
  params: z.object({
    resource: z.string(),
  }),
});