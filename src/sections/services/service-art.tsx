import type { ServiceDetail } from "@/constants/services-detail";

export type ArtKind = "website" | "portal" | "content" | "phone" | "workflow" | "design";
export function artForService(slug: string, index = 0): ArtKind {
  const kinds: Record<string, ArtKind[]> = {
    "web-development": ["website", "portal", "portal", "content", "phone", "workflow"],
    "mobile-app-development": ["phone", "workflow", "phone", "portal", "workflow", "portal"],
    "ui-ux-design": ["workflow", "design", "website", "design", "phone", "website"],
    "cloud-devops": ["workflow", "workflow", "content", "workflow", "portal", "workflow"],
    "data-analytics": ["workflow", "content", "portal", "portal", "workflow", "workflow"],
    "ai-agent-development": ["workflow", "workflow", "content", "workflow", "phone", "portal"],
    "custom-software-development": ["portal", "portal", "website", "portal", "content", "workflow"],
    "digital-marketing": ["website", "content", "content", "website", "portal", "design"],
    "qa-testing": ["workflow", "workflow", "design", "portal", "workflow", "workflow"],
    "product-engineering": ["workflow", "design", "portal", "design", "website", "workflow"],
  };
  return (kinds[slug] ?? kinds["web-development"])[index % 6];
}
const type = { fontFamily: "var(--font-sans)", fill: "#666", fontSize: 12 };
const heading = { fontFamily: "var(--font-serif)", fontWeight: 500, fill: "#111" };
function Chrome({ label }: { label: string }) {
  return <><rect width="640" height="420" rx="12" fill="#fff" /><rect width="640" height="34" rx="12" fill="#f7f7f7" /><rect y="20" width="640" height="14" fill="#f7f7f7" /><g fill="#949494"><circle cx="18" cy="17" r="3" /><circle cx="29" cy="17" r="3" /><circle cx="40" cy="17" r="3" /></g><text x="320" y="21" textAnchor="middle" style={{ ...type, fontSize: 10 }}>{label}</text></>;
}

/** Interface artwork follows the responsibilities and workflows described on each service page. */
export function ServiceArtwork({ kind, slug = "web-development" }: { kind: ArtKind; slug?: string }) {
  return <svg viewBox="0 0 640 420" aria-hidden="true" focusable="false" style={{ width: "100%", height: "auto", display: "block" }}>
    <Chrome label={kind === "website" ? "Website experience" : kind === "phone" ? "Mobile experience" : kind === "workflow" ? "Connected workflow" : kind === "design" ? "Interface design" : "Business workspace"} />
    {kind === "website" ? <>
      <text x="28" y="77" style={{ ...heading, fontSize: 25 }}>Spaces.</text><text x="409" y="74" style={type}>Places</text><text x="477" y="74" style={type}>Our story</text><rect x="552" y="54" width="61" height="30" rx="5" fill="#111" /><text x="583" y="73" textAnchor="middle" style={{ ...type, fill: "#fff", fontSize: 10 }}>Explore</text>
      <text x="28" y="157" style={{ ...heading, fontSize: 43 }}>Room for</text><text x="28" y="202" style={{ ...heading, fontSize: 43 }}>what’s next.</text><text x="29" y="238" style={type}>Places made for your next idea.</text>
      <rect x="28" y="266" width="156" height="40" rx="5" fill="#df2525" /><text x="45" y="290" style={{ ...type, fill: "#fff", fontSize: 11 }}>Discover the collection</text>
      <image href="/images/architecture.webp" x="328" y="111" width="285" height="219" preserveAspectRatio="xMidYMid slice" />
      <g style={type}><text x="29" y="376">Workspaces</text><text x="241" y="376">Creative studios</text><text x="459" y="376">Places to connect</text></g><g stroke="#b82222" fill="none" strokeWidth="1.5"><path d="M183 370h12m-5-5 5 5-5 5M397 370h12m-5-5 5 5-5 5M597 370h12m-5-5 5 5-5 5" /></g>
    </> : kind === "phone" ? <>
      <rect x="0" y="34" width="640" height="386" fill="#f7f7f7" /><text x="32" y="110" style={{ ...heading, fontSize: 35 }}>Useful.</text><text x="32" y="150" style={{ ...heading, fontSize: 35 }}>Wherever</text><text x="32" y="190" style={{ ...heading, fontSize: 35 }}>you are.</text><g style={type}><text x="34" y="233">Responsive journeys.</text><text x="34" y="257">Thoughtful interactions.</text><text x="34" y="281">Connected experiences.</text></g>
      <rect x="342" y="53" width="231" height="350" rx="28" fill="#111" /><rect x="349" y="60" width="217" height="335" rx="22" fill="#fff" /><rect x="415" y="67" width="81" height="12" rx="6" fill="#111" />
      <text x="367" y="110" style={{ ...heading, fontSize: 20 }}>Your next place.</text><image href="/images/sectors/travel-hero.webp" x="367" y="131" width="181" height="144" preserveAspectRatio="xMidYMid slice" /><text x="367" y="301" style={{ ...heading, fontSize: 17 }}>A change of scenery.</text><text x="367" y="322" style={{ ...type, fontSize: 10 }}>Discover. Save. Make it yours.</text><rect x="367" y="340" width="181" height="32" rx="5" fill="#df2525" /><text x="458" y="360" textAnchor="middle" style={{ ...type, fill: "#fff", fontSize: 10 }}>Explore places</text>
    </> : kind === "workflow" ? <>
      <text x="32" y="89" style={{ ...heading, fontSize: 27 }}>{slug === "ai-agent-development" ? "Knowledge into action." : "Connect the moving parts."}</text><text x="33" y="117" style={type}>Clear inputs. Defined actions. Human review.</text>
      <g fill="none" stroke="#c5c5c5" strokeWidth="2"><path d="M175 202h91m108 0h91M320 236v49M175 334h91m108 0h91" /></g>
      {[{ x: 32, y: 166, t: "Source", sub: "Documents & data" }, { x: 267, y: 166, t: "Process", sub: "Logic & permissions" }, { x: 466, y: 166, t: "Review", sub: "People in control" }, { x: 32, y: 298, t: "CRM", sub: "Business context" }, { x: 267, y: 298, t: "Tools", sub: "Approved actions" }, { x: 466, y: 298, t: "Updates", sub: "Connected systems" }].map((n, i) => <g key={n.t}><rect x={n.x} y={n.y} width="142" height="73" rx="8" fill={i === 1 ? "#111" : "#f7f7f7"} /><rect x={n.x + 15} y={n.y + 15} width="9" height="9" rx="2" fill="#df2525" /><text x={n.x + 33} y={n.y + 24} style={{ ...heading, fontSize: 16, fill: i === 1 ? "#fff" : "#111" }}>{n.t}</text><text x={n.x + 15} y={n.y + 53} style={{ ...type, fontSize: 10, fill: i === 1 ? "#b0b0b0" : "#666" }}>{n.sub}</text></g>)}
    </> : kind === "design" ? <>
      <rect x="24" y="58" width="174" height="332" rx="8" fill="#f7f7f7" /><text x="44" y="93" style={{ ...heading, fontSize: 19 }}>Design system</text><g style={type}><text x="44" y="133">Typography</text><text x="44" y="158">Components</text><text x="44" y="183">Interaction states</text></g><g><circle cx="51" cy="233" r="10" fill="#111" /><circle cx="82" cy="233" r="10" fill="#df2525" /><circle cx="113" cy="233" r="10" fill="#757575" /><circle cx="144" cy="233" r="10" fill="#e8e8e8" /></g><text x="44" y="290" style={{ ...heading, fontSize: 33 }}>Aa</text><text x="44" y="326" style={type}>One coherent language.</text>
      <rect x="228" y="60" width="380" height="150" rx="8" fill="#111" /><text x="253" y="103" style={{ ...heading, fontSize: 28, fill: "#fff" }}>Clarity, by design.</text><rect x="253" y="128" width="162" height="8" rx="4" fill="#757575" /><rect x="253" y="146" width="117" height="8" rx="4" fill="#757575" /><rect x="493" y="85" width="90" height="96" rx="7" fill="#df2525" />
      <rect x="228" y="234" width="179" height="156" rx="8" fill="#f7f7f7" /><rect x="431" y="234" width="177" height="156" rx="8" fill="#f7f7f7" /><g fill="#e8e8e8"><rect x="248" y="253" width="140" height="73" rx="6" /><rect x="451" y="253" width="138" height="73" rx="6" /></g><text x="248" y="358" style={type}>Useful components</text><text x="451" y="358" style={type}>Consistent behaviour</text>
    </> : <>
      <rect x="0" y="34" width="139" height="386" fill="#f7f7f7" /><text x="21" y="81" style={{ ...heading, fontSize: 21 }}>Workspace.</text><rect x="15" y="111" width="109" height="35" rx="5" fill="#111" /><text x="28" y="133" style={{ ...type, fill: "#fff", fontSize: 11 }}>Overview</text><g style={{ ...type, fontSize: 11 }}><text x="28" y="174">Requests</text><text x="28" y="215">Documents</text><text x="28" y="256">Settings</text></g>
      <text x="166" y="85" style={{ ...heading, fontSize: 26 }}>{kind === "content" ? "Content, in your hands." : "A clearer working day."}</text><text x="167" y="111" style={type}>{kind === "content" ? "Draft, review and publish with a shared structure." : "Requests, documents and the next step, together."}</text>
      <rect x="165" y="140" width="448" height="87" rx="8" fill="#111" /><text x="184" y="174" style={{ ...heading, fontSize: 21, fill: "#fff" }}>{kind === "content" ? "A home for your ideas." : "Everything in one place."}</text><text x="184" y="200" style={{ ...type, fill: "#b0b0b0", fontSize: 11 }}>Designed around the way your team works.</text>
      {["Draft", "In review", "Ready"].map((label, i) => <g key={label}><rect x={165 + i * 153} y="251" width="141" height="136" rx="7" fill="#f7f7f7" /><text x={180 + i * 153} y="277" style={{ ...heading, fontSize: 14 }}>{label}</text><rect x={179 + i * 153} y="292" width="113" height="73" rx="5" fill="#fff" /><rect x={189 + i * 153} y="303" width="7" height="7" rx="2" fill="#df2525" /><text x={189 + i * 153} y="333" style={{ ...type, fontSize: 10 }}>{["Project brief", "Brand assets", "Release notes"][i]}</text><rect x={189 + i * 153} y="344" width="62" height="4" rx="2" fill="#e8e8e8" /></g>)}
    </>}
  </svg>;
}

export function ResourceCover({ href, slug }: { href: string; slug: string }) {
  if (href === "/case-studies") return <ServiceArtwork kind={artForService(slug)} slug={slug} />;
  if (!href.startsWith("/insights")) return <ServiceArtwork kind="workflow" slug={slug} />;
  return <svg viewBox="0 0 640 420" aria-hidden="true" focusable="false" style={{ width:"100%", height:"auto", display:"block" }}>
    <rect width="640" height="420" rx="12" fill="#111" />
    <rect x="356" y="62" width="215" height="291" rx="10" fill="#383838" transform="rotate(8 463 207)" />
    <rect x="324" y="52" width="215" height="291" rx="10" fill="#df2525" />
    <g fill="#fff"><rect x="355" y="97" width="113" height="10" rx="4" /><rect x="355" y="126" width="148" height="7" rx="3" /><rect x="355" y="148" width="134" height="7" rx="3" /><rect x="355" y="170" width="144" height="7" rx="3" /></g>
    <path d="m390 270 21 21 48-54" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
    <text x="32" y="190" style={{ ...heading, fill:"#fff", fontSize:44 }}>Better</text><text x="32" y="242" style={{ ...heading, fill:"#fff", fontSize:44 }}>decisions.</text>
    <text x="34" y="280" style={{ ...type, fill:"#b0b0b0", fontSize:17 }}>Practical perspectives.</text>
  </svg>;
}

export function ArchitectureArt({ slug, active = 0 }: { slug: string; active?: number }) {
  const labels: Record<string, string[]> = { "ui-ux-design": ["Research", "Design system", "Implementation"], "digital-marketing": ["Audience", "Experience", "Measurement"], "cloud-devops": ["Source", "Pipeline", "Environments"], "data-analytics": ["Sources", "Models", "Reporting"], "ai-agent-development": ["Knowledge", "Agent", "Tools & review"], "qa-testing": ["Critical paths", "Test coverage", "Release checks"], "product-engineering": ["Research", "Delivery", "Feedback"] };
  const nodes = labels[slug] ?? ["Experience", "Application", "Connected data"];
  return <svg viewBox="0 0 640 360" aria-hidden="true" focusable="false" style={{ width: "100%", height: "auto", display: "block" }}>
    <g stroke="#383838" fill="none" strokeWidth="1.5"><path d="M122 172h86m224 0h86M320 118V71m0 154v58M80 290h480" /><path d="M92 96h456v160H92" strokeDasharray="4 7" /></g>
    <rect x="221" y="121" width="198" height="103" rx="14" fill="#fff" /><rect x="305" y="140" width="30" height="30" rx="6" fill="#df2525" /><path d="m312 154 6 6 10-12" fill="none" stroke="#fff" strokeWidth="2" /><text x="320" y="198" textAnchor="middle" style={{ ...heading, fontSize: 21 }}>{nodes[1]}</text>
    {[{ x: 22, t: nodes[0] }, { x: 451, t: nodes[2] }].map(n => <g key={n.t}><rect x={n.x} y="139" width="166" height="65" rx="10" fill="#171717" stroke="#454545" /><text x={n.x + 83} y="177" textAnchor="middle" style={{ ...type, fill: "#fff", fontSize: 16 }}>{n.t}</text></g>)}
    {["Access & data", "Quality", "After delivery"].map((t, i) => <g key={t}><rect x={81 + i * 165} y="277" width="149" height="43" rx="6" fill={active === i ? "#df2525" : "#171717"} /><text x={155 + i * 165} y="303" textAnchor="middle" style={{ ...type, fill: active === i ? "#fff" : "#b0b0b0", fontSize: 12 }}>{t}</text></g>)}
    <circle cx="320" cy="65" r="22" fill="#171717" stroke="#454545" /><path d="m309 65 7 7 15-15" stroke="#ff6b6b" strokeWidth="1.8" fill="none" />
  </svg>;
}

export function DeliveryArt({ phase, steps }: { phase: number; steps: ServiceDetail["process"] }) {
  return <svg viewBox="0 0 640 370" aria-hidden="true" focusable="false" style={{ width: "100%", height: "auto", display: "block" }}>
    <rect width="640" height="370" rx="12" fill="#f7f7f7" />
    <rect x="123" y="33" width="394" height="234" rx="11" fill="#fff" />
    {phase === 0 ? <><rect x="238" y="57" width="162" height="184" rx="5" fill="#f7f7f7" /><text x="259" y="98" style={{ ...heading, fontSize: 20 }}>Project brief</text><g fill="#c5c5c5">{[0, 1, 2, 3].map(i => <rect key={i} x="259" y={121 + i * 22} width={i % 2 ? 97 : 116} height="7" rx="3" />)}</g><rect x="173" y="127" width="111" height="57" rx="7" fill="#111" /><text x="228" y="161" textAnchor="middle" style={{ ...type, fill: "#fff" }}>Clear priorities</text></> : phase === 1 ? <><rect x="151" y="61" width="178" height="143" rx="6" fill="#f7f7f7" /><rect x="169" y="79" width="96" height="8" rx="3" fill="#757575" /><rect x="169" y="103" width="142" height="51" rx="4" fill="#e8e8e8" /><rect x="169" y="169" width="62" height="20" rx="3" fill="#df2525" /><rect x="343" y="83" width="134" height="159" rx="7" fill="#111" /><text x="365" y="116" style={{ ...heading, fontSize: 17, fill: "#fff" }}>Prototype</text><rect x="365" y="132" width="89" height="55" rx="4" fill="#383838" /><path d="m412 223 24-11-24-10Z" fill="#ff6b6b" /></> : phase === 2 ? <><rect x="151" y="61" width="336" height="174" rx="7" fill="#111" /><g style={{ ...type, fontSize: 14 }}><text x="174" y="94" fill="#b0b0b0">Application</text><text x="174" y="125" fill="#ff6b6b">routes / components / data</text><text x="194" y="155" fill="#fff">Build the useful paths.</text><text x="194" y="182" fill="#b0b0b0">Connect. Test. Review.</text></g><circle cx="454" cy="210" r="28" fill="#df2525" /><path d="m442 210 8 8 16-17" fill="none" stroke="#fff" strokeWidth="2" /></> : <><rect x="159" y="62" width="320" height="124" rx="7" fill="#111" /><text x="185" y="103" style={{ ...heading, fontSize: 23, fill: "#fff" }}>Ready for the next chapter.</text><text x="185" y="138" style={{ ...type, fill: "#b0b0b0" }}>Release plan · Documentation · Handover</text><rect x="242" y="167" width="155" height="69" rx="8" fill="#df2525" /><path d="M320 215v-28m-10 10 10-10 10 10" fill="none" stroke="#fff" strokeWidth="2" /></>}
    <path d="M94 306h451" stroke="#c5c5c5" strokeWidth="1.5" />
    {steps.map((_, i) => <g key={i}><circle cx={94 + i * 150} cy="306" r="18" fill={i === phase ? "#df2525" : "#fff"} /><text x={94 + i * 150} y="311" textAnchor="middle" style={{ ...type, fill: i === phase ? "#fff" : "#666", fontSize: 12 }}>{i + 1}</text></g>)}
  </svg>;
}
