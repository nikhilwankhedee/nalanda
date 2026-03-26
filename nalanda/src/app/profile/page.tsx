import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/database';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      readingHistory: {
        include: { post: true },
        orderBy: { lastReadAt: 'desc' },
        take: 10,
      },
      bookmarks: {
        include: {
          post: true,
          concept: true,
        },
      },
      followedConcepts: {
        include: { concept: true },
      },
    },
  });

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Profile Header */}
      <div className="card mb-8">
        <div className="flex items-center gap-4">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name || 'User'}
              className="w-16 h-16 rounded-full"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-600">
                {(user.name || user.email).charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {user.name || 'Anonymous'}
            </h1>
            <p className="text-gray-500">{user.email}</p>
            <p className="text-sm text-gray-400 mt-1">
              Member since {formatDate(user.createdAt)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Reading History */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Reading History</h2>
          {user.readingHistory.length > 0 ? (
            <div className="space-y-3">
              {user.readingHistory.map((history: { id: string; lastReadAt: Date; post: { slug: string; title: string; excerpt: string | null } }) => (
                <Link
                  key={history.id}
                  href={`/posts/${history.post.slug}`}
                  className="block p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">{history.post.title}</h3>
                    <span className="text-xs text-gray-500">
                      {formatDate(history.lastReadAt)}
                    </span>
                  </div>
                  {history.post.excerpt && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {history.post.excerpt}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="card text-center text-gray-500 py-8">
              <p>No reading history yet.</p>
              <Link href="/posts" className="text-primary-600 hover:text-primary-700 text-sm mt-2">
                Browse posts →
              </Link>
            </div>
          )}
        </section>

        {/* Bookmarks */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Bookmarks</h2>
          {user.bookmarks.length > 0 ? (
            <div className="space-y-3">
              {user.bookmarks.map((bookmark: { id: string; post: { slug: string; title: string } | null; concept: { slug: string; name: string } | null }) =>
                bookmark.post ? (
                  <Link
                    key={bookmark.id}
                    href={`/posts/${bookmark.post.slug}`}
                    className="block p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                  >
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 mb-2 inline-block">
                      Post
                    </span>
                    <h3 className="font-medium text-gray-900">{bookmark.post.title}</h3>
                  </Link>
                ) : bookmark.concept ? (
                  <Link
                    key={bookmark.id}
                    href={`/concepts/${bookmark.concept.slug}`}
                    className="block p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                  >
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600 mb-2 inline-block">
                      Concept
                    </span>
                    <h3 className="font-medium text-gray-900">{bookmark.concept.name}</h3>
                  </Link>
                ) : null
              )}
            </div>
          ) : (
            <div className="card text-center text-gray-500 py-8">
              <p>No bookmarks yet.</p>
            </div>
          )}
        </section>

        {/* Followed Concepts */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Followed Concepts</h2>
          {user.followedConcepts.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {user.followedConcepts.map((followed: { id: string; concept: { slug: string; name: string } }) => (
                <Link
                  key={followed.id}
                  href={`/concepts/${followed.concept.slug}`}
                  className="px-4 py-2 rounded-full bg-green-50 text-green-700 text-sm font-medium hover:bg-green-100 transition-colors"
                >
                  {followed.concept.name}
                </Link>
              ))}
            </div>
          ) : (
            <div className="card text-center text-gray-500 py-8">
              <p>Not following any concepts yet.</p>
              <Link href="/concepts" className="text-primary-600 hover:text-primary-700 text-sm mt-2">
                Explore concepts →
              </Link>
            </div>
          )}
        </section>

        {/* Stats */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="card text-center">
              <div className="text-2xl font-bold text-primary-600">
                {user.readingHistory.length}
              </div>
              <div className="text-sm text-gray-500 mt-1">Posts Read</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-primary-600">
                {user.bookmarks.length}
              </div>
              <div className="text-sm text-gray-500 mt-1">Bookmarks</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-primary-600">
                {user.followedConcepts.length}
              </div>
              <div className="text-sm text-gray-500 mt-1">Concepts Followed</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-primary-600">
                0
              </div>
              <div className="text-sm text-gray-500 mt-1">Posts Written</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
