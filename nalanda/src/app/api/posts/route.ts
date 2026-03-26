import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/database';
import { slugify } from '@/lib/utils';
import { extractBacklinks, getUniqueBacklinks } from '@/lib/backlinks';
import { z } from 'zod';

const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().optional(),
  type: z.enum(['POST', 'IDEA', 'RESEARCH']).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
});

// GET - List all posts
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as 'POST' | 'IDEA' | 'RESEARCH' | null;
    const status = searchParams.get('status') as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | null;
    const limit = parseInt(searchParams.get('limit') || '10');

    const posts = await prisma.post.findMany({
      where: {
        ...(type && { type }),
        ...(status && { status }),
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        tags: { include: { tag: true } },
        concepts: { include: { concept: true } },
        _count: { select: { bookmarks: true } },
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// POST - Create a new post
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
    const validation = createPostSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { title, content, excerpt, type = 'POST', tags = [], status = 'DRAFT' } = validation.data;

    // Generate slug from title
    const slug = slugify(title);

    // Check if slug already exists
    const existing = await prisma.post.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: 'A post with this title already exists' },
        { status: 400 }
      );
    }

    // Extract backlinks from content
    const backlinkTargets = getUniqueBacklinks(content);

    // Create the post
    const post = await prisma.post.create({
      data: {
        title,
        content,
        excerpt: excerpt || content.slice(0, 200),
        slug,
        type,
        status,
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
        authorId: session.user.id,
        tags: tags.length > 0 ? {
          create: tags.map((tagName) => ({
            tag: {
              connectOrCreate: {
                where: { slug: slugify(tagName) },
                create: { name: tagName, slug: slugify(tagName) },
              },
            },
          })),
        } : undefined,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        tags: { include: { tag: true } },
      },
    });

    // Create concept references from backlinks
    if (backlinkTargets.length > 0) {
      await prisma.postConcept.createMany({
        data: backlinkTargets.map((targetSlug) => ({
          postId: post.id,
          conceptId: targetSlug,
        })),
        skipDuplicates: true,
      });

      // Create or connect concepts
      for (const targetSlug of backlinkTargets) {
        await prisma.concept.upsert({
          where: { slug: targetSlug },
          update: {},
          create: {
            name: targetSlug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            slug: targetSlug,
          },
        });
      }
    }

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}
