<div align="center">

# Nalanda

**Knowledge is not a timeline. It is a network.**

Most publishing systems are built on a journalistic assumption: recency equals relevance.
This made sense for news. It is a poor model for ideas that compound, contradict, and cross-reference across years of thinking.

[![Status](https://img.shields.io/badge/status-active_development-4ade80?style=flat-square)](./nalanda)
[![Built with](https://img.shields.io/badge/built_with-Next.js-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Database](https://img.shields.io/badge/database-Prisma-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](./LICENSE)

</div>

---

Every piece of writing is a node. Every concept is a vertex. The graph is the interface.

---

## What it is

Nalanda is a knowledge engine that organizes content by meaning rather than time. It maps the relationships between concepts across everything you have written, automatically and structurally, and surfaces those relationships to the reader as a navigable graph.

The result is a system where a post written three years ago is as discoverable as one written yesterday, provided the reader is thinking about the right concept. Discovery is not chronological. It is topological.

---

## Core mechanics

| Feature | Description |
|---|---|
| **Knowledge graph** | Force-directed graph of concepts and their relationships, navigable in real time |
| **Backlink resolution** | Every concept tracks its references across the entire corpus |
| **Concept following** | Readers subscribe to concepts, not posts. New content finds them |
| **Reading state** | Personalized history surfaces unread content relevant to current context |
| **3D visualization** | Experimental full-corpus view. The entire knowledge structure in three dimensions |

---

## Architecture

```
nalanda/
├── README.md               ← this file
├── LICENSE
└── nalanda/                ← engine
    ├── src/
    ├── prisma/             ← graph schema & migrations
    ├── content/            ← corpus
    └── README.md           ← developer setup
```

Built on Next.js. Prisma over a relational database models the concept, post, and reader graph. Content lives in structured markdown. The graph layer is the non-trivial part.

> Developer setup, environment variables, and local run instructions: [`/nalanda/README.md`](./nalanda/README.md)

---

## Status

| Component | Status |
|---|---|
| Graph engine | ![stable](https://img.shields.io/badge/-stable-4ade80?style=flat-square) |
| Core reading experience | ![stable](https://img.shields.io/badge/-stable-4ade80?style=flat-square) |
| Concept following | ![in progress](https://img.shields.io/badge/-in_progress-facc15?style=flat-square) |
| 3D visualization | ![in progress](https://img.shields.io/badge/-in_progress-facc15?style=flat-square) |

---

## On the name

Nalanda was a university in Bihar, India. Fifth century CE. At its height, 10,000 students, 2,000 faculty, a nine-floor library called *Dharmaganja*. The accumulated scholarship of a civilization, organized in one place.

It was burned. Most of it is gone.

The name is a reminder that knowledge systems are not permanent by default. They require deliberate architecture.

---

<div align="center">

*Built by someone who thinks in systems.*

</div>
