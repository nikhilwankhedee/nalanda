/**
 * Content Ingestion Pipeline for Nalanda
 * 
 * Scans content directories and imports MDX files into the database.
 * Handles posts, ideas, research notes, concepts, tags, and backlinks.
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { PrismaClient, PostType } from '@prisma/client';
import { extractBacklinks, normalizeConcept, isValidConcept } from '../src/lib/backlinks';

const prisma = new PrismaClient();

// Content directories to scan
const CONTENT_DIRS = ['posts', 'ideas', 'research'];
const CONTENT_BASE_PATH = path.join(process.cwd(), 'content');

interface Frontmatter {
  title: string;
  excerpt?: string;
  summary?: string;
  date?: string;
  tags?: string[];
  draft?: boolean;
  type?: string;
}

interface ParsedFile {
  slug: string;
  filePath: string;
  frontmatter: Frontmatter;
  content: string;
  directoryType: string;
}

/**
 * Recursively find all MDX files in a directory
 */
function findMdxFiles(dir: string, baseDir: string): string[] {
  const files: string[] = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      files.push(...findMdxFiles(fullPath, baseDir));
    } else if (entry.isFile() && (entry.name.endsWith('.mdx') || entry.name.endsWith('.md'))) {
      const relativePath = path.relative(baseDir, fullPath);
      files.push(relativePath);
    }
  }

  return files;
}

/**
 * Parse a single MDX file
 */
function parseMdxFile(filePath: string, directoryType: string): ParsedFile | null {
  const fullPath = path.join(CONTENT_BASE_PATH, filePath);
  
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const fileContent = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContent);
  
  // Extract slug from filename
  const fileName = path.basename(filePath);
  const slug = fileName.replace(/\.(mdx|md)$/, '');

  return {
    slug,
    filePath: fullPath,
    frontmatter: data as Frontmatter,
    content,
    directoryType,
  };
}

/**
 * Map directory type to PostType
 */
function getPostType(directoryType: string): PostType {
  switch (directoryType) {
    case 'ideas':
      return PostType.IDEA;
    case 'research':
      return PostType.RESEARCH;
    default:
      return PostType.POST;
  }
}

/**
 * Get or create a default system user for imported content
 */
async function getSystemUser(): Promise<{ id: string }> {
  const email = 'system@nalanda.local';
  
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: 'System Import',
    },
  });

  return user;
}

/**
 * Ingest a single file into the database
 */
async function ingestFile(parsed: ParsedFile, authorId: string): Promise<void> {
  const { slug, frontmatter, content, directoryType } = parsed;

  const postType = getPostType(directoryType);
  const title = frontmatter.title || slug;
  const excerpt = frontmatter.excerpt || frontmatter.summary || content.slice(0, 200);
  const publishedAt = frontmatter.date ? new Date(frontmatter.date) : new Date();

  console.log(`  Ingesting: ${title} (${postType})`);

  // Upsert the post
  const post = await prisma.post.upsert({
    where: { slug },
    update: {
      title,
      content,
      excerpt,
      type: postType,
      status: frontmatter.draft ? 'DRAFT' : 'PUBLISHED',
      publishedAt,
    },
    create: {
      slug,
      title,
      content,
      excerpt,
      type: postType,
      status: frontmatter.draft ? 'DRAFT' : 'PUBLISHED',
      publishedAt,
      author: {
        connect: { id: authorId },
      },
    },
  });

  console.log(`    ✓ Post: ${post.id}`);

  // Process tags
  if (frontmatter.tags && frontmatter.tags.length > 0) {
    for (const tagName of frontmatter.tags) {
      const tagSlug = normalizeConcept(tagName);
      
      // Skip invalid tags
      if (!tagSlug || tagSlug.length < 2) {
        continue;
      }
      
      // Upsert tag
      const tag = await prisma.tag.upsert({
        where: { slug: tagSlug },
        update: { name: tagName },
        create: {
          name: tagName,
          slug: tagSlug,
        },
      });

      // Create PostTag relation (upsert to avoid duplicates)
      await prisma.postTag.upsert({
        where: {
          postId_tagId: {
            postId: post.id,
            tagId: tag.id,
          },
        },
        update: {},
        create: {
          postId: post.id,
          tagId: tag.id,
        },
      });

      console.log(`    ✓ Tag: ${tagName}`);
    }
  }

  // Process backlinks (concepts) using the enhanced parser
  const backlinkMatches = extractBacklinks(content);
  
  if (backlinkMatches.length > 0) {
    const conceptNames = Array.from(new Set(backlinkMatches.map(b => b.conceptName)));
    console.log(`    Found ${conceptNames.length} concept(s): ${conceptNames.join(', ')}`);
    
    for (const match of backlinkMatches) {
      // Skip invalid concepts
      if (!isValidConcept(match.conceptName)) {
        console.log(`    ⊘ Skipped invalid: "${match.conceptName}"`);
        continue;
      }
      
      const conceptSlug = match.slug;
      
      // Upsert concept
      const concept = await prisma.concept.upsert({
        where: { slug: conceptSlug },
        update: { name: match.conceptName },
        create: {
          name: match.conceptName,
          slug: conceptSlug,
          description: `Auto-generated concept page for "${match.conceptName}". Created from backlink references.`,
        },
      });

      console.log(`    ✓ Concept: ${match.conceptName} → ${concept.id}`);

      // Create PostConcept relation
      await prisma.postConcept.upsert({
        where: {
          postId_conceptId: {
            postId: post.id,
            conceptId: concept.id,
          },
        },
        update: {},
        create: {
          postId: post.id,
          conceptId: concept.id,
        },
      });

      // Create ConceptBacklink edge
      await prisma.conceptBacklink.upsert({
        where: {
          sourcePostId_targetConceptId: {
            sourcePostId: post.id,
            targetConceptId: concept.id,
          },
        },
        update: {},
        create: {
          sourcePostId: post.id,
          targetConceptId: concept.id,
        },
      });
    }
  }
}

/**
 * Main ingestion function
 */
async function ingestContent(): Promise<void> {
  console.log('🚀 Starting content ingestion...\n');

  let totalFiles = 0;
  let successCount = 0;
  let errorCount = 0;

  try {
    // Get or create system user for imported content
    console.log('👤 Getting system user...');
    const systemUser = await getSystemUser();
    console.log(`   User ID: ${systemUser.id}\n`);

    for (const dirType of CONTENT_DIRS) {
      const dirPath = path.join(CONTENT_BASE_PATH, dirType);

      if (!fs.existsSync(dirPath)) {
        console.log(`⚠️  Directory not found: ${dirType}`);
        continue;
      }

      console.log(`📁 Scanning: content/${dirType}`);
      const files = findMdxFiles(dirPath, CONTENT_BASE_PATH);

      console.log(`   Found ${files.length} file(s)\n`);

      for (const file of files) {
        totalFiles++;

        try {
          const parsed = parseMdxFile(file, dirType);

          if (parsed) {
            await ingestFile(parsed, systemUser.id);
            successCount++;
            console.log('');
          }
        } catch (error) {
          errorCount++;
          console.error(`  ✗ Error processing ${file}:`, error);
          console.log('');
        }
      }
    }

    console.log('✅ Ingestion complete!\n');
    console.log('📊 Summary:');
    console.log(`   Total files: ${totalFiles}`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log('');

    // Print database stats
    const postCount = await prisma.post.count();
    const conceptCount = await prisma.concept.count();
    const tagCount = await prisma.tag.count();
    const backlinkCount = await prisma.conceptBacklink.count();

    console.log('📈 Database stats:');
    console.log(`   Posts: ${postCount}`);
    console.log(`   Concepts: ${conceptCount}`);
    console.log(`   Tags: ${tagCount}`);
    console.log(`   Concept Backlinks: ${backlinkCount}`);
    console.log('');

  } catch (error) {
    console.error('❌ Ingestion failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run ingestion
ingestContent();
