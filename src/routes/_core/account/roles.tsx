import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { createFileRoute } from '@tanstack/react-router'
import { ChevronDown, ChevronRight, Key, Shield } from 'lucide-react'
import { useEffect, useState } from 'react'


export const Route = createFileRoute('/_core/account/roles')({
  component: RolesSettings,
})

interface Permission {
  id: string
  name: string
  title?: string
  description?: string
  auto_discovered?: boolean
}

interface Role {
  id: string
  name: string
  guard_name: string
  created_at: string
  permissions?: Permission[]
}

function RolesSettings() {
  const [openRoles, setOpenRoles] = useState<Record<number, boolean>>({})
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const toggleRole = (roleId: number) => {
    setOpenRoles(prev => ({
      ...prev,
      [roleId]: !prev[roleId],
    }))
  }

  useEffect(() => {
    // Load roles data
    const loadRoles = async () => {
      try {
        setIsLoading(true)

        // Use core RBAC API for core admin users
        const response = await fetch('/api/rbac/roles')
        if (!response.ok) {
          throw new Error('Failed to load roles')
        }

        const result = await response.json()
        if (result.success) {
          setRoles(result.data)
        } else {
          // Fallback to demo data
          setRoles([
            {
              id: '1',
              name: 'Administrator',
              guard_name: 'web',
              created_at: new Date().toISOString(),
              permissions: [
                {
                  id: '1',
                  name: 'users.create',
                  title: 'Create Users',
                  description: 'Create new user accounts',
                  auto_discovered: true,
                },
                {
                  id: '2',
                  name: 'users.read',
                  title: 'View Users',
                  description: 'View user accounts',
                  auto_discovered: true,
                },
                {
                  id: '3',
                  name: 'users.update',
                  title: 'Update Users',
                  description: 'Update user accounts',
                  auto_discovered: true,
                },
                {
                  id: '4',
                  name: 'users.delete',
                  title: 'Delete Users',
                  description: 'Delete user accounts',
                  auto_discovered: true,
                },
              ],
            },
            {
              id: '2',
              name: 'Editor',
              guard_name: 'web',
              created_at: new Date().toISOString(),
              permissions: [
                {
                  id: '2',
                  name: 'users.read',
                  title: 'View Users',
                  description: 'View user accounts',
                  auto_discovered: true,
                },
                {
                  id: '3',
                  name: 'users.update',
                  title: 'Update Users',
                  description: 'Update user accounts',
                  auto_discovered: true,
                },
              ],
            },
            {
              id: '3',
              name: 'Viewer',
              guard_name: 'web',
              created_at: new Date().toISOString(),
              permissions: [
                {
                  id: '2',
                  name: 'users.read',
                  title: 'View Users',
                  description: 'View user accounts',
                  auto_discovered: true,
                },
              ],
            },
          ])
        }
      } catch (error) {
        console.error('Error loading roles:', error)
        // Set demo data as fallback
        setRoles([
          {
            id: '1',
            name: 'Administrator',
            guard_name: 'web',
            created_at: new Date().toISOString(),
            permissions: [
              {
                id: '1',
                name: 'users.create',
                title: 'Create Users',
                description: 'Create new user accounts',
                auto_discovered: true,
              },
            ],
          },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    loadRoles()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Roles & Permissions</h2>
          <p className="text-muted-foreground">View all roles and their assigned permissions</p>
        </div>
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Roles & Permissions</h2>
        <p className="text-muted-foreground">View all roles and their assigned permissions</p>
      </div>

      <div className="space-y-8">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-medium">
            <Shield className="h-5 w-5" />
            System Roles
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Expand each role to view its assigned permissions
          </p>

          <div className="mt-6 space-y-2">
            {roles.map((role, index) => (
              <Collapsible
                key={role.id}
                open={openRoles[index] || false}
                onOpenChange={() => toggleRole(index)}
              >
                <CollapsibleTrigger asChild>
                  <div className="flex w-full cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      {openRoles[index] || false ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <h4 className="font-medium">{role.name}</h4>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {role.guard_name}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {role.permissions?.length || 0} permissions
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Created {new Date(role.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4">
                    {role.permissions && role.permissions.length > 0 ? (
                      <div className="mt-4 space-y-4">
                        {Object.entries(
                          role.permissions.reduce(
                            (acc, permission) => {
                              const parts = permission.name.split('.')
                              const controller = parts[0]
                              const key = controller.charAt(0).toUpperCase() + controller.slice(1)

                              if (!acc[key]) {
                                acc[key] = []
                              }
                              acc[key].push(permission)
                              return acc
                            },
                            {} as Record<string, typeof role.permissions>
                          )
                        ).map(([controller, perms]) => (
                          <div key={controller} className="space-y-2">
                            <h5 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                              <Key className="h-3 w-3" />
                              {controller} ({perms?.length || 0})
                            </h5>
                            <ul className="ml-5 space-y-2">
                              {perms?.map(permission => (
                                <li
                                  key={permission.id}
                                  className="flex items-start justify-between"
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm font-medium">
                                      {permission.title || permission.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {permission.name}
                                    </div>
                                    {permission.description && (
                                      <div className="mt-1 text-xs text-muted-foreground">
                                        {permission.description}
                                      </div>
                                    )}
                                  </div>
                                  <Badge
                                    variant={permission.auto_discovered ? 'default' : 'secondary'}
                                    className="ml-3 flex-shrink-0 text-xs"
                                  >
                                    {permission.auto_discovered ? 'Auto' : 'Manual'}
                                  </Badge>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 text-center text-muted-foreground">
                        No permissions assigned to this role
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
