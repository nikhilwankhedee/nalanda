import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Link href="/" className="text-lg font-bold text-primary-600">
              Nalanda
            </Link>
            <p className="text-sm text-gray-500 mt-1">
              A living knowledge blog
            </p>
          </div>
          <div className="flex space-x-6">
            <Link
              href="/posts"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Posts
            </Link>
            <Link
              href="/concepts"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Concepts
            </Link>
            <Link
              href="/graph"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Graph
            </Link>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-400 text-center">
            © {new Date().getFullYear()} Nalanda. Built for knowledge explorers.
          </p>
        </div>
      </div>
    </footer>
  );
}
