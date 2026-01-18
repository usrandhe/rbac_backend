import prisma from '../lib/prisma';
import { PasswordUtils } from '../utils/password';
import { JwtUtils } from '../utils/jwt';
import { BadRequestError, UnauthorizedError, ConflictError, NotFoundError } from '../utils/errors';
import { JwtPayload, UserWithRoles } from '../types';

export class AuthService {
    static async register(data: { email: string, password: string, firstName?: string, lastName?: string }) {
        //check existing user
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email }
        });

        if (existingUser) {
            throw new ConflictError('User already exists');
        }

        // password strength check
        const passwordValidation = PasswordUtils.validateStrength(data.password);
        if (!passwordValidation.isValid) {
            throw new BadRequestError(passwordValidation.errors.join(', '));
        }

        const hashedPassword = await PasswordUtils.hashPassword(data.password);

        // get default user role
        const userRole = await prisma.role.findUnique({
            where: { name: 'user' }
        });

        if (!userRole) {
            throw new Error('Default user role not found');
        }

        const user = await prisma.user.create({
            data: {
                email: data.email,
                passwordHash: hashedPassword,
                firstName: data.firstName,
                lastName: data.lastName,
                userRoles: {
                    create: {
                        roleId: userRole.id
                    },
                },
            },
            include: {
                userRoles: {
                    include: {
                        role: {
                            include: {
                                rolePermissions: {
                                    include: {
                                        permission: true
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        const tokens = await this.generateTokensForUser(user.id);

        return {
            user: this.sanitizeUser(user),
            ...tokens
        };
    }

    static async login(email: string, password: string) {

        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                userRoles: {
                    include: {
                        role: {
                            include: {
                                rolePermissions: {
                                    include: {
                                        permission: true
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!user) {
            throw new UnauthorizedError('Invalid credentials');
        }

        if (!user.isActive) {
            throw new UnauthorizedError('Account is deactivated');
        }

        const isPasswordValid = await PasswordUtils.comparePassword(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedError('Invalid credentials');
        }

        const tokens = await this.generateTokensForUser(user.id);

        return {
            user: this.sanitizeUser(user),
            ...tokens
        };
    }

    static async refreshToken(refreshToken: string) {
        const decoded = JwtUtils.verifyRefreshToken(refreshToken);

        if (!decoded) {
            throw new UnauthorizedError('Invalid refresh token');
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: {
                userRoles: {
                    include: {
                        role: {
                            include: {
                                rolePermissions: {
                                    include: {
                                        permission: true
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!user || !user.isActive) {
            throw new UnauthorizedError('Invalid refresh token');
        }

        const tokens = await this.generateTokensForUser(user.id);

        return {
            user: this.sanitizeUser(user),
            ...tokens
        };
    }

    static async getProfile(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                userRoles: {
                    include: {
                        role: {
                            include: {
                                rolePermissions: {
                                    include: {
                                        permission: true
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

        return this.sanitizeUser(user);
    }

    static async updateProfile(
        userId: string,
        data: {
            firstName?: string,
            lastName?: string
            avatarUrl?: string
        }
    ) {
        const user = await prisma.user.update({
            where: { id: userId },
            data,
            include: {
                userRoles: {
                    include: {
                        role: true
                    },
                },
            },
        });

        return this.sanitizeUser(user);
    }

    static async changePassword(
        userId: string,
        currentPassword: string,
        newPassword: string
    ) {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            throw new NotFoundError('User not found');
        }

        const isPasswordValid = await PasswordUtils.comparePassword(
            currentPassword,
            user.passwordHash
        );
        if (!isPasswordValid) {
            throw new UnauthorizedError('Invalid current password');
        }

        const passwordValidation = PasswordUtils.validateStrength(newPassword);
        if (!passwordValidation.isValid) {
            throw new BadRequestError(passwordValidation.errors.join(', '));
        }

        const hashedPassword = await PasswordUtils.hashPassword(newPassword);

        await prisma.user.update({
            where: { id: userId },
            data: {
                passwordHash: hashedPassword
            }
        });

        return {
            message: 'Password changed successfully'
        };
    }

    private static async generateTokensForUser(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                userRoles: {
                    include: {
                        role: {
                            include: {
                                rolePermissions: {
                                    include: {
                                        permission: true
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

        const roles = user.userRoles.map((ur) => ur.role.name);

        const permissionsSet = new Set<string>();

        user.userRoles.forEach((ur) => {
            ur.role.rolePermissions.forEach((rp) => {
                permissionsSet.add(rp.permission.name);
            });
        });

        const permissions = Array.from(permissionsSet);

        const payload: JwtPayload = {
            userId: user.id,
            email: user.email,
            roles,
            permissions
        };

        return JwtUtils.generateTokenPair(payload);
    }

    private static sanitizeUser(user: any) {
        const { passwordHash, ...sanitizedUser } = user;

        const roles = user.userRoles?.map((ur: any) => ({
            id: ur.role.id,
            name: ur.role.name,
            description: ur.role.description
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
            roles,
            permissions
        };

    }
}
