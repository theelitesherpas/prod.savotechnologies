import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { absoluteUrl } from "@/lib/env";
import { AGENT_FAQS } from "@/constants/agents";
import { getManagedAgents } from "@/lib/content-items";
import { AgentRolePage } from "@/sections/ai/ai-pages";
import { openGraphFor } from "@/lib/seo";
export async function generateStaticParams(){return(await getManagedAgents()).map(a=>({slug:a.slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const{slug}=await params;const agent=(await getManagedAgents()).find(a=>a.slug===slug);if(!agent)return{};const url=`/ai-agents/${slug}`;return{title:agent.name,description:agent.desc,alternates:{canonical:url},openGraph:openGraphFor({title:`${agent.name} | Savo Technologies`,description:agent.desc,url})};}
export default async function AgentDetailPage({params}:{params:Promise<{slug:string}>}){
 const{slug}=await params;const agents=await getManagedAgents();const agent=agents.find(a=>a.slug===slug);if(!agent)notFound();const url=`/ai-agents/${slug}`;
 const jsonLd={"@context":"https://schema.org","@graph":[{"@type":"Service",name:agent.name,description:agent.desc,url:absoluteUrl(url),provider:{"@id":absoluteUrl("/#organization")}},{"@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Home",item:absoluteUrl("/")},{"@type":"ListItem",position:2,name:"AI Agents",item:absoluteUrl("/ai-agents")},{"@type":"ListItem",position:3,name:agent.name,item:absoluteUrl(url)}]},{"@type":"FAQPage",mainEntity:AGENT_FAQS.map(f=>({"@type":"Question",name:f.q,acceptedAnswer:{"@type":"Answer",text:f.a}}))}]};
 return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd).replace(/</g,"\\u003c")}}/><AgentRolePage agent={agent} agents={agents}/></>;
}
