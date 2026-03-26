import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/database';
import { z } from 'zod';

const toggleBookmarkSchema = z.object({
  postId: z.string().optional(),
  conceptId: z.string().optional(),
});

// GET - Get user's bookmarks
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: session.user.id },
      include: {
        post: {
          select: {
            id: true,
            slug: true,
            title: true,
            excerpt: true,
            publishedAt: true,
          },
        },
        concept: {
          select: {
            id: true,
            slug: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ bookmarks });
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookmarks' },
      { status: 500 }
    );
  }
}

// POST - Toggle bookmark (create or delete)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = toggleBookmarkSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Either postId or conceptId is required' },
        { status: 400 }
      );
    }

    const { postId, conceptId } = validation.data;

    if (!postId && !conceptId) {
      return NextResponse.json(
        { error: 'Either postId or conceptId is required' },
        { status: 400 }
      );
    }

    // Check if bookmark exists
    const existing = await prisma.bookmark.findFirst({
      where: {
        userId: session.user.id,
        ...(postId && { postId }),
        ...(conceptId && { conceptId }),
      },
    });

    if (existing) {
      // Delete bookmark (toggle off)
      await prisma.bookmark.delete({ where: { id: existing.id } });
      return NextResponse.json({ bookmark: null, action: 'removed' });
    }

    // Create bookmark
    const bookmark = await prisma.bookmark.create({
      data: {
        userId: session.user.id,
        ...(postId && { postId }),
        ...(conceptId && { conceptId }),
      },
      include: {
        post: {
          select: {
            id: true,
            slug: true,
            title: true,
          },
        },
        concept: {
          select: {
            id: true,
            slug: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ bookmark, action: 'created' }, { status: 201 });
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to toggle bookmark' },
      { status: 500 }
    );
  }
}
