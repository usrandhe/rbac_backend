import { z } from 'zod';

export const registerSchema = z.object({
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
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: z
            .string({
                error: 'Email is required',
            })
            .email('Invalid email format'),
        password: z.string({
            error: 'Password is required',
        }),
    }),
});

export const refreshTokenSchema = z.object({
    body: z.object({
        refreshToken: z.string({
            error: 'Refresh token is required',
        }),
    }),
});

export const updateProfileSchema = z.object({
    body: z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        avatarUrl: z.string().url('Invalid URL format').optional(),
    }),
});

export const changePasswordSchema = z.object({
    body: z.object({
        currentPassword: z.string({
            error: 'Current password is required',
        }),
        newPassword: z
            .string({
                error: 'New password is required',
            })
            .min(8, 'New password must be at least 8 characters'),
    }),
});