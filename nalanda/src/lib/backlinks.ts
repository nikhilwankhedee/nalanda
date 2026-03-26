/**
 * Enhanced Backlink Parser
 * Supports: [[Concept Name]] and [[Concept Name|Alias]]
 * Filters out junk concepts
 */

// Pattern matches: [[Concept Name]] or [[Concept Name|Alias]]
const BACKLINK_REGEX = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

// Generic/invalid concept names to filter out
const BLOCKED_CONCEPTS = new Set([
  'concept',
  'example',
  'note',
  'test',
  'foo',
  'bar',
  'baz',
  'lorem',
  'ipsum',
]);

export interface BacklinkMatch {
  original: string;
  target: string;        // The display name (alias or concept name)
  conceptName: string;   // The actual concept name for lookup
  slug: string;          // Normalized slug
}

/**
 * Normalize concept name to a valid slug
 */
export function normalizeConcept(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Check if a concept name is valid
 */
export function isValidConcept(name: string): boolean {
  const trimmed = name.trim().toLowerCase();
  
  // Too short
  if (trimmed.length < 3) {
    return false;
  }
  
  // Blocked words
  if (BLOCKED_CONCEPTS.has(trimmed)) {
    return false;
  }
  
  // Contains only numbers
  if (/^\d+$/.test(trimmed)) {
    return false;
  }
  
  return true;
}

/**
 * Extract all [[concept]] references from content
 * Supports: [[Concept Name]] and [[Concept Name|Alias]]
 */
export function extractBacklinks(content: string): BacklinkMatch[] {
  const matches: BacklinkMatch[] = [];
  
  // Remove code blocks to avoid matching backlinks in code
  const contentWithoutCode = content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '');
  
  const regex = new RegExp(BACKLINK_REGEX);
  let match: RegExpExecArray | null;

  while ((match = regex.exec(contentWithoutCode)) !== null) {
    const conceptName = match[1].trim();
    const alias = match[2]?.trim();
    
    // Skip invalid concepts
    if (!isValidConcept(conceptName)) {
      continue;
    }
    
    const slug = normalizeConcept(conceptName);
    const target = alias || conceptName;
    
    matches.push({
      original: match[0],
      target,
      conceptName,
      slug,
    });
  }

  return matches;
}

/**
 * Convert [[concept]] syntax to markdown links
 * Supports: [[Concept Name]] and [[Concept Name|Alias]]
 */
export function processBacklinks(content: string, baseUrl: string = ''): string {
  return content.replace(BACKLINK_REGEX, (match, conceptName, alias) => {
    if (!isValidConcept(conceptName)) {
      return match; // Keep original if invalid
    }
    
    const slug = normalizeConcept(conceptName);
    const displayText = alias || conceptName;
    const href = `${baseUrl}/concepts/${slug}`;
    
    return `[${displayText}](${href})`;
  });
}

/**
 * Get unique backlink targets from content
 */
export function getUniqueBacklinks(content: string): string[] {
  const matches = extractBacklinks(content);
  const unique = new Set(matches.map((m) => m.slug));
  return Array.from(unique);
}

/**
 * Get concept info from a backlink match
 */
export function getConceptInfo(match: BacklinkMatch): {
  name: string;
  slug: string;
  displayName: string;
} {
  return {
    name: match.conceptName,
    slug: match.slug,
    displayName: match.target,
  };
}
