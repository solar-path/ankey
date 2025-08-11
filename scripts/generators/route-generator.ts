import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import type { CrudOptions, Field } from '../make-crud'

export class RouteGenerator {
  private options: CrudOptions

  constructor(options: CrudOptions) {
    this.options = options
  }

  async generate() {
    const routesDir = this.getRoutesDirectory()
    mkdirSync(routesDir, { recursive: true })

    // Generate layout route with navigation
    await this.generateLayoutRoute()

    // Generate index route (redirect to first sub-route)
    await this.generateIndexRoute()

    // Generate main list route
    await this.generateListRoute()

    // Generate individual item route if needed
    await this.generateItemRoute()
  }

  private getRoutesDirectory(): string {
    const prefix = this.options.schema === 'core' ? '_core' : '_tenant'
    const modelPath = this.camelToKebab(this.pluralize(this.options.name))
    return `src/routes/${prefix}/${modelPath}`
  }

  private async generateLayoutRoute() {
    const routePath = `${this.getRoutesDirectory()}/route.tsx`
    const content = this.generateLayoutRouteContent()

    mkdirSync(dirname(routePath), { recursive: true })
    writeFileSync(routePath, content)
  }

  private async generateIndexRoute() {
    const routePath = `${this.getRoutesDirectory()}/index.tsx`
    const content = this.generateIndexRouteContent()

    mkdirSync(dirname(routePath), { recursive: true })
    writeFileSync(routePath, content)
  }

  private async generateListRoute() {
    const routePath = `${this.getRoutesDirectory()}/list.tsx`
    const content = this.generateListRouteContent()

    mkdirSync(dirname(routePath), { recursive: true })
    writeFileSync(routePath, content)
  }

  private async generateItemRoute() {
    const routePath = `${this.getRoutesDirectory()}/$id.tsx`
    const content = this.generateItemRouteContent()

    writeFileSync(routePath, content)
  }

  private generateLayoutRouteContent(): string {
    const modelName = this.options.name
    const pluralModelName = this.pluralize(modelName)
    const modelPath = this.camelToKebab(pluralModelName)
    const routePath = this.getRoutePattern()

    return `import { SiteHeader } from '@/components/QSideBar/site-header'
import { cn } from '@/lib/utils'
import { type BreadcrumbItem } from '@/shared'
import { createFileRoute, Link, Outlet, useLocation } from '@tanstack/react-router'
import { List, Plus, Eye, Settings } from 'lucide-react'
import { createContext, useContext } from 'react'

// Create context for breadcrumbs
export const BreadcrumbContext = createContext<BreadcrumbItem[]>([])
export const useBreadcrumbs = () => useContext(BreadcrumbContext)

export const Route = createFileRoute('${routePath}')({
  component: ${pluralModelName}Layout,
})

const ${modelPath}Navigation = [
  {
    name: '${pluralModelName}',
    href: '${routePath}/list',
    icon: List,
    description: 'Manage your ${pluralModelName.toLowerCase()}',
  },
  {
    name: 'Create ${modelName}',
    href: '${routePath}/create',
    icon: Plus,
    description: 'Create a new ${modelName.toLowerCase()}',
  },
]

function ${pluralModelName}Layout() {
  const location = useLocation()
  const currentPath = location.pathname

  // Determine breadcrumbs based on current path
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const path = currentPath.split('/').filter(Boolean)
    const lastSegment = path[path.length - 1]

    const breadcrumbMap: Record<string, string> = {
      'list': '${pluralModelName}',
      'create': 'Create ${modelName}',
      '${modelPath}': '${pluralModelName}'
    }

    const breadcrumbs: BreadcrumbItem[] = [
      { title: '${pluralModelName}', href: '${routePath}' }
    ]

    if (lastSegment && lastSegment !== '${modelPath}' && breadcrumbMap[lastSegment]) {
      breadcrumbs.push({
        title: breadcrumbMap[lastSegment],
        href: currentPath
      })
    }

    return breadcrumbs
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Site Header with breadcrumbs */}
      <SiteHeader breadcrumbs={getBreadcrumbs()}/>

      <div className="flex h-full flex-1">
        {/* Navigation */}
        <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-6">
          <nav className="space-y-2">
            {${modelPath}Navigation.map(item => {
              const isActive =
                currentPath === item.href ||
                (currentPath === '${routePath}' && item.href === '${routePath}/list')

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-start p-3 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                  )}
                >
                  <item.icon
                    className={cn(
                      'h-5 w-5 mr-3 mt-0.5 flex-shrink-0',
                      isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                    )}
                  />
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div
                      className={cn('text-xs mt-1', isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400')}
                    >
                      {item.description}
                    </div>
                  </div>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
`
  }

  private generateIndexRouteContent(): string {
    const routePath = this.getRoutePattern()

    return `import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('${routePath}/')({ 
  beforeLoad: () => {
    throw redirect({ to: '${routePath}/list' })
  },
})
`
  }

  private generateListRouteContent(): string {
    const modelName = this.options.name
    const pluralModelName = this.pluralize(modelName)
    const rpcPath = this.options.schema === 'core' ? 'core' : 'tenant'
    const modelPath = this.camelToKebab(pluralModelName)
    const componentName = `${pluralModelName}Page`
    const routePath = this.getRoutePattern()

    return `import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { client } from '@/lib/rpc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  RotateCcw,
  Download,
  Upload,
  Filter
} from 'lucide-react'
import { toast } from 'sonner'

${this.generateFormSchema()}

// Search params schema
const searchSchema = z.object({
  page: z.coerce.number().min(1).catch(1),
  limit: z.coerce.number().min(1).max(100).catch(10),
  search: z.string().catch(''),
  sortBy: z.string().catch('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).catch('desc'),
  view: z.enum(['active', 'trashed', 'all']).catch('active')
})

export const Route = createFileRoute('${routePath}/list')({
  component: ${componentName},
  validateSearch: searchSchema
})

interface ${modelName}Item {
  id: string
${this.generateTypeFields()}
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

function ${componentName}() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<${modelName}Item | null>(null)
  
  // Form for creating/editing
  const form = useForm<z.infer<typeof ${modelName.toLowerCase()}FormSchema>>({
    resolver: zodResolver(${modelName.toLowerCase()}FormSchema),
    defaultValues: {
${this.generateDefaultFormValues()}
    }
  })

  // Fetch ${pluralModelName.toLowerCase()}
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['${pluralModelName.toLowerCase()}', search],
    queryFn: async () => {
      const response = await client.${rpcPath}.${modelPath}.$get({
        query: {
          page: search.page.toString(),
          limit: search.limit.toString(),
          search: search.search,
          sortBy: search.sortBy,
          sortOrder: search.sortOrder,
          view: search.view
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch ${pluralModelName.toLowerCase()}')
      return await response.json()
    }
  })

  // Handle search
  const handleSearch = (newSearch: string) => {
    navigate({
      search: { ...search, search: newSearch, page: 1 }
    })
  }

  // Handle view change
  const handleViewChange = (newView: 'active' | 'trashed' | 'all') => {
    navigate({
      search: { ...search, view: newView, page: 1 }
    })
  }

  // Handle sort change
  const handleSort = (sortBy: string) => {
    const sortOrder = search.sortBy === sortBy && search.sortOrder === 'asc' ? 'desc' : 'asc'
    navigate({
      search: { ...search, sortBy, sortOrder }
    })
  }

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    navigate({
      search: { ...search, page: newPage }
    })
  }

  // Create ${modelName.toLowerCase()}
  const handleCreate = async (data: z.infer<typeof ${modelName.toLowerCase()}FormSchema>) => {
    try {
      const response = await client.${rpcPath}.${modelPath}.$post({
        json: data
      })
      
      if (!response.ok) throw new Error('Failed to create ${modelName.toLowerCase()}')
      
      toast.success('${modelName} created successfully')
      setIsCreateDialogOpen(false)
      form.reset()
      refetch()
    } catch (error) {
      toast.error('Failed to create ${modelName.toLowerCase()}')
      console.error(error)
    }
  }

  // Update ${modelName.toLowerCase()}
  const handleUpdate = async (data: z.infer<typeof ${modelName.toLowerCase()}FormSchema>) => {
    if (!editingItem) return
    
    try {
      const response = await client.${rpcPath}.${modelPath}[':id'].$patch({
        param: { id: editingItem.id },
        json: data
      })
      
      if (!response.ok) throw new Error('Failed to update ${modelName.toLowerCase()}')
      
      toast.success('${modelName} updated successfully')
      setEditingItem(null)
      form.reset()
      refetch()
    } catch (error) {
      toast.error('Failed to update ${modelName.toLowerCase()}')
      console.error(error)
    }
  }

  // Delete ${modelName.toLowerCase()}
  const handleDelete = async (id: string) => {
    try {
      const response = await client.${rpcPath}.${modelPath}[':id'].$delete({
        param: { id }
      })
      
      if (!response.ok) throw new Error('Failed to delete ${modelName.toLowerCase()}')
      
      toast.success('${modelName} deleted successfully')
      refetch()
    } catch (error) {
      toast.error('Failed to delete ${modelName.toLowerCase()}')
      console.error(error)
    }
  }

  // Restore ${modelName.toLowerCase()}
  const handleRestore = async (id: string) => {
    try {
      const response = await client.${rpcPath}.${modelPath}[':id'].restore.$patch({
        param: { id }
      })
      
      if (!response.ok) throw new Error('Failed to restore ${modelName.toLowerCase()}')
      
      toast.success('${modelName} restored successfully')
      refetch()
    } catch (error) {
      toast.error('Failed to restore ${modelName.toLowerCase()}')
      console.error(error)
    }
  }

  // Open edit dialog
  const openEditDialog = (item: ${modelName}Item) => {
    setEditingItem(item)
    form.reset({
${this.generateEditFormData()}
    })
  }

  if (error) {
    return <div className="p-4 text-red-600">Error loading ${pluralModelName.toLowerCase()}: {error.message}</div>
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">${pluralModelName}</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create ${modelName}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <Input
            placeholder="Search ${pluralModelName.toLowerCase()}..."
            value={search.search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <Select value={search.view} onValueChange={handleViewChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trashed">Trashed</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                onClick={() => handleSort('title')}
              >
                Title {search.sortBy === 'title' && (search.sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
${this.generateTableHeaders()}
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                onClick={() => handleSort('createdAt')}
              >
                Created {search.sortBy === 'createdAt' && (search.sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300">Status</TableHead>
              <TableHead className="w-[70px] text-gray-700 dark:text-gray-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-600 dark:text-gray-400">Loading...</TableCell>
              </TableRow>
            ) : data?.data?.items?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-600 dark:text-gray-400">No ${pluralModelName.toLowerCase()} found</TableCell>
              </TableRow>
            ) : (
              data?.data?.items?.map((item: ${modelName}Item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-gray-900 dark:text-gray-100">{item.title}</TableCell>
${this.generateTableCells()}
                  <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={item.deletedAt ? 'destructive' : 'default'}>
                      {item.deletedAt ? 'Deleted' : 'Active'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!item.deletedAt ? (
                          <>
                            <DropdownMenuItem onClick={() => openEditDialog(item)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(item.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem onClick={() => handleRestore(item.id)}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Restore
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data?.data?.pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {((search.page - 1) * search.limit) + 1} to{' '}
            {Math.min(search.page * search.limit, data.data.pagination.total)} of{' '}
            {data.data.pagination.total} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(search.page - 1)}
              disabled={search.page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(search.page + 1)}
              disabled={search.page >= data.data.pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create ${modelName}</DialogTitle>
            <DialogDescription>
              Add a new ${modelName.toLowerCase()} to your collection.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
${this.generateReactHookFormFields()}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit ${modelName}</DialogTitle>
            <DialogDescription>
              Make changes to the ${modelName.toLowerCase()} here.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-4">
${this.generateReactHookFormFields()}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingItem(null)}>
                  Cancel
                </Button>
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}`
  }

  private generateItemRouteContent(): string {
    const modelName = this.options.name
    const pluralModelName = this.pluralize(modelName)
    const rpcPath = this.options.schema === 'core' ? 'core' : 'tenant'
    const modelPath = this.camelToKebab(pluralModelName)
    const routePath = this.getRoutePattern()

    return `import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { client } from '@/lib/rpc'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit } from 'lucide-react'

export const Route = createFileRoute('${routePath}/$id')({
  component: ${modelName}Detail
})

interface ${modelName}Item {
  id: string
${this.generateTypeFields()}
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

function ${modelName}Detail() {
  const { id } = Route.useParams()
  const navigate = Route.useNavigate()
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['${modelName.toLowerCase()}', id],
    queryFn: async () => {
      const response = await client.${rpcPath}.${modelPath}[':id'].$get({
        param: { id }
      })
      if (!response.ok) throw new Error('Failed to fetch ${modelName.toLowerCase()}')
      return await response.json()
    }
  })

  const item: ${modelName}Item = data?.data

  if (isLoading) {
    return <div className="p-4 text-gray-600 dark:text-gray-400">Loading...</div>
  }

  if (error || !item) {
    return <div className="p-4 text-red-600 dark:text-red-400">Error loading ${modelName.toLowerCase()}</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate({ to: '${routePath}/list' })}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{item.title}</h1>
        <Badge variant={item.deletedAt ? 'destructive' : 'default'}>
          {item.deletedAt ? 'Deleted' : 'Active'}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>${modelName} Details</CardTitle>
          <CardDescription>
            Created on {new Date(item.createdAt).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
${this.generateDetailFields()}
        </CardContent>
      </Card>
    </div>
  )
}`
  }

  private getRoutePattern(): string {
    const prefix = this.options.schema === 'core' ? '/_core' : '/_tenant'
    const modelPath = this.camelToKebab(this.pluralize(this.options.name))
    return `${prefix}/${modelPath}`
  }

  private generateTypeFields(): string {
    return this.options.fields
      .map(field => `  ${field.name}: ${this.getTypeScriptType(field)}`)
      .join('\n')
  }

  private generateFormTypeFields(): string {
    return this.options.fields
      .map(field => `  ${field.name}: ${this.getTypeScriptType(field)}`)
      .join('\n')
  }

  private generateDefaultFormData(): string {
    return this.options.fields
      .map(field => {
        const defaultValue = this.getDefaultValue(field)
        return `    ${field.name}: ${defaultValue}`
      })
      .join(',\n')
  }

  private generateEditFormData(): string {
    return this.options.fields.map(field => `      ${field.name}: item.${field.name}`).join(',\n')
  }

  private generateTableHeaders(): string {
    return this.options.fields
      .filter(field => field.name !== 'title') // Title is already handled
      .slice(0, 3) // Limit to first 3 additional fields to avoid table overflow
      .map(field => {
        const label = this.fieldNameToLabel(field.name)
        return `              <TableHead 
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                onClick={() => handleSort('${field.name}')}
              >
                ${label} {search.sortBy === '${field.name}' && (search.sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>`
      })
      .join('\n')
  }

  private generateTableCells(): string {
    return this.options.fields
      .filter(field => field.name !== 'title')
      .slice(0, 3) // Limit to first 3 additional fields
      .map(field => {
        let cellContent = `item.${field.name}`

        // Format different field types
        if (field.type === 'boolean') {
          cellContent = `item.${field.name} ? 'Yes' : 'No'`
        } else if (field.type === 'timestamp') {
          cellContent = `item.${field.name} ? new Date(item.${field.name}).toLocaleDateString() : '-'`
        } else if (field.type === 'decimal' || field.type === 'integer') {
          cellContent = `item.${field.name}?.toString() || '-'`
        }

        return `                  <TableCell className="text-gray-700 dark:text-gray-300">{${cellContent}}</TableCell>`
      })
      .join('\n')
  }

  private generateFormFields(): string {
    return this.options.fields
      .map(field => {
        const label = this.fieldNameToLabel(field.name)
        const fieldId = field.name

        if (field.type === 'boolean') {
          return `            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="${fieldId}" className="text-right">
                ${label}
              </Label>
              <div className="col-span-3">
                <input
                  id="${fieldId}"
                  type="checkbox"
                  checked={formData.${field.name}}
                  onChange={(e) => setFormData(prev => ({ ...prev, ${field.name}: e.target.checked }))}
                  className="rounded border-gray-300"
                />
              </div>
            </div>`
        }

        let inputType = 'text'
        if (field.type === 'integer' || field.type === 'decimal') {
          inputType = 'number'
        } else if (field.type === 'timestamp') {
          inputType = 'datetime-local'
        }

        const step = field.type === 'decimal' ? ' step="0.01"' : ''

        return `            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="${fieldId}" className="text-right">
                ${label}
              </Label>
              <Input
                id="${fieldId}"
                type="${inputType}"${step}
                value={formData.${field.name} || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, ${field.name}: ${this.getFormValue(field)} }))}
                className="col-span-3"
              />
            </div>`
      })
      .join('\n')
  }

  private generateDetailFields(): string {
    return this.options.fields
      .map(field => {
        const label = this.fieldNameToLabel(field.name)
        let valueExpression = `item.${field.name}`

        if (field.type === 'boolean') {
          valueExpression = `item.${field.name} ? 'Yes' : 'No'`
        } else if (field.type === 'timestamp') {
          valueExpression = `item.${field.name} ? new Date(item.${field.name}).toLocaleString() : 'Not set'`
        }

        return `          <div>
            <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">${label}</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{${valueExpression} || 'Not set'}</dd>
          </div>`
      })
      .join('\n')
  }

  private getTypeScriptType(field: Field): string {
    let baseType: string

    switch (field.type) {
      case 'boolean':
        baseType = 'boolean'
        break
      case 'integer':
      case 'decimal':
        baseType = 'number'
        break
      case 'timestamp':
        baseType = 'string'
        break
      default:
        baseType = 'string'
    }

    return field.nullable ? `${baseType} | null` : baseType
  }

  private getDefaultValue(field: Field): string {
    if (field.nullable) return 'null'

    switch (field.type) {
      case 'boolean':
        return 'false'
      case 'integer':
      case 'decimal':
        return '0'
      default:
        return "''"
    }
  }

  private getFormValue(field: Field): string {
    if (field.type === 'integer') {
      return 'parseInt(e.target.value) || 0'
    } else if (field.type === 'decimal') {
      return 'parseFloat(e.target.value) || 0'
    }
    return 'e.target.value'
  }

  private fieldNameToLabel(fieldName: string): string {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim()
  }

  private camelToKebab(str: string): string {
    return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`).replace(/^-/, '')
  }

  private generateFormSchema(): string {
    const modelName = this.options.name.toLowerCase()
    const schemaFields = this.options.fields
      .map(field => {
        const zodType = this.getZodType(field)
        return `  ${field.name}: ${zodType}`
      })
      .join(',\n')

    return `// Form schema
const ${modelName}FormSchema = z.object({
${schemaFields}
})`
  }

  private generateDefaultFormValues(): string {
    return this.options.fields
      .map(field => {
        const defaultValue = this.getZodDefaultValue(field)
        return `      ${field.name}: ${defaultValue}`
      })
      .join(',\n')
  }

  private generateReactHookFormFields(): string {
    return this.options.fields
      .map(field => {
        const label = this.fieldNameToLabel(field.name)

        if (field.type === 'boolean') {
          return `              <FormField
                control={form.control}
                name="${field.name}"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>${label}</FormLabel>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />`
        }

        let inputType = 'text'
        if (field.type === 'integer' || field.type === 'decimal') {
          inputType = 'number'
        } else if (field.type === 'timestamp') {
          inputType = 'datetime-local'
        }

        const step = field.type === 'decimal' ? ' step="0.01"' : ''

        return `              <FormField
                control={form.control}
                name="${field.name}"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>${label}</FormLabel>
                    <FormControl>
                      <Input type="${inputType}"${step} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />`
      })
      .join('\n')
  }

  private getZodType(field: Field): string {
    let baseType: string

    switch (field.type) {
      case 'boolean':
        baseType = 'z.boolean()'
        break
      case 'integer':
        baseType = 'z.number().int()'
        break
      case 'decimal':
        baseType = 'z.number()'
        break
      case 'timestamp':
        baseType = 'z.string().datetime()'
        break
      case 'uuid':
        baseType = 'z.string().uuid()'
        break
      case 'jsonb':
        baseType = 'z.record(z.any())'
        break
      default:
        baseType = 'z.string()'
    }

    if (field.nullable) {
      baseType += '.nullable()'
    }

    if (!field.nullable && field.type === 'text') {
      baseType += '.min(1, "This field is required")'
    }

    return baseType
  }

  private getZodDefaultValue(field: Field): string {
    if (field.nullable) return 'null'

    switch (field.type) {
      case 'boolean':
        return 'false'
      case 'integer':
      case 'decimal':
        return '0'
      case 'jsonb':
        return '{}'
      default:
        return "''"
    }
  }

  private pluralize(word: string): string {
    if (word.endsWith('y')) {
      return word.slice(0, -1) + 'ies'
    }
    if (
      word.endsWith('s') ||
      word.endsWith('sh') ||
      word.endsWith('ch') ||
      word.endsWith('x') ||
      word.endsWith('z')
    ) {
      return word + 'es'
    }
    return word + 's'
  }
}
