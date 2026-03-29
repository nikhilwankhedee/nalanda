import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';

export default async function AdminHeader() {
  const session = await getServerSession(authOptions);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your Nalanda platform</p>
        </div>
        <div className="flex items-center gap-4">
          {session?.user && (
            <>
              <span className="text-sm text-gray-600">
                {session.user.name || session.user.email}
              </span>
              <Link
                href="/"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                View Site
              </Link>
              <Link
                href="/api/auth/signout"
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Sign Out
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
