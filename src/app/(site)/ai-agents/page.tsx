import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/env";
import { AGENT_FAQS } from "@/constants/agents";
import { getManagedAgents, getManagedAiServices, getManagedArticles } from "@/lib/content-items";
import { AgentHub } from "@/sections/ai/ai-pages";
import { openGraphFor } from "@/lib/seo";
import { relatedAiArticles } from "@/sections/ai/ai-content";
const DESCRIPTION="AI agents by Savo Technologies for sales, support, recruiting, analytics, content and operations. Explore their scope, knowledge, tools and human review paths.";
export const metadata:Metadata={title:"AI Agents",description:DESCRIPTION,alternates:{canonical:"/ai-agents"},openGraph:openGraphFor({title:"AI Agents | Savo Technologies",description:DESCRIPTION,url:"/ai-agents"})};
export default async function AgentsPage(){
 const[agents,services,articles]=await Promise.all([getManagedAgents(),getManagedAiServices(),getManagedArticles()]);
 const jsonLd={"@context":"https://schema.org","@graph":[{"@type":"WebPage","@id":absoluteUrl("/ai-agents/#webpage"),url:absoluteUrl("/ai-agents"),name:"AI Agents | Savo Technologies",description:DESCRIPTION,isPartOf:{"@id":absoluteUrl("/#website")}},{"@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Home",item:absoluteUrl("/")},{"@type":"ListItem",position:2,name:"AI Agents",item:absoluteUrl("/ai-agents")}]},{"@type":"FAQPage",mainEntity:AGENT_FAQS.map(f=>({"@type":"Question",name:f.q,acceptedAnswer:{"@type":"Answer",text:f.a}}))},{"@type":"ItemList",name:"AI agent roles",itemListElement:agents.map((a,i)=>({"@type":"ListItem",position:i+1,name:a.name,url:absoluteUrl(`/ai-agents/${a.slug}`)}))}]};
 return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd).replace(/</g,"\\u003c")}}/><AgentHub agents={agents} services={services} articles={relatedAiArticles(articles)}/></>;
}
