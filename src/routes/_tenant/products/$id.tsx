import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit } from 'lucide-react'
import { tenantProducts, handleApiResponse } from '@/lib/rpc'

export const Route = createFileRoute('/_tenant/products/$id')({
  component: ProductDetail,
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

function ProductDetail() {
  const { id } = Route.useParams()
  const navigate = Route.useNavigate()

  const { data, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await tenantProducts[':id'].$get({ param: { id } })
      const result = await handleApiResponse(response)
      if (!result.success) throw new Error(result.error || 'Failed to fetch product')
      return result.data
    },
  })

  const item: ProductItem = data

  if (isLoading) {
    return <div className="p-4">Loading...</div>
  }

  if (error || !item) {
    return <div className="p-4 text-red-600">Error loading product</div>
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate({ to: '/_tenant/products' })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">{item.title}</h1>
        <Badge variant={item.deletedAt ? 'destructive' : 'default'}>
          {item.deletedAt ? 'Deleted' : 'Active'}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
          <CardDescription>
            Created on {new Date(item.createdAt).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Title</dt>
            <dd className="mt-1 text-sm">{item.title || 'Not set'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Description</dt>
            <dd className="mt-1 text-sm">{item.description || 'Not set'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Price</dt>
            <dd className="mt-1 text-sm">{item.price || 'Not set'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Is Active</dt>
            <dd className="mt-1 text-sm">{item.isActive || 'Not set'}</dd>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
