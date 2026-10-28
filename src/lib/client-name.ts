/** Optional honorifics are explicit client preferences, never inferred from a
 * name, gender or marital status. Keep the stored name separate from its title. */
export const CLIENT_TITLES = ["Mr.", "Mrs.", "Ms.", "Dr."] as const;
export type ClientTitle = (typeof CLIENT_TITLES)[number];

export function clientTitle(value: unknown): ClientTitle | null {
  return typeof value === "string" && CLIENT_TITLES.includes(value as ClientTitle) ? value as ClientTitle : null;
}

function parts(name: string, title?: string | null) {
  let bare = name.trim().replace(/\s+/gu, " ");
  let embedded: ClientTitle | null = null;
  // Recognize legacy prefixes so "Mr. Mr. James" never becomes a greeting.
  // A title must be a separate word; names such as "Mrinal" are untouched.
  let match: RegExpMatchArray | null;
  while ((match = bare.match(/^(Mr|Mrs|Ms|Dr)\.?\s+/iu))) {
    const prefix = match[1];
    embedded ??= clientTitle(`${prefix[0].toUpperCase()}${prefix.slice(1).toLowerCase()}.`);
    bare = bare.slice(match[0].length).trim();
  }
  return { bare, title: title === undefined ? embedded : clientTitle(title) };
}

/** Complete display name. Passing null explicitly means no stored title. */
export function clientFullName(name: string, title?: string | null): string {
  const p = parts(name, title);
  return p.bare ? [p.title, p.bare].filter(Boolean).join(" ") : "";
}

/** Greeting form: Mr. James Miller → Mr. James; untitled → James.
 * No cultural/gender inference or destructive edits to the stored full name. */
export function clientGreetingName(name: string, title?: string | null): string {
  const p = parts(name, title);
  const first = p.bare.split(" ")[0];
  return first ? [p.title, first].filter(Boolean).join(" ") : "there";
}

/** Avatar initials must come from the person's name, not their honorific. */
export function clientInitials(name: string): string {
  return parts(name).bare.split(" ").filter(Boolean).slice(0, 2).map((part) => Array.from(part)[0]).join("").toUpperCase();
}
