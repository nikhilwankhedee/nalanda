import prisma from '@/lib/database';
import AdminCard from '@/components/admin/AdminCard';

export default async function AdminDashboardPage() {
  // Fetch real metrics from database
  const [
    userCount,
    postCount,
    conceptCount,
    readingHistoryCount,
    publishedCount,
    draftCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.concept.count(),
    prisma.readingHistory.count(),
    prisma.post.count({ where: { status: 'PUBLISHED' } }),
    prisma.post.count({ where: { status: 'DRAFT' } }),
  ]);

  return (
    <div className="space-y-8">
      {/* System Overview */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">System Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AdminCard
            title="Total Users"
            value={userCount}
            description="Registered users"
            icon="👥"
          />
          <AdminCard
            title="Total Posts"
            value={postCount}
            description={`${publishedCount} published, ${draftCount} drafts`}
            icon="📝"
          />
          <AdminCard
            title="Total Concepts"
            value={conceptCount}
            description="Knowledge nodes"
            icon="💡"
          />
          <AdminCard
            title="Total Reads"
            value={readingHistoryCount}
            description="Reading history entries"
            icon="📖"
          />
        </div>
      </section>

      {/* Content Overview */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Content Overview</h2>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="text-3xl font-bold text-blue-600">{publishedCount}</div>
              <div className="text-sm text-gray-500 mt-1">Published Posts</div>
            </div>
            <div className="text-center p-4 border-l border-gray-200">
              <div className="text-3xl font-bold text-yellow-600">{draftCount}</div>
              <div className="text-sm text-gray-500 mt-1">Draft Posts</div>
            </div>
            <div className="text-center p-4 border-l border-gray-200">
              <div className="text-3xl font-bold text-green-600">{conceptCount}</div>
              <div className="text-sm text-gray-500 mt-1">Concepts</div>
            </div>
          </div>
        </div>
      </section>

      {/* User Overview */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">User Overview</h2>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{userCount}</div>
              <div className="text-sm text-gray-500 mt-1">Total Registered Users</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">1</div>
              <div className="text-sm text-gray-500 mt-1">Admin Users</div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <a
            href="/admin/posts"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            Manage Posts
          </a>
          <a
            href="/admin/concepts"
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Manage Concepts
          </a>
          <a
            href="/admin/users"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            Manage Users
          </a>
          <a
            href="/admin/analytics"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            View Analytics
          </a>
        </div>
      </section>
    </div>
  );
}
