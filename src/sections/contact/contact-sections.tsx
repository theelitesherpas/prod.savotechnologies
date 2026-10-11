import Link from "next/link";
import Image from "next/image";
import { withBasePath } from "@/lib/utils";
import { OFFICES, PRESENCE_LABEL } from "@/constants/site";
import { CAREERS_EMAIL } from "@/constants/careers";
import { CONTACT_NEXT_STEPS, CONTACT_QUESTIONS } from "./contact-content";
import { CONTACT_HERO_ALT, CONTACT_HERO_IMAGE } from "@/constants/contact";
import styles from "./contact.module.css";

export function ContactArrow({ diagonal = false }: { diagonal?: boolean }) { return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={diagonal ? "M5 19 19 5M5 5h14v14" : "M4 12h16m-6-6 6 6-6 6"} /></svg>; }
export function ContactIntroduction({ email, heroImage = CONTACT_HERO_IMAGE, heroAlt = CONTACT_HERO_ALT }: { email: string; heroImage?: string; heroAlt?: string }) {
  return <div className={styles.introduction}>
    <h1 id="contact-heading"><span>Let’s talk about</span><span>what’s <em>next.</em></span></h1>
    <p>A new idea, a product that needs work, or a question about Savo. Tell us what’s on your mind.</p>
    <div className={styles.introActions}><Link href="#send">Send a message<ContactArrow /></Link><Link href="#channels">Reach us directly</Link></div>
    <figure className={styles.heroFigure}><div className={styles.heroPhoto} data-image-guard><Image src={withBasePath(heroImage)} alt={heroAlt} fill sizes="(min-width: 1344px) 510px, (min-width: 900px) 40vw, 100vw" /><a href={`mailto:${email}`} className={styles.helloMark} aria-label={`Email ${email}`}>Say<br/>hello.<ContactArrow diagonal /></a></div></figure>
    <p className={styles.introEmail}>Prefer email?<a href={`mailto:${email}`}>{email}<ContactArrow diagonal /></a></p>
  </div>;
}
function ChannelIcon({ type }: { type: "email" | "phone" | "whatsapp" }) { return <svg aria-hidden="true" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{type === "email" ? <><rect x="4" y="7" width="24" height="18" rx="2"/><path d="m5 9 11 8 11-8"/></> : type === "phone" ? <path d="m9 4 5 6-3 4a21 21 0 0 0 7 7l4-3 6 5c-1 4-3 5-6 5C13 27 5 19 4 10c0-3 1-5 5-6Z"/> : <><path d="M28 15a12 12 0 0 1-17 11l-7 2 2-7A12 12 0 1 1 28 15Z"/><path d="m12 9 3 4-2 2 4 4 2-2 4 3"/></>}</svg>; }
export function ContactChannels({ email, phone, phoneE164 }: { email: string; phone: string; phoneE164: string }) {
  const channels = [
    { type: "email" as const, title: "Write to us", value: email, href: `mailto:${email}`, hint: "A good place for context and questions." },
    { type: "phone" as const, title: "Call Savo", value: phone, href: `tel:${phoneE164}`, hint: "Prefer to talk? Use our main line." },
    { type: "whatsapp" as const, title: "Message on WhatsApp", value: "Start a conversation", href: `https://wa.me/${phoneE164.replace(/\D/g, "")}?text=${encodeURIComponent("Hi Savo Technologies, I would like to talk about a project.")}`, hint: "Send a short note about what you need." },
  ];
  return <section id="channels" className={styles.channels} aria-labelledby="contact-channels-heading"><div className={styles.rail}>
    <div className={styles.sectionHead}><h2 id="contact-channels-heading">A conversation, your way.</h2><p>Choose the channel that works for you.</p></div>
    <div className={styles.channelGrid}>{channels.map(channel => <a key={channel.type} href={channel.href} {...(channel.type === "whatsapp" ? { target: "_blank", rel: "noopener noreferrer" } : {})} className={styles.channel}>
      <div className={styles.channelTop}><ChannelIcon type={channel.type}/><ContactArrow diagonal /></div><h3>{channel.title}</h3><p className={styles.channelValue}>{channel.value}</p><p className={styles.channelHint}>{channel.hint}</p>
    </a>)}</div>
    <details className={styles.locations}><summary>Our offices <span>India &amp; Switzerland</span><svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M10 4v12M4 10h12"/></svg></summary><div className={styles.officeGrid}>{OFFICES.filter(office => office.kind !== "market" && office.status === "verified").map(office => <div className={styles.office} key={office.id}><h3>{office.cityLine}</h3><p>{PRESENCE_LABEL[office.kind]}</p><address>{office.addressLine}</address>{office.phones?.filter(line => !line.label).map(line => <a key={line.e164} href={`tel:${line.e164}`}>{line.display}</a>)}{office.addressLine && <a className={styles.mapLink} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${office.addressLine}, ${office.region}`)}`} target="_blank" rel="noopener noreferrer">View on Google Maps<ContactArrow diagonal /></a>}</div>)}</div></details>
  </div></section>;
}
function StepIcon({ index }: { index: number }) { return <svg aria-hidden="true" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{index === 0 ? <><path d="M8 10h32v24H24L14 42v-8H8Z"/><path d="M15 18h18M15 24h11"/></> : index === 1 ? <><path d="M7 8h26v21H20l-8 7v-7H7Z"/><path d="M33 18h8v19h-6l-5 5v-5h-8v-8"/><path d="M13 15h14M13 21h8"/></> : <><path d="M10 7h28v34H10Z"/><path d="M16 15h16M16 21h10m-10 9 5 5 11-12"/></>}</svg>; }
export function ContactNextSteps() { return <section className={styles.nextSteps} aria-labelledby="contact-next-heading"><div className={styles.rail}><div className={styles.sectionHead}><h2 id="contact-next-heading">Make the first conversation useful.</h2><p>You don’t need a finished brief to start.</p></div><ol>{CONTACT_NEXT_STEPS.map((step, index) => <li key={step.title}><StepIcon index={index}/><h3>{step.title}</h3><p>{step.text}</p></li>)}</ol></div></section>; }
export function ContactQuestions() { return <section id="faq" className={styles.questions} aria-labelledby="contact-faq-heading"><div className={styles.rail}>
  <h2 id="contact-faq-heading">Before you say hello.</h2><div className={styles.questionGrid}><div className={styles.faqList}>{CONTACT_QUESTIONS.map(item => <details key={item.q}><summary>{item.q}<svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M10 4v12M4 10h12"/></svg></summary><p>{item.a}</p></details>)}</div><aside className={styles.careersAside}><svg aria-hidden="true" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 11h28v24H6Z"/><path d="M13 11V5h14v6M6 20h28m-20 0v5h12v-5"/></svg><h3>Looking for your next role?</h3><p>Explore the openings and use the Careers application. For questions about a role, contact HR.</p><Link href="/careers">Explore Careers<ContactArrow /></Link><a href={`mailto:${CAREERS_EMAIL}`}>Email HR<ContactArrow diagonal /></a></aside></div>
  </div></section>; }
