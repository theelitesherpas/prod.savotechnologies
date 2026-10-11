import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { absoluteUrl } from "@/lib/env";
import { openGraphFor } from "@/lib/seo";
import { getManagedHireRoles, getManagedArticles } from "@/lib/content-items";
import { hirePageRole } from "@/sections/hire/hire-content";
import { HiringRolePage } from "@/sections/hire/hire-pages";
export async function generateStaticParams(){return (await getManagedHireRoles()).map(r=>({slug:r.slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
 const{slug}=await params;const record=(await getManagedHireRoles()).find(r=>r.slug===slug);if(!record)return{};const role=hirePageRole(record);
 return{title:`Hire ${role.title}`,description:role.metaDescription,alternates:{canonical:`/hire/${role.slug}`},openGraph:openGraphFor({title:`Hire ${role.title} | Savo Technologies`,description:role.metaDescription,url:`/hire/${role.slug}`})};
}
export default async function HireRolePage({params}:{params:Promise<{slug:string}>}){
 const{slug}=await params;
 const roles=(await getManagedHireRoles()).map(hirePageRole);
 const role=roles.find(r=>r.slug===slug);
 if(!role)notFound();
 const articles=await getManagedArticles();
 const jsonLd={"@context":"https://schema.org","@graph":[
  {"@type":"Service","@id":absoluteUrl(`/hire/${role.slug}/#service`),name:`Hire ${role.title}`,description:role.metaDescription,provider:{"@id":absoluteUrl("/#organization")},url:absoluteUrl(`/hire/${role.slug}`)},
  {"@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Home",item:absoluteUrl("/")},{"@type":"ListItem",position:2,name:"Hire Developers",item:absoluteUrl("/hire")},{"@type":"ListItem",position:3,name:role.title,item:absoluteUrl(`/hire/${role.slug}`)}]},
  {"@type":"FAQPage",mainEntity:role.faqs.map(f=>({"@type":"Question",name:f.q,acceptedAnswer:{"@type":"Answer",text:f.a}}))}
 ]};
 return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd).replace(/</g,"\\u003c")}}/><HiringRolePage role={role} roles={roles} articles={articles}/></>;
}
