import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontalIcon, PlusIcon, PencilIcon, TrashIcon } from 'lucide-react'

interface Column<T> {
  key: keyof T | string
  header: string
  cell?: (row: T) => React.ReactNode
  accessor?: (row: T) => any
}

interface SimpleDataTableProps<T> {
  title?: string
  data: T[]
  columns: Column<T>[]
  onEdit?: (row: T) => void
  onDelete?: (rows: T[]) => void
  onCreate?: () => void
  getRowId?: (row: T) => string
}

export function SimpleDataTable<T extends Record<string, any>>({
  title,
  data,
  columns,
  onEdit,
  onDelete,
  onCreate,
  getRowId = row => row.id || Math.random().toString(),
}: SimpleDataTableProps<T>) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')

  // Filter data based on search term
  const filteredData = data.filter(row =>
    columns.some(column => {
      const value = column.accessor
        ? column.accessor(row)
        : column.key === 'string'
          ? (row as any)[column.key]
          : row[column.key as keyof T]
      return String(value).toLowerCase().includes(searchTerm.toLowerCase())
    })
  )

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(filteredData.map(row => getRowId(row))))
    } else {
      setSelectedRows(new Set())
    }
  }

  const handleSelectRow = (rowId: string, checked: boolean) => {
    const newSelected = new Set(selectedRows)
    if (checked) {
      newSelected.add(rowId)
    } else {
      newSelected.delete(rowId)
    }
    setSelectedRows(newSelected)
  }

  const handleDelete = () => {
    if (onDelete && selectedRows.size > 0) {
      const rowsToDelete = filteredData.filter(row => selectedRows.has(getRowId(row)))
      onDelete(rowsToDelete)
      setSelectedRows(new Set())
    }
  }

  const getCellValue = (row: T, column: Column<T>) => {
    if (column.cell) {
      return column.cell(row)
    }
    if (column.accessor) {
      return column.accessor(row)
    }
    return row[column.key as keyof T]
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between py-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          {title && <h2 className="text-xl font-semibold whitespace-nowrap">{title}</h2>}
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full md:w-64"
          />
        </div>
        <div className="flex items-center space-x-2">
          {onCreate && (
            <Button variant="default" onClick={onCreate} className="flex items-center space-x-2">
              <PlusIcon className="h-4 w-4" />
              <span>Create</span>
            </Button>
          )}
          {onDelete && selectedRows.size > 0 && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="flex items-center space-x-2"
            >
              <TrashIcon className="h-4 w-4" />
              <span>Delete ({selectedRows.size})</span>
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {(onDelete || onEdit) && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedRows.size === filteredData.length && filteredData.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              )}
              {columns.map((column, index) => (
                <TableHead key={index}>{column.header}</TableHead>
              ))}
              {onEdit && <TableHead className="w-12">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length ? (
              filteredData.map((row, index) => {
                const rowId = getRowId(row)
                return (
                  <TableRow key={rowId}>
                    {(onDelete || onEdit) && (
                      <TableCell>
                        <Checkbox
                          checked={selectedRows.has(rowId)}
                          onCheckedChange={checked => handleSelectRow(rowId, !!checked)}
                        />
                      </TableCell>
                    )}
                    {columns.map((column, colIndex) => (
                      <TableCell key={colIndex}>{getCellValue(row, column)}</TableCell>
                    ))}
                    {onEdit && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontalIcon className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => onEdit(row)}>
                              <PencilIcon className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (onEdit ? 1 : 0) + (onDelete || onEdit ? 1 : 0)}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
