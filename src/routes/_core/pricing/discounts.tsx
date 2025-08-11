import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { createFileRoute } from '@tanstack/react-router'
import { Plus, Search, Copy, Calendar, Percent, Tag } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/_core/pricing/discounts')({
  component: PricingDiscounts,
})

function PricingDiscounts() {
  const [searchTerm, setSearchTerm] = useState('')
  
  // Sample data - replace with actual API calls
  const discounts = [
    {
      id: 1,
      code: 'SUMMER2024',
      description: 'Summer promotion - 25% off',
      type: 'percentage',
      value: 25,
      usage: 45,
      limit: 100,
      validFrom: '2024-06-01',
      validTo: '2024-08-31',
      status: 'active',
    },
    {
      id: 2,
      code: 'NEWUSER',
      description: 'First-time user discount',
      type: 'fixed',
      value: 10,
      usage: 120,
      limit: null,
      validFrom: '2024-01-01',
      validTo: '2024-12-31',
      status: 'active',
    },
    {
      id: 3,
      code: 'LOYALTY50',
      description: 'Loyalty program - $50 off',
      type: 'fixed',
      value: 50,
      usage: 30,
      limit: 50,
      validFrom: '2024-03-01',
      validTo: '2024-05-31',
      status: 'expired',
    },
  ]

  const filteredDiscounts = discounts.filter(discount =>
    discount.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    discount.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    // Add toast notification here
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Discount Codes</h2>
          <p className="text-muted-foreground">Manage promotional codes and special offers</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Discount
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search discount codes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredDiscounts.map((discount) => (
          <Card key={discount.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{discount.code}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(discount.code)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Badge variant={discount.status === 'active' ? 'default' : 'secondary'}>
                      {discount.status}
                    </Badge>
                  </div>
                  <CardDescription>{discount.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {discount.type === 'percentage' ? (
                    <div className="flex items-center text-lg font-semibold">
                      <Percent className="h-4 w-4 mr-1" />
                      {discount.value}%
                    </div>
                  ) : (
                    <div className="flex items-center text-lg font-semibold">
                      ${discount.value}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Usage</p>
                  <p className="font-medium">
                    {discount.usage}{discount.limit ? ` / ${discount.limit}` : ' (Unlimited)'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Valid From</p>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <p className="font-medium">{new Date(discount.validFrom).toLocaleDateString()}</p>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground">Valid To</p>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <p className="font-medium">{new Date(discount.validTo).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              {discount.limit && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Usage Progress</span>
                    <span className="font-medium">{Math.round((discount.usage / discount.limit) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((discount.usage / discount.limit) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}