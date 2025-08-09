import { readFileSync, writeFileSync } from 'node:fs'
import type { CrudOptions, Field } from '../make-crud'

export class TypeGenerator {
  private options: CrudOptions

  constructor(options: CrudOptions) {
    this.options = options
  }

  async generate() {
    await this.generateTypes()
  }

  private async generateTypes() {
    const typesPath = 'src/shared/index.ts'
    let content = ''

    // Read existing content if file exists
    try {
      content = readFileSync(typesPath, 'utf-8')
    } catch {
      // File doesn't exist, start with empty content
      content = '// Generated types\n\n'
    }

    // Generate types
    const modelTypes = this.generateModelTypes()

    // Append new types (you could be smarter about checking for duplicates)
    const newContent = content + '\n' + modelTypes

    writeFileSync(typesPath, newContent)
  }

  private generateModelTypes(): string {
    const modelName = this.options.name
    const pluralModelName = this.pluralize(modelName)

    return `// ${modelName} types
export interface ${modelName} {
  id: string
${this.generateTypeFields()}
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ${modelName}CreateInput {
${this.generateCreateInputFields()}
}

export interface ${modelName}UpdateInput {
${this.generateUpdateInputFields()}
}

export interface ${modelName}Response {
  success: boolean
  data?: ${modelName}
  error?: string
}

export interface ${pluralModelName}Response {
  success: boolean
  data?: {
    items: ${modelName}[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
    view: 'active' | 'trashed' | 'all'
  }
  error?: string
}

export interface ${modelName}BulkActionRequest {
  ids: string[]
  action: 'delete' | 'restore' | 'force-delete'
}

export interface ${modelName}BulkActionResponse {
  success: boolean
  message: string
  count?: number
}
`
  }

  private generateTypeFields(): string {
    return this.options.fields
      .map(field => `  ${field.name}: ${this.getTypeScriptType(field)}`)
      .join('\n')
  }

  private generateCreateInputFields(): string {
    return this.options.fields
      .map(field => `  ${field.name}: ${this.getTypeScriptType(field)}`)
      .join('\n')
  }

  private generateUpdateInputFields(): string {
    return this.options.fields
      .map(field => `  ${field.name}?: ${this.getTypeScriptType(field)}`)
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
      case 'uuid':
        baseType = 'string'
        break
      case 'jsonb':
        baseType = 'any'
        break
      default:
        baseType = 'string'
    }

    return field.nullable ? `${baseType} | null` : baseType
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
