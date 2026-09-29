/**
 * Natural-language detection of "the visitor wants a human" — the trigger
 * behind the AI→human handoff (spec §4). Pure function, unit-tested.
 *
 * Matching is deliberately conservative: a question ABOUT talking to
 * humans ("can I talk to a human about pricing?") should hand off, while
 * generic sales words inside technical questions should not. We match on
 * phrase patterns, not single words like "sales".
 */

const PATTERNS: RegExp[] = [
  // Direct requests for a person
  /\btalk to (a|an|the|your|some)? ?(human|person|someone|agent|representative|rep|team|member|specialist|expert|consultant|advisor|manager|sales|developer|someone real)\b/i,
  /\bspeak (to|with) (a|an|the|your|some)? ?(human|person|someone|agent|representative|rep|team|member|specialist|expert|consultant|advisor|manager|sales|developer)\b/i,
  /\bconnect me (to|with) (a|an|the|your)? ?(human|person|someone|agent|team|specialist|sales)\b/i,
  /\b(chat|talk) with (a|an|the|your) (human|person|agent|team|member|specialist)\b/i,
  /\b(real (human|person)|actual person|live (person|agent|human|chat)|human agent|real agent)\b/i,
  /\b(is (there|anyone) (a )?(human|person|agent|team) (i can|to) (talk|speak|chat))/i,
  // Sales / commercial intent
  /\b(i want|need|would like|like) to (talk|speak|chat|discuss|connect)( with)? (to )?(someone|a person|your team|the team|sales|an agent|a human)\b/i,
  /\b(i need|i want|request|need a|want a) (a )?(quotation|quote|estimate|proposal|pricing for my|price for my)\b/i,
  /\b(can someone call me|can you call me|please call me|call me back)\b/i,
  /\b(i want|we want|i'd like|we'd like) to (hire|engage|work with|partner with) savo\b/i,
  /\b(discuss|talking about) my (project|idea|app|website|product|requirement|startup)\b/i,
  /\b(i need to|i want to) talk to (sales|your sales|the sales|business)\b/i,
  /\b(book|schedule) (a )?(call|meeting|discovery|consultation)\b/i,
  /\b(human|person|agent) (please|pls|now|asap)\b/i,
  /\btransfer (me|this|chat) to (a|an|the)? ?(human|person|agent|team)\b/i,
];

export function wantsHuman(text: string): boolean {
  const clean = text.trim();
  if (!clean || clean.length > 500) return false;
  return PATTERNS.some((p) => p.test(clean));
}
