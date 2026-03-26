# Nalanda v1

A knowledge engine for building living blogs and idea graphs.

## Features

- **Publishing System**: Visual editor with Markdown/MDX support, drafts, and tag system
- **Content Types**: Posts, Ideas, and Research Notes
- **Concept System**: Automatic concept pages with related posts
- **Knowledge Graph**: Interactive graph explorer showing connections between posts, concepts, and tags
- **Backlinks**: Automatic backlink generation using `[[concept]]` syntax
- **User System**: Accounts, login/signup, and profiles
- **Reading Memory**: Track reading history and resume reading
- **Bookmarks**: Save posts and concepts
- **Plugin System**: Extensible architecture for future features

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TailwindCSS
- **Editor**: Tiptap
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth (Auth.js) v5
- **Content**: MDX files
- **Graph Visualization**: React Flow

## Project Structure

```
nalanda/
├── prisma/
│   └── schema.prisma          # Database models
├── src/
│   ├── app/
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── posts/         # Posts CRUD
│   │   │   ├── concepts/      # Concepts CRUD
│   │   │   ├── bookmarks/     # Bookmark management
│   │   │   └── reading-history/ # Reading history
│   │   ├── posts/
│   │   │   ├── page.tsx       # Posts listing
│   │   │   └── [slug]/        # Post detail
│   │   ├── concepts/
│   │   │   ├── page.tsx       # Concepts listing
│   │   │   └── [slug]/        # Concept detail
│   │   ├── graph/
│   │   │   └── page.tsx       # Knowledge graph
│   │   ├── profile/
│   │   │   └── page.tsx       # User dashboard
│   │   ├── auth/
│   │   │   ├── login/         # Login page
│   │   │   └── signup/        # Signup page
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Homepage
│   ├── components/
│   │   ├── editor/            # Tiptap editor
│   │   ├── graph/             # Knowledge graph
│   │   ├── layout/            # Header, Footer
│   │   └── ui/                # Reusable components
│   ├── lib/
│   │   ├── database.ts        # Prisma client
│   │   ├── auth.ts            # NextAuth config
│   │   ├── backlinks.ts       # Backlink parser
│   │   ├── content.ts         # MDX loader
│   │   ├── graph.ts           # Graph generator
│   │   ├── plugins.ts         # Plugin system
│   │   └── utils.ts           # Utilities
│   └── plugins/
│       └── example/           # Example plugin
├── content/
│   ├── posts/                 # MDX posts
│   ├── ideas/                 # MDX ideas
│   └── research/              # MDX research notes
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone and install dependencies**

```bash
cd nalanda
npm install
```

2. **Set up environment variables**

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/nalanda?schema=public"

# NextAuth
AUTH_SECRET="your-secret-key-here"
AUTH_URL="http://localhost:3000"

# Generate AUTH_SECRET with: openssl rand -base64 32
```

3. **Set up the database**

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (development)
npm run db:push

# Or run migrations (production)
npm run db:migrate
```

4. **Start the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see Nalanda.

5. **Import content from MDX files**

```bash
# Ingest all content from content/ directory into the database
npm run ingest
```

This script will:
- Scan `content/posts`, `content/ideas`, `content/research` for `.mdx` files
- Parse frontmatter (title, tags, date, excerpt)
- Create posts in the database
- Extract `[[concept]]` backlinks and create concept pages
- Create tag relations

The script is **idempotent** - running it multiple times will update existing content without creating duplicates.

## Usage

### Creating Content

#### MDX Posts

Create posts in `content/posts/` with frontmatter:

```mdx
---
title: "My First Post"
excerpt: "A brief description of this post"
date: "2024-01-15"
tags: ["introduction", "welcome"]
draft: false
---

This is the content of my post.

I can reference concepts like [[Machine Learning]] or [[Neural Networks]].
```

#### Using the API

Create posts programmatically:

```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "My Post",
    "content": "Content with [[concept]] references",
    "type": "POST",
    "tags": ["tag1", "tag2"]
  }'
```

### Backlink Syntax

Use `[[concept name]]` to create automatic backlinks:

```markdown
This post discusses [[Machine Learning]] and its applications.

Related concepts include [[Deep Learning]] and [[Natural Language Processing]].
```

The system will:
1. Create concept pages automatically
2. Link posts to concepts
3. Generate backlinks on concept pages

### Knowledge Graph

Visit `/graph` to explore the knowledge graph:
- **Blue nodes**: Posts
- **Green nodes**: Concepts
- **Purple nodes**: Tags
- Click nodes to navigate

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/signin` | Sign in |
| POST | `/api/auth/signout` | Sign out |

### Posts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts` | List posts |
| POST | `/api/posts` | Create post |
| GET | `/api/posts/[slug]` | Get post |
| PUT | `/api/posts/[slug]` | Update post |
| DELETE | `/api/posts/[slug]` | Delete post |

### Concepts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/concepts` | List concepts |
| POST | `/api/concepts` | Create concept |
| GET | `/api/concepts/[slug]` | Get concept |

### Bookmarks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookmarks` | Get bookmarks |
| POST | `/api/bookmarks` | Toggle bookmark |

### Reading History

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reading-history` | Get history |
| POST | `/api/reading-history` | Update history |

## Plugin System

Create plugins in `src/plugins/`:

```typescript
import { createPlugin } from '@/lib/plugins';

const myPlugin = createPlugin({
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
})
  .onInit(() => {
    console.log('Plugin initialized!');
  })
  .processContent((content) => {
    // Transform content
    return content;
  })
  .register();
```

## Database Models

- **User**: User accounts
- **Post**: Posts, ideas, research notes
- **Tag**: Tags for categorization
- **Concept**: Knowledge concepts
- **Bookmark**: Saved content
- **ReadingHistory**: Reading progress
- **Backlink**: Post-to-post references
- **ConceptBacklink**: Post-to-concept references

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio
```

## License

MIT
