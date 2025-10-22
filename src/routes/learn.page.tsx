import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface PostMetadata {
  title: string;
  description: string;
  date: string;
  author: string;
}

interface Post {
  slug: string;
  content: string;
  metadata: PostMetadata;
}

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

// Simple frontmatter parser for browser
function parseFrontmatter(text: string): { data: PostMetadata; content: string } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = text.match(frontmatterRegex);

  if (!match) {
    return {
      data: {
        title: "Untitled",
        description: "",
        date: new Date().toISOString(),
        author: "Unknown",
      },
      content: text,
    };
  }

  const frontmatterText = match[1];
  const content = match[2];
  const data: any = {};

  frontmatterText.split("\n").forEach((line) => {
    const colonIndex = line.indexOf(":");
    if (colonIndex > -1) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, "");
      data[key] = value;
    }
  });

  return {
    data: data as PostMetadata,
    content,
  };
}

export default function LearnPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentPost, setCurrentPost] = useState<Post | null>(null);
  const [toc, setToc] = useState<TOCItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [docSlug, setDocSlug] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("doc") || "intro";
  });

  // Load available posts
  useEffect(() => {
    const loadPosts = async () => {
      try {
        // List of markdown files (dynamically discovered)
        const files = ["intro.md", "privacy.md", "terms.md", "cookies.md"];

        const loadedPosts: Post[] = [];

        for (const file of files) {
          try {
            const response = await fetch(`/posts/${file}`);
            if (response.ok) {
              const text = await response.text();
              const { data, content } = parseFrontmatter(text);

              loadedPosts.push({
                slug: file.replace(".md", ""),
                content,
                metadata: data,
              });
            }
          } catch (error) {
            console.error(`Error loading ${file}:`, error);
          }
        }

        setPosts(loadedPosts);

        // Load the current post
        const post = loadedPosts.find(p => p.slug === docSlug) || loadedPosts[0];
        setCurrentPost(post);

        setLoading(false);
      } catch (error) {
        console.error("Error loading posts:", error);
        setLoading(false);
      }
    };

    loadPosts();
  }, [docSlug]);

  // Generate table of contents from markdown headings
  useEffect(() => {
    if (!currentPost) return;

    const headings: TOCItem[] = [];
    const lines = currentPost.content.split("\n");

    lines.forEach((line) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2];
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        headings.push({ id, text, level });
      }
    });

    setToc(headings);
  }, [currentPost]);

  const handleDocChange = (slug: string) => {
    setDocSlug(slug);
    window.history.pushState({}, '', `/learn?doc=${slug}`);
  };

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar - Document List */}
        <aside className="lg:col-span-3">
          <div className="lg:sticky lg:top-4">
            <h2 className="font-semibold mb-4 text-lg">Documentation</h2>
            <nav className="space-y-1 overflow-x-auto lg:overflow-x-visible">
              <div className="flex lg:flex-col gap-2 lg:space-y-0">
                {posts.map((post) => (
                  <button
                    key={post.slug}
                    onClick={() => handleDocChange(post.slug)}
                    className={`whitespace-nowrap lg:whitespace-normal w-auto lg:w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      post.slug === docSlug
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent"
                    }`}
                  >
                    {post.metadata.title}
                  </button>
                ))}
              </div>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-6">
          {currentPost && (
            <article>
              <div className="mb-8 pb-6 border-b">
                <h1 className="text-4xl font-bold mb-3">{currentPost.metadata.title}</h1>
                <p className="text-lg text-muted-foreground mb-2">{currentPost.metadata.description}</p>
                <div className="text-sm text-muted-foreground">
                  By {currentPost.metadata.author} · {new Date(currentPost.metadata.date).toLocaleDateString()}
                </div>
              </div>

              <div className="prose prose-neutral dark:prose-invert prose-headings:font-semibold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-h1:mt-8 prose-h2:mt-6 prose-h3:mt-4 prose-p:text-base prose-p:leading-7 prose-li:text-base prose-li:leading-7 prose-a:text-primary prose-a:no-underline hover:prose-a:underline max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ node, ...props }) => {
                      const text = props.children?.toString() || "";
                      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                      return <h1 id={id} {...props} />;
                    },
                    h2: ({ node, ...props }) => {
                      const text = props.children?.toString() || "";
                      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                      return <h2 id={id} {...props} />;
                    },
                    h3: ({ node, ...props }) => {
                      const text = props.children?.toString() || "";
                      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                      return <h3 id={id} {...props} />;
                    },
                  }}
                >
                  {currentPost.content}
                </ReactMarkdown>
              </div>
            </article>
          )}
        </main>

        {/* Table of Contents */}
        <aside className="lg:col-span-3 hidden lg:block">
          <div className="sticky top-4">
            <h2 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">On This Page</h2>
            <nav className="space-y-1">
              {toc.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToHeading(item.id)}
                  className="block w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors"
                  style={{ paddingLeft: `${(item.level - 1) * 0.75}rem` }}
                >
                  {item.text}
                </button>
              ))}
            </nav>
          </div>
        </aside>
      </div>
    </div>
  );
}
