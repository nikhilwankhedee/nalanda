'use client';

import { useEffect, useState } from 'react';
import prisma from '@/lib/database';

interface Post {
  postId: string | null;
  _count: { postId: number };
  post?: {
    id: string;
    title: string;
    slug: string;
  } | null;
}

interface TopPostsTableProps {
  initialPosts: Post[];
}

export default function TopPostsTable({ initialPosts }: TopPostsTableProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Most Read Posts</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left text-sm font-medium text-gray-600 py-3 px-4">
                Rank
              </th>
              <th className="text-left text-sm font-medium text-gray-600 py-3 px-4">
                Title
              </th>
              <th className="text-right text-sm font-medium text-gray-600 py-3 px-4">
                Views
              </th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post, index) => (
              <tr key={post.postId} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-sm font-medium">
                    {index + 1}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-gray-900">
                    {post.post?.title || 'Unknown Post'}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="text-sm font-medium text-gray-900">
                    {post._count.postId}
                  </span>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-gray-500">
                  No post views yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
