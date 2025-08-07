import { createFileRoute } from '@tanstack/react-router'
import PublicLayout from './publicLayout'
import { Button } from '@/components/ui/button'
import { Book, FileText, Video, Download, ExternalLink } from 'lucide-react'

export const Route = createFileRoute('/(public)/learn')({
  component: Learn,
})

interface GuideSection {
  title: string
  description: string
  icon: React.ReactNode
  guides: Guide[]
}

interface Guide {
  title: string
  description: string
  type: 'article' | 'video' | 'pdf'
  duration?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  url: string
}

const guideSections: GuideSection[] = [
  {
    title: 'Getting Started',
    description: 'Learn the basics and get up and running quickly',
    icon: <Book className="h-6 w-6" />,
    guides: [
      {
        title: 'Quick Start Guide',
        description: 'Get your workspace set up in 10 minutes',
        type: 'article',
        duration: '10 min',
        difficulty: 'beginner',
        url: '#quick-start',
      },
      {
        title: 'Setting Up Your First Tenant',
        description: 'Learn how to create and configure your workspace',
        type: 'video',
        duration: '15 min',
        difficulty: 'beginner',
        url: '#first-tenant',
      },
      {
        title: 'User Management Basics',
        description: 'Invite users and manage permissions',
        type: 'article',
        duration: '8 min',
        difficulty: 'beginner',
        url: '#user-management',
      },
    ],
  },
  {
    title: 'Core Features',
    description: 'Master the essential features of the platform',
    icon: <FileText className="h-6 w-6" />,
    guides: [
      {
        title: 'Role-Based Access Control',
        description: 'Set up permissions and roles effectively',
        type: 'article',
        duration: '12 min',
        difficulty: 'intermediate',
        url: '#rbac',
      },
      {
        title: 'Delegation of Authority',
        description: 'Implement approval workflows and delegation',
        type: 'video',
        duration: '20 min',
        difficulty: 'intermediate',
        url: '#delegation',
      },
      {
        title: 'Data Import and Export',
        description: 'Work with Excel files and bulk operations',
        type: 'article',
        duration: '15 min',
        difficulty: 'intermediate',
        url: '#data-management',
      },
    ],
  },
  {
    title: 'Advanced Topics',
    description: 'Deep dive into advanced configurations and integrations',
    icon: <Video className="h-6 w-6" />,
    guides: [
      {
        title: 'API Integration Guide',
        description: 'Connect external systems using our API',
        type: 'pdf',
        duration: '45 min',
        difficulty: 'advanced',
        url: '#api-guide',
      },
      {
        title: 'SOX and SOC Compliance',
        description: 'Configure audit trails and compliance features',
        type: 'article',
        duration: '30 min',
        difficulty: 'advanced',
        url: '#compliance',
      },
      {
        title: 'Custom Workflows',
        description: 'Build complex business processes',
        type: 'video',
        duration: '25 min',
        difficulty: 'advanced',
        url: '#workflows',
      },
    ],
  },
]

function Learn() {
  const getTypeIcon = (type: Guide['type']) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />
      case 'pdf':
        return <Download className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getDifficultyColor = (difficulty: Guide['difficulty']) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800'
      case 'advanced':
        return 'bg-red-100 text-red-800'
    }
  }

  const handleGuideClick = (guide: Guide) => {
    console.log(`Opening guide: ${guide.title}`)
    // TODO: Implement guide navigation
  }

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Learning Center</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to know to get the most out of our platform. From quick start guides
            to advanced integrations.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-12 max-w-2xl mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search guides and documentation..."
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="bg-blue-50 p-6 rounded-lg text-center">
            <Book className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Quick Start</h3>
            <p className="text-gray-600 mb-4">Get up and running in minutes</p>
            <Button variant="outline" onClick={() => handleGuideClick(guideSections[0].guides[0])}>
              Start Here
            </Button>
          </div>

          <div className="bg-green-50 p-6 rounded-lg text-center">
            <Video className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Video Tutorials</h3>
            <p className="text-gray-600 mb-4">Watch step-by-step walkthroughs</p>
            <Button variant="outline">Watch Videos</Button>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg text-center">
            <Download className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">API Docs</h3>
            <p className="text-gray-600 mb-4">Technical documentation and guides</p>
            <Button variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Docs
            </Button>
          </div>
        </div>

        {/* Guide Sections */}
        <div className="space-y-12">
          {guideSections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <div className="flex items-center mb-6">
                <div className="bg-blue-100 p-3 rounded-lg mr-4">{section.icon}</div>
                <div>
                  <h2 className="text-2xl font-bold">{section.title}</h2>
                  <p className="text-gray-600">{section.description}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {section.guides.map((guide, guideIndex) => (
                  <div
                    key={guideIndex}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleGuideClick(guide)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center text-gray-500">
                        {getTypeIcon(guide.type)}
                        {guide.duration && <span className="ml-2 text-sm">{guide.duration}</span>}
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(guide.difficulty)}`}
                      >
                        {guide.difficulty}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold mb-2">{guide.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{guide.description}</p>

                    <div className="flex items-center text-blue-600 text-sm font-medium">
                      <span>Read more</span>
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Support Section */}
        <div className="mt-16 bg-gray-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Need More Help?</h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Can't find what you're looking for? Our support team is here to help you succeed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button>Contact Support</Button>
            <Button variant="outline">Schedule Demo</Button>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
