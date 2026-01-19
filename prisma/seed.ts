import * as bcrypt from 'bcryptjs';
import prisma from './../src/lib/prisma';

async function main() {
  console.log('Starting database seeding...');

  // 1. Create Roles
  console.log('Creating roles...');
  
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'super_admin' },
    update: {},
    create: {
      name: 'super_admin',
      description: 'Super Administrator with full system access',
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Administrator with elevated privileges',
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: 'manager' },
    update: {},
    create: {
      name: 'manager',
      description: 'Manager with moderate privileges',
    },
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: {
      name: 'user',
      description: 'Standard user with basic privileges',
    },
  });

  console.log('Roles created');

  // 2. Create Permissions
  console.log('Creating permissions...');

  const resources = ['users', 'roles', 'permissions'];
  const actions = ['create', 'read', 'update', 'delete'];

  const permissions = [];

  for (const resource of resources) {
    for (const action of actions) {
      const permission = await prisma.permission.upsert({
        where: { name: `${resource}:${action}` },
        update: {},
        create: {
          name: `${resource}:${action}`,
          resource,
          action,
          description: `${action.charAt(0).toUpperCase() + action.slice(1)} ${resource}`,
        },
      });
      permissions.push(permission);
    }
  }

  console.log(`${permissions.length} permissions created`);

  // 3. Assign Permissions to Roles
  console.log('Assigning permissions to roles...');

  // Super Admin gets ALL permissions
  const allPermissions = await prisma.permission.findMany();
  
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Admin gets most permissions (except permission management)
  const adminPermissions = allPermissions.filter(
    (p) => p.resource !== 'permissions'
  );

  for (const permission of adminPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Manager gets read/update for users, read-only for roles
  const managerPermissions = allPermissions.filter(
    (p) =>
      (p.resource === 'users' && ['read', 'update'].includes(p.action)) ||
      (p.resource === 'roles' && p.action === 'read')
  );

  for (const permission of managerPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: managerRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: managerRole.id,
        permissionId: permission.id,
      },
    });
  }

  // User gets only read permissions
  const userPermissions = allPermissions.filter((p) => p.action === 'read');

  for (const permission of userPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: userRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: userRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log('Permissions assigned to roles');

  // 4. Create Super Admin User
  console.log('Creating super admin user...');

  const hashedPassword = await bcrypt.hash('SuperAdmin@123', 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@rbac.com' },
    update: {},
    create: {
      email: 'superadmin@rbac.com',
      passwordHash: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      emailVerified: true,
      isActive: true,
    },
  });

  // Assign Super Admin Role
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: superAdmin.id,
        roleId: superAdminRole.id,
      },
    },
    update: {},
    create: {
      userId: superAdmin.id,
      roleId: superAdminRole.id,
      assignedBy: superAdmin.id, // Self-assigned
    },
  });

  console.log('Super admin user created');

  // 5. Create Sample Users for Testing
  console.log('Creating sample users...');

  // Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@rbac.com' },
    update: {},
    create: {
      email: 'admin@rbac.com',
      passwordHash: await bcrypt.hash('Admin@123', 10),
      firstName: 'John',
      lastName: 'Admin',
      emailVerified: true,
      isActive: true,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
      assignedBy: superAdmin.id,
    },
  });

  // Manager User
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@rbac.com' },
    update: {},
    create: {
      email: 'manager@rbac.com',
      passwordHash: await bcrypt.hash('Manager@123', 10),
      firstName: 'Jane',
      lastName: 'Manager',
      emailVerified: true,
      isActive: true,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: managerUser.id,
        roleId: managerRole.id,
      },
    },
    update: {},
    create: {
      userId: managerUser.id,
      roleId: managerRole.id,
      assignedBy: superAdmin.id,
    },
  });

  // Regular User
  const regularUser = await prisma.user.upsert({
    where: { email: 'user@rbac.com' },
    update: {},
    create: {
      email: 'user@rbac.com',
      passwordHash: await bcrypt.hash('User@123', 10),
      firstName: 'Bob',
      lastName: 'User',
      emailVerified: true,
      isActive: true,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: regularUser.id,
        roleId: userRole.id,
      },
    },
    update: {},
    create: {
      userId: regularUser.id,
      roleId: userRole.id,
      assignedBy: superAdmin.id,
    },
  });

  console.log('Sample users created');

  // Summary
  console.log('\n Seeding completed successfully!\n');
  console.log('Summary:');
  console.log('─────────────────────────────────');
  console.log(`✓ Roles: 4 (super_admin, admin, manager, user)`);
  console.log(`✓ Permissions: ${permissions.length}`);
  console.log(`✓ Users: 4`);
  console.log('─────────────────────────────────');
  console.log('\n Test Credentials:');
  console.log('─────────────────────────────────');
  console.log('Super Admin:');
  console.log('  Email: superadmin@rbac.com');
  console.log('  Password: SuperAdmin@123');
  console.log('\nAdmin:');
  console.log('  Email: admin@rbac.com');
  console.log('  Password: Admin@123');
  console.log('\nManager:');
  console.log('  Email: manager@rbac.com');
  console.log('  Password: Manager@123');
  console.log('\nUser:');
  console.log('  Email: user@rbac.com');
  console.log('  Password: User@123');
  console.log('─────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });