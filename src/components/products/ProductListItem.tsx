import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Edit, MoreHorizontal, RotateCcw, Trash2 } from 'lucide-react'

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

interface ProductListItemProps {
  item: ProductItem
  onEdit?: (item: ProductItem) => void
  onDelete?: (id: string) => void
  onRestore?: (id: string) => void
  onView?: (item: ProductItem) => void
}

export function ProductListItem({
  item,
  onEdit,
  onDelete,
  onRestore,
  onView,
}: ProductListItemProps) {
  const isDeleted = !!item.deletedAt

  return (
    <Card className="transition-colors hover:bg-muted/50">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle
            className="text-base cursor-pointer hover:text-primary"
            onClick={() => onView?.(item)}
          >
            {item.title}
          </CardTitle>
          <CardDescription>
            Created {new Date(item.createdAt).toLocaleDateString()}
            {item.updatedAt !== item.createdAt && (
              <> • Updated {new Date(item.updatedAt).toLocaleDateString()}</>
            )}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isDeleted ? 'destructive' : 'default'}>
            {isDeleted ? 'Deleted' : 'Active'}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
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
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Description:</span>
            <span>{item.description || 'Not set'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Price:</span>
            <span>{item.price || 'Not set'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
