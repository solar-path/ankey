import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { createFileRoute } from '@tanstack/react-router'
import { 
  ArrowRightLeft, 
  Shield, 
  Zap, 
  Globe, 
  BarChart3, 
  Wallet,
  Clock
} from 'lucide-react'

export const Route = createFileRoute('/_public/swap')({
  component: SwapPage,
})

function SwapPage() {
  const popularPairs = [
    {
      from: 'BTC',
      to: 'ETH',
      fromIcon: '₿',
      toIcon: 'Ξ',
      rate: '15.234',
      change: '+2.45%',
      volume: '$2.4M',
      isPositive: true
    },
    {
      from: 'ETH',
      to: 'USDC',
      fromIcon: 'Ξ',
      toIcon: '💵',
      rate: '2,341.56',
      change: '+1.23%',
      volume: '$1.8M',
      isPositive: true
    },
    {
      from: 'SOL',
      to: 'USDT',
      fromIcon: '◎',
      toIcon: '💰',
      rate: '156.78',
      change: '-0.89%',
      volume: '$1.2M',
      isPositive: false
    },
    {
      from: 'ADA',
      to: 'BTC',
      fromIcon: '₳',
      toIcon: '₿',
      rate: '0.00001234',
      change: '+3.67%',
      volume: '$890K',
      isPositive: true
    }
  ]

  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Execute swaps in seconds with our optimized smart contracts'
    },
    {
      icon: Shield,
      title: 'Secure & Audited',
      description: 'Multi-layer security with regular third-party audits'
    },
    {
      icon: Globe,
      title: 'Multi-Chain',
      description: 'Swap across 20+ blockchains seamlessly'
    },
    {
      icon: BarChart3,
      title: 'Best Rates',
      description: 'Access liquidity from 100+ DEXs for optimal pricing'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Crypto Swap Platform
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Swap cryptocurrencies instantly at the best rates. Access deep liquidity 
            across multiple chains with zero slippage guarantee.
          </p>
          
          {/* Swap Interface */}
          <div className="max-w-md mx-auto mb-8">
            <Card className="bg-white dark:bg-gray-800 shadow-xl">
              <CardHeader>
                <CardTitle className="text-center">Instant Swap</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 block">
                    From
                  </label>
                  <div className="flex gap-2">
                    <Input placeholder="0.00" className="flex-1" />
                    <Button variant="outline" className="min-w-20">
                      BTC ₿
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Balance: 0.025 BTC</p>
                </div>
                
                <div className="flex justify-center">
                  <Button variant="outline" size="icon" className="rounded-full">
                    <ArrowRightLeft className="h-4 w-4" />
                  </Button>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 block">
                    To
                  </label>
                  <div className="flex gap-2">
                    <Input placeholder="0.00" className="flex-1" />
                    <Button variant="outline" className="min-w-20">
                      ETH Ξ
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Balance: 1.234 ETH</p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="flex justify-between text-sm">
                    <span>Rate</span>
                    <span>1 BTC = 15.234 ETH</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Fee</span>
                    <span>0.3%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Slippage</span>
                    <span className="text-green-600">0.1%</span>
                  </div>
                </div>
                
                <Button size="lg" className="w-full">
                  <ArrowRightLeft className="mr-2 h-5 w-5" />
                  Swap Now
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center gap-4">
            <Button variant="outline" size="lg" className="px-8">
              <BarChart3 className="mr-2 h-5 w-5" />
              View Analytics
            </Button>
            <Button variant="outline" size="lg" className="px-8">
              <Wallet className="mr-2 h-5 w-5" />
              Connect Wallet
            </Button>
          </div>
        </div>

        {/* Popular Trading Pairs */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
            Popular Trading Pairs
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularPairs.map((pair, index) => (
              <Card key={index} className="bg-white dark:bg-gray-800 hover:shadow-lg transition-all cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{pair.fromIcon}</span>
                      <ArrowRightLeft className="h-4 w-4 text-gray-400" />
                      <span className="text-2xl">{pair.toIcon}</span>
                    </div>
                    <Badge 
                      variant={pair.isPositive ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {pair.change}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">
                    {pair.from}/{pair.to}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">Rate</span>
                      <span className="font-medium">{pair.rate}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">Volume</span>
                      <span className="font-medium">{pair.volume}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
            Why Choose Our Platform
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-white dark:bg-gray-800 text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-16">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <h3 className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">$2.5B+</h3>
              <p className="text-gray-600 dark:text-gray-300">Total Volume</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">500K+</h3>
              <p className="text-gray-600 dark:text-gray-300">Active Users</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">20+</h3>
              <p className="text-gray-600 dark:text-gray-300">Supported Chains</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">0.1%</h3>
              <p className="text-gray-600 dark:text-gray-300">Average Slippage</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
            Recent Swaps
          </h2>
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="space-y-4">
                {[
                  { from: 'ETH', to: 'USDC', amount: '2.5', time: '2m ago', user: '0x1234...5678' },
                  { from: 'BTC', to: 'ETH', amount: '0.1', time: '5m ago', user: '0xabcd...ef01' },
                  { from: 'SOL', to: 'USDT', amount: '50', time: '8m ago', user: '0x9876...4321' },
                  { from: 'ADA', to: 'BTC', amount: '1000', time: '12m ago', user: '0x5555...aaaa' }
                ].map((swap, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{swap.from}</span>
                        <ArrowRightLeft className="h-3 w-3 text-gray-400" />
                        <span className="font-medium">{swap.to}</span>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {swap.amount} {swap.from}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{swap.user}</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {swap.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-700 dark:to-pink-700 rounded-lg p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Start Swapping Today!</h2>
          <p className="text-xl mb-8 opacity-90">Join the future of decentralized finance</p>
          <div className="flex justify-center gap-4">
            <Button variant="secondary" size="lg" className="px-8">
              Connect Wallet
            </Button>
            <Button variant="outline" size="lg" className="px-8 text-white border-white hover:bg-white hover:text-purple-600">
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}