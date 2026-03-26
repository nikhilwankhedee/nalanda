import Link from 'next/link';
import prisma from '@/lib/database';
import { Card } from '@/components/ui/Card';
import { formatDate, generateExcerpt } from '@/lib/utils';

export default async function HomePage() {
  const recentPosts = await prisma.post.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
    take: 6,
    include: {
      tags: { include: { tag: true } },
      author: true,
    },
  });

  const concepts = await prisma.concept.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 6,
  });

  const stats = {
    posts: await prisma.post.count({ where: { status: 'PUBLISHED' } }),
    concepts: await prisma.concept.count(),
    tags: await prisma.tag.count(),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Welcome to <span className="text-primary-600">Nalanda</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          A living knowledge blog where ideas connect and grow into a graph of understanding.
        </p>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-3 gap-6 mb-16">
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600">{stats.posts}</div>
          <div className="text-sm text-gray-500 mt-1">Posts</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600">{stats.concepts}</div>
          <div className="text-sm text-gray-500 mt-1">Concepts</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600">{stats.tags}</div>
          <div className="text-sm text-gray-500 mt-1">Tags</div>
        </div>
      </section>

      {/* Recent Posts */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Recent Posts</h2>
          <Link href="/posts" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View all →
          </Link>
        </div>
        {recentPosts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentPosts.map((post: { id: string; title: string; slug: string; excerpt: string | null; content: string; publishedAt: Date | null; type: string; tags: { tag: { name: string } }[] }) => (
              <Card
                key={post.id}
                title={post.title}
                href={`/posts/${post.slug}`}
                excerpt={post.excerpt || generateExcerpt(post.content)}
                date={post.publishedAt ? formatDate(post.publishedAt) : undefined}
                tags={post.tags.map((pt) => pt.tag.name)}
                type={post.type.toLowerCase() as any}
              />
            ))}
          </div>
        ) : (
          <div className="card text-center text-gray-500">
            <p>No posts yet. Start by creating your first post!</p>
          </div>
        )}
      </section>

      {/* Recent Concepts */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Recent Concepts</h2>
          <Link href="/concepts" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View all →
          </Link>
        </div>
        {concepts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {concepts.map((concept: { id: string; name: string; slug: string; description: string | null }) => (
              <Card
                key={concept.id}
                title={concept.name}
                href={`/concepts/${concept.slug}`}
                excerpt={concept.description || undefined}
                type="concept"
              />
            ))}
          </div>
        ) : (
          <div className="card text-center text-gray-500">
            <p>No concepts yet. Concepts are created automatically when you use [[concept]] syntax.</p>
          </div>
        )}
      </section>
    </div>
  );
}
