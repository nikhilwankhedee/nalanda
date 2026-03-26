import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/database';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

interface ConceptPageProps {
  params: { slug: string };
}

export default async function ConceptPage({ params }: ConceptPageProps) {
  const session = await getServerSession(authOptions);

  const concept = await prisma.concept.findUnique({
    where: { slug: params.slug },
    include: {
      posts: {
        include: {
          post: {
            include: {
              author: true,
              tags: { include: { tag: true } },
            },
          },
        },
      },
      followers: {
        include: { user: true },
      },
    },
  });

  if (!concept) {
    notFound();
  }

  const isFollowing = session?.user
    ? concept.followers.some((f: { userId: string }) => f.userId === session.user?.id)
    : false;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-600 font-medium">
            Concept
          </span>
          {session?.user && (
            <button
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isFollowing
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{concept.name}</h1>
        {concept.description && (
          <p className="text-lg text-gray-600">{concept.description}</p>
        )}
      </header>

      {/* Content */}
      {concept.content && (
        <div className="prose prose-lg max-w-none mb-12">
          <div dangerouslySetInnerHTML={{ __html: concept.content }} />
        </div>
      )}

      {/* Related Posts */}
      <section className="border-t border-gray-200 pt-8 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Related Posts ({concept.posts.length})
        </h2>
        {concept.posts.length > 0 ? (
          <div className="space-y-4">
            {concept.posts.map((pc: { post: { id: string; slug: string; title: string; publishedAt: Date | null; excerpt: string | null } }) => (
              <Link
                key={pc.post.id}
                href={`/posts/${pc.post.slug}`}
                className="block p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">{pc.post.title}</h3>
                  <span className="text-xs text-gray-500">
                    {pc.post.publishedAt ? formatDate(pc.post.publishedAt) : 'Draft'}
                  </span>
                </div>
                {pc.post.excerpt && (
                  <p className="text-sm text-gray-600 mt-2">{pc.post.excerpt}</p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No posts reference this concept yet.</p>
        )}
      </section>

      {/* Followers */}
      {concept.followers.length > 0 && (
        <section className="border-t border-gray-200 pt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Followers ({concept.followers.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {concept.followers.map((follower: { id: string; user: { name: string | null; email: string } }) => (
              <span
                key={follower.id}
                className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-sm"
              >
                {follower.user.name || follower.user.email}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
