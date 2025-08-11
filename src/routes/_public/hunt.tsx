import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { createFileRoute } from '@tanstack/react-router'
import { 
  Search, 
  MapPin, 
  Briefcase, 
  DollarSign, 
  Clock, 
  Building, 
  Users, 
  TrendingUp,
  Target,
  Award,
  Zap,
  Globe
} from 'lucide-react'

export const Route = createFileRoute('/_public/hunt')({
  component: JobHuntPage,
})

function JobHuntPage() {
  const featuredJobs = [
    {
      id: 1,
      title: 'Senior Frontend Developer',
      company: 'TechFlow Inc.',
      location: 'San Francisco, CA',
      type: 'Full-time',
      remote: true,
      salary: '$120k - $160k',
      logo: '🚀',
      badge: 'Hot',
      posted: '2 days ago',
      applicants: 45
    },
    {
      id: 2,
      title: 'Product Manager',
      company: 'InnovateCorp',
      location: 'New York, NY',
      type: 'Full-time',
      remote: false,
      salary: '$130k - $170k',
      logo: '💡',
      badge: 'Urgent',
      posted: '1 day ago',
      applicants: 23
    },
    {
      id: 3,
      title: 'UX Designer',
      company: 'DesignHub',
      location: 'Austin, TX',
      type: 'Contract',
      remote: true,
      salary: '$80k - $110k',
      logo: '🎨',
      badge: 'New',
      posted: '3 hours ago',
      applicants: 12
    },
    {
      id: 4,
      title: 'Data Scientist',
      company: 'DataMind Labs',
      location: 'Seattle, WA',
      type: 'Full-time',
      remote: true,
      salary: '$140k - $180k',
      logo: '📊',
      badge: 'Featured',
      posted: '5 days ago',
      applicants: 67
    }
  ]

  const categories = [
    { name: 'Technology', icon: '💻', jobs: '15.2K jobs' },
    { name: 'Marketing', icon: '📈', jobs: '8.5K jobs' },
    { name: 'Design', icon: '🎨', jobs: '4.3K jobs' },
    { name: 'Sales', icon: '💼', jobs: '12.1K jobs' },
    { name: 'Finance', icon: '💰', jobs: '6.8K jobs' },
    { name: 'Healthcare', icon: '🏥', jobs: '9.4K jobs' }
  ]

  const companies = [
    { name: 'Google', logo: 'G', openings: 245 },
    { name: 'Microsoft', logo: 'M', openings: 189 },
    { name: 'Apple', logo: 'A', openings: 156 },
    { name: 'Amazon', logo: 'A', openings: 234 },
    { name: 'Meta', logo: 'F', openings: 98 },
    { name: 'Netflix', logo: 'N', openings: 67 }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Find Your Dream Job
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Discover thousands of job opportunities from top companies worldwide. 
            Take the next step in your career journey today.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Job title, skills, or company"
                    className="pl-10 h-12 text-lg"
                  />
                </div>
                <div className="flex-1 relative">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="City, state, or remote"
                    className="pl-10 h-12 text-lg"
                  />
                </div>
                <Button size="lg" className="h-12 px-8">
                  Search Jobs
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <Button variant="outline" size="lg" className="px-8">
              <Target className="mr-2 h-5 w-5" />
              Remote Jobs
            </Button>
            <Button variant="outline" size="lg" className="px-8">
              <TrendingUp className="mr-2 h-5 w-5" />
              Trending
            </Button>
            <Button variant="outline" size="lg" className="px-8">
              <Award className="mr-2 h-5 w-5" />
              Top Companies
            </Button>
          </div>
        </div>

        {/* Job Categories */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
            Browse by Category
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <Card key={index} className="bg-white dark:bg-gray-800 hover:shadow-lg transition-all cursor-pointer group">
                <CardHeader className="text-center">
                  <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                    {category.icon}
                  </div>
                  <CardTitle className="text-xl">{category.name}</CardTitle>
                  <CardDescription className="text-lg">{category.jobs}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Featured Jobs */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Featured Jobs
            </h2>
            <Button variant="outline">
              View All Jobs
            </Button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {featuredJobs.map((job) => (
              <Card key={job.id} className="bg-white dark:bg-gray-800 hover:shadow-lg transition-all group">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">{job.logo}</div>
                      <div>
                        <CardTitle className="text-xl mb-1">{job.title}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Building className="h-4 w-4" />
                          {job.company}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary">{job.badge}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4 text-gray-400" />
                        {job.type}
                      </div>
                      {job.remote && (
                        <Badge variant="outline" className="text-xs">Remote</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {job.salary}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Clock className="h-4 w-4" />
                        {job.posted}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Users className="h-4 w-4" />
                        {job.applicants} applicants
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Save
                        </Button>
                        <Button size="sm">
                          Apply Now
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Top Companies */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
            Top Hiring Companies
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company, index) => (
              <Card key={index} className="bg-white dark:bg-gray-800 hover:shadow-lg transition-all cursor-pointer group">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold group-hover:scale-110 transition-transform">
                    {company.logo}
                  </div>
                  <CardTitle className="text-xl">{company.name}</CardTitle>
                  <CardDescription className="text-lg">
                    {company.openings} open positions
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-16">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="font-semibold mb-2">Smart Matching</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">AI-powered job recommendations</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold mb-2">Quick Apply</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Apply to multiple jobs instantly</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold mb-2">Global Reach</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Jobs from companies worldwide</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="font-semibold mb-2">Career Growth</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Tools for professional development</p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-16">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <h3 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">50K+</h3>
              <p className="text-gray-600 dark:text-gray-300">Active Jobs</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">2K+</h3>
              <p className="text-gray-600 dark:text-gray-300">Companies Hiring</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">1M+</h3>
              <p className="text-gray-600 dark:text-gray-300">Job Seekers</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">95%</h3>
              <p className="text-gray-600 dark:text-gray-300">Success Rate</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-700 dark:to-teal-700 rounded-lg p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Find Your Next Role?</h2>
          <p className="text-xl mb-8 opacity-90">Join thousands of professionals who found their dream jobs through our platform</p>
          <div className="flex justify-center gap-4">
            <Button variant="secondary" size="lg" className="px-8">
              Upload Resume
            </Button>
            <Button variant="outline" size="lg" className="px-8 text-white border-white hover:bg-white hover:text-emerald-600">
              Browse Jobs
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}