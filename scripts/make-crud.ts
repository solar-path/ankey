#!/usr/bin/env bun

import { parseArgs } from 'node:util'
import { existsSync, mkdirSync } from 'node:fs'
import { SchemaGenerator } from './generators/schema-generator'
import { ControllerGenerator } from './generators/controller-generator'
import { RouteGenerator } from './generators/route-generator'
import { ComponentGenerator } from './generators/component-generator'
import { TypeGenerator } from './generators/type-generator'

// Simple console-based prompts
function prompt(message: string): Promise<string> {
  return new Promise(resolve => {
    process.stdout.write(message + ' ')
    process.stdin.setEncoding('utf8')
    process.stdin.once('data', data => {
      resolve(data.toString().trim())
    })
  })
}

function confirm(message: string, defaultValue = false): Promise<boolean> {
  const suffix = defaultValue ? ' (Y/n)' : ' (y/N)'
  return prompt(message + suffix).then(response => {
    if (!response) return defaultValue
    return response.toLowerCase().startsWith('y')
  })
}

interface Field {
  name: string
  type: 'text' | 'boolean' | 'integer' | 'decimal' | 'timestamp' | 'uuid' | 'jsonb'
  nullable: boolean
  unique: boolean
  defaultValue?: string
}

interface CrudOptions {
  name: string
  schema: 'core' | 'tenant'
  fields: Field[]
  generateController: boolean
  generateRoutes: boolean
  generateComponents: boolean
  runMigrations: boolean
}

class CrudGenerator {
  private options: CrudOptions

  constructor(options: CrudOptions) {
    this.options = options
  }

  async generate() {
    console.log('🚀 Starting CRUD generation...')

    try {
      // 1. Generate database schema
      if (this.options.schema) {
        console.log('📦 Generating database schema...')
        const schemaGenerator = new SchemaGenerator(this.options)
        await schemaGenerator.generate()
        console.log('✅ Database schema generated')
      }

      // 2. Generate API controller
      if (this.options.generateController) {
        console.log('🔧 Generating Hono API controller...')
        const controllerGenerator = new ControllerGenerator(this.options)
        await controllerGenerator.generate()
        console.log('✅ Hono controller generated')
      }

      // 3. Generate TypeScript types
      console.log('📝 Generating TypeScript types...')
      const typeGenerator = new TypeGenerator(this.options)
      await typeGenerator.generate()
      console.log('✅ TypeScript types generated')

      // 4. Generate TanStack Router routes
      if (this.options.generateRoutes) {
        console.log('🛣️  Generating TanStack Router routes...')
        const routeGenerator = new RouteGenerator(this.options)
        await routeGenerator.generate()
        console.log('✅ Router routes generated')
      }

      // 5. Generate React components
      if (this.options.generateComponents) {
        console.log('⚛️  Generating React components...')
        const componentGenerator = new ComponentGenerator(this.options)
        await componentGenerator.generate()
        console.log('✅ React components generated')
      }

      // 6. Run database migrations if requested
      if (this.options.runMigrations) {
        console.log('🗄️  Running database migrations...')
        await this.runMigrations()
        console.log('✅ Database migrations completed')
      }

      console.log(`\n✅ CRUD for ${this.options.name} generated successfully!`)

      console.log(`\nNext steps:
• Update your database by running: bun run db:push:${this.options.schema}
• Register the new routes in src/api/api.ts if not already done
• Add navigation links to your sidebar/menu if needed`)
    } catch (error) {
      console.error('❌ Error generating CRUD:', error)
      process.exit(1)
    }
  }

  private async runMigrations() {
    try {
      const { $ } = await import('bun')
      await $`bun run db:push:${this.options.schema}`.quiet()
    } catch (error) {
      console.warn('Migration failed:', error)
      log.warn('Please run migrations manually: bun run db:push:' + this.options.schema)
    }
  }
}

async function promptForOptions(): Promise<CrudOptions> {
  console.log('🚀 CRUD Generator')

  let name = ''
  while (!name) {
    name = await prompt('What is the name of your model? (e.g., Product):')
    if (!name) {
      console.log('❌ Model name is required')
      continue
    }
    if (!/^[A-Z][a-zA-Z0-9]*$/.test(name)) {
      console.log('❌ Model name must be PascalCase (e.g., Product, UserProfile)')
      name = ''
      continue
    }
  }

  let schema: 'core' | 'tenant' = 'tenant'
  const schemaChoice = await prompt(
    'Which database schema? (1) Tenant (multi-tenant data) (2) Core (system-wide) [1]:'
  )
  if (schemaChoice === '2') {
    schema = 'core'
  }

  const fields: Field[] = []

  // Always add a title field by default
  fields.push({
    name: 'title',
    type: 'text',
    nullable: false,
    unique: false,
  })

  console.log('ℹ️  Default field "title" added. Add more fields:')

  let addMoreFields = true
  while (addMoreFields) {
    const fieldName = await prompt('Field name (or press Enter to finish):')

    if (!fieldName) {
      addMoreFields = false
      continue
    }

    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(fieldName)) {
      console.log('❌ Field name must be valid identifier (letters, numbers, underscore)')
      continue
    }

    if (fields.some(f => f.name === fieldName)) {
      console.log('❌ Field name already exists')
      continue
    }

    console.log(
      'Field types: (1) Text (2) Boolean (3) Integer (4) Decimal (5) Timestamp (6) UUID (7) JSON'
    )
    const typeChoice = await prompt(`Type for field "${fieldName}" [1]:`)

    let fieldType: Field['type'] = 'text'
    switch (typeChoice) {
      case '2':
        fieldType = 'boolean'
        break
      case '3':
        fieldType = 'integer'
        break
      case '4':
        fieldType = 'decimal'
        break
      case '5':
        fieldType = 'timestamp'
        break
      case '6':
        fieldType = 'uuid'
        break
      case '7':
        fieldType = 'jsonb'
        break
    }

    const nullable = await confirm(`Should "${fieldName}" be nullable?`, false)
    const unique = await confirm(`Should "${fieldName}" be unique?`, false)

    fields.push({
      name: fieldName,
      type: fieldType,
      nullable,
      unique,
    })

    const continueAdding = await confirm('Add another field?', true)
    addMoreFields = continueAdding
  }

  const generateController = await confirm('Generate Hono API controller?', true)
  const generateRoutes = await confirm('Generate TanStack Router routes?', true)
  const generateComponents = await confirm('Generate React components?', true)
  const runMigrations = await confirm('Run database migrations now?', false)

  return {
    name,
    schema,
    fields,
    generateController,
    generateRoutes,
    generateComponents,
    runMigrations,
  }
}

async function parseFieldsString(fieldsString: string): Promise<Field[]> {
  const fields: Field[] = []

  // Always add title field
  fields.push({
    name: 'title',
    type: 'text',
    nullable: false,
    unique: false,
  })

  if (!fieldsString) return fields

  const fieldDefs = fieldsString.split(',')
  for (const fieldDef of fieldDefs) {
    const [nameAndType, ...options] = fieldDef.trim().split(':')
    const [name, type = 'text'] = nameAndType.split(':')

    if (!name) continue

    const field: Field = {
      name: name.trim(),
      type: type.trim() as Field['type'],
      nullable: options.includes('nullable'),
      unique: options.includes('unique'),
    }

    fields.push(field)
  }

  return fields
}

async function main() {
  const { values: args } = parseArgs({
    args: process.argv.slice(2),
    options: {
      name: { type: 'string', short: 'n' },
      schema: { type: 'string', short: 's' },
      fields: { type: 'string', short: 'f' },
      help: { type: 'boolean', short: 'h' },
    },
  })

  if (args.help) {
    console.log(`
Usage: bun run make:crud [options]

Options:
  -n, --name <name>      Model name (PascalCase)
  -s, --schema <schema>  Database schema (core|tenant)
  -f, --fields <fields>  Comma-separated field definitions
  -h, --help            Show this help message

Examples:
  bun run make:crud
  bun run make:crud --name=Product --schema=tenant
  bun run make:crud -n Product -s tenant -f "description:text:nullable,price:decimal,isActive:boolean"

Field format: name:type[:nullable][:unique]
Field types: text, boolean, integer, decimal, timestamp, uuid, jsonb
`)
    process.exit(0)
  }

  let options: CrudOptions

  if (args.name) {
    // Non-interactive mode
    const fields = args.fields
      ? await parseFieldsString(args.fields)
      : [{ name: 'title', type: 'text' as const, nullable: false, unique: false }]

    options = {
      name: args.name,
      schema: (args.schema as 'core' | 'tenant') || 'tenant',
      fields,
      generateController: true,
      generateRoutes: true,
      generateComponents: true,
      runMigrations: false,
    }
  } else {
    // Interactive mode
    options = await promptForOptions()
  }

  const generator = new CrudGenerator(options)
  await generator.generate()
}

// Handle CLI invocation
if (import.meta.main) {
  main().catch(console.error)
}

export { CrudGenerator, type CrudOptions, type Field }
