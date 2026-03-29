import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/database';
import { z } from 'zod';

const followConceptSchema = z.object({
  conceptId: z.string(),
});

// POST - Follow or unfollow a concept
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
    const validation = followConceptSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'conceptId is required' },
        { status: 400 }
      );
    }

    const { conceptId } = validation.data;

    // Check if concept exists
    const concept = await prisma.concept.findUnique({
      where: { id: conceptId },
    });

    if (!concept) {
      return NextResponse.json(
        { error: 'Concept not found' },
        { status: 404 }
      );
    }

    // Check if already following
    const existing = await prisma.followedConcept.findUnique({
      where: {
        userId_conceptId: {
          userId: session.user.id,
          conceptId,
        },
      },
    });

    if (existing) {
      // Unfollow - delete the relationship
      await prisma.followedConcept.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ following: false, action: 'unfollowed' });
    }

    // Follow - create the relationship
    await prisma.followedConcept.create({
      data: {
        userId: session.user.id,
        conceptId,
      },
    });

    return NextResponse.json({ following: true, action: 'followed' });
  } catch (error) {
    console.error('Error toggling follow:', error);
    return NextResponse.json(
      { error: 'Failed to toggle follow' },
      { status: 500 }
    );
  }
}
