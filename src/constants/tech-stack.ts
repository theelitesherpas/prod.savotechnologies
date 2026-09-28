/**
 * Curated technology stacks and integrations for the case-study form.
 * Selectable chips prevent typos and standardize naming across all
 * case studies. Custom entries are still allowed via the "+ Add" input.
 */

export const TECH_STACK_OPTIONS: { category: string; items: string[] }[] = [
  {
    category: "Frontend",
    items: ["React", "Next.js", "Vue.js", "Angular", "Svelte", "TypeScript", "JavaScript", "Tailwind CSS", "HTML5", "CSS3", "Sass"],
  },
  {
    category: "Mobile",
    items: ["Flutter", "React Native", "Swift", "Kotlin", "iOS", "Android", "Expo", "Firebase Auth"],
  },
  {
    category: "Backend",
    items: ["Node.js", "Python", "Java", "Go", "Rust", "PHP", "Laravel", "Django", "Express.js", "NestJS", "Spring Boot", ".NET"],
  },
  {
    category: "Database",
    items: ["PostgreSQL", "MongoDB", "MySQL", "Redis", "Supabase", "Firebase", "SQLite", "Prisma", "DynamoDB"],
  },
  {
    category: "AI / ML",
    items: ["OpenAI", "Anthropic Claude", "Google Gemini", "LangChain", "RAG", "Vector Search", "TensorFlow", "PyTorch", "Hugging Face", "OpenCV"],
  },
  {
    category: "Cloud & DevOps",
    items: ["AWS", "Google Cloud", "Azure", "Docker", "Kubernetes", "Vercel", "Nginx", "CI/CD", "Terraform", "Linux"],
  },
  {
    category: "Payments",
    items: ["Stripe", "Razorpay", "PayPal", "PhonePe", "UPI", "Square"],
  },
  {
    category: "CMS & Content",
    items: ["WordPress", "Contentful", "Sanity", "Strapi", "Shopify", "WooCommerce", "Headless CMS"],
  },
  {
    category: "Communication",
    items: ["SendGrid", "Twilio", "Firebase Cloud Messaging", "Push Notifications", "WebRTC", "WebSocket"],
  },
  {
    category: "Analytics & Growth",
    items: ["Google Analytics", "GA4", "Mixpanel", "PostHog", "Hotjar", "Google Search Console", "AEO", "SEO"],
  },
  {
    category: "APIs & Integration",
    items: ["REST API", "GraphQL", "tRPC", "Webhooks", "OAuth 2.0", "Stripe API", "WhatsApp Business API"],
  },
];

export const ALL_TECH_STACKS = TECH_STACK_OPTIONS.flatMap((g) => g.items).sort();

export const INTEGRATION_OPTIONS = [
  "Stripe", "Razorpay", "PayPal", "SendGrid", "Twilio", "Firebase", "Supabase",
  "Google Maps", "Google Analytics", "Google Calendar", "WhatsApp Business",
  "Slack", "Zapier", "Shopify", "WordPress", "Mailchimp", "HubSpot",
  "Salesforce", "Zoho", "Notion", "Airtable", "Cloudinary", "AWS S3",
  "Twilio SMS", "Firebase Auth", "Google OAuth", "Apple Sign-In",
].sort();

export const BUSINESS_MODELS = [
  "B2B", "B2C", "B2B2C", "SaaS", "Marketplace", "E-commerce", "Enterprise", "Startup",
] as const;

export const PLATFORM_OPTIONS = [
  "Web", "iOS", "Android", "PWA", "Desktop", "Apple Watch", "iPad",
] as const;
