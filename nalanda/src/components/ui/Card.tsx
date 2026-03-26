import Link from 'next/link';

interface CardProps {
  title: string;
  href: string;
  excerpt?: string;
  date?: string;
  tags?: string[];
  type?: 'post' | 'concept' | 'idea' | 'research';
}

export function Card({ title, href, excerpt, date, tags, type }: CardProps) {
  return (
    <Link href={href}>
      <article className="card group cursor-pointer">
        <div className="flex items-start justify-between">
          <h3 className="card-title group-hover:text-primary-600 transition-colors">
            {title}
          </h3>
          {type && (
            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 capitalize">
              {type}
            </span>
          )}
        </div>
        {excerpt && <p className="card-excerpt">{excerpt}</p>}
        <div className="flex items-center justify-between mt-4">
          {date && <span className="text-xs text-gray-400">{date}</span>}
          {tags && tags.length > 0 && (
            <div className="flex gap-2">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 rounded-full bg-primary-50 text-primary-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
