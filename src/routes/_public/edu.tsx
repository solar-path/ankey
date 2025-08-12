import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createFileRoute } from '@tanstack/react-router'
import {
  Award,
  BookOpen,
  Clock,
  Download,
  Globe,
  PlayCircle,
  Search,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react'

export const Route = createFileRoute('/_public/edu')({
  component: EducationPage,
})

function EducationPage() {
  const featuredCourses = [
    {
      id: 1,
      title: 'Full-Stack Web Development',
      instructor: 'Sarah Johnson',
      price: 89.99,
      originalPrice: 199.99,
      rating: 4.9,
      students: 12450,
      duration: '42 hours',
      image: '💻',
      badge: 'Bestseller',
      discount: 55,
      level: 'Intermediate',
    },
    {
      id: 2,
      title: 'Data Science with Python',
      instructor: 'Dr. Michael Chen',
      price: 79.99,
      originalPrice: 149.99,
      rating: 4.8,
      students: 8932,
      duration: '36 hours',
      image: '🐍',
      badge: 'Hot & New',
      discount: 47,
      level: 'Beginner',
    },
    {
      id: 3,
      title: 'UI/UX Design Masterclass',
      instructor: 'Emma Wilson',
      price: 69.99,
      originalPrice: 129.99,
      rating: 4.9,
      students: 15670,
      duration: '28 hours',
      image: '🎨',
      badge: 'Top Rated',
      discount: 46,
      level: 'All Levels',
    },
    {
      id: 4,
      title: 'Mobile App Development',
      instructor: 'Alex Rodriguez',
      price: 94.99,
      originalPrice: 179.99,
      rating: 4.7,
      students: 6784,
      duration: '48 hours',
      image: '📱',
      badge: 'New',
      discount: 47,
      level: 'Advanced',
    },
  ]

  const categories = [
    { name: 'Programming', icon: '👨‍💻', courses: '2,500+ courses' },
    { name: 'Design', icon: '🎨', courses: '1,800+ courses' },
    { name: 'Business', icon: '💼', courses: '3,200+ courses' },
    { name: 'Marketing', icon: '📈', courses: '1,500+ courses' },
    { name: 'Data Science', icon: '📊', courses: '980+ courses' },
    { name: 'Photography', icon: '📸', courses: '650+ courses' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Learn New Skills Online
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Master in-demand skills with expert-led courses. Join millions of learners and advance
            your career with hands-on projects and certificates.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input placeholder="What do you want to learn?" className="pl-10 h-12 text-lg" />
                </div>
                <Button size="lg" className="h-12 px-8">
                  Search
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <Button variant="outline" size="lg" className="px-8">
              <BookOpen className="mr-2 h-5 w-5" />
              Browse Courses
            </Button>
            <Button variant="outline" size="lg" className="px-8">
              <Award className="mr-2 h-5 w-5" />
              Get Certified
            </Button>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
            Popular Categories
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
                  <CardDescription className="text-lg">{category.courses}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Featured Courses */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Featured Courses
            </h2>
            <Button variant="outline">View All Courses</Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredCourses.map(course => (
              <Card
                key={course.id}
                className="bg-white dark:bg-gray-800 hover:shadow-lg transition-all group"
              >
                <CardHeader className="relative">
                  <div className="absolute top-2 left-2 z-10">
                    <Badge variant="destructive">{course.discount}% OFF</Badge>
                  </div>
                  <div className="text-8xl text-center mb-4 group-hover:scale-105 transition-transform">
                    {course.image}
                  </div>
                  <Badge variant="secondary" className="w-fit">
                    {course.badge}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg mb-2 line-clamp-2">{course.title}</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    by {course.instructor}
                  </p>

                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(course.rating)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      ({course.students.toLocaleString()})
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mb-3 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {course.duration}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {course.level}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      ${course.price}
                    </span>
                    <span className="text-lg text-gray-500 line-through">
                      ${course.originalPrice}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1">
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Enroll Now
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
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold mb-2">Expert Instructors</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Learn from industry professionals
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold mb-2">Lifetime Access</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Access courses anytime, anywhere
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold mb-2">Certificates</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Get certified upon completion
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="font-semibold mb-2">Global Community</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Connect with learners worldwide
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-16">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <h3 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">10K+</h3>
              <p className="text-gray-600 dark:text-gray-300">Courses Available</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">2M+</h3>
              <p className="text-gray-600 dark:text-gray-300">Students Enrolled</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">500+</h3>
              <p className="text-gray-600 dark:text-gray-300">Expert Instructors</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">95%</h3>
              <p className="text-gray-600 dark:text-gray-300">Completion Rate</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 rounded-lg p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Start Learning Today!</h2>
          <p className="text-xl mb-8 opacity-90">
            Join millions of learners and unlock your potential
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="secondary" size="lg" className="px-8">
              <TrendingUp className="mr-2 h-5 w-5" />
              Browse Trending
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="px-8 text-white border-white hover:bg-white hover:text-blue-600"
            >
              Start Free Trial
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
