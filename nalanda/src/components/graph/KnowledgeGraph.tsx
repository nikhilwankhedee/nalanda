'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

interface GraphNodeData {
  id: string;
  type: 'post' | 'concept' | 'tag';
  label: string;
  slug?: string;
}

interface GraphEdgeData {
  id: string;
  source: string;
  target: string;
  type: 'reference' | 'tag' | 'concept';
}

interface GraphData {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
}

interface KnowledgeGraphProps {
  data: GraphData;
}

const nodeColorMap = {
  post: '#3b82f6',
  concept: '#22c55e',
  tag: '#a855f7',
};

export function KnowledgeGraph({ data }: KnowledgeGraphProps) {
  const [showPosts, setShowPosts] = useState(true);
  const [showConcepts, setShowConcepts] = useState(true);
  const [showTags, setShowTags] = useState(true);

  const initialNodes: Node[] = useMemo(
    () =>
      data.nodes.map((node) => ({
        id: node.id,
        type: 'default',
        position: {
          x: Math.random() * 500,
          y: Math.random() * 500,
        },
        data: {
          label: node.label,
          type: node.type,
          slug: node.slug,
        },
        style: {
          padding: '12px 16px',
          borderRadius: '8px',
          border: `2px solid ${nodeColorMap[node.type]}`,
          background: nodeColorMap[node.type] + '20',
          minWidth: '150px',
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: '500',
        },
      })),
    [data.nodes]
  );

  const initialEdges: Edge[] = useMemo(
    () =>
      data.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'smoothstep',
        animated: false,
        style: {
          stroke: edge.type === 'reference' ? '#6b7280' : '#9ca3af',
          strokeWidth: edge.type === 'reference' ? 2 : 1,
        },
      })),
    [data.edges]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const { type, slug } = node.data;
    if (slug) {
      window.location.href = `/${type === 'concept' ? 'concepts' : 'posts'}/${slug}`;
    }
  }, []);

  // Filter nodes and edges based on toggles
  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      const nodeType = node.data.type as string;
      if (nodeType === 'post' && !showPosts) return false;
      if (nodeType === 'concept' && !showConcepts) return false;
      if (nodeType === 'tag' && !showTags) return false;
      return true;
    });
  }, [nodes, showPosts, showConcepts, showTags]);

  const filteredEdgeIds = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    return new Set(edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target)).map(e => e.id));
  }, [filteredNodes, edges]);

  const filteredEdges = useMemo(() => {
    return edges.filter(e => filteredEdgeIds.has(e.id));
  }, [edges, filteredEdgeIds]);

  return (
    <div className="w-full h-[600px] border border-gray-200 rounded-lg relative">
      <ReactFlow
        nodes={filteredNodes}
        edges={filteredEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        attributionPosition="bottom-right"
      >
        <Controls />
        <Background color="#e5e7eb" gap={20} />
      </ReactFlow>

      {/* Legend and Filters */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-4 border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Legend & Filters</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showPosts}
              onChange={(e) => setShowPosts(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-xs text-gray-600">Posts ({nodes.filter(n => n.data.type === 'post').length})</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showConcepts}
              onChange={(e) => setShowConcepts(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-gray-600">Concepts ({nodes.filter(n => n.data.type === 'concept').length})</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showTags}
              onChange={(e) => setShowTags(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-xs text-gray-600">Tags ({nodes.filter(n => n.data.type === 'tag').length})</span>
          </label>
        </div>
      </div>

      {/* Stats */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md p-3 border border-gray-200">
        <div className="text-xs text-gray-500">Visible Nodes</div>
        <div className="text-lg font-bold text-gray-900">{filteredNodes.length}</div>
      </div>
    </div>
  );
}
