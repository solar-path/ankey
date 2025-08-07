import * as XLSX from 'xlsx'
import Papa from 'papaparse'

interface ImportColumn {
  key: string
  label: string
  required?: boolean
  type?: 'string' | 'number' | 'date' | 'boolean'
  validator?: (value: any) => boolean
  transform?: (value: any) => any
}

export interface ImportResult<T = any> {
  success: boolean
  data: T[]
  errors: ImportError[]
  summary: {
    totalRows: number
    validRows: number
    errorRows: number
    newRecords: number
    updatedRecords: number
  }
}

interface ImportError {
  row: number
  column?: string
  message: string
  value?: any
}

interface ImportOptions {
  skipFirstRow?: boolean
  syncMode?: 'create-only' | 'update-only' | 'create-update'
  keyColumn?: string // Column to use for matching existing records
}

export class ImportService {
  static async parseExcelFile<T = any>(
    file: File,
    columns: ImportColumn[],
    options: ImportOptions = {}
  ): Promise<ImportResult<T>> {
    return new Promise(resolve => {
      const reader = new FileReader()

      reader.onload = e => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

          const result = this.processImportData(jsonData, columns, options)
          resolve(result)
        } catch (error) {
          resolve({
            success: false,
            data: [],
            errors: [{ row: 0, message: `Failed to parse Excel file: ${error}` }],
            summary: {
              totalRows: 0,
              validRows: 0,
              errorRows: 1,
              newRecords: 0,
              updatedRecords: 0,
            },
          })
        }
      }

      reader.onerror = () => {
        resolve({
          success: false,
          data: [],
          errors: [{ row: 0, message: 'Failed to read file' }],
          summary: {
            totalRows: 0,
            validRows: 0,
            errorRows: 1,
            newRecords: 0,
            updatedRecords: 0,
          },
        })
      }

      reader.readAsArrayBuffer(file)
    })
  }

  static async parseCSVFile<T = any>(
    file: File,
    columns: ImportColumn[],
    options: ImportOptions = {}
  ): Promise<ImportResult<T>> {
    return new Promise(resolve => {
      Papa.parse(file, {
        complete: results => {
          const result = this.processImportData(results.data as any[][], columns, options)
          resolve(result)
        },
        error: error => {
          resolve({
            success: false,
            data: [],
            errors: [{ row: 0, message: `Failed to parse CSV file: ${error.message}` }],
            summary: {
              totalRows: 0,
              validRows: 0,
              errorRows: 1,
              newRecords: 0,
              updatedRecords: 0,
            },
          })
        },
      })
    })
  }

  private static processImportData<T>(
    rawData: any[][],
    columns: ImportColumn[],
    options: ImportOptions
  ): ImportResult<T> {
    const errors: ImportError[] = []
    const validData: T[] = []
    let startRow = 0

    // Skip header row if specified
    if (options.skipFirstRow !== false) {
      startRow = 1
    }

    // Process each data row
    for (let rowIndex = startRow; rowIndex < rawData.length; rowIndex++) {
      const row = rawData[rowIndex]
      const rowData: any = {}
      let hasError = false

      // Skip empty rows
      if (!row || row.every(cell => !cell && cell !== 0)) {
        continue
      }

      // Process each column
      columns.forEach((column, columnIndex) => {
        const cellValue = row[columnIndex]
        const actualRowNumber = rowIndex + 1

        // Check required fields
        if (
          column.required &&
          (cellValue === undefined || cellValue === null || cellValue === '')
        ) {
          errors.push({
            row: actualRowNumber,
            column: column.label,
            message: `${column.label} is required`,
            value: cellValue,
          })
          hasError = true
          return
        }

        // Transform and validate value
        let processedValue = cellValue
        try {
          // Apply transformation if provided
          if (column.transform) {
            processedValue = column.transform(cellValue)
          }

          // Type conversion
          if (processedValue !== undefined && processedValue !== null && processedValue !== '') {
            switch (column.type) {
              case 'number':
                processedValue = Number(processedValue)
                if (isNaN(processedValue)) {
                  throw new Error(`Invalid number format`)
                }
                break
              case 'date':
                processedValue = new Date(processedValue)
                if (isNaN(processedValue.getTime())) {
                  throw new Error(`Invalid date format`)
                }
                break
              case 'boolean':
                processedValue = Boolean(processedValue)
                break
              default:
                processedValue = String(processedValue)
            }
          }

          // Apply custom validator if provided
          if (column.validator && processedValue !== undefined && processedValue !== null) {
            if (!column.validator(processedValue)) {
              throw new Error(`Validation failed for ${column.label}`)
            }
          }

          rowData[column.key] = processedValue
        } catch (error) {
          errors.push({
            row: actualRowNumber,
            column: column.label,
            message: `${column.label}: ${error}`,
            value: cellValue,
          })
          hasError = true
        }
      })

      if (!hasError) {
        validData.push(rowData as T)
      }
    }

    return {
      success: errors.length === 0,
      data: validData,
      errors,
      summary: {
        totalRows: rawData.length - startRow,
        validRows: validData.length,
        errorRows: errors.length,
        newRecords: validData.length, // This would be calculated based on sync logic
        updatedRecords: 0, // This would be calculated based on sync logic
      },
    }
  }

  static async syncData<T extends Record<string, any>>(
    importedData: T[],
    existingData: T[],
    keyColumn: string,
    syncMode: 'create-only' | 'update-only' | 'create-update' = 'create-update'
  ): Promise<{
    toCreate: T[]
    toUpdate: T[]
    unchanged: T[]
  }> {
    const toCreate: T[] = []
    const toUpdate: T[] = []
    const unchanged: T[] = []

    // Create a map of existing data by key for faster lookup
    const existingMap = new Map(existingData.map(item => [item[keyColumn], item]))

    for (const importedItem of importedData) {
      const key = importedItem[keyColumn]
      const existingItem = existingMap.get(key)

      if (!existingItem) {
        // New record
        if (syncMode === 'create-only' || syncMode === 'create-update') {
          toCreate.push(importedItem)
        }
      } else {
        // Existing record - check if data has changed
        const hasChanges = Object.keys(importedItem).some(
          field => field !== keyColumn && importedItem[field] !== existingItem[field]
        )

        if (hasChanges) {
          if (syncMode === 'update-only' || syncMode === 'create-update') {
            toUpdate.push({ ...importedItem, id: existingItem.id }) // Preserve existing ID
          }
        } else {
          unchanged.push(existingItem)
        }
      }
    }

    return { toCreate, toUpdate, unchanged }
  }
}
