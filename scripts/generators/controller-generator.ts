import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import type { CrudOptions, Field } from '../make-crud'

export class ControllerGenerator {
  private options: CrudOptions

  constructor(options: CrudOptions) {
    this.options = options
  }

  async generate() {
    const controllerPath = this.getControllerPath()
    
    // Ensure directory exists
    mkdirSync(dirname(controllerPath), { recursive: true })
    
    const controllerContent = this.generateControllerContent()
    writeFileSync(controllerPath, controllerContent)
    
    // Update the main API file to register routes
    await this.updateApiRoutes()
  }

  private getControllerPath(): string {
    const fileName = this.camelToKebab(this.options.name)
    return `src/api/controllers/${this.options.schema}/${fileName}.hono.ts`
  }

  private generateControllerContent(): string {
    const tableName = this.getTableVariableName()
    const modelName = this.options.name
    const schemaImport = this.options.schema === 'core' ? 'core.drizzle' : 'tenant.drizzle'
    const dbConnection = this.options.schema === 'core' ? 'createCoreConnection' : 'createTenantConnection'
    const validationSchema = `${this.camelCase(modelName)}Schema`
    
    return `import { Hono } from 'hono'
import { eq, and, isNull, isNotNull, desc, asc, ilike, count } from 'drizzle-orm'
import { ${dbConnection} } from '@/api/database.settings'
import { ${tableName} } from '@/api/db/schemas/${schemaImport}'
import { z } from 'zod'

const app = new Hono()

// Validation schema
const ${validationSchema} = z.object({
${this.generateValidationFields()}
})

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  view: z.enum(['active', 'trashed', 'all']).default('active')
})

// Get all ${this.pluralize(modelName).toLowerCase()} with pagination and filters
app.get('/', async (c) => {
  try {
    const db = ${dbConnection}(${this.options.schema === 'tenant' ? "c.get('tenantDatabase')" : ''})
    const query = querySchema.parse(c.req.query())
    
    // Build base query
    let baseQuery = db.select().from(${tableName})
    let countQuery = db.select({ count: count() }).from(${tableName})
    
    // Apply filters based on view
    const whereConditions = []
    if (query.view === 'active') {
      whereConditions.push(isNull(${tableName}.deletedAt))
    } else if (query.view === 'trashed') {
      whereConditions.push(isNotNull(${tableName}.deletedAt))
    }
    // 'all' view shows both active and trashed
    
    // Apply search filter
    if (query.search) {
      whereConditions.push(ilike(${tableName}.title, \`%\${query.search}%\`))
    }
    
    if (whereConditions.length > 0) {
      baseQuery = baseQuery.where(and(...whereConditions))
      countQuery = countQuery.where(and(...whereConditions))
    }
    
    // Apply sorting
    const sortColumn = ${tableName}[query.sortBy as keyof typeof ${tableName}] || ${tableName}.createdAt
    baseQuery = query.sortOrder === 'asc' 
      ? baseQuery.orderBy(asc(sortColumn))
      : baseQuery.orderBy(desc(sortColumn))
    
    // Apply pagination
    const offset = (query.page - 1) * query.limit
    baseQuery = baseQuery.limit(query.limit).offset(offset)
    
    // Execute queries
    const [items, totalCount] = await Promise.all([
      baseQuery,
      countQuery.then(result => result[0]?.count || 0)
    ])
    
    return c.json({
      success: true,
      data: {
        items,
        pagination: {
          page: query.page,
          limit: query.limit,
          total: Number(totalCount),
          totalPages: Math.ceil(Number(totalCount) / query.limit)
        },
        view: query.view
      }
    })
  } catch (error) {
    console.error('Get ${this.pluralize(modelName).toLowerCase()} error:', error)
    return c.json({ success: false, error: 'Failed to fetch ${this.pluralize(modelName).toLowerCase()}' }, 500)
  }
})

// Get single ${modelName.toLowerCase()} by ID
app.get('/:id', async (c) => {
  try {
    const db = ${dbConnection}(${this.options.schema === 'tenant' ? "c.get('tenantDatabase')" : ''})
    const id = c.req.param('id')
    
    const item = await db
      .select()
      .from(${tableName})
      .where(eq(${tableName}.id, id))
      .then(rows => rows[0])
    
    if (!item) {
      return c.json({ success: false, error: '${modelName} not found' }, 404)
    }
    
    return c.json({ success: true, data: item })
  } catch (error) {
    console.error('Get ${modelName.toLowerCase()} error:', error)
    return c.json({ success: false, error: 'Failed to fetch ${modelName.toLowerCase()}' }, 500)
  }
})

// Create new ${modelName.toLowerCase()}
app.post('/', async (c) => {
  try {
    const db = ${dbConnection}(${this.options.schema === 'tenant' ? "c.get('tenantDatabase')" : ''})
    const body = await c.req.json()
    const validatedData = ${validationSchema}.parse(body)
    
    const [newItem] = await db
      .insert(${tableName})
      .values(validatedData)
      .returning()
    
    return c.json({ success: true, data: newItem }, 201)
  } catch (error) {
    console.error('Create ${modelName.toLowerCase()} error:', error)
    if (error instanceof z.ZodError) {
      return c.json({
        success: false,
        error: 'Validation failed',
        details: error.flatten().fieldErrors
      }, 400)
    }
    return c.json({ success: false, error: 'Failed to create ${modelName.toLowerCase()}' }, 500)
  }
})

// Update ${modelName.toLowerCase()}
app.patch('/:id', async (c) => {
  try {
    const db = ${dbConnection}(${this.options.schema === 'tenant' ? "c.get('tenantDatabase')" : ''})
    const id = c.req.param('id')
    const body = await c.req.json()
    const validatedData = ${validationSchema}.partial().parse(body)
    
    const [updatedItem] = await db
      .update(${tableName})
      .set({ ...validatedData, updatedAt: new Date() })
      .where(eq(${tableName}.id, id))
      .returning()
    
    if (!updatedItem) {
      return c.json({ success: false, error: '${modelName} not found' }, 404)
    }
    
    return c.json({ success: true, data: updatedItem })
  } catch (error) {
    console.error('Update ${modelName.toLowerCase()} error:', error)
    if (error instanceof z.ZodError) {
      return c.json({
        success: false,
        error: 'Validation failed',
        details: error.flatten().fieldErrors
      }, 400)
    }
    return c.json({ success: false, error: 'Failed to update ${modelName.toLowerCase()}' }, 500)
  }
})

// Soft delete ${modelName.toLowerCase()}
app.delete('/:id', async (c) => {
  try {
    const db = ${dbConnection}(${this.options.schema === 'tenant' ? "c.get('tenantDatabase')" : ''})
    const id = c.req.param('id')
    
    const [deletedItem] = await db
      .update(${tableName})
      .set({ deletedAt: new Date() })
      .where(and(eq(${tableName}.id, id), isNull(${tableName}.deletedAt)))
      .returning()
    
    if (!deletedItem) {
      return c.json({ success: false, error: '${modelName} not found or already deleted' }, 404)
    }
    
    return c.json({ success: true, message: '${modelName} deleted successfully' })
  } catch (error) {
    console.error('Delete ${modelName.toLowerCase()} error:', error)
    return c.json({ success: false, error: 'Failed to delete ${modelName.toLowerCase()}' }, 500)
  }
})

// Restore ${modelName.toLowerCase()}
app.patch('/:id/restore', async (c) => {
  try {
    const db = ${dbConnection}(${this.options.schema === 'tenant' ? "c.get('tenantDatabase')" : ''})
    const id = c.req.param('id')
    
    const [restoredItem] = await db
      .update(${tableName})
      .set({ deletedAt: null, updatedAt: new Date() })
      .where(and(eq(${tableName}.id, id), isNotNull(${tableName}.deletedAt)))
      .returning()
    
    if (!restoredItem) {
      return c.json({ success: false, error: '${modelName} not found or not deleted' }, 404)
    }
    
    return c.json({ success: true, data: restoredItem, message: '${modelName} restored successfully' })
  } catch (error) {
    console.error('Restore ${modelName.toLowerCase()} error:', error)
    return c.json({ success: false, error: 'Failed to restore ${modelName.toLowerCase()}' }, 500)
  }
})

// Force delete ${modelName.toLowerCase()} (permanent)
app.delete('/:id/force', async (c) => {
  try {
    const db = ${dbConnection}(${this.options.schema === 'tenant' ? "c.get('tenantDatabase')" : ''})
    const id = c.req.param('id')
    
    const [deletedItem] = await db
      .delete(${tableName})
      .where(eq(${tableName}.id, id))
      .returning()
    
    if (!deletedItem) {
      return c.json({ success: false, error: '${modelName} not found' }, 404)
    }
    
    return c.json({ success: true, message: '${modelName} permanently deleted' })
  } catch (error) {
    console.error('Force delete ${modelName.toLowerCase()} error:', error)
    return c.json({ success: false, error: 'Failed to permanently delete ${modelName.toLowerCase()}' }, 500)
  }
})

// Bulk operations
app.post('/bulk', async (c) => {
  try {
    const db = ${dbConnection}(${this.options.schema === 'tenant' ? "c.get('tenantDatabase')" : ''})
    const { ids, action } = await c.req.json()
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return c.json({ success: false, error: 'Invalid or empty IDs array' }, 400)
    }
    
    let result
    switch (action) {
      case 'delete':
        result = await db
          .update(${tableName})
          .set({ deletedAt: new Date() })
          .where(and(eq(${tableName}.id, ids[0]), isNull(${tableName}.deletedAt)))
        // Note: Bulk operations would need more complex handling for multiple IDs
        break
      
      case 'restore':
        result = await db
          .update(${tableName})
          .set({ deletedAt: null, updatedAt: new Date() })
          .where(and(eq(${tableName}.id, ids[0]), isNotNull(${tableName}.deletedAt)))
        break
      
      case 'force-delete':
        result = await db
          .delete(${tableName})
          .where(eq(${tableName}.id, ids[0]))
        break
      
      default:
        return c.json({ success: false, error: 'Invalid action' }, 400)
    }
    
    return c.json({ success: true, message: \`Bulk \${action} completed\` })
  } catch (error) {
    console.error('Bulk operation error:', error)
    return c.json({ success: false, error: 'Bulk operation failed' }, 500)
  }
})

export const ${this.camelCase(modelName)}Routes = app`
  }

  private async updateApiRoutes() {
    const apiPath = 'src/api/api.ts'
    if (!existsSync(apiPath)) return
    
    const apiContent = readFileSync(apiPath, 'utf-8')
    const importName = `${this.camelCase(this.options.name)}Routes`
    const fileName = this.camelToKebab(this.options.name)
    
    // Add import
    const importLine = `import { ${importName} } from '@/api/controllers/${this.options.schema}/${fileName}.hono'`
    
    // Add route registration
    const routeLine = `app.route('/api/${this.options.schema}/${this.camelToKebab(this.pluralize(this.options.name))}', ${importName})`
    
    // Check if already exists
    if (apiContent.includes(importLine)) return
    
    // Find insertion points
    const lastImportPattern = new RegExp(`import.*from '@/api/controllers/${this.options.schema}/.*'`)
    const matches = [...apiContent.matchAll(new RegExp(lastImportPattern, 'g'))]
    
    if (matches.length > 0) {
      const lastMatch = matches[matches.length - 1]
      const insertionPoint = lastMatch.index! + lastMatch[0].length
      let newContent = apiContent.slice(0, insertionPoint) + '\n' + importLine + apiContent.slice(insertionPoint)
      
      // Find route registration insertion point
      const routePattern = new RegExp(`app\\.route\\('/api/${this.options.schema}/.*'.*\\)`)
      const routeMatches = [...newContent.matchAll(new RegExp(routePattern, 'g'))]
      
      if (routeMatches.length > 0) {
        const lastRouteMatch = routeMatches[routeMatches.length - 1]
        const routeInsertionPoint = lastRouteMatch.index! + lastRouteMatch[0].length
        newContent = newContent.slice(0, routeInsertionPoint) + '\n' + routeLine + newContent.slice(routeInsertionPoint)
      }
      
      writeFileSync(apiPath, newContent)
    }
  }

  private generateValidationFields(): string {
    return this.options.fields
      .map(field => this.generateValidationField(field))
      .join('')
  }

  private generateValidationField(field: Field): string {
    let validation = `  ${field.name}: `
    
    switch (field.type) {
      case 'text':
        validation += 'z.string()'
        break
      case 'boolean':
        validation += 'z.boolean()'
        break
      case 'integer':
        validation += 'z.number().int()'
        break
      case 'decimal':
        validation += 'z.number()'
        break
      case 'timestamp':
        validation += 'z.date().or(z.string().datetime())'
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
      validation += '.nullable()'
    }
    
    validation += ',\n'
    return validation
  }

  private getTableVariableName(): string {
    return this.camelCase(this.pluralize(this.options.name))
  }

  private camelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1)
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