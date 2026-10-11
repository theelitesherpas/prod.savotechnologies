import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/env";
import { getManagedHireRoles, getManagedArticles } from "@/lib/content-items";
import { openGraphFor } from "@/lib/seo";
import { HireHub } from "@/sections/hire/hire-hub";
import { hirePageRole, HIRING_FAQS } from "@/sections/hire/hire-content";
const DESCRIPTION="Hire developers from Savo Technologies for AI, frontend, backend, full stack, mobile and DevOps work. Explore roles, responsibilities, working models and the hiring process.";
export const metadata:Metadata={title:"Hire Developers",description:DESCRIPTION,alternates:{canonical:"/hire"},openGraph:openGraphFor({title:"Hire Developers | Savo Technologies",description:DESCRIPTION,url:"/hire"})};
export default async function HirePage(){
 const [records,articles]=await Promise.all([getManagedHireRoles(),getManagedArticles()]);
 const roles=records.map(hirePageRole);
 const jsonLd={"@context":"https://schema.org","@graph":[
  {"@type":"WebPage","@id":absoluteUrl("/hire/#webpage"),url:absoluteUrl("/hire"),name:"Hire Developers | Savo Technologies",description:DESCRIPTION,isPartOf:{"@id":absoluteUrl("/#website")}},
  {"@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Home",item:absoluteUrl("/")},{"@type":"ListItem",position:2,name:"Hire Developers",item:absoluteUrl("/hire")}]},
  {"@type":"ItemList",name:"Developer roles",itemListElement:roles.map((r,i)=>({"@type":"ListItem",position:i+1,name:`Hire ${r.title}`,url:absoluteUrl(`/hire/${r.slug}`)}))},
  {"@type":"FAQPage",mainEntity:HIRING_FAQS.map(f=>({"@type":"Question",name:f.q,acceptedAnswer:{"@type":"Answer",text:f.a}}))}
 ]};
 return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd).replace(/</g,"\\u003c")}}/><HireHub roles={roles} articles={articles}/></>;
}
