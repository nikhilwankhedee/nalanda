import { Suspense } from 'react';
import { generateGraphData } from '@/lib/graph';
import { KnowledgeGraph } from '@/components/graph/KnowledgeGraph';

export default async function GraphPage() {
  const graphData = await generateGraphData();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Knowledge Graph</h1>
        <p className="text-gray-600">
          Explore the connections between posts, concepts, and tags.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="w-full h-[600px] flex items-center justify-center border border-gray-200 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4" />
              <p className="text-gray-500">Loading graph...</p>
            </div>
          </div>
        }
      >
        <KnowledgeGraph data={graphData} />
      </Suspense>

      {/* Graph Stats */}
      <div className="grid grid-cols-3 gap-6 mt-8">
        <div className="card">
          <div className="text-2xl font-bold text-blue-600">
            {graphData.nodes.filter((n) => n.type === 'post').length}
          </div>
          <div className="text-sm text-gray-500 mt-1">Posts</div>
        </div>
        <div className="card">
          <div className="text-2xl font-bold text-green-600">
            {graphData.nodes.filter((n) => n.type === 'concept').length}
          </div>
          <div className="text-sm text-gray-500 mt-1">Concepts</div>
        </div>
        <div className="card">
          <div className="text-2xl font-bold text-purple-600">
            {graphData.nodes.filter((n) => n.type === 'tag').length}
          </div>
          <div className="text-sm text-gray-500 mt-1">Tags</div>
        </div>
      </div>
    </div>
  );
}
