/** JSON embedded in an HTML script must not be able to end that element.
 * JSON.stringify alone does NOT escape HTML parser delimiters. */
export function scriptJson(value: unknown): string {
  const escapes: Record<string, string> = { "<": "\\u003c", ">": "\\u003e", "&": "\\u0026", "\u2028": "\\u2028", "\u2029": "\\u2029" };
  return (JSON.stringify(value) ?? "null").replace(/[<>&\u2028\u2029]/g, character => escapes[character]);
}
