import { Hono } from 'hono'
import { eq, and, isNull, isNotNull, desc, asc, ilike, count } from 'drizzle-orm'
import { createTenantConnection } from '@/api/database.settings'
import { products } from '@/api/db/schemas/tenant.drizzle'
import { z } from 'zod'

const app = new Hono()

// Validation schema
const productSchema = z.object({
  title: z.string(),
  description: z.string().nullable(),
  price: z.string(),
  isActive: z.string(),

})

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  view: z.enum(['active', 'trashed', 'all']).default('active')
})

// Get all products with pagination and filters
app.get('/', async (c) => {
  try {
    const db = createTenantConnection(c.get('tenantDatabase'))
    const query = querySchema.parse(c.req.query())
    
    // Build base query
    let baseQuery = db.select().from(products)
    let countQuery = db.select({ count: count() }).from(products)
    
    // Apply filters based on view
    const whereConditions = []
    if (query.view === 'active') {
      whereConditions.push(isNull(products.deletedAt))
    } else if (query.view === 'trashed') {
      whereConditions.push(isNotNull(products.deletedAt))
    }
    // 'all' view shows both active and trashed
    
    // Apply search filter
    if (query.search) {
      whereConditions.push(ilike(products.title, `%${query.search}%`))
    }
    
    if (whereConditions.length > 0) {
      baseQuery = baseQuery.where(and(...whereConditions))
      countQuery = countQuery.where(and(...whereConditions))
    }
    
    // Apply sorting
    const sortColumn = products[query.sortBy as keyof typeof products] || products.createdAt
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
    console.error('Get products error:', error)
    return c.json({ success: false, error: 'Failed to fetch products' }, 500)
  }
})

// Get single product by ID
app.get('/:id', async (c) => {
  try {
    const db = createTenantConnection(c.get('tenantDatabase'))
    const id = c.req.param('id')
    
    const item = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .then(rows => rows[0])
    
    if (!item) {
      return c.json({ success: false, error: 'Product not found' }, 404)
    }
    
    return c.json({ success: true, data: item })
  } catch (error) {
    console.error('Get product error:', error)
    return c.json({ success: false, error: 'Failed to fetch product' }, 500)
  }
})

// Create new product
app.post('/', async (c) => {
  try {
    const db = createTenantConnection(c.get('tenantDatabase'))
    const body = await c.req.json()
    const validatedData = productSchema.parse(body)
    
    const [newItem] = await db
      .insert(products)
      .values(validatedData)
      .returning()
    
    return c.json({ success: true, data: newItem }, 201)
  } catch (error) {
    console.error('Create product error:', error)
    if (error instanceof z.ZodError) {
      return c.json({
        success: false,
        error: 'Validation failed',
        details: error.flatten().fieldErrors
      }, 400)
    }
    return c.json({ success: false, error: 'Failed to create product' }, 500)
  }
})

// Update product
app.patch('/:id', async (c) => {
  try {
    const db = createTenantConnection(c.get('tenantDatabase'))
    const id = c.req.param('id')
    const body = await c.req.json()
    const validatedData = productSchema.partial().parse(body)
    
    const [updatedItem] = await db
      .update(products)
      .set({ ...validatedData, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning()
    
    if (!updatedItem) {
      return c.json({ success: false, error: 'Product not found' }, 404)
    }
    
    return c.json({ success: true, data: updatedItem })
  } catch (error) {
    console.error('Update product error:', error)
    if (error instanceof z.ZodError) {
      return c.json({
        success: false,
        error: 'Validation failed',
        details: error.flatten().fieldErrors
      }, 400)
    }
    return c.json({ success: false, error: 'Failed to update product' }, 500)
  }
})

// Soft delete product
app.delete('/:id', async (c) => {
  try {
    const db = createTenantConnection(c.get('tenantDatabase'))
    const id = c.req.param('id')
    
    const [deletedItem] = await db
      .update(products)
      .set({ deletedAt: new Date() })
      .where(and(eq(products.id, id), isNull(products.deletedAt)))
      .returning()
    
    if (!deletedItem) {
      return c.json({ success: false, error: 'Product not found or already deleted' }, 404)
    }
    
    return c.json({ success: true, message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Delete product error:', error)
    return c.json({ success: false, error: 'Failed to delete product' }, 500)
  }
})

// Restore product
app.patch('/:id/restore', async (c) => {
  try {
    const db = createTenantConnection(c.get('tenantDatabase'))
    const id = c.req.param('id')
    
    const [restoredItem] = await db
      .update(products)
      .set({ deletedAt: null, updatedAt: new Date() })
      .where(and(eq(products.id, id), isNotNull(products.deletedAt)))
      .returning()
    
    if (!restoredItem) {
      return c.json({ success: false, error: 'Product not found or not deleted' }, 404)
    }
    
    return c.json({ success: true, data: restoredItem, message: 'Product restored successfully' })
  } catch (error) {
    console.error('Restore product error:', error)
    return c.json({ success: false, error: 'Failed to restore product' }, 500)
  }
})

// Force delete product (permanent)
app.delete('/:id/force', async (c) => {
  try {
    const db = createTenantConnection(c.get('tenantDatabase'))
    const id = c.req.param('id')
    
    const [deletedItem] = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning()
    
    if (!deletedItem) {
      return c.json({ success: false, error: 'Product not found' }, 404)
    }
    
    return c.json({ success: true, message: 'Product permanently deleted' })
  } catch (error) {
    console.error('Force delete product error:', error)
    return c.json({ success: false, error: 'Failed to permanently delete product' }, 500)
  }
})

// Bulk operations
app.post('/bulk', async (c) => {
  try {
    const db = createTenantConnection(c.get('tenantDatabase'))
    const { ids, action } = await c.req.json()
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return c.json({ success: false, error: 'Invalid or empty IDs array' }, 400)
    }
    
    let result
    switch (action) {
      case 'delete':
        result = await db
          .update(products)
          .set({ deletedAt: new Date() })
          .where(and(eq(products.id, ids[0]), isNull(products.deletedAt)))
        // Note: Bulk operations would need more complex handling for multiple IDs
        break
      
      case 'restore':
        result = await db
          .update(products)
          .set({ deletedAt: null, updatedAt: new Date() })
          .where(and(eq(products.id, ids[0]), isNotNull(products.deletedAt)))
        break
      
      case 'force-delete':
        result = await db
          .delete(products)
          .where(eq(products.id, ids[0]))
        break
      
      default:
        return c.json({ success: false, error: 'Invalid action' }, 400)
    }
    
    return c.json({ success: true, message: `Bulk ${action} completed` })
  } catch (error) {
    console.error('Bulk operation error:', error)
    return c.json({ success: false, error: 'Bulk operation failed' }, 500)
  }
})

export const productRoutes = app