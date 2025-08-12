export const testUsers = {
  admin: {
    email: 'admin@test.com',
    fullName: 'Test Admin',
    password: 'password123',
  },
  owner: {
    email: 'owner@test.com',
    fullName: 'Workspace Owner',
    password: 'password123',
  },
  member: {
    email: 'member@test.com',
    fullName: 'Team Member',
    password: 'password123',
  },
  viewer: {
    email: 'viewer@test.com',
    fullName: 'Read Only User',
    password: 'password123',
  },
}

export const testCompanies = {
  primary: {
    name: 'Primary Company',
    code: 'PRIMARY',
    description: 'Main testing company',
    email: 'info@primary.com',
    industry: 'Technology',
    size: 'medium' as const,
  },
  secondary: {
    name: 'Secondary Company',
    code: 'SECONDARY',
    description: 'Secondary testing company',
    email: 'info@secondary.com',
    industry: 'Finance',
    size: 'small' as const,
  },
  subsidiary: {
    name: 'Subsidiary Company',
    code: 'SUB',
    description: 'Subsidiary for testing hierarchy',
    email: 'info@subsidiary.com',
    industry: 'Manufacturing',
    size: 'large' as const,
  },
}

export const testPlans = {
  micro: {
    name: 'Micro',
    description: 'Basic plan for testing',
    pricePerUserPerMonth: 25,
    maxUsers: 5,
    maxCompanies: 3,
    features: ['1 to 5 users', 'Up to 3 companies', 'Basic features', 'Email support'],
    badge: 'Starter',
  },
  small: {
    name: 'Small',
    description: 'Small business plan for testing',
    pricePerUserPerMonth: 50,
    maxUsers: 49,
    maxCompanies: 5,
    features: ['6 to 49 users', 'Up to 5 companies', 'Advanced features', 'Priority support'],
    badge: 'Popular',
  },
  unlimited: {
    name: 'Enterprise',
    description: 'Unlimited plan for testing',
    pricePerUserPerMonth: 100,
    maxUsers: null,
    maxCompanies: null,
    features: ['Unlimited users', 'Unlimited companies', 'All features', '24/7 support'],
    badge: 'Enterprise',
  },
}

export const testTenants = {
  basic: {
    name: 'Test Workspace',
    subdomain: 'test-workspace',
    billingEmail: 'billing@test.com',
  },
  premium: {
    name: 'Premium Workspace',
    subdomain: 'premium-workspace',
    billingEmail: 'billing@premium.com',
  },
}

export const testInvitations = {
  pending: {
    email: 'pending@test.com',
    fullName: 'Pending User',
    role: 'member',
  },
  expired: {
    email: 'expired@test.com',
    fullName: 'Expired Invitation',
    role: 'viewer',
  },
}

export const testPermissions = [
  { name: 'users.create', resource: 'users', action: 'create', description: 'Create users' },
  { name: 'users.read', resource: 'users', action: 'read', description: 'View users' },
  { name: 'users.update', resource: 'users', action: 'update', description: 'Update users' },
  { name: 'users.delete', resource: 'users', action: 'delete', description: 'Delete users' },
  {
    name: 'companies.create',
    resource: 'companies',
    action: 'create',
    description: 'Create companies',
  },
  { name: 'companies.read', resource: 'companies', action: 'read', description: 'View companies' },
  {
    name: 'companies.update',
    resource: 'companies',
    action: 'update',
    description: 'Update companies',
  },
  {
    name: 'companies.delete',
    resource: 'companies',
    action: 'delete',
    description: 'Delete companies',
  },
]

export const testRoles = [
  {
    name: 'Admin',
    description: 'Full access to workspace',
    permissions: ['users.*', 'companies.*'],
  },
  {
    name: 'Manager',
    description: 'Manage teams and projects',
    permissions: ['users.read', 'companies.*'],
  },
  {
    name: 'Member',
    description: 'Standard team member',
    permissions: ['users.read', 'companies.read'],
  },
  { name: 'Viewer', description: 'Read-only access', permissions: ['*.read'] },
]
