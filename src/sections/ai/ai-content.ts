import type { Article } from "@/constants/insights";

/** Select from the public article collection only; never resurrect missing managed rows. */
export function relatedAiArticles(articles: readonly Article[]): Article[] {
 const preferred = ["ai-agent-vs-workflow-automation", "rag-vs-fine-tuning", "how-to-evaluate-an-ai-development-company"];
 const ai = articles.filter(article => article.cat === "AI");
 return [...ai.filter(article => preferred.includes(article.slug)).sort((a, b) => preferred.indexOf(a.slug) - preferred.indexOf(b.slug)), ...ai.filter(article => !preferred.includes(article.slug))].slice(0, 3);
}

export type Example = { question:string; source:string; sourceNote:string; result:string; action:string; review:string };
/** Synthetic UI examples. No model call, connected account or client evidence. */
export const AGENT_EXAMPLES:Record<string,Example> = {
 salesbot:{question:"We need a customer portal connected to our CRM.",source:"Example service catalogue",sourceNote:"Web applications · API integrations",result:"Start with a web application and a scoped CRM integration. Confirm users, existing tools and the first workflow before estimating.",action:"Prepare a project brief",review:"A consultant reviews scope and follows up."},
 supportagent:{question:"A customer needs to change an order that has already shipped.",source:"Example support policy",sourceNote:"Order changes · Dispatch exceptions",result:"Changes after dispatch need a support review. Collect the order reference and explain the next step instead of promising a change.",action:"Prepare a support handoff",review:"A support specialist decides what is possible."},
 recruitai:{question:"Summarise this application against our backend role scorecard.",source:"Example application + role criteria",sourceNote:"API experience · Testing · Database work",result:"API and database experience are described. Evidence of automated testing is incomplete - flag it as a question for the interview, not a rejection.",action:"Prepare an evidence summary",review:"A recruiter checks the evidence and makes the decision."},
 insightagent:{question:"What information do we need to explain a change in orders?",source:"Example data dictionary",sourceNote:"Orders · Channels · Reporting periods",result:"Compare equivalent periods and separate channels. Check missing records before treating a change as a trend. Include the query with the answer.",action:"Prepare a governed query",review:"An analyst validates the query and interpretation."},
 contentagent:{question:"Draft a short introduction for our new customer portal.",source:"Example product brief",sourceNote:"Brand guidance · Portal capabilities",result:"Your account, in one place. View requests, share documents and keep your team up to date. Check the feature names and claims before publishing.",action:"Prepare an editorial draft",review:"An editor checks facts, wording and channel requirements."},
 opsagent:{question:"An integration has stopped responding. What should we check?",source:"Example incident runbook",sourceNote:"Integration timeouts · Escalation policy",result:"Check the provider status and recent changes, then collect the error trace. Prepare a recovery proposal; do not restart a service without permission.",action:"Prepare an incident summary",review:"The on-call owner approves the recovery action."},
};
export const DEFAULT_EXAMPLE:Example={question:"Find the information needed for this task.",source:"Example knowledge source",sourceNote:"Approved information · Defined permissions",result:"Prepare a source-based response and identify missing information before proposing an action.",action:"Prepare a review handoff",review:"A person reviews the proposed action."};
export function agentExample(slug:string):Example { return AGENT_EXAMPLES[slug] ?? DEFAULT_EXAMPLE; }
export const PRACTICE_FIT:Record<string,{heading:string;yes:string[];no:string}>={
 "generative-ai":{heading:"Start with one useful product moment.",yes:["People repeatedly search the same information.","A draft or suggestion can save effort without bypassing review.","The feature has a clear owner and a way to evaluate its answers."],no:"If the information is unreliable, or a clear rule solves the task, fix that foundation before introducing a model."},
 automation:{heading:"Start with a handoff everyone recognises.",yes:["The same information moves between several tools.","The trigger, owner and expected result are clear.","Exceptions can be identified and sent to the right person."],no:"An unclear process does not become clear by automating it. Map responsibilities and exceptions first."},
 consulting:{heading:"Start with the decision, not the technology.",yes:["Your team has ideas but needs to choose a first project.","You need to compare AI, existing tools and simpler integrations.","Data readiness, ownership or risk needs a shared plan."],no:"When the use case and architecture are already agreed, a focused implementation review may be more useful than another broad strategy exercise."},
 "machine-learning":{heading:"Start with a decision the data can support.",yes:["Relevant historical data is available and usable.","There is a baseline and a way to evaluate a prediction.","Your team can act on the output and maintain the system."],no:"Thin, changing or biased data may limit a model. Better data or a simpler rule may be the right first investment."},
};
export const FOUNDATIONS=[
 {title:"Relevant information",text:"Select useful sources, respect access and make the supporting context available. Missing or stale information should be visible, not silently filled in."},
 {title:"Bounded actions",text:"Specify what the system may read, prepare or change. Sensitive actions need the right permission and, where appropriate, a person's approval."},
 {title:"Evaluation & fallback",text:"Test routine questions, incomplete inputs and difficult cases. Define when to ask, stop, retry or hand off rather than assuming every answer is correct."},
 {title:"An operating plan",text:"Agree who reviews usage, handles incidents and maintains prompts, data or integrations. Monitoring, cost controls and review records depend on the deployment."},
];
export const AI_RELATED=[{title:"AI agents",href:"/ai-agents",text:"Knowledge and tools, around a defined role."},{title:"Business automation",href:"/ai/automation",text:"Connect the work between applications."},{title:"Generative AI",href:"/ai/generative-ai",text:"Useful language-model features in your product."},{title:"AI consulting",href:"/ai/consulting",text:"Choose the first step with a practical plan."},{title:"Machine learning",href:"/ai/machine-learning",text:"Models built around a business decision."}];
export const TOOL_ICONS:Record<string,string>={OpenAI:"openai",Anthropic:"anthropic",Python:"python",PyTorch:"pytorch","scikit-learn":"scikitlearn",PostgreSQL:"postgresql",Supabase:"supabase"};
