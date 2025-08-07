import React, { useState } from 'react'
import { Download, FileSpreadsheet, FileText, File } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ExportService } from '@/lib/export.service'

interface ExportButtonProps {
  data: Record<string, any>[]
  columns: Array<{
    key: string
    label: string
    width?: number
  }>
  title: string
  metadata?: {
    exportedBy?: string
    exportedAt?: Date
    company?: string
    description?: string
  }
  variant?: 'default' | 'outline' | 'secondary' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  disabled?: boolean
  className?: string
}

export function ExportButton({
  data,
  columns,
  title,
  metadata,
  variant = 'outline',
  size = 'default',
  disabled = false,
  className,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    if (disabled || data.length === 0) return

    setIsExporting(true)
    try {
      const exportData = {
        title,
        columns,
        data,
        metadata: {
          ...metadata,
          exportedAt: new Date(),
        },
      }

      switch (format) {
        case 'pdf':
          ExportService.exportToPDF(exportData)
          break
        case 'excel':
          ExportService.exportToExcel(exportData)
          break
        case 'csv':
          ExportService.exportToCSV(exportData)
          break
      }
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  if (data.length === 0 && !disabled) {
    return (
      <Button variant={variant} size={size} disabled className={className}>
        <Download className="h-4 w-4 mr-2" />
        No Data to Export
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={disabled || isExporting}
          className={className}
        >
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <FileText className="h-4 w-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('excel')}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <File className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
