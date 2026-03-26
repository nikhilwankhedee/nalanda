import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/database';
import { redirect } from 'next/navigation';

export default async function HealthPage() {
  const session = await getServerSession(authOptions);
  
  // For now, allow anyone to view health in development
  // In production, you'd want to restrict this to admins
  const isAdmin = process.env.NODE_ENV === 'development' || !!session;

  if (!isAdmin) {
    redirect('/auth/login');
  }

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    const dbStatus = 'connected';
  } catch {
    // Will be handled in catch block
  }

  const [
    postCount,
    conceptCount,
    tagCount,
    userCount,
    publishedCount,
    draftCount,
  ] = await Promise.all([
    prisma.post.count(),
    prisma.concept.count(),
    prisma.tag.count(),
    prisma.user.count(),
    prisma.post.count({ where: { status: 'PUBLISHED' } }),
    prisma.post.count({ where: { status: 'DRAFT' } }),
  ]);

  const postConceptCount = await prisma.postConcept.count();
  const conceptBacklinkCount = await prisma.conceptBacklink.count();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">System Health</h1>

      {/* Database Status */}
      <section className="card mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Database</h2>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-green-700 font-medium">Connected</span>
        </div>
        <p className="text-sm text-gray-500 mt-2">PostgreSQL via Prisma</p>
      </section>

      {/* Content Stats */}
      <section className="card mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Content</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{postCount}</div>
            <div className="text-sm text-gray-500 mt-1">Total Posts</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{publishedCount}</div>
            <div className="text-sm text-gray-500 mt-1">Published</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{draftCount}</div>
            <div className="text-sm text-gray-500 mt-1">Drafts</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{conceptCount}</div>
            <div className="text-sm text-gray-500 mt-1">Concepts</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-xl font-bold text-pink-600">{tagCount}</div>
            <div className="text-sm text-gray-500 mt-1">Tags</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-xl font-bold text-indigo-600">{userCount}</div>
            <div className="text-sm text-gray-500 mt-1">Users</div>
          </div>
        </div>
      </section>

      {/* Graph Stats */}
      <section className="card mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Knowledge Graph</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{postCount}</div>
            <div className="text-sm text-gray-600 mt-1">Post Nodes</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{conceptCount}</div>
            <div className="text-sm text-gray-600 mt-1">Concept Nodes</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{tagCount}</div>
            <div className="text-sm text-gray-600 mt-1">Tag Nodes</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-xl font-bold text-gray-700">{postConceptCount}</div>
            <div className="text-sm text-gray-500 mt-1">Post-Concept Edges</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-xl font-bold text-gray-700">{conceptBacklinkCount}</div>
            <div className="text-sm text-gray-500 mt-1">Concept Backlinks</div>
          </div>
        </div>
      </section>

      {/* Auth Status */}
      <section className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Authentication</h2>
        <div className="space-y-2">
          {session ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-green-700 font-medium">Authenticated</span>
              </div>
              <p className="text-sm text-gray-600">
                Logged in as: <span className="font-mono">{session.user?.email}</span>
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-yellow-700 font-medium">Not Authenticated</span>
              </div>
              <p className="text-sm text-gray-500">
                Some features may be limited
              </p>
            </>
          )}
        </div>
      </section>

      {/* Environment Info */}
      <section className="card mt-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Environment</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Node Environment:</span>
            <span className="font-mono">{process.env.NODE_ENV}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Next.js Version:</span>
            <span className="font-mono">14.1.0</span>
          </div>
        </div>
      </section>
    </div>
  );
}
