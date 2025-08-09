import { type ExportData, ServerExportService } from '@/api/services/export.service'
import { exportRequestSchema } from '@/shared'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'

// Export data to various formats
export const coreExportRoutes = new Hono()
  .post('/export', zValidator('json', exportRequestSchema), async c => {
    try {
      const { title, format, columns, data, metadata } = c.req.valid('json')

      const exportData: ExportData = {
        title,
        columns,
        data,
        metadata: {
          ...metadata,
          exportedAt: new Date(),
        },
      }

      let buffer: Buffer
      let contentType: string

      switch (format) {
        case 'pdf':
          buffer = ServerExportService.generatePDF(exportData)
          contentType = 'application/pdf'
          break
        case 'xlsx':
          buffer = ServerExportService.generateExcel(exportData)
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          break
        case 'csv':
          buffer = ServerExportService.generateCSV(exportData)
          contentType = 'text/csv'
          break
        default:
          return c.json({ error: 'Unsupported format' }, 400)
      }

      const fileName = ServerExportService.getFileName(title, format)

      c.header('Content-Type', contentType)
      c.header('Content-Disposition', `attachment; filename="${fileName}"`)
      c.header('Content-Length', buffer.length.toString())

      return c.body(buffer)
    } catch (error) {
      console.error('Export error:', error)
      return c.json({ error: 'Export failed' }, 500)
    }
  })

  // Get export templates for different data types
  .get('/export/templates/:type', async c => {
    const { type } = c.req.param()

    const templates: Record<string, any> = {
      users: {
        columns: [
          { key: 'id', label: 'ID', width: 10 },
          { key: 'name', label: 'Name', width: 20 },
          { key: 'email', label: 'Email', width: 25 },
          { key: 'role', label: 'Role', width: 15 },
          { key: 'status', label: 'Status', width: 15 },
          { key: 'createdAt', label: 'Created At', width: 20 },
        ],
      },
      tenants: {
        columns: [
          { key: 'id', label: 'ID', width: 10 },
          { key: 'name', label: 'Name', width: 20 },
          { key: 'subdomain', label: 'Subdomain', width: 20 },
          { key: 'userCount', label: 'Users', width: 10 },
          { key: 'status', label: 'Status', width: 15 },
          { key: 'createdAt', label: 'Created At', width: 20 },
        ],
      },
      permissions: {
        columns: [
          { key: 'id', label: 'ID', width: 10 },
          { key: 'name', label: 'Permission', width: 25 },
          { key: 'resource', label: 'Resource', width: 20 },
          { key: 'action', label: 'Action', width: 15 },
          { key: 'description', label: 'Description', width: 30 },
        ],
      },
    }

    const template = templates[type]
    if (!template) {
      return c.json({ error: 'Template not found' }, 404)
    }

    return c.json(template)
  })
