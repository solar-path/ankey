import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, ChevronRight, Menu, X, Clock, BookOpen, Hash } from 'lucide-react'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'

export const Route = createFileRoute('/_public/learn/')({
  component: LearnIndex,
})

// MDX file metadata interface
interface MDXFile {
  filename: string
  title: string
  description?: string
  category?: string
  duration?: string
  difficulty?: string
  order?: number
  content: string
  htmlContent?: string
}

// Table of contents item
interface TOCItem {
  id: string
  title: string
  level: number
}

function LearnIndex() {
  const [mdxFiles, setMdxFiles] = useState<MDXFile[]>([])
  const [selectedFile, setSelectedFile] = useState<MDXFile | null>(null)
  const [tableOfContents, setTableOfContents] = useState<TOCItem[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<string>('')
  const contentRef = useRef<HTMLDivElement>(null)

  // List of MDX files in /public/posts/
  const mdxFilesList = [
    'getting-started.mdx',
    'workspace-setup.mdx',
    'user-management.mdx',
    'terms.mdx',
    'privacy.mdx',
    'cookies.mdx',
  ]

  // Load MDX files on mount
  useEffect(() => {
    loadMDXFiles()
  }, [])

  // Track active section on scroll
  useEffect(() => {
    if (!selectedFile || tableOfContents.length === 0) return

    const handleScroll = () => {
      const headings = contentRef.current?.querySelectorAll('h1, h2, h3, h4, h5, h6')
      if (!headings) return

      let currentActiveId = ''

      headings.forEach(heading => {
        const rect = heading.getBoundingClientRect()
        if (rect.top <= 100 && rect.bottom >= 0) {
          currentActiveId = heading.id
        }
      })

      if (currentActiveId && currentActiveId !== activeSection) {
        setActiveSection(currentActiveId)
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Initial check

    return () => window.removeEventListener('scroll', handleScroll)
  }, [selectedFile, tableOfContents, activeSection])

  // Load all MDX files from public/posts
  const loadMDXFiles = async () => {
    setLoading(true)
    const files: MDXFile[] = []

    for (const filename of mdxFilesList) {
      try {
        const response = await fetch(`/posts/${filename}`)
        if (response.ok) {
          const rawContent = await response.text()

          // Parse frontmatter with gray-matter
          const { data: frontmatter, content } = matter(rawContent)

          // Convert markdown to HTML
          const processedContent = await remark().use(html, { sanitize: false }).process(content)

          const htmlContent = processedContent.toString()

          files.push({
            filename,
            title: frontmatter.title || filename.replace('.mdx', ''),
            description: frontmatter.description || '',
            category: frontmatter.category || 'General',
            duration: frontmatter.duration || '5 min read',
            difficulty: frontmatter.difficulty || 'Beginner',
            order: frontmatter.order || 999,
            content,
            htmlContent,
          })
        }
      } catch (error) {
        console.error(`Error loading ${filename}:`, error)
      }
    }

    // Sort files by order
    files.sort((a, b) => (a.order || 999) - (b.order || 999))

    setMdxFiles(files)
    if (files.length > 0) {
      selectFile(files[0])
    }
    setLoading(false)
  }

  // Select a file and load its content
  const selectFile = (file: MDXFile) => {
    setSelectedFile(file)
    generateTableOfContents(file.htmlContent || '')
    setActiveSection('')

    // Scroll to top when selecting a new file
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Generate table of contents from HTML content
  const generateTableOfContents = (htmlContent: string) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlContent, 'text/html')
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6')

    const toc: TOCItem[] = []

    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.substring(1))
      const title = heading.textContent || ''
      const id = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')

      // Skip the main title (first H1)
      if (level === 1 && index === 0) return

      toc.push({ id, title, level })
    })

    setTableOfContents(toc)
  }

  // Add IDs to headings and render content
  const renderContent = (htmlContent: string) => {
    if (!htmlContent) return null

    // Parse HTML and add IDs to headings
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlContent, 'text/html')
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6')

    headings.forEach(heading => {
      const id =
        heading.textContent
          ?.toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-') || ''
      heading.id = id
    })

    // Add classes for better styling
    doc
      .querySelectorAll('h1')
      .forEach(el => el.classList.add('text-4xl', 'font-bold', 'mb-4', 'mt-8'))
    doc
      .querySelectorAll('h2')
      .forEach(el => el.classList.add('text-3xl', 'font-semibold', 'mb-3', 'mt-6'))
    doc
      .querySelectorAll('h3')
      .forEach(el => el.classList.add('text-2xl', 'font-semibold', 'mb-2', 'mt-4'))
    doc
      .querySelectorAll('h4')
      .forEach(el => el.classList.add('text-xl', 'font-medium', 'mb-2', 'mt-3'))
    doc
      .querySelectorAll('h5')
      .forEach(el => el.classList.add('text-lg', 'font-medium', 'mb-1', 'mt-2'))
    doc
      .querySelectorAll('h6')
      .forEach(el => el.classList.add('text-base', 'font-medium', 'mb-1', 'mt-2'))

    doc
      .querySelectorAll('p')
      .forEach(el => el.classList.add('mb-4', 'text-gray-700', 'leading-relaxed'))
    doc
      .querySelectorAll('ul')
      .forEach(el => el.classList.add('list-disc', 'list-inside', 'mb-4', 'ml-4'))
    doc
      .querySelectorAll('ol')
      .forEach(el => el.classList.add('list-decimal', 'list-inside', 'mb-4', 'ml-4'))
    doc.querySelectorAll('li').forEach(el => el.classList.add('mb-2'))
    doc.querySelectorAll('code').forEach(el => {
      if (!el.parentElement || el.parentElement.tagName !== 'PRE') {
        el.classList.add('bg-gray-100', 'px-1', 'py-0.5', 'rounded', 'text-sm', 'font-mono')
      }
    })
    doc
      .querySelectorAll('pre')
      .forEach(el =>
        el.classList.add(
          'bg-gray-900',
          'text-gray-100',
          'p-4',
          'rounded-md',
          'overflow-x-auto',
          'mb-4'
        )
      )
    doc.querySelectorAll('pre code').forEach(el => el.classList.add('text-sm', 'font-mono'))
    doc.querySelectorAll('a').forEach(el => el.classList.add('text-blue-600', 'hover:underline'))
    doc
      .querySelectorAll('blockquote')
      .forEach(el => el.classList.add('border-l-4', 'border-gray-300', 'pl-4', 'italic', 'mb-4'))
    doc.querySelectorAll('strong').forEach(el => el.classList.add('font-semibold'))
    doc.querySelectorAll('em').forEach(el => el.classList.add('italic'))
    doc.querySelectorAll('hr').forEach(el => el.classList.add('my-8', 'border-gray-300'))

    return <div dangerouslySetInnerHTML={{ __html: doc.body.innerHTML }} />
  }

  // Scroll to section in content
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 80 // Account for sticky header
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
    }
  }

  // Group files by category
  const filesByCategory = mdxFiles.reduce(
    (acc, file) => {
      const category = file.category || 'General'
      if (!acc[category]) acc[category] = []
      acc[category].push(file)
      return acc
    },
    {} as Record<string, MDXFile[]>
  )

  // Order categories
  const categoryOrder = ['Basics', 'Administration', 'Advanced', 'Legal', 'General']
  const orderedCategories = categoryOrder.filter(cat => filesByCategory[cat])
  const otherCategories = Object.keys(filesByCategory).filter(cat => !categoryOrder.includes(cat))
  const allCategories = [...orderedCategories, ...otherCategories]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading documentation...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex">
        {/* Left Sidebar - File Navigation */}
        <div
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:sticky top-0 left-0 z-40 w-64 h-screen bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out overflow-y-auto`}
        >
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Documentation</h2>

            {/* File list grouped by category */}
            <nav className="space-y-6">
              {allCategories.map(category => (
                <div key={category}>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    {category}
                  </h3>
                  <ul className="space-y-1">
                    {filesByCategory[category].map(file => (
                      <li key={file.filename}>
                        <button
                          onClick={() => {
                            selectFile(file)
                            setSidebarOpen(false)
                          }}
                          className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                            selectedFile?.filename === file.filename
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <FileText className="h-4 w-4 mr-3 flex-shrink-0" />
                          <span className="truncate">{file.title}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 lg:ml-0">
          <div className="max-w-7xl mx-auto flex">
            {/* Article Content */}
            <main className="flex-1 px-6 py-8 lg:px-8 max-w-4xl">
              {selectedFile ? (
                <article ref={contentRef}>
                  {/* Article Header */}
                  <header className="mb-8 pb-8 border-b border-gray-200">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">{selectedFile.title}</h1>
                    {selectedFile.description && (
                      <p className="text-lg text-gray-600 mb-4">{selectedFile.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      {selectedFile.duration && (
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {selectedFile.duration}
                        </span>
                      )}
                      {selectedFile.category && (
                        <span className="flex items-center">
                          <BookOpen className="h-4 w-4 mr-1" />
                          {selectedFile.category}
                        </span>
                      )}
                      {selectedFile.difficulty && (
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            selectedFile.difficulty === 'Beginner'
                              ? 'bg-green-100 text-green-800'
                              : selectedFile.difficulty === 'Intermediate'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {selectedFile.difficulty}
                        </span>
                      )}
                    </div>
                  </header>

                  {/* Article Content */}
                  <div className="prose prose-lg max-w-none">
                    {renderContent(selectedFile.htmlContent || '')}
                  </div>
                </article>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Select a document from the sidebar to get started</p>
                </div>
              )}
            </main>

            {/* Right Sidebar - Table of Contents */}
            {selectedFile && tableOfContents.length > 0 && (
              <aside className="hidden xl:block w-64 flex-shrink-0">
                <div className="sticky top-8 p-6">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                    On This Page
                  </h3>
                  <nav className="space-y-1">
                    {tableOfContents.map(item => (
                      <button
                        key={item.id}
                        onClick={() => scrollToSection(item.id)}
                        className={`block w-full text-left py-1.5 text-sm transition-colors ${
                          activeSection === item.id
                            ? 'text-blue-600 font-medium'
                            : 'text-gray-600 hover:text-gray-900'
                        } ${
                          item.level === 2
                            ? 'pl-0'
                            : item.level === 3
                              ? 'pl-4'
                              : item.level === 4
                                ? 'pl-8'
                                : 'pl-12'
                        }`}
                      >
                        <span className="flex items-center">
                          {item.level > 2 && (
                            <ChevronRight
                              className={`h-3 w-3 mr-1 ${
                                activeSection === item.id ? 'text-blue-600' : 'text-gray-400'
                              }`}
                            />
                          )}
                          {item.level === 2 && (
                            <Hash
                              className={`h-3 w-3 mr-1 ${
                                activeSection === item.id ? 'text-blue-600' : 'text-gray-400'
                              }`}
                            />
                          )}
                          <span className="truncate">{item.title}</span>
                        </span>
                      </button>
                    ))}
                  </nav>
                </div>
              </aside>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
