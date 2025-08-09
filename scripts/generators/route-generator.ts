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
    
    // Generate index route (data table)
    await this.generateIndexRoute()
    
    // Generate individual item route if needed
    await this.generateItemRoute()
  }

  private getRoutesDirectory(): string {
    const prefix = this.options.schema === 'core' ? '_core' : '_tenant'
    const modelPath = this.camelToKebab(this.pluralize(this.options.name))
    return `src/routes/${prefix}/${modelPath}`
  }

  private async generateIndexRoute() {
    const routePath = `${this.getRoutesDirectory()}/index.tsx`
    const content = this.generateIndexRouteContent()
    
    mkdirSync(dirname(routePath), { recursive: true })
    writeFileSync(routePath, content)
  }

  private async generateItemRoute() {
    const routePath = `${this.getRoutesDirectory()}/$id.tsx`
    const content = this.generateItemRouteContent()
    
    writeFileSync(routePath, content)
  }

  private generateIndexRouteContent(): string {
    const modelName = this.options.name
    const pluralModelName = this.pluralize(modelName)
    const apiPath = `/api/${this.options.schema}/${this.camelToKebab(pluralModelName)}`
    const componentName = `${pluralModelName}Page`
    
    return `import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

// Search params schema
const searchSchema = z.object({
  page: z.coerce.number().min(1).catch(1),
  limit: z.coerce.number().min(1).max(100).catch(10),
  search: z.string().catch(''),
  sortBy: z.string().catch('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).catch('desc'),
  view: z.enum(['active', 'trashed', 'all']).catch('active')
})

export const Route = createFileRoute('${this.getRoutePattern()}/')(({
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

interface ${modelName}FormData {
${this.generateFormTypeFields()}
}

function ${componentName}() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<${modelName}Item | null>(null)
  const [formData, setFormData] = useState<${modelName}FormData>({
${this.generateDefaultFormData()}
  })

  // Fetch ${pluralModelName.toLowerCase()}
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['${pluralModelName.toLowerCase()}', search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: search.page.toString(),
        limit: search.limit.toString(),
        search: search.search,
        sortBy: search.sortBy,
        sortOrder: search.sortOrder,
        view: search.view
      })
      
      const response = await fetch(\`${apiPath}?\${params}\`)
      if (!response.ok) throw new Error('Failed to fetch ${pluralModelName.toLowerCase()}')
      return response.json()
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
  const handleCreate = async () => {
    try {
      const response = await fetch('${apiPath}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) throw new Error('Failed to create ${modelName.toLowerCase()}')
      
      toast.success('${modelName} created successfully')
      setIsCreateDialogOpen(false)
      resetForm()
      refetch()
    } catch (error) {
      toast.error('Failed to create ${modelName.toLowerCase()}')
      console.error(error)
    }
  }

  // Update ${modelName.toLowerCase()}
  const handleUpdate = async () => {
    if (!editingItem) return
    
    try {
      const response = await fetch(\`${apiPath}/\${editingItem.id}\`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) throw new Error('Failed to update ${modelName.toLowerCase()}')
      
      toast.success('${modelName} updated successfully')
      setEditingItem(null)
      resetForm()
      refetch()
    } catch (error) {
      toast.error('Failed to update ${modelName.toLowerCase()}')
      console.error(error)
    }
  }

  // Delete ${modelName.toLowerCase()}
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(\`${apiPath}/\${id}\`, {
        method: 'DELETE'
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
      const response = await fetch(\`${apiPath}/\${id}/restore\`, {
        method: 'PATCH'
      })
      
      if (!response.ok) throw new Error('Failed to restore ${modelName.toLowerCase()}')
      
      toast.success('${modelName} restored successfully')
      refetch()
    } catch (error) {
      toast.error('Failed to restore ${modelName.toLowerCase()}')
      console.error(error)
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
${this.generateDefaultFormData()}
    })
  }

  // Open edit dialog
  const openEditDialog = (item: ${modelName}Item) => {
    setEditingItem(item)
    setFormData({
${this.generateEditFormData()}
    })
  }

  if (error) {
    return <div className="p-4 text-red-600">Error loading ${pluralModelName.toLowerCase()}: {error.message}</div>
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">${pluralModelName}</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create ${modelName}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('title')}
              >
                Title {search.sortBy === 'title' && (search.sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
${this.generateTableHeaders()}
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('createdAt')}
              >
                Created {search.sortBy === 'createdAt' && (search.sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : data?.data?.items?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">No ${pluralModelName.toLowerCase()} found</TableCell>
              </TableRow>
            ) : (
              data?.data?.items?.map((item: ${modelName}Item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.title}</TableCell>
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
          <div className="text-sm text-muted-foreground">
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
          <div className="grid gap-4 py-4">
${this.generateFormFields()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
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
          <div className="grid gap-4 py-4">
${this.generateFormFields()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}`
  }

  private generateItemRouteContent(): string {
    const modelName = this.options.name
    const apiPath = `/api/${this.options.schema}/${this.camelToKebab(this.pluralize(modelName))}`
    
    return `import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit } from 'lucide-react'

export const Route = createFileRoute('${this.getRoutePattern()}/$id')({
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
      const response = await fetch(\`${apiPath}/\${id}\`)
      if (!response.ok) throw new Error('Failed to fetch ${modelName.toLowerCase()}')
      return response.json()
    }
  })

  const item: ${modelName}Item = data?.data

  if (isLoading) {
    return <div className="p-4">Loading...</div>
  }

  if (error || !item) {
    return <div className="p-4 text-red-600">Error loading ${modelName.toLowerCase()}</div>
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate({ to: '${this.getRoutePattern()}' })}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">{item.title}</h1>
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
    return this.options.fields
      .map(field => `      ${field.name}: item.${field.name}`)
      .join(',\n')
  }

  private generateTableHeaders(): string {
    return this.options.fields
      .filter(field => field.name !== 'title') // Title is already handled
      .slice(0, 3) // Limit to first 3 additional fields to avoid table overflow
      .map(field => {
        const label = this.fieldNameToLabel(field.name)
        return `              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
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
        
        return `                  <TableCell>{${cellContent}}</TableCell>`
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
            <dt className="text-sm font-medium text-muted-foreground">${label}</dt>
            <dd className="mt-1 text-sm">{${valueExpression} || 'Not set'}</dd>
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

  private pluralize(word: string): string {
    if (word.endsWith('y')) {
      return word.slice(0, -1) + 'ies'
    }
    if (word.endsWith('s') || word.endsWith('sh') || word.endsWith('ch') || word.endsWith('x') || word.endsWith('z')) {
      return word + 'es'
    }
    return word + 's'
  }
}