import { readFileSync, writeFileSync } from 'node:fs'
import type { CrudOptions, Field } from '../make-crud'

export class SchemaGenerator {
  private options: CrudOptions

  constructor(options: CrudOptions) {
    this.options = options
  }

  async generate() {
    const schemaPath = `src/api/db/schemas/${this.options.schema}.drizzle.ts`
    const schemaContent = readFileSync(schemaPath, 'utf-8')

    // Generate table definition
    const tableDefinition = this.generateTableDefinition()
    const relationDefinition = this.generateRelationDefinition()

    // Find insertion point for table definition
    const tableInsertionPoint = this.findTableInsertionPoint(schemaContent)
    const relationInsertionPoint = this.findRelationInsertionPoint(schemaContent)

    // Insert table definition
    let newContent = this.insertAtPosition(schemaContent, tableInsertionPoint, tableDefinition)

    // Insert relation definition
    newContent = this.insertAtPosition(
      newContent,
      relationInsertionPoint + tableDefinition.length,
      relationDefinition
    )

    // Update imports if needed
    newContent = this.updateImports(newContent)

    writeFileSync(schemaPath, newContent)
  }

  private generateTableDefinition(): string {
    const tableName = this.getTableName()
    const fields = this.generateFieldDefinitions()

    return `
// ${this.options.name} table
export const ${this.getTableVariableName()} = pgTable('${tableName}', {
  id: uuid('id').defaultRandom().primaryKey(),
${fields}
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})
`
  }

  private generateRelationDefinition(): string {
    const tableVariable = this.getTableVariableName()
    const relationName = `${tableVariable}Relations`

    return `
export const ${relationName} = relations(${tableVariable}, ({ one, many }) => ({
  // Add relations here as needed
}))
`
  }

  private generateFieldDefinitions(): string {
    return this.options.fields.map(field => this.generateFieldDefinition(field)).join('')
  }

  private generateFieldDefinition(field: Field): string {
    const drizzleType = this.getDrizzleType(field.type)
    const fieldName = field.name
    let definition = `  ${fieldName}: ${drizzleType}('${fieldName}')`

    // Add constraints
    if (!field.nullable) {
      definition += '.notNull()'
    }

    if (field.unique) {
      definition += '.unique()'
    }

    // Add default values for specific types
    if (field.type === 'boolean' && !field.nullable) {
      definition += '.default(false)'
    }

    if (field.defaultValue) {
      definition += `.default(${field.defaultValue})`
    }

    definition += ',\n'

    return definition
  }

  private getDrizzleType(fieldType: Field['type']): string {
    switch (fieldType) {
      case 'text':
        return 'text'
      case 'boolean':
        return 'boolean'
      case 'integer':
        return 'integer'
      case 'decimal':
        return 'decimal'
      case 'timestamp':
        return 'timestamp'
      case 'uuid':
        return 'uuid'
      case 'jsonb':
        return 'jsonb'
      default:
        return 'text'
    }
  }

  private getTableName(): string {
    const prefix = this.options.schema === 'core' ? 'core_' : ''
    return prefix + this.camelToSnake(this.pluralize(this.options.name))
  }

  private getTableVariableName(): string {
    return this.camelCase(this.pluralize(this.options.name))
  }

  private findTableInsertionPoint(content: string): number {
    // Look for the last table definition to insert after it
    const tablePattern = /export const \w+ = pgTable\([^}]+}\)\n/g
    let lastMatch: RegExpExecArray | null = null
    let match: RegExpExecArray | null

    while ((match = tablePattern.exec(content)) !== null) {
      lastMatch = match
    }

    if (lastMatch) {
      return lastMatch.index + lastMatch[0].length
    }

    // If no tables found, insert before relations
    const relationPattern = /\/\/ Relations/
    const relationMatch = content.match(relationPattern)
    if (relationMatch && relationMatch.index) {
      return relationMatch.index
    }

    // Fallback: insert before export statements
    const exportPattern = /export const \w+Relations/
    const exportMatch = content.match(exportPattern)
    if (exportMatch && exportMatch.index) {
      return exportMatch.index
    }

    // Ultimate fallback: end of file
    return content.length
  }

  private findRelationInsertionPoint(content: string): number {
    // Look for the last relation definition
    const relationPattern = /export const \w+Relations = relations\([^}]+}\)\)\n/g
    let lastMatch: RegExpExecArray | null = null
    let match: RegExpExecArray | null

    while ((match = relationPattern.exec(content)) !== null) {
      lastMatch = match
    }

    if (lastMatch) {
      return lastMatch.index + lastMatch[0].length
    }

    // If no relations found, insert at the end
    return content.length
  }

  private insertAtPosition(content: string, position: number, insertion: string): string {
    return content.slice(0, position) + insertion + content.slice(position)
  }

  private updateImports(content: string): string {
    // Check if we need to add any new imports
    const currentImports =
      content.match(/import\s*{\s*([^}]+)\s*}\s*from\s*['"]drizzle-orm\/pg-core['"]/)?.[1] || ''
    const requiredTypes = new Set(['pgTable', 'text', 'timestamp', 'uuid'])

    // Add required types based on fields
    this.options.fields.forEach(field => {
      const drizzleType = this.getDrizzleType(field.type)
      requiredTypes.add(drizzleType)
    })

    const currentImportsArray = currentImports
      .split(',')
      .map(s => s.trim())
      .filter(s => s)
    const missingImports = [...requiredTypes].filter(type => !currentImportsArray.includes(type))

    if (missingImports.length > 0) {
      const allImports = [...currentImportsArray, ...missingImports].sort()
      const newImportLine = `import { ${allImports.join(', ')} } from 'drizzle-orm/pg-core'`
      return content.replace(
        /import\s*{\s*[^}]+\s*}\s*from\s*['"]drizzle-orm\/pg-core['"]/,
        newImportLine
      )
    }

    return content
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, '')
  }

  private camelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1)
  }

  private pluralize(word: string): string {
    // Simple pluralization - can be enhanced
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
