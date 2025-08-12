import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { createFileRoute } from '@tanstack/react-router'
import {
  Search,
  ShoppingCart,
  Star,
  Heart,
  Filter,
  Truck,
  Shield,
  RotateCcw,
  CreditCard,
} from 'lucide-react'

export const Route = createFileRoute('/_public/shop')({
  component: ShopPage,
})

function ShopPage() {
  const featuredProducts = [
    {
      id: 1,
      name: 'Premium Wireless Headphones',
      price: 299.99,
      originalPrice: 399.99,
      rating: 4.8,
      reviews: 1245,
      image: '🎧',
      badge: 'Best Seller',
      discount: 25,
    },
    {
      id: 2,
      name: 'Smart Fitness Watch',
      price: 199.99,
      originalPrice: 249.99,
      rating: 4.6,
      reviews: 892,
      image: '⌚',
      badge: 'New Arrival',
      discount: 20,
    },
    {
      id: 3,
      name: 'Ergonomic Office Chair',
      price: 449.99,
      originalPrice: 599.99,
      rating: 4.9,
      reviews: 567,
      image: '🪑',
      badge: 'Top Rated',
      discount: 25,
    },
    {
      id: 4,
      name: 'Professional Camera',
      price: 899.99,
      originalPrice: 1199.99,
      rating: 4.7,
      reviews: 334,
      image: '📷',
      badge: 'Sale',
      discount: 25,
    },
  ]

  const categories = [
    { name: 'Electronics', icon: '💻', count: '2.5K products' },
    { name: 'Fashion', icon: '👕', count: '1.8K products' },
    { name: 'Home & Garden', icon: '🏠', count: '1.2K products' },
    { name: 'Sports & Fitness', icon: '⚽', count: '980 products' },
    { name: 'Books & Media', icon: '📚', count: '750 products' },
    { name: 'Beauty & Health', icon: '💄', count: '640 products' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Online Shopping Hub
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Discover amazing products at unbeatable prices. Shop from thousands of items with fast
            delivery and secure checkout.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input placeholder="Search for products..." className="pl-10 h-12 text-lg" />
                </div>
                <Button size="lg" className="h-12 px-8">
                  Search
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <Button variant="outline" size="lg" className="px-8">
              <Filter className="mr-2 h-5 w-5" />
              Browse Categories
            </Button>
            <Button variant="outline" size="lg" className="px-8">
              <Star className="mr-2 h-5 w-5" />
              Today's Deals
            </Button>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
            Shop by Category
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <Card
                key={index}
                className="bg-white dark:bg-gray-800 hover:shadow-lg transition-all cursor-pointer group"
              >
                <CardHeader className="text-center">
                  <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                    {category.icon}
                  </div>
                  <CardTitle className="text-xl">{category.name}</CardTitle>
                  <CardDescription className="text-lg">{category.count}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Featured Products */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Featured Products
            </h2>
            <Button variant="outline">View All Products</Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map(product => (
              <Card
                key={product.id}
                className="bg-white dark:bg-gray-800 hover:shadow-lg transition-all group"
              >
                <CardHeader className="relative">
                  <div className="absolute top-2 left-2 z-10">
                    <Badge variant="destructive">{product.discount}% OFF</Badge>
                  </div>
                  <div className="absolute top-2 right-2 z-10">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-8xl text-center mb-4 group-hover:scale-105 transition-transform">
                    {product.image}
                  </div>
                  <Badge variant="secondary" className="w-fit">
                    {product.badge}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg mb-2 line-clamp-2">{product.name}</CardTitle>

                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(product.rating)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      ({product.reviews})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      ${product.price}
                    </span>
                    <span className="text-lg text-gray-500 line-through">
                      ${product.originalPrice}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Add to Cart
                    </Button>
                    <Button variant="outline" size="icon">
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-16">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold mb-2">Free Shipping</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Free delivery on orders over $50
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold mb-2">Secure Payment</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">100% secure transactions</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <RotateCcw className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold mb-2">Easy Returns</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">30-day return policy</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="font-semibold mb-2">Best Prices</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Competitive pricing guaranteed
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-16">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <h3 className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                100K+
              </h3>
              <p className="text-gray-600 dark:text-gray-300">Products Available</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">50K+</h3>
              <p className="text-gray-600 dark:text-gray-300">Happy Customers</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">1M+</h3>
              <p className="text-gray-600 dark:text-gray-300">Orders Delivered</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">24/7</h3>
              <p className="text-gray-600 dark:text-gray-300">Customer Support</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-700 dark:to-red-700 rounded-lg p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Start Shopping Today!</h2>
          <p className="text-xl mb-8 opacity-90">
            Join millions of satisfied customers and discover great deals
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="secondary" size="lg" className="px-8">
              Create Account
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="px-8 text-white border-white hover:bg-white hover:text-orange-600"
            >
              Browse Products
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
