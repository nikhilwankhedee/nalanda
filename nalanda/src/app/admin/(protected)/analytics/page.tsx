import prisma from '@/lib/database';
import AnalyticsCard from '@/components/admin/AnalyticsCard';
import CountryChart from '@/components/admin/CountryChart';
import TopPostsTable from '@/components/admin/TopPostsTable';
import ConceptTrends from '@/components/admin/ConceptTrends';
import LiveVisitorsWidget from '@/components/admin/LiveVisitorsWidget';

export default async function AdminAnalyticsPage() {
  // Fetch live visitors (last 60 seconds)
  const sixtySecondsAgo = new Date(Date.now() - 60 * 1000);
  const liveVisitorsData = await prisma.visitorEvent.findMany({
    where: {
      createdAt: { gte: sixtySecondsAgo },
    },
    select: { visitorId: true, country: true, page: true },
    distinct: ['visitorId'],
  });

  // Fetch today's stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const visitorsTodayData = await prisma.visitorEvent.findMany({
    where: {
      createdAt: { gte: today },
    },
    distinct: ['visitorId'],
    select: { visitorId: true },
  });
  const visitorsToday = visitorsTodayData.length;
  const pageViewsTodayData = await prisma.visitorEvent.findMany({
    where: {
      createdAt: { gte: today },
      event: 'page_view',
    },
    select: { id: true },
  });
  const pageViewsToday = pageViewsTodayData.length;

  // Fetch total stats
  const allVisitorsData = await prisma.visitorEvent.findMany({
    distinct: ['visitorId'],
    select: { visitorId: true },
  });
  const totalVisitors = allVisitorsData.length;
  const allPageViewsData = await prisma.visitorEvent.findMany({
    where: { event: 'page_view' },
    select: { id: true },
  });
  const totalPageViews = allPageViewsData.length;

  // Fetch visitors by country
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

  // Fetch top pages
  const topPages = await prisma.visitorEvent.groupBy({
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

  // Fetch top posts
  const topPostsData = await prisma.knowledgeEvent.groupBy({
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

  // Fetch post details for top posts
  const topPosts = await Promise.all(
    topPostsData.map(async (item) => {
      if (item.postId) {
        const post = await prisma.post.findUnique({
          where: { id: item.postId },
          select: { id: true, title: true, slug: true },
        });
        return { ...item, post };
      }
      return item;
    })
  );

  // Fetch completed posts count (reading completion metric)
  const completedPosts = await prisma.knowledgeEvent.findMany({
    where: {
      event: 'post_complete',
      postId: { not: null },
    },
    select: { postId: true },
  });
  const completedPostsCount = completedPosts.length;

  // Fetch average scroll depth
  const scrollEvents = await prisma.visitorEvent.findMany({
    where: {
      event: { startsWith: 'scroll_' },
      value: { not: null },
    },
    select: { value: true },
  });
  const avgScrollDepth = scrollEvents.length > 0
    ? Math.round(scrollEvents.reduce((sum, s) => sum + (s.value || 0), 0) / scrollEvents.length)
    : 0;

  // Fetch returning visitors
  const visitorCounts = await prisma.visitorEvent.groupBy({
    by: ['visitorId'],
    _count: { visitorId: true },
    orderBy: {
      _count: { visitorId: 'desc' },
    },
  });
  const returningVisitors = visitorCounts.filter((v) => v._count.visitorId > 1).length;

  // Fetch trending concepts
  const trendingConceptsData = await prisma.knowledgeEvent.groupBy({
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

  // Fetch concept details
  const trendingConcepts = await Promise.all(
    trendingConceptsData.map(async (item) => {
      if (item.conceptId) {
        const concept = await prisma.concept.findUnique({
          where: { id: item.conceptId },
          select: { id: true, name: true, slug: true },
        });
        return { ...item, concept };
      }
      return item;
    })
  );

  // Fetch most followed concepts
  const followedConceptsData = await prisma.knowledgeEvent.groupBy({
    by: ['conceptId'],
    _count: { conceptId: true },
    where: {
      conceptId: { not: null },
      event: 'concept_follow',
    },
    orderBy: {
      _count: { conceptId: 'desc' },
    },
    take: 5,
  });

  const followedConcepts = await Promise.all(
    followedConceptsData.map(async (item) => {
      if (item.conceptId) {
        const concept = await prisma.concept.findUnique({
          where: { id: item.conceptId },
          select: { id: true, name: true, slug: true },
        });
        return { ...item, concept };
      }
      return item;
    })
  );

  return (
    <div className="space-y-8">
      {/* Live Visitors Widget */}
      <LiveVisitorsWidget
        initialCount={liveVisitorsData.length}
        initialVisitors={liveVisitorsData}
      />

      {/* Visitor Analytics */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Visitor Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnalyticsCard
            title="Visitors Today"
            value={visitorsToday}
            description="Unique visitors"
            icon="👥"
          />
          <AnalyticsCard
            title="Page Views Today"
            value={pageViewsToday}
            description="Total page views"
            icon="📄"
          />
          <AnalyticsCard
            title="Total Visitors"
            value={totalVisitors}
            description="All time"
            icon="🌍"
          />
          <AnalyticsCard
            title="Returning Visitors"
            value={returningVisitors}
            description="Visited more than once"
            icon="🔄"
          />
        </div>
      </section>

      {/* Content Analytics */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Content Analytics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnalyticsCard
            title="Completed Reads"
            value={completedPostsCount}
            description="Posts read completely"
            icon="📚"
          />
          <AnalyticsCard
            title="Average Scroll Depth"
            value={`${avgScrollDepth}%`}
            description="Per page"
            icon="📜"
          />
        </div>
        <div className="mt-6">
          <TopPostsTable initialPosts={topPosts as any} />
        </div>
      </section>

      {/* Knowledge Analytics */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Knowledge Analytics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ConceptTrends concepts={trendingConcepts as any} title="Trending Concepts" />
          <ConceptTrends concepts={followedConcepts as any} title="Most Followed Concepts" />
        </div>
      </section>

      {/* Geographic Distribution */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Geographic Distribution</h2>
        <CountryChart countries={countries} />
      </section>

      {/* Top Pages */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Top Pages</h2>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="space-y-3">
            {topPages.map((page, index) => (
              <div
                key={page.page}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400 w-6">{index + 1}</span>
                  <span className="text-sm text-gray-900 font-mono">{page.page}</span>
                </div>
                <span className="text-sm font-medium text-gray-600">
                  {page._count.page} views
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
