import { z } from '@hono/zod-openapi'

// Generic API Response wrapper
export const ApiResponseSchema = <T extends z.ZodType>(dataSchema?: T) =>
  z.object({
    success: z.boolean().openapi({
      example: true,
      description: 'Indicates if the request was successful',
    }),
    data: dataSchema ? dataSchema.optional().openapi({
      description: 'Response data when successful',
    }) : z.any().optional().openapi({
      description: 'Response data when successful',
    }),
    error: z.string().optional().openapi({
      description: 'Error message when request fails',
      example: 'Invalid credentials',
    }),
    details: z.any().optional().openapi({
      description: 'Additional error details or validation errors',
    }),
  })

// Pagination parameters
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1).openapi({
    param: {
      name: 'page',
      in: 'query',
      description: 'Page number',
      example: 1,
    },
  }),
  limit: z.coerce.number().min(1).max(100).default(10).openapi({
    param: {
      name: 'limit',
      in: 'query',
      description: 'Items per page',
      example: 10,
    },
  }),
  sortBy: z.string().optional().openapi({
    param: {
      name: 'sortBy',
      in: 'query',
      description: 'Field to sort by',
      example: 'createdAt',
    },
  }),
  sortOrder: z.enum(['asc', 'desc']).default('desc').openapi({
    param: {
      name: 'sortOrder',
      in: 'query',
      description: 'Sort order',
      example: 'desc',
    },
  }),
})

// Paginated response
export const PaginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    success: z.boolean(),
    data: z.object({
      items: z.array(itemSchema),
      pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
        hasNext: z.boolean(),
        hasPrev: z.boolean(),
      }),
    }),
  })

// Common error responses
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  details: z.any().optional(),
})

export const ValidationErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.literal('Validation error'),
  details: z.object({
    fieldErrors: z.record(z.array(z.string())),
    formErrors: z.array(z.string()),
  }),
})

// UUID parameter schema
export const UUIDParamSchema = z.object({
  id: z.string().uuid().openapi({
    param: {
      name: 'id',
      in: 'path',
      description: 'Resource UUID',
      example: '123e4567-e89b-12d3-a456-426614174000',
    },
  }),
})

// Timestamp schemas
export const TimestampSchema = z.object({
  createdAt: z.string().datetime().openapi({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00Z',
  }),
  updatedAt: z.string().datetime().openapi({
    description: 'Last update timestamp',
    example: '2024-01-01T00:00:00Z',
  }),
})

// Audit fields
export const AuditFieldsSchema = z.object({
  createdBy: z.string().uuid().optional().openapi({
    description: 'UUID of user who created the resource',
  }),
  updatedBy: z.string().uuid().optional().openapi({
    description: 'UUID of user who last updated the resource',
  }),
  deletedAt: z.string().datetime().optional().openapi({
    description: 'Soft delete timestamp',
  }),
})

// File upload schema
export const FileUploadSchema = z.object({
  file: z.any().openapi({
    type: 'string',
    format: 'binary',
    description: 'File to upload',
  }),
  purpose: z.enum(['avatar', 'logo', 'document', 'import']).openapi({
    description: 'Purpose of the uploaded file',
  }),
})

// Bulk operation schemas
export const BulkOperationSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).openapi({
    description: 'Array of resource UUIDs to operate on',
    example: ['id1', 'id2', 'id3'],
  }),
})

export const BulkOperationResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    succeeded: z.array(z.string()),
    failed: z.array(z.object({
      id: z.string(),
      error: z.string(),
    })),
    total: z.number(),
    successCount: z.number(),
    failureCount: z.number(),
  }),
})

// Search query schema
export const SearchQuerySchema = z.object({
  q: z.string().min(1).openapi({
    param: {
      name: 'q',
      in: 'query',
      description: 'Search query',
      example: 'john doe',
    },
  }),
  fields: z.array(z.string()).optional().openapi({
    param: {
      name: 'fields',
      in: 'query',
      description: 'Fields to search in',
      example: ['name', 'email'],
    },
  }),
})

// Export all schemas
export const CommonSchemas = {
  ApiResponse: ApiResponseSchema,
  PaginationQuery: PaginationQuerySchema,
  PaginatedResponse: PaginatedResponseSchema,
  ErrorResponse: ErrorResponseSchema,
  ValidationErrorResponse: ValidationErrorResponseSchema,
  UUIDParam: UUIDParamSchema,
  Timestamp: TimestampSchema,
  AuditFields: AuditFieldsSchema,
  FileUpload: FileUploadSchema,
  BulkOperation: BulkOperationSchema,
  BulkOperationResponse: BulkOperationResponseSchema,
  SearchQuery: SearchQuerySchema,
}