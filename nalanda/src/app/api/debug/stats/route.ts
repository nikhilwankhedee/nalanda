import { NextResponse } from 'next/server';
import prisma from '@/lib/database';

/**
 * Debug API - Returns system statistics
 */
export async function GET() {
  try {
    const [
      postCount,
      conceptCount,
      tagCount,
      userCount,
      bookmarkCount,
      readingHistoryCount,
      backlinkCount,
      conceptBacklinkCount,
    ] = await Promise.all([
      prisma.post.count(),
      prisma.concept.count(),
      prisma.tag.count(),
      prisma.user.count(),
      prisma.bookmark.count(),
      prisma.readingHistory.count(),
      prisma.backlink.count(),
      prisma.conceptBacklink.count(),
    ]);

    // Get published vs draft posts
    const publishedPosts = await prisma.post.count({ where: { status: 'PUBLISHED' } });
    const draftPosts = await prisma.post.count({ where: { status: 'DRAFT' } });

    // Get post types breakdown
    const postTypes = {
      posts: await prisma.post.count({ where: { type: 'POST' } }),
      ideas: await prisma.post.count({ where: { type: 'IDEA' } }),
      research: await prisma.post.count({ where: { type: 'RESEARCH' } }),
    };

    // Get graph stats
    const postConcepts = await prisma.postConcept.count();
    const postTags = await prisma.postTag.count();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        posts: {
          total: postCount,
          published: publishedPosts,
          drafts: draftPosts,
          byType: postTypes,
        },
        concepts: conceptCount,
        tags: tagCount,
        users: userCount,
        bookmarks: bookmarkCount,
        readingHistory: readingHistoryCount,
        edges: {
          backlinks: backlinkCount,
          conceptBacklinks: conceptBacklinkCount,
          postConcepts: postConcepts,
          postTags: postTags,
          total: backlinkCount + conceptBacklinkCount + postConcepts + postTags,
        },
      },
    });
  } catch (error) {
    console.error('[Debug] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
