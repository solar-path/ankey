import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataTable } from '@/components/ui/data-table'
import { MoreHorizontal, Edit, Trash2, RotateCcw } from 'lucide-react'

export interface ProductItem {
  id: string
  title: string
  description: string | null
  price: string
  isActive: string
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

interface ProductDataTableProps {
  data: ProductItem[]
  isLoading?: boolean
  onEdit?: (item: ProductItem) => void
  onDelete?: (id: string) => void
  onRestore?: (id: string) => void
  view?: 'active' | 'trashed' | 'all'
}

export function ProductDataTable({
  data,
  isLoading = false,
  onEdit,
  onDelete,
  onRestore,
  view = 'active',
}: ProductDataTableProps) {
  const columns: ColumnDef<ProductItem>[] = [
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => <div className="font-medium">{row.getValue('title')}</div>,
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => row.getValue('description'),
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }) => row.getValue('price'),
    },
    {
      accessorKey: 'isActive',
      header: 'Is Active',
      cell: ({ row }) => row.getValue('isActive'),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => {
        const date = row.getValue('createdAt') as string
        return new Date(date).toLocaleDateString()
      },
    },
    {
      accessorKey: 'deletedAt',
      header: 'Status',
      cell: ({ row }) => {
        const deletedAt = row.getValue('deletedAt') as string | null
        return (
          <Badge variant={deletedAt ? 'destructive' : 'default'}>
            {deletedAt ? 'Deleted' : 'Active'}
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const item = row.original
        const isDeleted = !!item.deletedAt

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isDeleted ? (
                <>
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(item)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={() => onDelete(item.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </>
              ) : (
                onRestore && (
                  <DropdownMenuItem onClick={() => onRestore(item.id)}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Restore
                  </DropdownMenuItem>
                )
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={isLoading}
      searchKey="title"
      searchPlaceholder="Search products..."
    />
  )
}
