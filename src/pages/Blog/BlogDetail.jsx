import { useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'
import { SEOHead } from '../../components/common'
import { BLOG_POSTS, BLOG_CATEGORIES } from './Blog'
import './BlogDetail.css'

function renderMarkdown(text) {
  const lines = text.trim().split('\n')
  const elements = []
  let listBuffer = []
  let key = 0

  const flushList = () => {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={`ul-${key++}`}>
          {listBuffer.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </ul>
      )
      listBuffer = []
    }
  }

  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed.startsWith('## ')) {
      flushList()
      elements.push(<h2 key={key++}>{trimmed.slice(3)}</h2>)
    } else if (trimmed.startsWith('### ')) {
      flushList()
      elements.push(<h3 key={key++}>{trimmed.slice(4)}</h3>)
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const content = trimmed.slice(2).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      listBuffer.push(content)
    } else if (trimmed === '') {
      flushList()
    } else if (trimmed) {
      flushList()
      const html = trimmed
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.+?)`/g, '<code>$1</code>')
      elements.push(
        <p key={key++} dangerouslySetInnerHTML={{ __html: html }} />
      )
    }
  }

  flushList()
  return elements
}

export default function BlogDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const post = BLOG_POSTS.find(p => p.slug === slug)

  useEffect(() => {
    if (!post) navigate('/blog', { replace: true })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [slug, post, navigate])

  if (!post) return null

  const categoryLabel = BLOG_CATEGORIES.find(c => c.key === post.category)?.label ?? ''
  const formattedDate = new Date(post.date).toLocaleDateString('zh-TW', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  const relatedPosts = BLOG_POSTS
    .filter(p => p.slug !== slug && p.category === post.category)
    .slice(0, 2)

  return (
    <main className="blog-detail-page">
      <SEOHead
        title={post.title}
        description={post.excerpt}
        ogType="article"
        canonicalUrl={`/blog/${post.slug}`}
      />

      {/* Breadcrumb */}
      <nav className="blog-detail__breadcrumb" aria-label="麵包屑">
        <Link to="/">首頁</Link>
        <span className="blog-detail__breadcrumb-sep">›</span>
        <Link to="/blog">Polar Journal</Link>
        <span className="blog-detail__breadcrumb-sep">›</span>
        <span>{post.title}</span>
      </nav>

      {/* Header */}
      <header className="blog-detail__header">
        <span className="blog-detail__category">{categoryLabel}</span>
        <h1 className="blog-detail__title">{post.title}</h1>
        <div className="blog-detail__meta">
          <Calendar size={14} />
          <span>{formattedDate}</span>
          <span className="blog-detail__meta-dot" />
          <Clock size={14} />
          <span>閱讀時間 {post.readTime}</span>
        </div>
      </header>

      {/* Cover */}
      <div className="blog-detail__cover">
        <motion.div
          className="blog-detail__cover-inner"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {post.coverImage
            ? <img src={post.coverImage} alt={post.title} />
            : <span className="blog-detail__cover-emoji">{post.emoji}</span>
          }
        </motion.div>
      </div>

      {/* Article */}
      <div className="blog-detail__body">
        <div className="blog-detail__back">
          <button
            className="blog-detail__back-btn"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={16} />
            返回部落格
          </button>
        </div>

        <motion.article
          className="blog-detail__article"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
        >
          {renderMarkdown(post.content)}
        </motion.article>
      </div>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <div className="blog-detail__related">
          <h2 className="blog-detail__related-title">相關文章</h2>
          <div className="blog-detail__related-grid">
            {relatedPosts.map(related => (
              <Link
                key={related.slug}
                to={`/blog/${related.slug}`}
                className="blog-card"
              >
                <div className="blog-card__cover">
                  <span className="blog-card__cover-emoji">{related.emoji}</span>
                </div>
                <div className="blog-card__body">
                  <div className="blog-card__meta">
                    <span className="blog-card__category">{categoryLabel}</span>
                  </div>
                  <h3 className="blog-card__title">{related.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
