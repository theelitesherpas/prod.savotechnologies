/** Original technology-family reasoning, architecture principles and all eleven FAQs.
 * The redesign changes presentation, not stack choices. No new vendor, metric
 * or certification claims are added. */
export type TechnologyTool = { name: string; logo?: string };
export type TechnologyFamily = { id: string; family: string; picks: string; why: string; where: string; tools: TechnologyTool[] };

export const TECHNOLOGY_STACK: TechnologyFamily[] = [
  {
    "id": "frontend",
    "family": "Frontend",
    "picks": "Next.js · React · TypeScript · Tailwind CSS",
    "why": "Server rendering for content speed and search, client interactivity where it earns its JavaScript. One framework covers marketing sites and full applications.",
    "where": "Most web products. A pure SPA is chosen only for app-like, login-first products behind no SEO need.",
    "tools": [
      {
        "name": "Next.js",
        "logo": "nextdotjs"
      },
      {
        "name": "React",
        "logo": "react"
      },
      {
        "name": "TypeScript",
        "logo": "typescript"
      },
      {
        "name": "Tailwind CSS",
        "logo": "tailwindcss"
      }
    ]
  },
  {
    "id": "mobile",
    "family": "Mobile",
    "picks": "Flutter · React Native · Swift · Kotlin",
    "why": "Cross-platform for most products, native when hardware, platform APIs or polish demand it. The choice follows the product, not our comfort.",
    "where": "Two-platform products with standard UI patterns. Camera-first, OS-deep or performance-critical apps go native.",
    "tools": [
      {
        "name": "Flutter",
        "logo": "flutter"
      },
      {
        "name": "React Native",
        "logo": "reactnative"
      },
      {
        "name": "Swift",
        "logo": "swift"
      },
      {
        "name": "Kotlin",
        "logo": "kotlin"
      }
    ]
  },
  {
    "id": "backend",
    "family": "Backend",
    "picks": "Node.js · TypeScript · Python",
    "why": "Typed end-to-end with the frontend; Python where the data and AI ecosystem lives. Boring, observable services over clever frameworks.",
    "where": "APIs, integrations and product services. CPU-heavy analysis moves to Python where the libraries are.",
    "tools": [
      {
        "name": "Node.js",
        "logo": "nodedotjs"
      },
      {
        "name": "TypeScript",
        "logo": "typescript"
      },
      {
        "name": "Python",
        "logo": "python"
      }
    ]
  },
  {
    "id": "data",
    "family": "Data",
    "picks": "PostgreSQL · Prisma · Redis",
    "why": "PostgreSQL handles relational work, JSON and search well enough for most products; Redis for caches and queues where needed.",
    "where": "Default choice. Document stores and specialised search engines earn their place at real scale, not at whiteboard scale.",
    "tools": [
      {
        "name": "PostgreSQL",
        "logo": "postgresql"
      },
      {
        "name": "Prisma",
        "logo": "prisma"
      },
      {
        "name": "Redis",
        "logo": "redis"
      }
    ]
  },
  {
    "id": "ai",
    "family": "AI",
    "picks": "LLM APIs · RAG pipelines · evaluation harnesses",
    "why": "Models are components behind grounded retrieval, guardrails and evaluation. Choice of model is a cost and latency decision per task.",
    "where": "Anywhere answers must be grounded in your data. Deterministic workflows stay deterministic.",
    "tools": [
      {
        "name": "LLM APIs"
      },
      {
        "name": "RAG pipelines"
      },
      {
        "name": "evaluation harnesses"
      }
    ]
  },
  {
    "id": "cloud",
    "family": "Cloud & DevOps",
    "picks": "Managed cloud · containers · CI/CD · monitoring",
    "why": "Automated pipelines, preview environments and monitoring from day one. Infrastructure as reviewed code, not clicked consoles.",
    "where": "Every production system we operate.",
    "tools": [
      {
        "name": "Managed cloud"
      },
      {
        "name": "containers"
      },
      {
        "name": "CI/CD"
      },
      {
        "name": "monitoring"
      }
    ]
  }
];

export const ARCHITECTURE_JUDGMENT = [
  {
    "k": "Modular first, distributed when justified",
    "v": "Microservices are not automatically better architecture. For many products a well structured modular application is easier to operate and maintain. We introduce distributed systems when scale, team structure or technical requirements justify the additional complexity."
  },
  {
    "k": "API-first, always",
    "v": "Every system we build exposes its capability through typed APIs, even when only one frontend consumes them today. The second consumer arrives eventually; API-first costs little now and saves a rewrite later."
  },
  {
    "k": "Events where they belong",
    "v": "Queues and event streams for anything that must survive spikes or retry: emails, syncs, exports, notifications. Synchronous coupling is reserved for interactions that genuinely need an immediate answer."
  },
  {
    "k": "Caching as a decision",
    "v": "Cache layers are added per measured problem with explicit invalidation, never as default decoration. An unmeasured cache is a future incident."
  },
  {
    "k": "Multi-tenancy decided early",
    "v": "Whether a SaaS isolates tenants by column, schema or database is expensive to change later. We decide it from the compliance and scale requirements at the start."
  },
  {
    "k": "Migrations as projects",
    "v": "Data migrations are planned, rehearsed and reversible. Strangler patterns replace legacy systems piece by piece while they keep serving users."
  }
];

export const TECHNOLOGY_FAQS = [
  {
    "q": "How do you choose the technology stack for a project?",
    "a": "By the problem: content speed and search point to server-rendered web, hardware depth points native, scale and team shape decide architecture. Every major choice is written down with its rejected alternatives."
  },
  {
    "q": "Can you work with our existing technology stack?",
    "a": "Yes. We take over existing codebases and extend current stacks after a structured audit, and we document everything we touch so your team stays in control."
  },
  {
    "q": "Do you modernize legacy applications?",
    "a": "Yes, strangler-style: the new system replaces the old piece by piece while it keeps serving users, with rehearsed data migration and rollback paths at every step."
  },
  {
    "q": "Which AI technologies do you use in production?",
    "a": "LLM APIs behind grounded retrieval, RAG pipelines, tool-calling agents with permission scopes, and evaluation harnesses. Model choice is a cost and latency decision per task, abstracted so providers can swap."
  },
  {
    "q": "Do you recommend microservices for every project?",
    "a": "No. For many products a well-structured modular monolith is easier to operate and maintain. Distributed systems are introduced when scale, team structure or requirements justify the complexity."
  },
  {
    "q": "Which is better: React or Angular?",
    "a": "Both are mature; the choice is organizational. React's ecosystem and Next.js win when content speed, search and product flexibility matter, which is most products. Angular suits large teams that want one prescribed, batteries-included framework. We work in React's ecosystem and will tell you when that is the wrong answer."
  },
  {
    "q": "Is Python or Node.js better for backend development?",
    "a": "Node.js gives one language and one type system across the whole product, which keeps web teams fast. Python owns the data and AI ecosystem: pipelines, models and analysis live there naturally. We run both and decide per workload, not per preference."
  },
  {
    "q": "Is WordPress or a custom-built website better?",
    "a": "WordPress is right when a standard content site is genuinely all you need; it is fast to launch and cheap to run. A custom build pays for itself when search performance, custom workflows, portals or integrations are the product. We build both and say which one fits your case."
  },
  {
    "q": "What is the best technology stack for a startup or SaaS in 2026?",
    "a": "The boring, proven one: TypeScript with Next.js on the front, Node.js services behind, PostgreSQL underneath, managed cloud to run it. Startups die of novelty, not of Postgres. Introduce specialized technology when scale or product reality demands it, with evidence."
  },
  {
    "q": "Which database should we choose: SQL or NoSQL?",
    "a": "Start relational. PostgreSQL covers relational work, JSON documents, full-text search and scale further than most products ever need. Purpose-built stores earn their place for specific workloads, time-series, caching, high-volume telemetry, not as a default. We published a full comparison on Insights."
  },
  {
    "q": "Is Flutter still a good choice for app development in 2026?",
    "a": "Yes for most two-platform products: one codebase, near-native quality, strong tooling. Go fully native when the app is camera-first, platform-deep or performance-critical. Our decision framework, including when we talk clients out of Flutter, is published on Insights."
  }
];
