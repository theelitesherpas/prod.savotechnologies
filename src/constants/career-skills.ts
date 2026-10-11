export type CareerSkillGroup = { id: string; label: string; skills: readonly string[] };
export const MAX_CAREER_SKILLS = 12;
export const MAX_CAREER_SKILL_LENGTH = 60;

const HR: readonly CareerSkillGroup[] = [
  { id: "recruitment", label: "Recruitment", skills: ["Candidate sourcing", "CV screening", "Interview scheduling", "Candidate communication", "Recruitment tracking", "Job posting", "Applicant tracking systems"] },
  { id: "hr-operations", label: "HR coordination", skills: ["Onboarding coordination", "HR documentation", "Employee records", "Employee coordination", "Data confidentiality", "Attendance tracking"] },
  { id: "hr-tools", label: "Communication & tools", skills: ["Written communication", "Verbal communication", "Microsoft Excel", "Google Sheets", "Attention to detail", "Time management"] },
];
const AI: readonly CareerSkillGroup[] = [
  { id: "ml", label: "Machine learning & data", skills: ["Python", "Machine learning", "scikit-learn", "PyTorch", "TensorFlow", "Pandas", "NumPy", "Data preparation", "Model evaluation"] },
  { id: "llm", label: "LLM applications", skills: ["LLM APIs", "Retrieval-augmented generation (RAG)", "Embeddings", "Vector databases", "Prompt design", "LangChain", "Hugging Face Transformers", "AI guardrails"] },
  { id: "ml-delivery", label: "Integration & delivery", skills: ["FastAPI", "API integration", "Data pipelines", "Docker", "Git", "Automated testing"] },
];
const FULL_STACK_AI: readonly CareerSkillGroup[] = [
  { id: "frontend", label: "Frontend", skills: ["React", "Next.js", "TypeScript", "JavaScript", "HTML & CSS", "Responsive interfaces", "Accessibility", "Frontend testing"] },
  { id: "backend", label: "Backend & data", skills: ["Node.js", "Python", "FastAPI", "Django", "API design", "PostgreSQL", "MongoDB", "Authentication", "Git"] },
  { id: "ai-product", label: "AI integration", skills: ["LLM APIs", "Retrieval-augmented generation (RAG)", "Embeddings", "Prompt design", "Model evaluation", "AI error handling", "Human review workflows"] },
];
const BACKEND: readonly CareerSkillGroup[] = [
  { id: "backend-services", label: "Backend & APIs", skills: ["Node.js", "Python", "Java", "C# / .NET", "Go", "PHP", "TypeScript", "API design", "API integration", "Authentication"] },
  { id: "backend-data", label: "Data & persistence", skills: ["SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Data modelling", "Database migrations", "Query optimisation"] },
  { id: "backend-delivery", label: "Testing & delivery", skills: ["Git", "Automated testing", "Docker", "CI / CD", "Application security", "Application monitoring"] },
];
const DEVOPS: readonly CareerSkillGroup[] = [
  { id: "infrastructure", label: "Cloud & infrastructure", skills: ["AWS", "Microsoft Azure", "Google Cloud", "Linux", "Networking", "Terraform", "Infrastructure as code"] },
  { id: "devops-delivery", label: "Delivery & configuration", skills: ["Git", "CI / CD", "Docker", "Kubernetes", "Configuration management", "Shell scripting"] },
  { id: "operations", label: "Operations & reliability", skills: ["Application monitoring", "Logging", "Alerting", "Backup & recovery", "Access controls", "Incident troubleshooting", "Technical documentation"] },
];
const UI_UX: readonly CareerSkillGroup[] = [
  { id: "design-research", label: "Research & interaction", skills: ["User research", "User flows", "Wireframing", "Interaction design", "Information architecture", "Usability testing"] },
  { id: "interface-design", label: "Interface design", skills: ["Figma", "Prototyping", "UI / UX design", "Visual design", "Typography", "Responsive design", "Accessibility"] },
  { id: "design-systems", label: "Systems & collaboration", skills: ["Design systems", "Component libraries", "Design specifications", "Developer handoff", "Product thinking", "Design communication"] },
];
export const GENERAL_CAREER_SKILL_GROUPS: readonly CareerSkillGroup[] = [
  { id: "web", label: "Frontend & web", skills: ["JavaScript", "TypeScript", "HTML & CSS", "React", "Next.js", "Angular", "Vue", "Svelte", "WordPress", "Responsive interfaces", "Accessibility"] },
  { id: "backend", label: "Backend & APIs", skills: ["Node.js", "Python", "Java", "C# / .NET", "Go", "PHP", "FastAPI", "Django", "Spring Boot", "API design", "Authentication"] },
  { id: "ai", label: "AI & machine learning", skills: ["Machine learning", "scikit-learn", "PyTorch", "TensorFlow", "LLM APIs", "Retrieval-augmented generation (RAG)", "Embeddings", "Prompt design", "LangChain", "Model evaluation"] },
  { id: "data", label: "Data & analytics", skills: ["SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Pandas", "NumPy", "Data pipelines", "Power BI", "Data visualisation"] },
  { id: "cloud", label: "Cloud & delivery", skills: ["AWS", "Microsoft Azure", "Google Cloud", "Docker", "Kubernetes", "Linux", "Git", "CI / CD", "Terraform", "Application monitoring"] },
  { id: "mobile", label: "Mobile development", skills: ["Flutter", "React Native", "Swift", "Kotlin", "Android", "iOS", "Mobile testing"] },
  { id: "design-quality", label: "Design & quality", skills: ["Figma", "UI / UX design", "User research", "Design systems", "Manual testing", "Automated testing", "Playwright", "Cypress", "Product thinking"] },
  { id: "people-ops", label: "People & business operations", skills: ["Candidate sourcing", "CV screening", "Interview scheduling", "Onboarding coordination", "HR documentation", "Employee records", "Microsoft Excel", "Google Sheets", "Project coordination", "Client communication", "Customer support", "Process improvement", "CRM tools", "Bookkeeping", "Administrative support"] },
  { id: "growth", label: "Marketing & growth", skills: ["SEO", "Content writing", "Digital marketing", "Paid campaigns", "Social media management", "Marketing analytics", "Business development", "Account management", "Sales support"] },
];

/** Options describe applicant skills, not vacancies or claims about Savo's teams. */
export function careerSkillGroups(title: string): readonly CareerSkillGroup[] {
  const key = title.trim().toLowerCase();
  if (key === "hr intern") return HR;
  if (key === "ai / ml engineer") return AI;
  if (key === "full stack ai engineer") return FULL_STACK_AI;
  if (key === "backend engineer") return BACKEND;
  if (key === "devops engineer") return DEVOPS;
  if (key.replace(/\s*\/\s*/g, "/") === "ui/ux designer") return UI_UX;
  // Future managed titles still offer a usable directory and a custom-skill field.
  return GENERAL_CAREER_SKILL_GROUPS;
}
