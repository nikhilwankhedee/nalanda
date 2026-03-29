import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/database';
import geoip from 'geoip-lite';

const trackSchema = {
  visitorId: (v: string) => typeof v === 'string' && v.length > 0,
  event: (v: string) => typeof v === 'string' && v.length > 0,
  page: (v?: string) => v === undefined || typeof v === 'string',
  postId: (v?: string) => v === undefined || typeof v === 'string',
  conceptId: (v?: string) => v === undefined || typeof v === 'string',
  value: (v?: number) => v === undefined || typeof v === 'number',
};

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
  return ip;
}

function getCountryFromIp(ip: string): string | null {
  const geo = geoip.lookup(ip);
  return geo?.country || null;
}

function getDeviceFromRequest(request: NextRequest): string {
  const userAgent = request.headers.get('user-agent') || '';
  if (/mobile/i.test(userAgent)) return 'mobile';
  if (/tablet/i.test(userAgent)) return 'tablet';
  return 'desktop';
}

// POST - Track analytics event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { visitorId, event, page, postId, conceptId, value } = body;

    // Validate required fields
    if (!visitorId || !event) {
      return NextResponse.json(
        { error: 'visitorId and event are required' },
        { status: 400 }
      );
    }

    // Get IP and geo data
    const ip = getClientIp(request);
    const country = getCountryFromIp(ip);
    const device = getDeviceFromRequest(request);

    // Store visitor event
    await prisma.visitorEvent.create({
      data: {
        visitorId,
        page: page || '/',
        country,
        device,
        event,
        value: value || null,
      },
    });

    // Store knowledge event if applicable
    if (postId || conceptId) {
      await prisma.knowledgeEvent.create({
        data: {
          visitorId,
          postId: postId || null,
          conceptId: conceptId || null,
          event,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking analytics:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}

// GET - Get analytics data (for admin dashboard)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'overview';

    if (type === 'live') {
      // Live visitors in last 60 seconds
      const sixtySecondsAgo = new Date(Date.now() - 60 * 1000);
      const liveVisitors = await prisma.visitorEvent.findMany({
        where: {
          createdAt: { gte: sixtySecondsAgo },
        },
        select: { visitorId: true, country: true, page: true },
        distinct: ['visitorId'],
      });
      return NextResponse.json({ 
        count: liveVisitors.length,
        visitors: liveVisitors 
      });
    }

    if (type === 'today') {
      // Visitors today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const visitorsToday = await prisma.visitorEvent.findMany({
        where: {
          createdAt: { gte: today },
        },
        select: { visitorId: true },
        distinct: ['visitorId'],
      });
      const pageViewsToday = await prisma.visitorEvent.count({
        where: {
          createdAt: { gte: today },
          event: 'page_view',
        },
      });
      return NextResponse.json({
        visitors: visitorsToday.length,
        pageViews: pageViewsToday,
      });
    }

    if (type === 'countries') {
      // Visitors by country
      const countries = await prisma.visitorEvent.groupBy({
        by: ['country'],
        _count: { country: true },
        where: {
          country: { not: null },
        },
        orderBy: {
          _count: { country: 'desc' },
        },
        take: 10,
      });
      return NextResponse.json({ countries });
    }

    if (type === 'top-pages') {
      // Top pages
      const pages = await prisma.visitorEvent.groupBy({
        by: ['page'],
        _count: { page: true },
        where: {
          event: 'page_view',
        },
        orderBy: {
          _count: { page: 'desc' },
        },
        take: 10,
      });
      return NextResponse.json({ pages });
    }

    if (type === 'top-posts') {
      // Most read posts
      const posts = await prisma.knowledgeEvent.groupBy({
        by: ['postId'],
        _count: { postId: true },
        where: {
          postId: { not: null },
          event: 'post_open',
        },
        orderBy: {
          _count: { postId: 'desc' },
        },
        take: 10,
      });
      return NextResponse.json({ posts });
    }

    if (type === 'reading-time') {
      // Completed reads count
      const completedReads = await prisma.knowledgeEvent.findMany({
        where: {
          event: 'post_complete',
          postId: { not: null },
        },
        select: { postId: true },
      });
      return NextResponse.json({ count: completedReads.length });
    }

    if (type === 'scroll-depth') {
      // Average scroll depth
      const scrollEvents = await prisma.visitorEvent.findMany({
        where: {
          event: { startsWith: 'scroll_' },
          value: { not: null },
        },
        select: { value: true },
      });
      const avgScrollDepth = scrollEvents.length > 0
        ? scrollEvents.reduce((sum, s) => sum + (s.value || 0), 0) / scrollEvents.length
        : 0;
      return NextResponse.json({ average: avgScrollDepth });
    }

    if (type === 'trending-concepts') {
      // Trending concepts
      const concepts = await prisma.knowledgeEvent.groupBy({
        by: ['conceptId'],
        _count: { conceptId: true },
        where: {
          conceptId: { not: null },
          event: 'concept_view',
        },
        orderBy: {
          _count: { conceptId: 'desc' },
        },
        take: 10,
      });
      return NextResponse.json({ concepts });
    }

    if (type === 'concept-follows') {
      // Most followed concepts
      const follows = await prisma.knowledgeEvent.groupBy({
        by: ['conceptId'],
        _count: { conceptId: true },
        where: {
          conceptId: { not: null },
          event: 'concept_follow',
        },
        orderBy: {
          _count: { conceptId: 'desc' },
        },
        take: 10,
      });
      return NextResponse.json({ concepts: follows });
    }

    if (type === 'returning') {
      // Returning visitors
      const visitorCounts = await prisma.visitorEvent.groupBy({
        by: ['visitorId'],
        _count: { visitorId: true },
        orderBy: {
          _count: { visitorId: 'desc' },
        },
      });
      const returning = visitorCounts.filter(v => v._count.visitorId > 1).length;
      return NextResponse.json({ returning });
    }

    // Default: overview
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const visitorsToday = await prisma.visitorEvent.findMany({
      where: {
        createdAt: { gte: startOfDay },
      },
      distinct: ['visitorId'],
      select: { visitorId: true },
    });
    const uniqueVisitorsToday = visitorsToday.length;

    const pageViewsToday = await prisma.visitorEvent.findMany({
      where: {
        createdAt: { gte: startOfDay },
        event: 'page_view',
      },
      select: { id: true },
    });
    const pageViewsTodayCount = pageViewsToday.length;

    const allVisitors = await prisma.visitorEvent.findMany({
      distinct: ['visitorId'],
      select: { visitorId: true },
    });
    const totalVisitors = allVisitors.length;

    const allPageViews = await prisma.visitorEvent.findMany({
      where: { event: 'page_view' },
      select: { id: true },
    });
    const totalPageViews = allPageViews.length;

    const totalKnowledgeEvents = await prisma.knowledgeEvent.count();

    return NextResponse.json({
      totalVisitors,
      uniqueVisitorsToday,
      pageViewsToday: pageViewsTodayCount,
      totalPageViews,
      totalKnowledgeEvents,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
