import prisma from '@/lib/database';
import { Card } from '@/components/ui/Card';
import { formatDate, generateExcerpt } from '@/lib/utils';

export default async function PostsPage() {
  const posts = await prisma.post.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
    include: {
      tags: { include: { tag: true } },
      author: true,
    },
  });

  const types = ['ALL', 'POST', 'IDEA', 'RESEARCH'] as const;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">All Posts</h1>
        <p className="text-gray-600">
          Explore our collection of posts, ideas, and research notes.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-8">
        {types.map((type) => (
          <button
            key={type}
            className="px-4 py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            {type === 'ALL' ? 'All' : type.charAt(0) + type.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Posts grid */}
      {posts.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post: { id: string; title: string; slug: string; excerpt: string | null; content: string; publishedAt: Date | null; type: string; tags: { tag: { name: string } }[] }) => (
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
        <div className="card text-center text-gray-500 py-12">
          <p className="text-lg">No posts yet.</p>
          <p className="text-sm mt-2">Check back later for new content!</p>
        </div>
      )}
    </div>
  );
}
