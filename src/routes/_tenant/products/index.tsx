import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { client, handleApiResponse } from '@/lib/rpc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  RotateCcw,
  Download,
  Upload,
  Filter,
} from 'lucide-react'
import { toast } from 'sonner'

// Search params schema
const searchSchema = z.object({
  page: z.coerce.number().min(1).catch(1),
  limit: z.coerce.number().min(1).max(100).catch(10),
  search: z.string().catch(''),
  sortBy: z.string().catch('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).catch('desc'),
  view: z.enum(['active', 'trashed', 'all']).catch('active'),
})

export const Route = createFileRoute('/_tenant/products/')({
  component: ProductsPage,
  validateSearch: searchSchema,
})

interface ProductItem {
  id: string
  title: string
  description: string | null
  price: string
  isActive: string
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

interface ProductFormData {
  title: string
  description: string | null
  price: string
  isActive: string
}

function ProductsPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ProductItem | null>(null)
  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    description: null,
    price: '',
    isActive: '',
  })

  // Fetch products
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['products', search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: search.page.toString(),
        limit: search.limit.toString(),
        search: search.search,
        sortBy: search.sortBy,
        sortOrder: search.sortOrder,
        view: search.view,
      })

      const response = await client.products.$get({ query: Object.fromEntries(params) })
      const result = await handleApiResponse(response)
      if (!result.success) throw new Error(result.error || 'Failed to fetch products')
      return result.data
    },
  })

  // Handle search
  const handleSearch = (newSearch: string) => {
    navigate({
      search: { ...search, search: newSearch, page: 1 },
    })
  }

  // Handle view change
  const handleViewChange = (newView: 'active' | 'trashed' | 'all') => {
    navigate({
      search: { ...search, view: newView, page: 1 },
    })
  }

  // Handle sort change
  const handleSort = (sortBy: string) => {
    const sortOrder = search.sortBy === sortBy && search.sortOrder === 'asc' ? 'desc' : 'asc'
    navigate({
      search: { ...search, sortBy, sortOrder },
    })
  }

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    navigate({
      search: { ...search, page: newPage },
    })
  }

  // Create product
  const handleCreate = async () => {
    try {
      const response = await client.products.$post({ json: formData })
      const result = await handleApiResponse(response)

      if (!result.success) throw new Error(result.error || 'Failed to create product')

      toast.success('Product created successfully')
      setIsCreateDialogOpen(false)
      resetForm()
      refetch()
    } catch (error) {
      toast.error('Failed to create product')
      console.error(error)
    }
  }

  // Update product
  const handleUpdate = async () => {
    if (!editingItem) return

    try {
      const response = await client.products[':id'].$patch({
        param: { id: editingItem.id },
        json: formData,
      })
      const result = await handleApiResponse(response)

      if (!result.success) throw new Error(result.error || 'Failed to update product')

      toast.success('Product updated successfully')
      setEditingItem(null)
      resetForm()
      refetch()
    } catch (error) {
      toast.error('Failed to update product')
      console.error(error)
    }
  }

  // Delete product
  const handleDelete = async (id: string) => {
    try {
      const response = await client.products[':id'].$delete({ param: { id } })
      const result = await handleApiResponse(response)

      if (!result.success) throw new Error(result.error || 'Failed to delete product')

      toast.success('Product deleted successfully')
      refetch()
    } catch (error) {
      toast.error('Failed to delete product')
      console.error(error)
    }
  }

  // Restore product
  const handleRestore = async (id: string) => {
    try {
      const response = await client.products[':id'].restore.$patch({ param: { id } })
      const result = await handleApiResponse(response)

      if (!result.success) throw new Error(result.error || 'Failed to restore product')

      toast.success('Product restored successfully')
      refetch()
    } catch (error) {
      toast.error('Failed to restore product')
      console.error(error)
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: null,
      price: '',
      isActive: '',
    })
  }

  // Open edit dialog
  const openEditDialog = (item: ProductItem) => {
    setEditingItem(item)
    setFormData({
      title: item.title,
      description: item.description,
      price: item.price,
      isActive: item.isActive,
    })
  }

  if (error) {
    return <div className="p-4 text-red-600">Error loading products: {error.message}</div>
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Product
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search.search}
            onChange={e => handleSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <Select value={search.view} onValueChange={handleViewChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trashed">Trashed</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('title')}
              >
                Title {search.sortBy === 'title' && (search.sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('description')}
              >
                Description{' '}
                {search.sortBy === 'description' && (search.sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('price')}
              >
                Price {search.sortBy === 'price' && (search.sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('isActive')}
              >
                Is Active {search.sortBy === 'isActive' && (search.sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('createdAt')}
              >
                Created {search.sortBy === 'createdAt' && (search.sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : data?.data?.items?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              data?.data?.items?.map((item: ProductItem) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.price}</TableCell>
                  <TableCell>{item.isActive}</TableCell>
                  <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={item.deletedAt ? 'destructive' : 'default'}>
                      {item.deletedAt ? 'Deleted' : 'Active'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!item.deletedAt ? (
                          <>
                            <DropdownMenuItem onClick={() => openEditDialog(item)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(item.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem onClick={() => handleRestore(item.id)}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Restore
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data?.data?.pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(search.page - 1) * search.limit + 1} to{' '}
            {Math.min(search.page * search.limit, data.data.pagination.total)} of{' '}
            {data.data.pagination.total} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(search.page - 1)}
              disabled={search.page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(search.page + 1)}
              disabled={search.page >= data.data.pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Product</DialogTitle>
            <DialogDescription>Add a new product to your collection.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                type="text"
                value={formData.title || ''}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                type="text"
                value={formData.description || ''}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price
              </Label>
              <Input
                id="price"
                type="text"
                value={formData.price || ''}
                onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">
                Is Active
              </Label>
              <Input
                id="isActive"
                type="text"
                value={formData.isActive || ''}
                onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.value }))}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={open => !open && setEditingItem(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Make changes to the product here.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                type="text"
                value={formData.title || ''}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                type="text"
                value={formData.description || ''}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price
              </Label>
              <Input
                id="price"
                type="text"
                value={formData.price || ''}
                onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">
                Is Active
              </Label>
              <Input
                id="isActive"
                type="text"
                value={formData.isActive || ''}
                onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.value }))}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
