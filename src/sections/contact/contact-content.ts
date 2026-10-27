export const CONTACT_QUESTIONS = [
  { q: "What should I include in my message?", a: "Tell us what you want to build, improve or ask about, where things stand today, and any constraints you already know. A few clear sentences are enough to begin. Please don’t include passwords, payment details or confidential files." },
  { q: "Do I need a budget before getting in touch?", a: "No. The budget field is optional and includes ‘To be discussed’. If you have a range in mind, it helps give the conversation context; it is not a quote or a commitment." },
  { q: "Can we discuss confidentiality first?", a: "Yes - mention that in your first message without sharing sensitive details. Any confidentiality agreement and its scope should be discussed and agreed before you share protected information." },
  { q: "Can I apply for a job using this form?", a: "Use the Careers application for job applications so your skills, experience and availability reach the right flow. You can still use this form for a general question about Savo or a role." },
  { q: "Can I call or message instead?", a: "Yes. Use the phone, email or WhatsApp links on this page. For a project callback request, use the ‘Prefer a call about your project?’ form in the footer. Response timing depends on the enquiry and availability." },
] as const;

export const CONTACT_NEXT_STEPS = [
  { title: "Share the context.", text: "Your goal, current stage and constraints give the conversation a useful starting point." },
  { title: "Clarify the question.", text: "Depending on your enquiry, the next step may be a follow-up question or a conversation about what you need." },
  { title: "Agree what’s next.", text: "If there’s a project to explore, scope, responsibilities, timing and commercial terms are discussed separately." },
] as const;

export const TOPIC_GUIDANCE = {
  "New project": { hint: "A new idea or something you want to improve? Start with the goal.", placeholder: "What would you like to build or improve, and where are you starting from?" },
  "Hire a team": { hint: "Tell us about the skills, responsibilities and working arrangement you need.", placeholder: "What skills do you need, and how would the team work with you?" },
  "Support": { hint: "Describe the product or issue. Please don’t include passwords or sensitive data.", placeholder: "What are you using, what happened, and what help do you need?" },
  "Careers": { hint: "For job applications, use the dedicated Careers form. General questions are welcome here.", placeholder: "What would you like to know about a role or working with Savo?" },
  "Something else": { hint: "Have another question? Tell us a little about it.", placeholder: "What would you like to talk about?" },
} as const;

/** Reuses the existing first-touch context; never stores new personal data. */
export function contactAttribution(raw: string | null): Record<string, string> {
  try {
    const parsed: unknown = JSON.parse(raw || "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const landing = parsed as Record<string, unknown>;
    const result: Record<string, string> = {};
    for (const [key, source] of [["landingPage", "page"], ["referrer", "referrer"], ["utm_source", "utm_source"], ["utm_medium", "utm_medium"], ["utm_campaign", "utm_campaign"], ["utm_content", "utm_content"], ["utm_term", "utm_term"]]) {
      const value = landing[source];
      if (typeof value === "string" && value) result[key] = value.slice(0, key === "referrer" ? 300 : 500);
    }
    return result;
  } catch { return {}; }
}
