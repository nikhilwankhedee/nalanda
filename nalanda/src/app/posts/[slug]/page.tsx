import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/database';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { processBacklinks } from '@/lib/backlinks';

interface PostPageProps {
  params: { slug: string };
}

export default async function PostPage({ params }: PostPageProps) {
  const session = await getServerSession(authOptions);
  
  const post = await prisma.post.findUnique({
    where: { slug: params.slug, status: 'PUBLISHED' },
    include: {
      author: true,
      tags: { include: { tag: true } },
      concepts: { include: { concept: true } },
    },
  });

  if (!post) {
    notFound();
  }

  // Process backlinks in content
  const processedContent = processBacklinks(post.content);

  // Get backlinks to this post
  const backlinks = await prisma.backlink.findMany({
    where: { targetPostId: post.id },
    include: {
      sourcePost: true,
    },
  });

  // Track reading history if user is logged in
  if (session?.user?.id) {
    await prisma.readingHistory.upsert({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId: post.id,
        },
      },
      update: {
        lastReadAt: new Date(),
        progress: 0,
      },
      create: {
        userId: session.user.id,
        postId: post.id,
        progress: 0,
      },
    });
  }

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs px-2 py-1 rounded-full bg-primary-50 text-primary-600 font-medium capitalize">
            {post.type.toLowerCase()}
          </span>
          {post.tags.map((pt: { tag: { id: string; name: string } }) => (
            <span
              key={pt.tag.id}
              className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600"
            >
              {pt.tag.name}
            </span>
          ))}
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>By {post.author.name || 'Anonymous'}</span>
          <span>•</span>
          <span>{post.publishedAt ? formatDate(post.publishedAt) : 'Draft'}</span>
        </div>
      </header>

      {/* Content */}
      <div className="prose prose-lg max-w-none mb-12">
        <div dangerouslySetInnerHTML={{ __html: processedContent }} />
      </div>

      {/* Related Concepts */}
      {post.concepts.length > 0 && (
        <section className="border-t border-gray-200 pt-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Related Concepts</h2>
          <div className="flex flex-wrap gap-2">
            {post.concepts.map((pc: { concept: { id: string; slug: string; name: string } }) => (
              <Link
                key={pc.concept.id}
                href={`/concepts/${pc.concept.slug}`}
                className="px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-sm font-medium hover:bg-green-100 transition-colors"
              >
                {pc.concept.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Backlinks */}
      {backlinks.length > 0 && (
        <section className="border-t border-gray-200 pt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Backlinks</h2>
          <div className="space-y-3">
            {backlinks.map((backlink: { id: string; sourcePost: { slug: string; title: string; excerpt: string | null } }) => (
              <Link
                key={backlink.id}
                href={`/posts/${backlink.sourcePost.slug}`}
                className="block p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <h3 className="font-medium text-gray-900">{backlink.sourcePost.title}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {backlink.sourcePost.excerpt || 'Click to read more'}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
