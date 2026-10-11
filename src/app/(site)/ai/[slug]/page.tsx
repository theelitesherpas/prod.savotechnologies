import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { absoluteUrl } from "@/lib/env";
import { getManagedAiServices } from "@/lib/content-items";
import { AiPracticePage } from "@/sections/ai/ai-pages";
import { openGraphFor } from "@/lib/seo";
export async function generateStaticParams(){return(await getManagedAiServices()).map(s=>({slug:s.slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const{slug}=await params;const svc=(await getManagedAiServices()).find(s=>s.slug===slug);if(!svc)return{};return{title:svc.title,description:svc.metaDescription,alternates:{canonical:`/ai/${svc.slug}`},openGraph:openGraphFor({title:`${svc.title} | Savo Technologies`,description:svc.metaDescription,url:`/ai/${svc.slug}`})};}
export default async function AiServicePage({params}:{params:Promise<{slug:string}>}){
 const{slug}=await params;const services=await getManagedAiServices();const service=services.find(s=>s.slug===slug);if(!service)notFound();const url=`/ai/${service.slug}`;
 const jsonLd={"@context":"https://schema.org","@graph":[{"@type":"Service","@id":absoluteUrl(`${url}/#service`),name:service.title,description:service.metaDescription,provider:{"@id":absoluteUrl("/#organization")},url:absoluteUrl(url)},{"@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Home",item:absoluteUrl("/")},{"@type":"ListItem",position:2,name:"AI Agents",item:absoluteUrl("/ai-agents")},{"@type":"ListItem",position:3,name:service.title,item:absoluteUrl(url)}]},{"@type":"FAQPage",mainEntity:service.faqs.map(f=>({"@type":"Question",name:f.q,acceptedAnswer:{"@type":"Answer",text:f.a}}))}]};
 return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd).replace(/</g,"\\u003c")}}/><AiPracticePage service={service} services={services}/></>;
}
