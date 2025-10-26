import { User } from '../redux/auth.slice'

export interface Role {
    id: string
    name: string
    description: string
    permissions: Permission[]
    isActive: boolean
    createdAt: string
    updatedAt: string
}

export interface Permission {
    id: string
    name: string
    resource: string
    action: string
    conditions?: PermissionCondition[]
    isActive: boolean
}

export interface PermissionCondition {
    field: string
    operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'contains' | 'starts_with' | 'ends_with'
    value: any
}

export interface UserRole {
    userId: string
    roleId: string
    assignedAt: string
    assignedBy: string
    expiresAt?: string
    isActive: boolean
}

export interface AuthorizationContext {
    user: User
    resource: string
    action: string
    data?: any
    metadata?: Record<string, any>
}

export interface AuthorizationResult {
    allowed: boolean
    reason?: string
    conditions?: PermissionCondition[]
    role?: string
    permission?: string
}

export interface AccessControlList {
    userId: string
    roles: Role[]
    permissions: Permission[]
    effectivePermissions: Permission[]
}

export class AuthAuthorization {
    private roles: Map<string, Role> = new Map()
    private permissions: Map<string, Permission> = new Map()
    private userRoles: Map<string, UserRole[]> = new Map()

    constructor() {
        this.initializeDefaultRoles()
        this.initializeDefaultPermissions()
    }

    /**
     * Check if user has permission
     */
    hasPermission(userId: string, resource: string, action: string, context?: any): AuthorizationResult {
        const userRoles = this.getUserRoles(userId)
        const effectivePermissions = this.getEffectivePermissions(userId)

        // Check direct permissions
        for (const permission of effectivePermissions) {
            if (this.matchesPermission(permission, resource, action, context)) {
                return {
                    allowed: true,
                    role: this.getRoleByPermission(permission.id),
                    permission: permission.name,
                }
            }
        }

        // Check role-based permissions
        for (const userRole of userRoles) {
            const role = this.roles.get(userRole.roleId)
            if (!role || !userRole.isActive) continue

            for (const permission of role.permissions) {
                if (this.matchesPermission(permission, resource, action, context)) {
                    return {
                        allowed: true,
                        role: role.name,
                        permission: permission.name,
                    }
                }
            }
        }

        return {
            allowed: false,
            reason: 'Insufficient permissions',
        }
    }

    /**
     * Check if user can access resource
     */
    canAccess(userId: string, resource: string, action: string, context?: any): boolean {
        return this.hasPermission(userId, resource, action, context).allowed
    }

    /**
     * Get user roles
     */
    getUserRoles(userId: string): UserRole[] {
        return this.userRoles.get(userId) || []
    }

    /**
     * Get effective permissions for user
     */
    getEffectivePermissions(userId: string): Permission[] {
        const userRoles = this.getUserRoles(userId)
        const permissions: Permission[] = []

        // Get permissions from roles
        for (const userRole of userRoles) {
            const role = this.roles.get(userRole.roleId)
            if (role && userRole.isActive) {
                permissions.push(...role.permissions.filter(p => p.isActive))
            }
        }

        // Remove duplicates
        const uniquePermissions = permissions.filter((permission, index, self) =>
            index === self.findIndex(p => p.id === permission.id)
        )

        return uniquePermissions
    }

    /**
     * Assign role to user
     */
    assignRole(userId: string, roleId: string, assignedBy: string, expiresAt?: string): boolean {
        const role = this.roles.get(roleId)
        if (!role || !role.isActive) return false

        const userRoles = this.getUserRoles(userId)

        // Check if role is already assigned
        if (userRoles.some(ur => ur.roleId === roleId && ur.isActive)) {
            return false
        }

        const userRole: UserRole = {
            userId,
            roleId,
            assignedAt: new Date().toISOString(),
            assignedBy,
            expiresAt,
            isActive: true,
        }

        userRoles.push(userRole)
        this.userRoles.set(userId, userRoles)

        return true
    }

    /**
     * Remove role from user
     */
    removeRole(userId: string, roleId: string): boolean {
        const userRoles = this.getUserRoles(userId)
        const roleIndex = userRoles.findIndex(ur => ur.roleId === roleId && ur.isActive)

        if (roleIndex === -1) return false

        userRoles[roleIndex].isActive = false
        this.userRoles.set(userId, userRoles)

        return true
    }

    /**
     * Create new role
     */
    createRole(roleData: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Role {
        const role: Role = {
            ...roleData,
            id: this.generateRoleId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }

        this.roles.set(role.id, role)
        return role
    }

    /**
     * Update role
     */
    updateRole(roleId: string, updates: Partial<Role>): boolean {
        const role = this.roles.get(roleId)
        if (!role) return false

        const updatedRole = {
            ...role,
            ...updates,
            updatedAt: new Date().toISOString(),
        }

        this.roles.set(roleId, updatedRole)
        return true
    }

    /**
     * Delete role
     */
    deleteRole(roleId: string): boolean {
        const role = this.roles.get(roleId)
        if (!role) return false

        // Check if role is assigned to any users
        const isAssigned = Array.from(this.userRoles.values())
            .some(userRoles => userRoles.some(ur => ur.roleId === roleId && ur.isActive))

        if (isAssigned) {
            return false // Cannot delete role that is assigned to users
        }

        this.roles.delete(roleId)
        return true
    }

    /**
     * Create new permission
     */
    createPermission(permissionData: Omit<Permission, 'id'>): Permission {
        const permission: Permission = {
            ...permissionData,
            id: this.generatePermissionId(),
        }

        this.permissions.set(permission.id, permission)
        return permission
    }

    /**
     * Add permission to role
     */
    addPermissionToRole(roleId: string, permissionId: string): boolean {
        const role = this.roles.get(roleId)
        const permission = this.permissions.get(permissionId)

        if (!role || !permission) return false

        // Check if permission is already in role
        if (role.permissions.some(p => p.id === permissionId)) {
            return false
        }

        role.permissions.push(permission)
        this.roles.set(roleId, role)
        return true
    }

    /**
     * Remove permission from role
     */
    removePermissionFromRole(roleId: string, permissionId: string): boolean {
        const role = this.roles.get(roleId)
        if (!role) return false

        const permissionIndex = role.permissions.findIndex(p => p.id === permissionId)
        if (permissionIndex === -1) return false

        role.permissions.splice(permissionIndex, 1)
        this.roles.set(roleId, role)
        return true
    }

    /**
     * Get all roles
     */
    getAllRoles(): Role[] {
        return Array.from(this.roles.values())
    }

    /**
     * Get all permissions
     */
    getAllPermissions(): Permission[] {
        return Array.from(this.permissions.values())
    }

    /**
     * Get role by ID
     */
    getRole(roleId: string): Role | null {
        return this.roles.get(roleId) || null
    }

    /**
     * Get permission by ID
     */
    getPermission(permissionId: string): Permission | null {
        return this.permissions.get(permissionId) || null
    }

    /**
     * Check if user has role
     */
    hasRole(userId: string, roleName: string): boolean {
        const userRoles = this.getUserRoles(userId)
        return userRoles.some(ur => {
            const role = this.roles.get(ur.roleId)
            return role && role.name === roleName && ur.isActive
        })
    }

    /**
     * Get user access control list
     */
    getUserACL(userId: string): AccessControlList {
        const userRoles = this.getUserRoles(userId)
        const roles = userRoles
            .filter(ur => ur.isActive)
            .map(ur => this.roles.get(ur.roleId))
            .filter(Boolean) as Role[]

        const permissions = this.getEffectivePermissions(userId)

        return {
            userId,
            roles,
            permissions,
            effectivePermissions: permissions,
        }
    }

    /**
     * Check resource access with conditions
     */
    checkResourceAccess(context: AuthorizationContext): AuthorizationResult {
        const { user, resource, action, data, metadata } = context

        // Check if user is authenticated
        if (!user) {
            return {
                allowed: false,
                reason: 'User not authenticated',
            }
        }

        // Check permissions
        const result = this.hasPermission(user.id, resource, action, { data, metadata })

        if (!result.allowed) {
            return result
        }

        // Check conditions if any
        if (result.conditions && data) {
            for (const condition of result.conditions) {
                if (!this.evaluateCondition(condition, data)) {
                    return {
                        allowed: false,
                        reason: 'Condition not met',
                        conditions: result.conditions,
                    }
                }
            }
        }

        return result
    }

    /**
     * Match permission with resource and action
     */
    private matchesPermission(permission: Permission, resource: string, action: string, context?: any): boolean {
        // Check if permission is active
        if (!permission.isActive) return false

        // Check resource match
        if (permission.resource !== resource && permission.resource !== '*') {
            return false
        }

        // Check action match
        if (permission.action !== action && permission.action !== '*') {
            return false
        }

        return true
    }

    /**
     * Get role by permission ID
     */
    private getRoleByPermission(permissionId: string): string | undefined {
        for (const role of this.roles.values()) {
            if (role.permissions.some(p => p.id === permissionId)) {
                return role.name
            }
        }
        return undefined
    }

    /**
     * Evaluate permission condition
     */
    private evaluateCondition(condition: PermissionCondition, data: any): boolean {
        const fieldValue = this.getNestedValue(data, condition.field)

        switch (condition.operator) {
            case 'equals':
                return fieldValue === condition.value
            case 'not_equals':
                return fieldValue !== condition.value
            case 'in':
                return Array.isArray(condition.value) && condition.value.includes(fieldValue)
            case 'not_in':
                return Array.isArray(condition.value) && !condition.value.includes(fieldValue)
            case 'contains':
                return String(fieldValue).includes(String(condition.value))
            case 'starts_with':
                return String(fieldValue).startsWith(String(condition.value))
            case 'ends_with':
                return String(fieldValue).endsWith(String(condition.value))
            default:
                return false
        }
    }

    /**
     * Get nested value from object
     */
    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => current?.[key], obj)
    }

    /**
     * Initialize default roles
     */
    private initializeDefaultRoles(): void {
        // Admin role
        const adminRole = this.createRole({
            name: 'admin',
            description: 'Full system access',
            permissions: [],
            isActive: true,
        })

        // User role
        const userRole = this.createRole({
            name: 'user',
            description: 'Standard user access',
            permissions: [],
            isActive: true,
        })

        // Guest role
        const guestRole = this.createRole({
            name: 'guest',
            description: 'Limited access for unauthenticated users',
            permissions: [],
            isActive: true,
        })

        // Add permissions to roles
        this.addDefaultPermissionsToRoles()
    }

    /**
     * Initialize default permissions
     */
    private initializeDefaultPermissions(): void {
        // User management permissions
        this.createPermission({
            name: 'user:read',
            resource: 'user',
            action: 'read',
            isActive: true,
        })

        this.createPermission({
            name: 'user:write',
            resource: 'user',
            action: 'write',
            isActive: true,
        })

        this.createPermission({
            name: 'user:delete',
            resource: 'user',
            action: 'delete',
            isActive: true,
        })

        // Product permissions
        this.createPermission({
            name: 'product:read',
            resource: 'product',
            action: 'read',
            isActive: true,
        })

        this.createPermission({
            name: 'product:write',
            resource: 'product',
            action: 'write',
            isActive: true,
        })

        // Order permissions
        this.createPermission({
            name: 'order:read',
            resource: 'order',
            action: 'read',
            isActive: true,
        })

        this.createPermission({
            name: 'order:write',
            resource: 'order',
            action: 'write',
            isActive: true,
        })

        // Cart permissions
        this.createPermission({
            name: 'cart:read',
            resource: 'cart',
            action: 'read',
            isActive: true,
        })

        this.createPermission({
            name: 'cart:write',
            resource: 'cart',
            action: 'write',
            isActive: true,
        })
    }

    /**
     * Add default permissions to roles
     */
    private addDefaultPermissionsToRoles(): void {
        const adminRole = Array.from(this.roles.values()).find(r => r.name === 'admin')
        const userRole = Array.from(this.roles.values()).find(r => r.name === 'user')
        const guestRole = Array.from(this.roles.values()).find(r => r.name === 'guest')

        if (adminRole) {
            // Admin gets all permissions
            const allPermissions = Array.from(this.permissions.values())
            adminRole.permissions = allPermissions
        }

        if (userRole) {
            // User gets basic permissions
            const userPermissions = this.permissions.get('user:read')
            const productPermissions = this.permissions.get('product:read')
            const orderPermissions = this.permissions.get('order:read')
            const cartPermissions = this.permissions.get('cart:read')

            if (userPermissions) userRole.permissions.push(userPermissions)
            if (productPermissions) userRole.permissions.push(productPermissions)
            if (orderPermissions) userRole.permissions.push(orderPermissions)
            if (cartPermissions) userRole.permissions.push(cartPermissions)
        }

        if (guestRole) {
            // Guest gets limited permissions
            const productPermissions = this.permissions.get('product:read')
            if (productPermissions) guestRole.permissions.push(productPermissions)
        }
    }

    /**
     * Generate role ID
     */
    private generateRoleId(): string {
        return `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    /**
     * Generate permission ID
     */
    private generatePermissionId(): string {
        return `perm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
}

export const authAuthorization = new AuthAuthorization()
export default authAuthorization
