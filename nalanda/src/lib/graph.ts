import prisma from './database';

export interface GraphNode {
  id: string;
  type: 'post' | 'concept' | 'tag';
  label: string;
  slug?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'reference' | 'tag' | 'concept';
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphFilter {
  showPosts?: boolean;
  showConcepts?: boolean;
  showTags?: boolean;
}

// In-memory cache for graph data
let cachedGraphData: GraphData | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60000; // 1 minute cache

/**
 * Generate graph data for visualization
 * Supports filtering and caching
 */
export async function generateGraphData(filter?: GraphFilter): Promise<GraphData> {
  const {
    showPosts = true,
    showConcepts = true,
    showTags = true,
  } = filter || {};

  // Check cache
  const now = Date.now();
  if (cachedGraphData && (now - cacheTimestamp) < CACHE_TTL) {
    return applyFilter(cachedGraphData, filter);
  }

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Fetch posts
  if (showPosts) {
    const posts = await prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        tags: { include: { tag: true } },
        concepts: { include: { concept: true } },
      },
    });

    // Add post nodes
    for (const post of posts) {
      nodes.push({
        id: `post-${post.id}`,
        type: 'post',
        label: post.title,
        slug: post.slug,
      });
    }

    // Add concept nodes and edges (only if showing concepts)
    if (showConcepts) {
      for (const post of posts) {
        for (const postConcept of post.concepts) {
          // Add concept node if not already added
          const conceptNodeId = `concept-${postConcept.concept.id}`;
          if (!nodes.find(n => n.id === conceptNodeId)) {
            nodes.push({
              id: conceptNodeId,
              type: 'concept',
              label: postConcept.concept.name,
              slug: postConcept.concept.slug,
            });
          }

          // Add edge
          edges.push({
            id: `edge-post-${post.id}-concept-${postConcept.concept.id}`,
            source: `post-${post.id}`,
            target: conceptNodeId,
            type: 'concept',
          });
        }
      }
    }

    // Add tag nodes and edges (only if showing tags)
    if (showTags) {
      for (const post of posts) {
        for (const postTag of post.tags) {
          // Add tag node if not already added
          const tagNodeId = `tag-${postTag.tag.id}`;
          if (!nodes.find(n => n.id === tagNodeId)) {
            nodes.push({
              id: tagNodeId,
              type: 'tag',
              label: postTag.tag.name,
              slug: postTag.tag.slug,
            });
          }

          // Add edge
          edges.push({
            id: `edge-post-${post.id}-tag-${postTag.tag.id}`,
            source: `post-${post.id}`,
            target: tagNodeId,
            type: 'tag',
          });
        }
      }
    }
  }

  // Fetch standalone concepts (concepts without posts)
  if (showConcepts) {
    const concepts = await prisma.concept.findMany({
      include: {
        posts: { include: { post: true } },
      },
    });

    for (const concept of concepts) {
      const conceptNodeId = `concept-${concept.id}`;
      
      // Add concept node if not already added
      if (!nodes.find(n => n.id === conceptNodeId)) {
        nodes.push({
          id: conceptNodeId,
          type: 'concept',
          label: concept.name,
          slug: concept.slug,
        });
      }
    }
  }

  const graphData = { nodes, edges };
  
  // Cache the full graph data
  cachedGraphData = graphData;
  cacheTimestamp = Date.now();

  return applyFilter(graphData, filter);
}

/**
 * Apply filter to graph data
 */
function applyFilter(data: GraphData, filter?: GraphFilter): GraphData {
  const {
    showPosts = true,
    showConcepts = true,
    showTags = true,
  } = filter || {};

  const nodes = data.nodes.filter(node => {
    if (node.type === 'post' && !showPosts) return false;
    if (node.type === 'concept' && !showConcepts) return false;
    if (node.type === 'tag' && !showTags) return false;
    return true;
  });

  const nodeIds = new Set(nodes.map(n => n.id));

  const edges = data.edges.filter(edge => {
    return nodeIds.has(edge.source) && nodeIds.has(edge.target);
  });

  return { nodes, edges };
}

/**
 * Clear the graph cache
 */
export function clearGraphCache(): void {
  cachedGraphData = null;
  cacheTimestamp = 0;
}

/**
 * Get related concepts for a concept
 */
export async function getRelatedConcepts(conceptId: string, limit: number = 5): Promise<GraphNode[]> {
  const concept = await prisma.concept.findUnique({
    where: { id: conceptId },
    include: {
      posts: {
        include: {
          post: {
            include: {
              concepts: {
                include: { concept: true },
              },
            },
          },
        },
      },
    },
  });

  if (!concept) return [];

  const relatedConceptIds = new Set<string>();
  
  for (const postConcept of concept.posts) {
    for (const pc of postConcept.post.concepts) {
      if (pc.conceptId !== conceptId) {
        relatedConceptIds.add(pc.conceptId);
      }
    }
  }

  const relatedConcepts = await prisma.concept.findMany({
    where: { id: { in: Array.from(relatedConceptIds) } },
    take: limit,
  });

  return relatedConcepts.map((c) => ({
    id: c.id,
    type: 'concept' as const,
    label: c.name,
    slug: c.slug,
  }));
}

/**
 * Get graph statistics
 */
export async function getGraphStats(): Promise<{
  totalNodes: number;
  totalEdges: number;
  postNodes: number;
  conceptNodes: number;
  tagNodes: number;
}> {
  const data = await generateGraphData();
  
  return {
    totalNodes: data.nodes.length,
    totalEdges: data.edges.length,
    postNodes: data.nodes.filter(n => n.type === 'post').length,
    conceptNodes: data.nodes.filter(n => n.type === 'concept').length,
    tagNodes: data.nodes.filter(n => n.type === 'tag').length,
  };
}
