import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/database';
import { z } from 'zod';

const updateReadingHistorySchema = z.object({
  postId: z.string(),
  progress: z.number().min(0).max(100).optional(),
});

// GET - Get user's reading history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const history = await prisma.readingHistory.findMany({
      where: { userId: session.user.id },
      include: {
        post: {
          select: {
            id: true,
            slug: true,
            title: true,
            excerpt: true,
            publishedAt: true,
            type: true,
          },
        },
      },
      orderBy: { lastReadAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Error fetching reading history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reading history' },
      { status: 500 }
    );
  }
}

// POST - Update reading history
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
    const validation = updateReadingHistorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'postId is required' },
        { status: 400 }
      );
    }

    const { postId, progress = 0 } = validation.data;

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Upsert reading history
    const history = await prisma.readingHistory.upsert({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId,
        },
      },
      update: {
        progress,
        lastReadAt: new Date(),
      },
      create: {
        userId: session.user.id,
        postId,
        progress,
      },
      include: {
        post: {
          select: {
            id: true,
            slug: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Error updating reading history:', error);
    return NextResponse.json(
      { error: 'Failed to update reading history' },
      { status: 500 }
    );
  }
}
