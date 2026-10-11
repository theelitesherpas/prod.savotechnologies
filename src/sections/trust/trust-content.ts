/** Original policy/practice wording retained from the Trust page.
 * This redesign is not a legal, operational-controls or certification audit.
 * Engagement-specific commitments follow the signed agreement. */
export const OWNERSHIP_ROWS = [
  {
    "k": "Source code",
    "v": "Contracted work product is developed for you and belongs to you. Repositories are handed over with full history, not exported snapshots."
  },
  {
    "k": "Design files",
    "v": "Design source files, prototypes and the design system built for your product are part of the deliverable."
  },
  {
    "k": "Repository access",
    "v": "You have access to the repository from the start of the engagement, not at the end. You can watch the work happen."
  },
  {
    "k": "Documentation",
    "v": "Architecture notes, environment documentation and handover material are written alongside the product, not reconstructed afterwards."
  },
  {
    "k": "Infrastructure",
    "v": "Accounts, subscriptions and infrastructure set up for your product are created in your name or transferred to you. We do not hold your production hostage."
  },
  {
    "k": "Domains & credentials",
    "v": "Domains you own stay in your registrar account. Credentials and secrets are managed in your vault or handed over on completion."
  },
  {
    "k": "Intellectual property",
    "v": "IP terms follow the signed agreement for each engagement. Where Savo reuses general internal tooling or libraries, that is stated in the contract rather than discovered later."
  }
] as const;

export const CONFIDENTIALITY_ROWS = [
  {
    "k": "NDA first",
    "v": "We sign a mutual NDA before engagement details are shared, so both sides can speak openly. Our standard template is available on request."
  },
  {
    "k": "Need-to-know teams",
    "v": "Project teams see what the project requires. Credentials, production access and client data are scoped per role."
  },
  {
    "k": "Confidential work stays quiet",
    "v": "Some clients prefer their vendors unnamed. We respect that. Where work cannot be shown publicly, it can often be discussed in detail under NDA."
  },
  {
    "k": "Evidence kept on file",
    "v": "Contracts, approvals and verification records for published case studies are retained internally, so public claims stay defensible."
  }
] as const;

export const SECURITY_ROWS = [
  {
    "k": "Access control",
    "v": "Role-based access across our delivery platform. Admin, client portal and employee surfaces are separate sessions with separate scopes."
  },
  {
    "k": "Environment separation",
    "v": "Local, staging and production are distinct environments. Secrets never travel between them, and production changes ship through review."
  },
  {
    "k": "Input validation & rate limiting",
    "v": "Every public endpoint validates its input and is rate limited. Spam protection runs ahead of human review."
  },
  {
    "k": "Dependencies",
    "v": "Dependencies are pinned and updated deliberately, not swept in silently."
  },
  {
    "k": "Monitoring & errors",
    "v": "Applications we operate are monitored. Failures surface to us, not only to your users."
  },
  {
    "k": "Backups",
    "v": "Data-bearing systems we operate carry backups with a restore path that is actually rehearsed."
  }
] as const;

export const HANDOVER_ROWS = [
  {
    "k": "Documentation",
    "v": "Architecture decisions, environment setup and operating notes are written with the product, kept current, and included in handover."
  },
  {
    "k": "Handover",
    "v": "Walkthroughs for your team: repository, environments, deployments, monitoring and the release process."
  },
  {
    "k": "After launch",
    "v": "Monitoring, maintenance, iteration or a clean exit - the relationship ends on your terms, not on lock-in."
  }
] as const;

export const TRUST_FAQS = [
  {
    "q": "Will you sign an NDA before we share project details?",
    "a": "Yes, before any engagement detail changes hands. A mutual NDA protects both sides, our standard template is available on request, and confidential work stays confidential."
  },
  {
    "q": "Who owns the source code you write for us?",
    "a": "You do. Contracted work product, source code, design files and documentation belong to the client, with repository access from day one of the engagement."
  },
  {
    "q": "Do you claim ISO 27001 or SOC 2 certification?",
    "a": "No. We claim only what we can evidence. If your procurement requires a specific framework, we will state plainly what we hold, what we can arrange, and what we cannot."
  },
  {
    "q": "How is access to our systems and data controlled?",
    "a": "Role-based access scoped per project, segregated environments, secrets in managed vaults, and audit trails on privileged actions. Credentials are handed over at completion, never held hostage."
  },
  {
    "q": "What exactly do we receive at handover?",
    "a": "Repositories with full history, documentation written alongside the product, infrastructure in your name or transferred, and walkthroughs for your team. A project you can hand to another team tomorrow."
  }
] as const;

export const CERTIFICATION_BOUNDARY = "We do not claim ISO 27001, SOC 2, GDPR certification or any compliance framework we have not formally obtained and can evidence. If your procurement requires a specific framework, tell us - we will say plainly what we hold, what we can arrange, and what we cannot.";
