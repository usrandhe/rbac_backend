# RBAC Backend Summary -

## Project Overview
I have built a complete **Role-Based Access Control (RBAC)** backend system with:
- **Backend:** Express + TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT (Access + Refresh tokens)
- **Base URL:** `http://localhost:5000/api/v1`

---

## Database Schema

### Users Table
- id (UUID)
- email (unique)
- firstName, lastName
- avatarUrl
- emailVerified (boolean)
- isActive (boolean)
- passwordHash
- createdAt, updatedAt

### Roles Table
- id (UUID)
- name (unique) - e.g., 'super_admin', 'admin', 'manager', 'user'
- description
- createdAt, updatedAt

### Permissions Table
- id (UUID)
- name (unique) - format: 'resource:action' (e.g., 'users:create')
- resource (e.g., 'users', 'roles', 'permissions')
- action (e.g., 'create', 'read', 'update', 'delete')
- description
- createdAt, updatedAt

### Relationships
- Users ↔ Roles (Many-to-Many via UserRole table)
- Roles ↔ Permissions (Many-to-Many via RolePermission table)

---

## Seeded Test Data

### Test Accounts
| Email | Password | Role | Permissions |
|-------|----------|------|-------------|
| superadmin@rbac.com | SuperAdmin@123 | super_admin | ALL permissions |
| admin@rbac.com | Admin@123 | admin | All except permission management |
| manager@rbac.com | Manager@123 | manager | users:read, users:update, roles:read |
| user@rbac.com | User@123 | user | users:read, roles:read, permissions:read |

### Default Roles & Permissions
**Resources:** users, roles, permissions  
**Actions:** create, read, update, delete  
**Total Permissions:** 12 (3 resources × 4 actions)

---

## API Endpoints

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | Login user | No |
| POST | `/refresh-token` | Refresh access token | No |
| GET | `/profile` | Get current user profile | Yes |
| PATCH | `/profile` | Update profile | Yes |
| POST | `/change-password` | Change password | Yes |
| POST | `/logout` | Logout | Yes |

### Users (`/api/v1/users`)
| Method | Endpoint | Description | Permission Required |
|--------|----------|-------------|---------------------|
| GET | `/` | Get all users (paginated) | users:read |
| GET | `/:id` | Get user by ID | users:read or owner |
| POST | `/` | Create user | users:create |
| PATCH | `/:id` | Update user | users:update or owner |
| DELETE | `/:id` | Delete user | users:delete |
| POST | `/:id/roles` | Assign roles to user | users:update |
| DELETE | `/:id/roles/:roleId` | Remove role from user | users:update |
| GET | `/:id/permissions` | Get user permissions | users:read or owner |

### Roles (`/api/v1/roles`)
| Method | Endpoint | Description | Permission Required |
|--------|----------|-------------|---------------------|
| GET | `/` | Get all roles (paginated) | roles:read |
| GET | `/:id` | Get role by ID | roles:read |
| POST | `/` | Create role | roles:create |
| PATCH | `/:id` | Update role | roles:update |
| DELETE | `/:id` | Delete role | roles:delete |
| POST | `/:id/permissions` | Assign permissions to role | roles:update |
| POST | `/:id/permissions/add` | Add single permission | roles:update |
| DELETE | `/:id/permissions/:permissionId` | Remove permission | roles:update |

### Permissions (`/api/v1/permissions`)
| Method | Endpoint | Description | Permission Required |
|--------|----------|-------------|---------------------|
| GET | `/` | Get all permissions (paginated) | permissions:read |
| GET | `/grouped` | Get permissions grouped by resource | permissions:read |
| GET | `/:id` | Get permission by ID | permissions:read |
| POST | `/` | Create permission | permissions:create |
| PATCH | `/:id` | Update permission | permissions:update |
| DELETE | `/:id` | Delete permission | permissions:delete |
| GET | `/resources/:resource/actions` | Get resource actions | permissions:read |

---

## API Request/Response Examples

### Register
**Request:**
```json
POST /api/v1/auth/register
{
  "email": "test@example.com",
  "password": "Test@1234",
  "firstName": "Test",
  "lastName": "User"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid...",
      "email": "test@example.com",
      "firstName": "Test",
      "lastName": "User",
      "roles": [{"id": "...", "name": "user"}],
      "permissions": ["users:read", "roles:read", "permissions:read"]
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Login
**Request:**
```json
POST /api/v1/auth/login
{
  "email": "superadmin@rbac.com",
  "password": "SuperAdmin@123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid...",
      "email": "superadmin@rbac.com",
      "roles": [{"name": "super_admin"}],
      "permissions": ["users:create", "users:read", "users:update", "users:delete", ...]
    },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### Get Users (Paginated)
**Request:**
```
GET /api/v1/users?page=1&limit=10&sortBy=email&sortOrder=asc&search=admin
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    {
      "id": "uuid...",
      "email": "admin@rbac.com",
      "firstName": "John",
      "lastName": "Admin",
      "roles": [{"name": "admin"}],
      "permissions": ["users:create", "users:read", ...]
    }
  ],
  "meta": {
    "total": 4,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

## Authentication Flow

1. **User logs in** → Receives `accessToken` (7 days) and `refreshToken` (30 days)
2. **Frontend stores tokens** → Typically in memory or httpOnly cookies
3. **API requests** → Include `Authorization: Bearer {accessToken}` header
4. **Token expires** → Use refresh token to get new access token
5. **Logout** → Clear tokens from client

### JWT Payload Structure
```typescript
{
  userId: string;
  email: string;
  roles: string[];        // ['super_admin', 'admin']
  permissions: string[];  // ['users:create', 'users:read', ...]
}
```

---

## Authorization Rules

### Permission Format
`resource:action` (e.g., `users:create`, `roles:update`)

### Role Hierarchy & Permissions

**super_admin:**
- ALL permissions (users:*, roles:*, permissions:*)

**admin:**
- users:create, users:read, users:update, users:delete
- roles:create, roles:read, roles:update, roles:delete

**manager:**
- users:read, users:update
- roles:read

**user:**
- users:read, roles:read, permissions:read

---

## Error Responses

### Standard Error Format
```json
{
  "success": false,
  "message": "Error message here"
}
```

### Common HTTP Status Codes
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (not enough permissions)
- `404` - Not Found
- `409` - Conflict (duplicate email, etc.)
- `422` - Validation Error

### Example Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

---

## Pagination Query Parameters

All list endpoints support:
- `page` (default: 1)
- `limit` (default: 10, max: 100)
- `sortBy` (default: 'createdAt')
- `sortOrder` ('asc' | 'desc', default: 'desc')
- `search` (searches across relevant fields)

**Example:**
```
GET /api/v1/users?page=2&limit=20&sortBy=email&sortOrder=asc&search=john
```

---

