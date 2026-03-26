import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/database';
import { slugify } from '@/lib/utils';
import { z } from 'zod';

const createConceptSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  content: z.string().optional(),
});

// GET - List all concepts
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search');

    const concepts = await prisma.concept.findMany({
      where: search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      } : undefined,
      include: {
        posts: {
          include: {
            post: {
              select: {
                id: true,
                slug: true,
                title: true,
                publishedAt: true,
              },
            },
          },
        },
        _count: { select: { followers: true } },
      },
      orderBy: { name: 'asc' },
      take: limit,
    });

    return NextResponse.json({ concepts });
  } catch (error) {
    console.error('Error fetching concepts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch concepts' },
      { status: 500 }
    );
  }
}

// POST - Create a new concept
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = createConceptSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, description, content } = validation.data;
    const slug = slugify(name);

    // Check if concept already exists
    const existing = await prisma.concept.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: 'A concept with this name already exists' },
        { status: 400 }
      );
    }

    const concept = await prisma.concept.create({
      data: {
        name,
        slug,
        description,
        content,
      },
      include: {
        posts: { include: { post: true } },
      },
    });

    return NextResponse.json({ concept }, { status: 201 });
  } catch (error) {
    console.error('Error creating concept:', error);
    return NextResponse.json(
      { error: 'Failed to create concept' },
      { status: 500 }
    );
  }
}
