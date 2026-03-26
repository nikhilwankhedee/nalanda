import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface PostFrontmatter {
  title: string;
  excerpt?: string;
  date?: string;
  tags?: string[];
  draft?: boolean;
  type?: 'post' | 'idea' | 'research';
}

export interface PostData {
  slug: string;
  content: string;
  data: PostFrontmatter;
}

const CONTENT_DIR = path.join(process.cwd(), 'content');

/**
 * Get all posts from the content directory
 */
export function getAllPosts(type?: string): PostData[] {
  const postsDir = path.join(CONTENT_DIR, type || 'posts');
  
  if (!fs.existsSync(postsDir)) {
    return [];
  }

  const files = fs.readdirSync(postsDir);
  const posts: PostData[] = [];

  for (const file of files) {
    if (file.endsWith('.mdx') || file.endsWith('.md')) {
      const slug = file.replace(/\.(mdx|md)$/, '');
      const post = getPostBySlug(slug, type);
      if (post) {
        posts.push(post);
      }
    }
  }

  // Sort by date descending
  return posts.sort((a, b) => {
    const dateA = a.data.date ? new Date(a.data.date).getTime() : 0;
    const dateB = b.data.date ? new Date(b.data.date).getTime() : 0;
    return dateB - dateA;
  });
}

/**
 * Get a single post by slug
 */
export function getPostBySlug(slug: string, type: string = 'posts'): PostData | null {
  const filePath = path.join(CONTENT_DIR, type, `${slug}.mdx`);
  const altPath = path.join(CONTENT_DIR, type, `${slug}.md`);
  
  const existingPath = fs.existsSync(filePath) ? filePath : 
                       fs.existsSync(altPath) ? altPath : null;

  if (!existingPath) {
    return null;
  }

  const fileContents = fs.readFileSync(existingPath, 'utf8');
  const { data, content } = matter(fileContents);

  return {
    slug,
    content,
    data: data as PostFrontmatter,
  };
}

/**
 * Get all unique tags from posts
 */
export function getAllTags(): string[] {
  const allPosts = [...getAllPosts('posts'), ...getAllPosts('ideas'), ...getAllPosts('research')];
  const tags = new Set<string>();

  for (const post of allPosts) {
    if (post.data.tags) {
      for (const tag of post.data.tags) {
        tags.add(tag);
      }
    }
  }

  return Array.from(tags).sort();
}

/**
 * Get posts by tag
 */
export function getPostsByTag(tag: string): PostData[] {
  const allPosts = [...getAllPosts('posts'), ...getAllPosts('ideas'), ...getAllPosts('research')];
  return allPosts.filter((post) => 
    post.data.tags?.some((t) => t.toLowerCase() === tag.toLowerCase())
  );
}

/**
 * Simple slugify for concept names
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
