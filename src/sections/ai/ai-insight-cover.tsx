import type { CSSProperties } from "react";

/** Authored editorial diagrams, not client work or article screenshots. */
export function AiInsightCover({ slug }: { slug: string }) {
  const label: CSSProperties = { fontFamily: "var(--font-sans)", fontSize: 15, fill: "#333" };
  const line = { fill: "none", stroke: "#949494", strokeWidth: 2 };
  const retrieval = slug === "rag-vs-fine-tuning";
  const workflow = slug === "ai-agent-vs-workflow-automation";
  return (
    <svg viewBox="0 0 420 240" aria-hidden="true" focusable="false">
      <rect width="420" height="240" fill="#e8e8e8" />
      {workflow ? <>
        <path d="M210 61v39m0 0H100v43m110-43h110v43" {...line} />
        <rect x="163" y="28" width="94" height="45" rx="6" fill="#fff" />
        <text x="210" y="56" textAnchor="middle" style={label}>The task</text>
        <rect x="42" y="143" width="116" height="60" rx="8" fill="#fff" />
        <path d="M59 159h25m-25 9h18m-18 9h25" {...line} stroke="#b82222" />
        <text x="119" y="181" textAnchor="middle" style={label}>Rules</text>
        <rect x="262" y="143" width="116" height="60" rx="8" fill="#111" />
        <path d="m280 167 7 7 13-15" {...line} stroke="#ff6b6b" />
        <text x="337" y="181" textAnchor="middle" style={{ ...label, fill: "#fff" }}>Agent</text>
      </> : retrieval ? <>
        <rect x="46" y="67" width="82" height="110" rx="6" fill="#f7f7f7" />
        <rect x="61" y="52" width="82" height="110" rx="6" fill="#fff" />
        <path d="M78 78h48m-48 15h36m-36 15h48m-48 15h26" {...line} />
        <path d="M151 107h92m-8-7 10 7-10 7" {...line} stroke="#b82222" />
        <rect x="257" y="65" width="114" height="82" rx="8" fill="#111" />
        <text x="314" y="112" textAnchor="middle" style={{ ...label, fill: "#fff" }}>Model</text>
        <text x="103" y="205" textAnchor="middle" style={label}>Your sources</text>
        <text x="314" y="205" textAnchor="middle" style={label}>Useful context</text>
      </> : <>
        <rect x="86" y="28" width="248" height="184" rx="8" fill="#fff" />
        <text x="111" y="64" style={{ ...label, fontSize: 18 }}>Questions to ask</text>
        {["Information", "Evaluation", "Human review"].map((text, i) => <g key={text}>
          <rect x="112" y={83 + i * 36} width="20" height="20" rx="4" {...line} stroke="#b82222" />
          <path d={`m117 ${93 + i * 36} 4 4 7-9`} {...line} stroke="#b82222" />
          <text x="146" y={98 + i * 36} style={label}>{text}</text>
        </g>)}
      </>}
    </svg>
  );
}
