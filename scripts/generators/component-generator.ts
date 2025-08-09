import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import type { CrudOptions, Field } from '../make-crud'

export class ComponentGenerator {
  private options: CrudOptions

  constructor(options: CrudOptions) {
    this.options = options
  }

  async generate() {
    const componentsDir = this.getComponentsDirectory()
    mkdirSync(componentsDir, { recursive: true })

    // Generate data table component
    await this.generateDataTableComponent()

    // Generate form component
    await this.generateFormComponent()

    // Generate list item component
    await this.generateListItemComponent()
  }

  private getComponentsDirectory(): string {
    const modelPath = this.camelToKebab(this.pluralize(this.options.name))
    return `src/components/${modelPath}`
  }

  private async generateDataTableComponent() {
    const componentPath = `${this.getComponentsDirectory()}/${this.options.name}DataTable.tsx`
    const content = this.generateDataTableContent()

    mkdirSync(dirname(componentPath), { recursive: true })
    writeFileSync(componentPath, content)
  }

  private async generateFormComponent() {
    const componentPath = `${this.getComponentsDirectory()}/${this.options.name}Form.tsx`
    const content = this.generateFormContent()

    writeFileSync(componentPath, content)
  }

  private async generateListItemComponent() {
    const componentPath = `${this.getComponentsDirectory()}/${this.options.name}ListItem.tsx`
    const content = this.generateListItemContent()

    writeFileSync(componentPath, content)
  }

  private generateDataTableContent(): string {
    const modelName = this.options.name
    const pluralModelName = this.pluralize(modelName)

    return `import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataTable } from '@/components/ui/data-table'
import { MoreHorizontal, Edit, Trash2, RotateCcw } from 'lucide-react'

export interface ${modelName}Item {
  id: string
${this.generateTypeFields()}
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

interface ${modelName}DataTableProps {
  data: ${modelName}Item[]
  isLoading?: boolean
  onEdit?: (item: ${modelName}Item) => void
  onDelete?: (id: string) => void
  onRestore?: (id: string) => void
  view?: 'active' | 'trashed' | 'all'
}

export function ${modelName}DataTable({
  data,
  isLoading = false,
  onEdit,
  onDelete,
  onRestore,
  view = 'active'
}: ${modelName}DataTableProps) {
  const columns: ColumnDef<${modelName}Item>[] = [
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('title')}</div>
      ),
    },
${this.generateColumnDefinitions()}
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => {
        const date = row.getValue('createdAt') as string
        return new Date(date).toLocaleDateString()
      },
    },
    {
      accessorKey: 'deletedAt',
      header: 'Status',
      cell: ({ row }) => {
        const deletedAt = row.getValue('deletedAt') as string | null
        return (
          <Badge variant={deletedAt ? 'destructive' : 'default'}>
            {deletedAt ? 'Deleted' : 'Active'}
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const item = row.original
        const isDeleted = !!item.deletedAt

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isDeleted ? (
                <>
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(item)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem 
                      onClick={() => onDelete(item.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </>
              ) : (
                onRestore && (
                  <DropdownMenuItem onClick={() => onRestore(item.id)}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Restore
                  </DropdownMenuItem>
                )
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={isLoading}
      searchKey="title"
      searchPlaceholder="Search ${pluralModelName.toLowerCase()}..."
    />
  )
}`
  }

  private generateFormContent(): string {
    const modelName = this.options.name

    return `import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { LoaderCircle } from 'lucide-react'

const formSchema = z.object({
${this.generateZodSchema()}
})

export type ${modelName}FormData = z.infer<typeof formSchema>

export interface ${modelName}Item {
  id: string
${this.generateTypeFields()}
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

interface ${modelName}FormProps {
  initialData?: Partial<${modelName}Item>
  onSubmit: (data: ${modelName}FormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  submitText?: string
}

export function ${modelName}Form({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitText = 'Save'
}: ${modelName}FormProps) {
  const form = useForm<${modelName}FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
${this.generateDefaultValues()}
    },
  })

  const handleSubmit = async (data: ${modelName}FormData) => {
    try {
      await onSubmit(data)
      if (!initialData) {
        form.reset()
      }
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
${this.generateFormFields()}
        
        <div className="flex items-center justify-end gap-4 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              submitText
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}`
  }

  private generateListItemContent(): string {
    const modelName = this.options.name

    return `import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Edit, MoreHorizontal, RotateCcw, Trash2 } from 'lucide-react'

export interface ${modelName}Item {
  id: string
${this.generateTypeFields()}
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

interface ${modelName}ListItemProps {
  item: ${modelName}Item
  onEdit?: (item: ${modelName}Item) => void
  onDelete?: (id: string) => void
  onRestore?: (id: string) => void
  onView?: (item: ${modelName}Item) => void
}

export function ${modelName}ListItem({
  item,
  onEdit,
  onDelete,
  onRestore,
  onView
}: ${modelName}ListItemProps) {
  const isDeleted = !!item.deletedAt

  return (
    <Card className="transition-colors hover:bg-muted/50">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle 
            className="text-base cursor-pointer hover:text-primary"
            onClick={() => onView?.(item)}
          >
            {item.title}
          </CardTitle>
          <CardDescription>
            Created {new Date(item.createdAt).toLocaleDateString()}
            {item.updatedAt !== item.createdAt && (
              <> • Updated {new Date(item.updatedAt).toLocaleDateString()}</>
            )}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isDeleted ? 'destructive' : 'default'}>
            {isDeleted ? 'Deleted' : 'Active'}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isDeleted ? (
                <>
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(item)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem 
                      onClick={() => onDelete(item.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </>
              ) : (
                onRestore && (
                  <DropdownMenuItem onClick={() => onRestore(item.id)}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Restore
                  </DropdownMenuItem>
                )
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-2">
${this.generatePreviewFields()}
        </div>
      </CardContent>
    </Card>
  )
}`
  }

  private generateTypeFields(): string {
    return this.options.fields
      .map(field => `  ${field.name}: ${this.getTypeScriptType(field)}`)
      .join('\n')
  }

  private generateColumnDefinitions(): string {
    return this.options.fields
      .filter(field => field.name !== 'title') // Title is handled separately
      .slice(0, 3) // Limit columns to prevent overflow
      .map(field => {
        let cellContent = "row.getValue('" + field.name + "')"

        if (field.type === 'boolean') {
          cellContent = `(${cellContent} as boolean) ? 'Yes' : 'No'`
        } else if (field.type === 'timestamp') {
          cellContent = `new Date(${cellContent} as string).toLocaleDateString()`
        }

        return `    {
      accessorKey: '${field.name}',
      header: '${this.fieldNameToLabel(field.name)}',
      cell: ({ row }) => ${cellContent},
    },`
      })
      .join('\n')
  }

  private generateZodSchema(): string {
    return this.options.fields
      .map(field => {
        let validation = `  ${field.name}: `

        switch (field.type) {
          case 'text':
            validation += 'z.string().min(1, "This field is required")'
            break
          case 'boolean':
            validation += 'z.boolean()'
            break
          case 'integer':
            validation += 'z.number().int("Must be a whole number")'
            break
          case 'decimal':
            validation += 'z.number()'
            break
          case 'timestamp':
            validation += 'z.string().datetime().or(z.date())'
            break
          case 'uuid':
            validation += 'z.string().uuid()'
            break
          case 'jsonb':
            validation += 'z.any()'
            break
          default:
            validation += 'z.string()'
        }

        if (field.nullable) {
          validation += '.nullable().optional()'
        }

        validation += ','
        return validation
      })
      .join('\n')
  }

  private generateDefaultValues(): string {
    return this.options.fields
      .map(field => {
        const defaultValue = this.getDefaultValue(field)
        return `      ${field.name}: initialData?.${field.name} ?? ${defaultValue}`
      })
      .join(',\n')
  }

  private generateFormFields(): string {
    return this.options.fields.map(field => this.generateFormField(field)).join('\n')
  }

  private generateFormField(field: Field): string {
    const label = this.fieldNameToLabel(field.name)
    const fieldName = field.name

    if (field.type === 'boolean') {
      return `        <FormField
          control={form.control}
          name="${fieldName}"
          render={({ field: formField }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={formField.value}
                  onCheckedChange={formField.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>${label}</FormLabel>
                <FormDescription>
                  Check this box to enable ${label.toLowerCase()}
                </FormDescription>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />`
    }

    let inputComponent = 'Input'
    let inputProps = ''

    if (field.type === 'text' && fieldName.includes('description')) {
      inputComponent = 'Textarea'
      inputProps = ' placeholder="Enter description..." rows={3}'
    } else if (field.type === 'integer' || field.type === 'decimal') {
      inputProps = ` type="number"${field.type === 'decimal' ? ' step="0.01"' : ''}`
    } else if (field.type === 'timestamp') {
      inputProps = ' type="datetime-local"'
    }

    return `        <FormField
          control={form.control}
          name="${fieldName}"
          render={({ field: formField }) => (
            <FormItem>
              <FormLabel>${label}</FormLabel>
              <FormControl>
                <${inputComponent}
                  {...formField}
                  value={formField.value || ''}${inputProps}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />`
  }

  private generatePreviewFields(): string {
    return this.options.fields
      .filter(field => field.name !== 'title') // Title is shown in header
      .slice(0, 2) // Limit to prevent clutter
      .map(field => {
        let valueExpression = `item.${field.name}`

        if (field.type === 'boolean') {
          valueExpression = `item.${field.name} ? 'Yes' : 'No'`
        } else if (field.type === 'timestamp') {
          valueExpression = `item.${field.name} ? new Date(item.${field.name}).toLocaleDateString() : 'Not set'`
        }

        return `          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">${this.fieldNameToLabel(field.name)}:</span>
            <span>{${valueExpression} || 'Not set'}</span>
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
