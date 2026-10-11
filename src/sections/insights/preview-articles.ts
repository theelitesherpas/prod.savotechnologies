import "server-only";

export type PreviewSection = {
  id: string; title: string; paragraphs: readonly string[];
  points?: readonly string[];
  comparison?: { headings: readonly string[]; rows: readonly (readonly string[])[] };
  example?: { title: string; text: string; points: readonly string[] };
};
export type PreviewArticle = {
  id: string; category: string; title: string; excerpt: string; image: string; alt: string;
  introduction: readonly string[]; sections: readonly PreviewSection[]; takeaways: readonly string[];
  references: readonly { label: string; href: string }[]; related: readonly string[];
};

/** Authored, unpublished editorial previews. Never imported by publication getters or dossiers. */
export const PREVIEW_ARTICLES: readonly PreviewArticle[] = [
  {
    id: "rag-vs-fine-tuning", category: "AI", title: "RAG or fine-tuning? Start with the problem.",
    excerpt: "Fresh knowledge and learned behaviour are different needs. A useful starting point for choosing an AI approach.",
    image: "/images/architecture.webp", alt: "An upward view between glass buildings",
    introduction: [
      "Choosing an AI approach starts with a question about the product, not a question about the model. Does the system need to work with information that changes? Does it need to follow a particular format or recognise a repeated pattern? Those are different problems, and they do not always need the same solution.",
      "Retrieval-augmented generation, usually shortened to RAG, supplies selected source material when a model prepares an answer. Fine-tuning trains a model on examples to influence its behaviour. Neither approach removes the need for permissions, evaluation or human review. This guide explains the distinction and offers a practical way to frame the decision.",
    ],
    sections: [
      { id: "knowledge-or-behaviour", title: "Separate knowledge from behaviour", paragraphs: [
        "A question about a recently updated policy is primarily a knowledge problem. A task that must consistently classify messages into a specific taxonomy is more likely to involve behaviour. A product can need both: it may need current documents and a reliable output format at the same time.",
        "Describe the failure you are trying to correct before selecting a technique. An answer can fail because the right document was not found, because the document was unclear, because the model ignored the evidence or because the interface allowed an action that should have required approval. Changing the model addresses only some of those failures.",
      ], points: ["What information is missing or changing?", "What output or behaviour needs to become more consistent?", "What would an unacceptable answer or action look like?"] },
      { id: "retrieval", title: "What retrieval changes", paragraphs: [
        "A retrieval system identifies relevant material and provides it as context. The material might come from approved documents, a knowledge base or structured records. Preparing that source collection is product work: documents need ownership, clear boundaries, useful structure and an update process.",
        "The retrieval layer must respect the person’s access rights. A document being relevant does not mean the person is allowed to see it. Citations can help people inspect an answer, but the presence of a citation alone does not prove that the answer correctly represents its source. Check both retrieval quality and the final response.",
      ] },
      { id: "fine-tuning", title: "What fine-tuning changes", paragraphs: [
        "Fine-tuning uses training examples to adapt a model. Depending on the model and training method, it can help with recurring formats, styles or task patterns. It requires examples that represent the intended task and a separate evaluation set that can reveal whether the adaptation actually helped.",
        "Treat the dataset as a maintained product asset. Check consent, sensitive information, duplicate examples and ambiguous labels. Training on confidential material is a data-handling decision, not simply a technical shortcut. Fine-tuning is also not a substitute for keeping changing operational facts up to date.",
      ], comparison: { headings: ["Decision", "Retrieval", "Fine-tuning"], rows: [["Main lever", "Information supplied at answer time", "Patterns learned from training examples"], ["Preparation", "Sources, permissions and retrieval quality", "Representative examples and evaluation data"], ["Changing facts", "Update the approved source collection", "Consider a separate current-information layer"], ["Review", "Inspect sources and grounded responses", "Compare behaviour on held-out tasks"]] } },
      { id: "evaluate", title: "Evaluate before expanding", paragraphs: [
        "Start with a small, representative set of questions and expected outcomes. Include questions with no supported answer, conflicting documents, outdated information and attempts to access restricted material. A demonstration that only covers easy questions cannot establish whether the approach is suitable.",
        "Compare against a simpler baseline, such as ordinary search, a structured workflow or an untuned model with carefully scoped instructions. Record where each option fails. Only add complexity when it addresses a measured problem, and keep latency, operational cost and maintenance effort in the review alongside answer quality.",
      ], example: { title: "Illustrative example: an internal policy assistant", text: "This is a hypothetical planning example, not a Savo engagement or deployed system.", points: ["Retrieve only approved policies the employee can access.", "Show the relevant source and recognise conflicting or missing information.", "Route sensitive interpretations to the policy owner rather than acting automatically."] } },
      { id: "ownership", title: "Keep ownership and review explicit", paragraphs: [
        "Decide who owns source updates, who reviews failures and who can change the system’s permitted actions. Define an escalation route for uncertain answers. People need a way to challenge a result without having to understand the underlying model architecture.",
        "RAG and fine-tuning can be combined, but a combined design also brings a combined maintenance burden. The useful question is not which technique sounds more advanced. It is which arrangement can perform the intended task with evidence, boundaries and an operating process the team can sustain.",
      ] },
    ],
    takeaways: ["Identify whether the gap concerns knowledge, behaviour or both.", "Treat sources, permissions and training examples as maintained assets.", "Evaluate unsupported and sensitive cases, not only successful demonstrations.", "Choose complexity deliberately and keep a human-review boundary."],
    references: [{ label: "Hugging Face: fine-tuning pretrained models", href: "https://huggingface.co/docs/transformers/en/training" }, { label: "OWASP: risks in generative AI applications", href: "https://genai.owasp.org/" }, { label: "Explore Savo’s AI approach", href: "/ai-agents" }],
    related: ["how-software-discovery-works", "monolith-vs-microservices"],
  },
  {
    id: "offline-first-field-apps", category: "Engineering", title: "Designing field apps for life offline.",
    excerpt: "Local storage, clear sync states and conflict handling matter when a connection is not guaranteed.",
    image: "/images/sectors/logistics-hero.webp", alt: "Shipping containers and cranes at a working port",
    introduction: [
      "A field app is not useful if the most important task stops whenever the network disappears. A person may be working in a warehouse, travelling between sites or using a device in an area with inconsistent coverage. The interface needs to explain what remains possible, not simply display a spinning loader.",
      "Offline-first design starts by choosing a useful task that can be completed locally. It then makes the transition back to the shared system predictable. Storage, synchronisation, permissions and recovery all contribute to that experience. This guide focuses on the decisions behind it rather than prescribing one framework or database.",
    ],
    sections: [
      { id: "choose-the-task", title: "Choose what must work offline", paragraphs: [
        "List the actions a person needs to complete without a connection. Reading an assigned job, capturing a note and updating a delivery status may have different requirements. Some information can be cached; some decisions may need a current server response before they are safe to make.",
        "Make that boundary visible. A person should know whether an action has been saved on the device, accepted by the shared system or blocked until a connection returns. Avoid presenting those states as the same success message. The distinction becomes especially important when another person depends on the result.",
      ], points: ["What can be read from a local copy?", "What changes can be recorded locally?", "Which decisions require current shared information?"] },
      { id: "local-data", title: "Treat local data as sensitive data", paragraphs: [
        "Decide which records belong on the device and how long they should remain there. Consider shared devices, sign-out, lost hardware and account changes. A local copy should not quietly become a permanent collection of information the person no longer needs or is authorised to access.",
        "Storage choices depend on the platform and threat model. Review encryption, backup behaviour and key management where relevant. Do not assume that choosing a particular storage library settles the security question. The application’s lifecycle and the way the device is used matter too.",
      ] },
      { id: "sync", title: "Make synchronisation understandable", paragraphs: [
        "Synchronisation is a process, not an instant event. A change can be waiting, in progress, acknowledged or rejected. Show those states in the place where the person recorded the change, with an explanation and a useful action when something needs attention.",
        "Retries should be designed around duplicate-safe operations. A request can succeed on the server even if the device never receives the response. Repeating it must not create a second delivery, payment or other unintended record. The exact mechanism depends on the operation, but the risk should be considered explicitly.",
      ], example: { title: "Illustrative example: recording a site visit", text: "A hypothetical workflow for discussing the design—not a delivered product or an implementation specification.", points: ["Save the note locally and show ‘Waiting to sync’.", "Send the change with a stable operation identity when connectivity returns.", "Show acknowledgement or a specific correction request beside the original note."] } },
      { id: "conflicts", title: "Decide how conflicts are resolved", paragraphs: [
        "Two people may change the same record while one device is offline. A universal ‘last write wins’ rule is simple to describe, but it can discard important work. Decide which fields can be merged, which changes should be rejected and which conflicts need a person to review them.",
        "Preserve enough context to explain the conflict. Tell the person what changed, what remains saved locally and what action is available. Avoid forcing someone to reconstruct their work from memory or interpret an opaque server error before they can continue.",
      ] },
      { id: "failure-testing", title: "Test the transitions, not just the happy path", paragraphs: [
        "Test interrupted requests, expired sessions, low storage, device restarts and changes made on another device. Include transitions between fast, slow and unavailable networks. These are normal operating conditions for a field app, not merely unusual edge cases at the end of development.",
        "Observe the person’s task as well as the transport layer. Can they tell what is safe to close? Can they find an unsent record? Can they recover without starting again? An app is meaningfully offline-first when people can complete the intended work and understand what happens next.",
      ] },
    ],
    takeaways: ["Define a useful offline task and make its limits visible.", "Protect local data throughout the device and account lifecycle.", "Design duplicate-safe retries and explicit conflict handling.", "Test real interruptions and give people a recovery path."],
    references: [{ label: "MDN: progressive web apps", href: "https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps" }, { label: "MDN: IndexedDB API", href: "https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API" }, { label: "Explore mobile development", href: "/services/mobile-app-development" }],
    related: ["wcag-aa-in-practice", "monolith-vs-microservices"],
  },
  {
    id: "wcag-aa-in-practice", category: "Design", title: "Accessibility belongs in the whole journey.",
    excerpt: "Look beyond the finished screen: focus, readable content and useful recovery states are part of the experience.",
    image: "/images/studio.webp", alt: "A drawing tablet beside a book of visual references",
    introduction: [
      "A screen can look polished and still prevent someone from completing the task. The problem may appear in a menu that cannot be reached by keyboard, an error that is not announced or an action whose purpose is only conveyed through colour. Reviewing the finished screenshot will not reveal all of those failures.",
      "Accessibility belongs in the complete journey: arriving, understanding the content, making a choice, correcting a mistake and confirming the result. The guidance below is a starting point for practical review. It is not an accessibility audit, a legal interpretation or a claim that a product meets a particular standard.",
    ],
    sections: [
      { id: "task-and-structure", title: "Start with the task and the structure", paragraphs: [
        "Identify the task each screen supports. Use clear headings and meaningful reading order so people can find the relevant information without having to inspect every element. A label should describe the action or information, rather than repeat a vague instruction such as ‘Click here’.",
        "Choose semantic HTML before adding custom interaction. Native buttons, links, labels and form controls provide behaviour that a styled generic container does not. Visual position and document order should support the same journey, especially when the layout changes on a narrow screen.",
      ] },
      { id: "keyboard", title: "Make keyboard movement visible", paragraphs: [
        "Review the journey without a pointer. People should be able to reach controls in a sensible order, identify where focus is and complete or leave an interaction. A visible focus treatment needs enough contrast and should not be clipped by a decorative container.",
        "For dialogs and custom composite controls, review focus movement and expected keyboard behaviour carefully. Closing a dialog should return someone to a meaningful place. Avoid trapping focus in a component or hiding a control visually while leaving it unexpectedly reachable.",
      ], points: ["Can the task be completed using a keyboard?", "Is the current focus location always visible?", "Do opening, closing and validation move focus predictably?"] },
      { id: "readable-content", title: "Keep content readable and adaptable", paragraphs: [
        "Check text contrast, labels and content hierarchy with the actual copy. Instructions should not depend only on colour, position or an icon. If a control needs an explanation, place it where it can be understood before the person commits to the action.",
        "Test text resizing, narrow widths and long values rather than treating one desktop layout as the finished design. A fixed-height container that looks tidy with short copy may cut off important information when content grows. Decorative motion should also have an appropriate reduced-motion behaviour.",
      ] },
      { id: "forms-and-feedback", title: "Explain errors and recovery", paragraphs: [
        "An error message should identify the problem and a useful next step. Associate it with the relevant field, preserve the information already entered and make important changes available to assistive technology. A red border by itself does not provide enough explanation.",
        "Review loading, empty and success states with the same care as the form. People need to know whether an action is still processing, whether it completed and what happens next. Avoid a transient message that disappears before it can be read or revisited.",
      ], example: { title: "Illustrative example: correcting an application form", text: "A hypothetical interface review, not a compliance assessment of a client product.", points: ["Explain that an email address is incomplete beside the field.", "Preserve the other details and move focus to a useful correction point.", "Confirm the result in readable text after a successful submission."] } },
      { id: "review-process", title: "Use tools and human testing together", paragraphs: [
        "Automated checks can identify some structural and contrast problems. They cannot determine every aspect of understandable wording, sensible focus movement or whether the complete task is usable. Use them as part of an ongoing review rather than a certificate of completion.",
        "Include manual keyboard and assistive-technology checks, and involve people with relevant access needs where possible. Record the scope, conditions and remaining issues. If a conformance claim is required, it needs a defined assessment process and appropriate specialist review—not an assumption based on a design checklist.",
      ] },
    ],
    takeaways: ["Review a complete task, not only the polished screen.", "Prefer semantic controls and clear reading order.", "Include focus, errors, resizing and motion preferences.", "Combine tools with human testing; do not turn a checklist into a compliance claim."],
    references: [{ label: "W3C: Web Content Accessibility Guidelines 2.2", href: "https://www.w3.org/TR/WCAG22/" }, { label: "W3C: accessibility tutorials", href: "https://www.w3.org/WAI/tutorials/" }, { label: "Explore product design", href: "/services/ui-ux-design" }],
    related: ["offline-first-field-apps", "how-software-discovery-works"],
  },
  {
    id: "monolith-vs-microservices", category: "Engineering", title: "A simpler system can be the stronger choice.",
    excerpt: "Choose service boundaries around real constraints—not around the architecture everyone is talking about.",
    image: "/images/code.webp", alt: "A laptop showing source code on a desk",
    introduction: [
      "Architecture discussions can turn into a contest between labels. A monolith is treated as old-fashioned; microservices are treated as the default route to scale. Neither description tells you whether the system will meet the product’s needs or whether the team can operate it responsibly.",
      "The useful comparison starts with constraints: how the product changes, who owns it, where load appears and what failures the business can tolerate. A modular monolith and a set of independently deployed services make different trade-offs. This guide explains what to examine before paying the cost of distributing a system.",
    ],
    sections: [
      { id: "constraints", title: "Name the constraints before the architecture", paragraphs: [
        "Identify the parts of the system that have genuinely different needs. A particular workload may need independent capacity, a component may have a distinct release cycle or separate teams may need clear ownership boundaries. Those can be useful reasons to consider a separate service.",
        "Other problems may be better addressed inside the existing application. Slow queries, unclear code ownership and tightly coupled modules do not automatically require a distributed design. Review the specific bottleneck and consider whether a local change would resolve it with less operational complexity.",
      ] },
      { id: "modularity", title: "Separate responsibilities in code", paragraphs: [
        "A modular monolith keeps one main deployment while defining clear internal responsibilities. Modules should expose deliberate interfaces and avoid reaching into one another’s private implementation. The benefit comes from discipline in the boundaries, not from the deployment label alone.",
        "This arrangement can make transactions, development and diagnosis easier to reason about. It still needs testing, observability and an ownership model. ‘Simple’ should mean fewer unnecessary moving parts, not an absence of structure or an excuse to leave responsibilities entangled.",
      ] },
      { id: "distributed-cost", title: "Account for the distributed-system cost", paragraphs: [
        "Independent services communicate across a network that can be slow, unavailable or only partly successful. The design needs timeouts, retries and a strategy for duplicate work. Data changes that once occurred together may require a deliberate consistency and recovery approach.",
        "Operations also become part of the architecture decision. Teams need to understand deployments, configuration, traces, service dependencies and incident ownership. Adding services without adding the capability to operate them can make the product harder to change even when individual repositories are smaller.",
      ], comparison: { headings: ["Consideration", "Modular monolith", "Independent services"], rows: [["Deployment", "A shared deployment boundary", "Separate release and deployment boundaries"], ["Communication", "Often local module calls", "Network calls and partial failures"], ["Data changes", "Shared transactions may be simpler", "Consistency needs explicit design"], ["Ownership", "Clear internal module ownership", "Clear service and operational ownership"]] } },
      { id: "extract-deliberately", title: "Extract a boundary for a named reason", paragraphs: [
        "If one capability needs to become independent, define the responsibility and the interface before extracting it. Decide which data it owns, what the caller can expect and how it will fail. A service that shares undocumented assumptions with every neighbour is not an independent boundary in practice.",
        "Plan migration and rollback as part of the work. Preserve a way to compare behaviour and investigate discrepancies. Do not split the whole product simply to make the diagram consistent: different parts can reasonably use different arrangements when the constraints differ.",
      ], example: { title: "Illustrative example: a reporting workload", text: "A hypothetical architecture discussion, not a benchmark or a reference client system.", points: ["Identify whether reporting load disrupts the core task.", "Review data freshness, access boundaries and failure isolation.", "Choose a separate processing boundary only if it addresses those needs."] } },
      { id: "operating-model", title: "Choose an operating model the team can sustain", paragraphs: [
        "Discuss who will notice a failure, investigate it and restore a useful service. Review how changes will be tested and how another engineer will understand the system. Architecture that cannot be maintained by the people responsible for it is not a good fit, regardless of the pattern’s popularity.",
        "The strongest choice is the one whose complexity earns its place. Start with clear responsibilities, measure the constraints and change a boundary when the evidence calls for it. A simpler system can be a deliberate engineering decision rather than a temporary compromise.",
      ] },
    ],
    takeaways: ["Start with product and team constraints, not architecture labels.", "Use clear module boundaries even in a single deployment.", "Include network failures, data consistency and operations in the cost.", "Extract services to solve a named problem, with a migration and recovery plan."],
    references: [{ label: "Martin Fowler: microservices", href: "https://martinfowler.com/articles/microservices.html" }, { label: "Microsoft: architecture guidance", href: "https://learn.microsoft.com/en-us/azure/architecture/" }, { label: "Explore software engineering", href: "/services/custom-software-development" }],
    related: ["offline-first-field-apps", "how-software-discovery-works"],
  },
  {
    id: "how-software-discovery-works", category: "Delivery", title: "What discovery should answer before a build.",
    excerpt: "Clarify the outcome, constraints and open questions before turning a product idea into a delivery plan.",
    image: "/images/mobile.webp", alt: "A close view of a phone with several applications",
    introduction: [
      "A product idea can be clear about its ambition and unclear about the work required to realise it. People may disagree about the first useful outcome, the systems involved or the decision that determines the scope. Starting development does not automatically resolve that uncertainty.",
      "Discovery is a way to investigate the questions that could change the plan. It should connect what people need to do with the product’s constraints, assumptions and decision owners. The goal is not a large document for its own sake. It is a more informed next step, with remaining uncertainty made visible.",
    ],
    sections: [
      { id: "outcome", title: "Define the outcome in useful terms", paragraphs: [
        "Describe the task or result the product is meant to support. A list of features can help describe an idea, but it does not necessarily explain what success means for the people using it. Ask what they need to complete and what currently prevents them from doing it.",
        "Agree who can assess whether an outcome is useful. Different stakeholders may bring different constraints: a person doing the task, a business owner, an operations team or a specialist reviewing risk. Make those perspectives explicit rather than assuming one feature list represents all of them.",
      ], points: ["Who needs to complete the task?", "What would a useful first outcome look like?", "Who can review and accept that outcome?"] },
      { id: "existing-context", title: "Map the existing context", paragraphs: [
        "Identify the systems, data and processes the product will join. Review integrations, ownership, access and the quality of the information available. An interface that looks straightforward can depend on a difficult approval process or a source system whose limits have not yet been understood.",
        "Separate a verified constraint from an assumption. Record where the information came from and who can clarify it. If a supplier, internal system or regulatory question could materially change the work, give that dependency a place in the plan instead of hiding it in general contingency language.",
      ] },
      { id: "investigation", title: "Choose investigation that answers a question", paragraphs: [
        "Interviews, prototypes and technical investigation have different jobs. An interview may clarify a task, a prototype may reveal an interaction problem and a technical exercise may test an integration assumption. Choose the activity because of the question, not because every discovery engagement is expected to produce the same artefacts.",
        "Define what you intend to learn and what result would change the direction. A prototype can be convincing without being production-ready. A successful technical experiment can also leave security, resilience and operating questions unresolved. Record that boundary clearly when presenting the work.",
      ], example: { title: "Illustrative example: improving a booking journey", text: "A hypothetical planning exercise—not a completed engagement, a delivery estimate or a promised outcome.", points: ["Observe where people abandon or repeat the task.", "Prototype the uncertain step and review it with representative users.", "Investigate the availability-data integration before committing to the release scope."] } },
      { id: "scope", title: "Turn findings into a reviewable scope", paragraphs: [
        "Use the findings to define a useful slice of work. Specify the important journeys, acceptance conditions and dependencies. Identify what is deliberately outside the first slice so people can distinguish a decision from an accidental omission.",
        "Estimation should reflect the information available and the uncertainty that remains. Discuss assumptions and the circumstances that would change the plan. Avoid treating an early estimate as a guarantee simply because it has been placed in a document or presented alongside a polished prototype.",
      ] },
      { id: "handover", title: "Make the next decision explicit", paragraphs: [
        "A useful discovery handover explains what was learned, what remains unknown and which options are available. Include the people who can approve a direction and the responsibilities that will carry into delivery. Information is easier to use when the next decision is not buried beneath a collection of artefacts.",
        "Discovery can lead to a build, a smaller experiment, a change in approach or a decision not to proceed yet. Its value comes from reducing the risk of acting on the wrong assumptions, not from proving that the original idea must be built exactly as first imagined.",
      ] },
    ],
    takeaways: ["Start with a useful outcome and the people who can assess it.", "Distinguish verified constraints from assumptions and dependencies.", "Use investigation to answer specific questions.", "Hand over a reviewable next step, including what remains uncertain."],
    references: [{ label: "GOV.UK: the discovery phase", href: "https://www.gov.uk/service-manual/agile-delivery/how-the-discovery-phase-works" }, { label: "GOV.UK: planning user research", href: "https://www.gov.uk/service-manual/user-research/plan-user-research-for-your-service" }, { label: "Explore engagement approaches", href: "/enterprise#models" }],
    related: ["rag-vs-fine-tuning", "wcag-aa-in-practice"],
  },
];

export function previewArticleHref(id: string) { return `/insights/preview/${id}`; }
export function findPreviewArticle(id: string, environment = process.env.NODE_ENV) {
  return environment === "development" ? PREVIEW_ARTICLES.find(article => article.id === id) : undefined;
}
export function previewReadingStats(article: PreviewArticle) {
  const text = [article.title, article.excerpt, ...article.introduction, ...article.sections.flatMap(s => [s.title, ...s.paragraphs, ...(s.points ?? []), ...(s.comparison?.rows.flatMap(row => [...row]) ?? []), ...(s.example ? [s.example.title, s.example.text, ...s.example.points] : [])]), ...article.takeaways].join(" ");
  const words = text.trim().split(/\s+/u).length;
  return { words, minutes: Math.max(1, Math.ceil(words / 220)) };
}
