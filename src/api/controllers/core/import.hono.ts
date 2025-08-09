import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod/v4'
import { type ImportColumn, ServerImportService } from '../../services/import.service'



const ImportConfigSchema = z.object({
  columns: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      required: z.boolean().optional(),
      type: z.enum(['string', 'number', 'date', 'boolean']).optional(),
    })
  ),
  options: z
    .object({
      skipFirstRow: z.boolean().optional(),
      syncMode: z.enum(['create-only', 'update-only', 'create-update']).optional(),
      keyColumn: z.string().optional(),
    })
    .optional(),
})

// Parse uploaded file for import preview
export const coreImportRoutes = new Hono().post('/import/parse', async c => {
  try {
    const body = await c.req.parseBody()
    const file = body['file'] as File
    const config = body['config'] as string

    if (!file) {
      return c.json({ error: 'No file provided' }, 400)
    }

    if (!config) {
      return c.json({ error: 'No configuration provided' }, 400)
    }

    let parsedConfig
    try {
      parsedConfig = JSON.parse(config)
    } catch (error) {
      return c.json({ error: 'Invalid configuration JSON' }, 400)
    }

    // Validate configuration
    const validatedConfig = ImportConfigSchema.safeParse(parsedConfig)
    if (!validatedConfig.success) {
      return c.json({ error: 'Invalid configuration', details: validatedConfig.error }, 400)
    }

    const { columns, options = {} } = validatedConfig.data

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let result
    const fileExtension = file.name.toLowerCase().split('.').pop()

    if (fileExtension === 'csv') {
      result = ServerImportService.parseCSVBuffer(buffer, columns, options)
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      result = ServerImportService.parseExcelBuffer(buffer, columns, options)
    } else {
      return c.json(
        { error: 'Unsupported file format. Only CSV and Excel files are supported.' },
        400
      )
    }

    return c.json({
      success: true,
      result,
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type,
      },
    })
  } catch (error) {
    console.error('Import parse error:', error)
    return c.json({ error: 'Import parsing failed' }, 500)
  }
})

// Sync imported data with existing records
.post(
  '/import/sync',
  zValidator(
    'json',
    z.object({
      importedData: z.array(z.record(z.any())),
      existingData: z.array(z.record(z.any())),
      keyColumn: z.string(),
      syncMode: z.enum(['create-only', 'update-only', 'create-update']).optional(),
    })
  ),
  async c => {
    try {
      const {
        importedData,
        existingData,
        keyColumn,
        syncMode = 'create-update',
      } = c.req.valid('json')

      const syncResult = await ServerImportService.syncData(
        importedData,
        existingData,
        keyColumn,
        syncMode
      )

      return c.json({
        success: true,
        syncResult,
        summary: {
          totalImported: importedData.length,
          toCreate: syncResult.toCreate.length,
          toUpdate: syncResult.toUpdate.length,
          unchanged: syncResult.unchanged.length,
        },
      })
    } catch (error) {
      console.error('Import sync error:', error)
      return c.json({ error: 'Import sync failed' }, 500)
    }
  }
)

// Get import templates for different data types
.get('/import/templates/:type', async c => {
  const { type } = c.req.param()

  const templates: Record<string, { columns: ImportColumn[] }> = {
    users: {
      columns: [
        { key: 'name', label: 'Name', required: true, type: 'string' },
        { key: 'email', label: 'Email', required: true, type: 'string' },
        { key: 'role', label: 'Role', required: false, type: 'string' },
        { key: 'status', label: 'Status', required: false, type: 'string' },
      ],
    },
    tenants: {
      columns: [
        { key: 'name', label: 'Name', required: true, type: 'string' },
        { key: 'subdomain', label: 'Subdomain', required: true, type: 'string' },
        { key: 'userLimit', label: 'User Limit', required: false, type: 'number' },
        { key: 'status', label: 'Status', required: false, type: 'string' },
      ],
    },
    permissions: {
      columns: [
        { key: 'name', label: 'Permission Name', required: true, type: 'string' },
        { key: 'resource', label: 'Resource', required: true, type: 'string' },
        { key: 'action', label: 'Action', required: true, type: 'string' },
        { key: 'description', label: 'Description', required: false, type: 'string' },
      ],
    },
  }

  const template = templates[type]
  if (!template) {
    return c.json({ error: 'Template not found' }, 404)
  }

  return c.json({
    success: true,
    template,
    sampleData: this.getSampleDataForType(type),
  })
})

// Generate sample CSV for download
.get('/import/templates/:type/download', async c => {
  const { type } = c.req.param()
  const format = c.req.query('format') || 'csv'

  const templates: Record<string, { columns: ImportColumn[]; sampleData: any[] }> = {
    users: {
      columns: [
        { key: 'name', label: 'Name', required: true, type: 'string' },
        { key: 'email', label: 'Email', required: true, type: 'string' },
        { key: 'role', label: 'Role', required: false, type: 'string' },
        { key: 'status', label: 'Status', required: false, type: 'string' },
      ],
      sampleData: [
        { name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
        { name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Active' },
      ],
    },
    tenants: {
      columns: [
        { key: 'name', label: 'Name', required: true, type: 'string' },
        { key: 'subdomain', label: 'Subdomain', required: true, type: 'string' },
        { key: 'userLimit', label: 'User Limit', required: false, type: 'number' },
        { key: 'status', label: 'Status', required: false, type: 'string' },
      ],
      sampleData: [
        { name: 'Acme Corp', subdomain: 'acme', userLimit: 50, status: 'Active' },
        { name: 'Tech Startup', subdomain: 'techco', userLimit: 10, status: 'Trial' },
      ],
    },
  }

  const template = templates[type]
  if (!template) {
    return c.json({ error: 'Template not found' }, 404)
  }

  if (format === 'csv') {
    // Generate CSV
    const headers = template.columns.map(col => col.label).join(',')
    const rows = template.sampleData
      .map(row => template.columns.map(col => row[col.key] || '').join(','))
      .join('\n')

    const csvContent = `${headers}\n${rows}`
    const fileName = `${type}_import_template.csv`

    c.header('Content-Type', 'text/csv')
    c.header('Content-Disposition', `attachment; filename="${fileName}"`)

    return c.body(csvContent)
  }

  return c.json({ error: 'Unsupported format' }, 400)
})

