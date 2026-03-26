import prisma from '@/lib/database';
import { Card } from '@/components/ui/Card';

export default async function ConceptsPage() {
  const concepts = await prisma.concept.findMany({
    orderBy: { name: 'asc' },
    include: {
      posts: {
        include: { post: true },
      },
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Concepts</h1>
        <p className="text-gray-600">
          Explore the knowledge graph through interconnected concepts.
        </p>
      </div>

      {concepts.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {concepts.map((concept: { id: string; name: string; slug: string; description: string | null }) => (
            <Card
              key={concept.id}
              title={concept.name}
              href={`/concepts/${concept.slug}`}
              excerpt={concept.description || undefined}
              type="concept"
            />
          ))}
        </div>
      ) : (
        <div className="card text-center text-gray-500 py-12">
          <p className="text-lg">No concepts yet.</p>
          <p className="text-sm mt-2">
            Concepts are created automatically when you use [[concept name]] syntax in your posts.
          </p>
        </div>
      )}
    </div>
  );
}
