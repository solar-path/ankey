'use client'

import * as React from 'react'
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  ChevronDown,
  MoreHorizontal,
  Pencil,
  Trash,
  Plus,
  FileSpreadsheet,
  FileText,
  Upload,
  RefreshCw,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { type DataTableProps } from '@/shared'

export function QDataTable<TData, TValue>({
  columns,
  data,
  onDelete,
  onEdit,
  onCreate,
  onExportPdf,
  onExportExcel,
  onImport,
  onSync,
  title,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState('')

  // Add selection and actions columns
  const enhancedColumns = React.useMemo(() => {
    const selectColumn: ColumnDef<TData, any> = {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          ref={(el: HTMLInputElement | null) => {
            if (el) el.indeterminate = table.getIsSomePageRowsSelected()
          }}
          onChange={e => table.toggleAllPageRowsSelected(!!e.target.checked)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onChange={e => row.toggleSelected(!!e.target.checked)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    }

    const actionsColumn: ColumnDef<TData, any> = {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(row.original)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem onClick={() => onDelete([row.original])}>
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    }

    return [selectColumn, ...columns, actionsColumn]
  }, [columns, onEdit, onDelete])

  const table = useReactTable({
    data,
    columns: enhancedColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    enableRowSelection: true,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  })

  return (
    <div className="w-full">
      {title && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
      )}
      <div className="flex items-center justify-between py-4">
        <Input
          placeholder="Filter all columns..."
          value={globalFilter ?? ''}
          onChange={event => setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />

        <div className="flex items-center space-x-2">
          <TooltipProvider>
            {onCreate && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="default" onClick={onCreate}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Create new</TooltipContent>
              </Tooltip>
            )}

            {onExportExcel && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={onExportExcel}>
                    <FileSpreadsheet className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export to Excel</TooltipContent>
              </Tooltip>
            )}

            {onExportPdf && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={onExportPdf}>
                    <FileText className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export to PDF</TooltipContent>
              </Tooltip>
            )}

            {onImport && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={onImport}>
                    <Upload className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Import</TooltipContent>
              </Tooltip>
            )}

            {onSync && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={onSync}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Sync</TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>

          {table.getFilteredSelectedRowModel().rows.length > 0 && onDelete && (
            <Button
              variant="destructive"
              onClick={() =>
                onDelete(table.getFilteredSelectedRowModel().rows.map(row => row.original))
              }
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete Selected ({table.getFilteredSelectedRowModel().rows.length})
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter(column => column.getCanHide())
                .map(column => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={value => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={enhancedColumns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
