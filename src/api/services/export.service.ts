import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

export interface ExportColumn {
  key: string
  label: string
  width?: number
}

export interface ExportData {
  title: string
  columns: ExportColumn[]
  data: Record<string, any>[]
  metadata?: {
    exportedBy?: string
    exportedAt?: Date
    company?: string
    description?: string
  }
}

export class ServerExportService {
  static generatePDF(exportData: ExportData): Buffer {
    const { title, columns, data, metadata } = exportData
    const doc = new jsPDF()

    // Add title
    doc.setFontSize(16)
    doc.text(title, 14, 20)

    // Add metadata if provided
    let yPosition = 30
    if (metadata) {
      doc.setFontSize(10)
      if (metadata.company) {
        doc.text(`Company: ${metadata.company}`, 14, yPosition)
        yPosition += 7
      }
      if (metadata.description) {
        doc.text(`Description: ${metadata.description}`, 14, yPosition)
        yPosition += 7
      }
      if (metadata.exportedBy) {
        doc.text(`Exported by: ${metadata.exportedBy}`, 14, yPosition)
        yPosition += 7
      }
      doc.text(
        `Exported at: ${metadata.exportedAt?.toLocaleString() || new Date().toLocaleString()}`,
        14,
        yPosition
      )
      yPosition += 10
    }

    // Generate table
    autoTable(doc, {
      startY: yPosition,
      head: [columns.map(col => col.label)],
      body: data.map(row => columns.map(col => row[col.key] || '')),
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: 'bold',
      },
      columnStyles: columns.reduce(
        (acc, col, colIndex) => {
          if (col.width) {
            acc[colIndex] = { cellWidth: col.width }
          }
          return acc
        },
        {} as Record<number, { cellWidth: number }>
      ),
    })

    // Return PDF as buffer
    return Buffer.from(doc.output('arraybuffer'))
  }

  static generateExcel(exportData: ExportData): Buffer {
    const { title, columns, data, metadata } = exportData
    const wb = XLSX.utils.book_new()

    // Create worksheet data with headers
    const wsData = [columns.map(col => col.label)]

    // Add metadata rows if provided
    if (metadata) {
      if (metadata.company) wsData.unshift(['Company:', metadata.company])
      if (metadata.description) wsData.unshift(['Description:', metadata.description])
      if (metadata.exportedBy) wsData.unshift(['Exported by:', metadata.exportedBy])
      wsData.unshift([
        'Exported at:',
        metadata.exportedAt?.toLocaleString() || new Date().toLocaleString(),
      ])
      wsData.unshift([]) // Empty row separator
    }

    // Add data rows
    data.forEach(row => {
      wsData.push(columns.map(col => row[col.key] || ''))
    })

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData)

    // Set column widths based on content or specified widths
    const colWidths = columns.map((col, _index) => {
      if (col.width) return { wch: col.width }

      // Auto-calculate width based on content
      const maxLength = Math.max(
        col.label.length,
        ...data.map(row => String(row[col.key] || '').length)
      )
      return { wch: Math.min(maxLength + 2, 50) }
    })
    ws['!cols'] = colWidths

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Data')

    // Return Excel file as buffer
    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))
  }

  static generateCSV(exportData: ExportData): Buffer {
    const { columns, data } = exportData

    // Create CSV content
    const headers = columns.map(col => col.label).join(',')
    const rows = data
      .map(row =>
        columns
          .map(col => {
            const value = row[col.key] || ''
            // Escape quotes and wrap in quotes if contains comma or quote
            return typeof value === 'string' && (value.includes(',') || value.includes('"'))
              ? `"${value.replace(/"/g, '""')}"`
              : value
          })
          .join(',')
      )
      .join('\n')

    const csvContent = `${headers}\n${rows}`
    return Buffer.from(csvContent, 'utf-8')
  }

  static getFileName(title: string, format: 'pdf' | 'xlsx' | 'csv'): string {
    const sanitizedTitle = title.replace(/\s+/g, '_').toLowerCase()
    const timestamp = new Date().toISOString().split('T')[0]
    return `${sanitizedTitle}_${timestamp}.${format}`
  }
}
