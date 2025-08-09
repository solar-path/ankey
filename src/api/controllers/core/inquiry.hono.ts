import { AuditService } from '@/api/audit.settings'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod/v4'

const inquirySchema = z.object({
  email: z.string().email('Invalid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  attachments: z.array(z.string()).optional(),
})

const findInquirySchema = z.object({
  id: z.string().min(1, 'Inquiry ID is required'),
})

const auditService = new AuditService()

// Submit inquiry
export const inquiryRoutes = new Hono()
.post('/submit', zValidator('json', inquirySchema), async c => {
  const data = c.req.valid('json')

  try {
    // Generate inquiry ID
    const inquiryId = `INQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // In a real app, you would:
    // 1. Store in database
    // 2. Send notification email to admins
    // 3. Process attachments
    // 4. Create audit log

    // For now, let's simulate the process
    const inquiry = {
      id: inquiryId,
      email: data.email,
      message: data.message,
      attachments: data.attachments || [],
      status: 'submitted',
      submittedAt: new Date(),
    }

    console.log('New inquiry submitted:', inquiry)

    // Log the inquiry submission
    await auditService.log({
      action: 'inquiry.submit',
      resource: 'inquiry',
      resourceId: inquiryId,
      newValues: inquiry,
      ipAddress: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
      userAgent: c.req.header('user-agent') || 'unknown',
    })

    return c.json(
      {
        success: true,
        data: {
          inquiryId,
          message: 'Your inquiry has been submitted successfully. We will respond within 24 hours.',
        },
      },
      201
    )
  } catch (error) {
    console.error('Error submitting inquiry:', error)
    return c.json(
      {
        success: false,
        error: 'Failed to submit inquiry. Please try again later.',
      },
      500
    )
  }
})

// Find inquiry by ID
.post('/find', zValidator('json', findInquirySchema), async c => {
  const { id } = c.req.valid('json')

  try {
    // In a real app, you would query the database
    // For now, let's simulate finding an inquiry

    // Mock inquiry data
    const inquiry = {
      id,
      email: 'example@example.com',
      message: 'This is a sample inquiry message.',
      status: 'in-progress',
      submittedAt: new Date('2024-01-15T10:00:00Z'),
      updatedAt: new Date('2024-01-16T14:30:00Z'),
      response:
        'Thank you for your inquiry. We are reviewing your request and will get back to you soon.',
    }

    // Log the inquiry lookup
    await auditService.log({
      action: 'inquiry.find',
      resource: 'inquiry',
      resourceId: id,
      ipAddress: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
      userAgent: c.req.header('user-agent') || 'unknown',
    })

    return c.json({
      success: true,
      data: inquiry,
    })
  } catch (error) {
    console.error('Error finding inquiry:', error)
    return c.json(
      {
        success: false,
        error: 'Inquiry not found or an error occurred.',
      },
      404
    )
  }
})

// Get all inquiries (admin only)
.get('/list', async c => {
  try {
    // In a real app, you would:
    // 1. Check admin authentication
    // 2. Query database for all inquiries
    // 3. Support pagination

    const mockInquiries = [
      {
        id: 'INQ-1234567890-abc123',
        email: 'customer1@example.com',
        message: 'I need help with setting up my workspace.',
        status: 'open',
        submittedAt: new Date('2024-01-15T10:00:00Z'),
      },
      {
        id: 'INQ-1234567891-def456',
        email: 'customer2@example.com',
        message: 'Question about billing and pricing.',
        status: 'in-progress',
        submittedAt: new Date('2024-01-16T11:30:00Z'),
      },
    ]

    return c.json({
      success: true,
      data: mockInquiries,
    })
  } catch (error) {
    console.error('Error fetching inquiries:', error)
    return c.json(
      {
        success: false,
        error: 'Failed to fetch inquiries.',
      },
      500
    )
  }
})

// Update inquiry status (admin only)
.put(
  '/:id/status',
  zValidator(
    'json',
    z.object({
      status: z.enum(['open', 'in-progress', 'resolved', 'closed']),
      response: z.string().optional(),
    })
  ),
  async c => {
    const inquiryId = c.req.param('id')
    const { status, response } = c.req.valid('json')

    try {
      // In a real app, you would:
      // 1. Check admin authentication
      // 2. Update in database
      // 3. Send email notification to customer

      console.log(`Updating inquiry ${inquiryId} status to ${status}`)

      const updatedInquiry = {
        id: inquiryId,
        status,
        response,
        updatedAt: new Date(),
      }

      // Log the status update
      await auditService.log({
        action: 'inquiry.status_update',
        resource: 'inquiry',
        resourceId: inquiryId,
        newValues: updatedInquiry,
        ipAddress: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
        userAgent: c.req.header('user-agent') || 'unknown',
      })

      return c.json({
        success: true,
        data: updatedInquiry,
      })
    } catch (error) {
      console.error('Error updating inquiry status:', error)
      return c.json(
        {
          success: false,
          error: 'Failed to update inquiry status.',
        },
        500
      )
    }
  }
)

