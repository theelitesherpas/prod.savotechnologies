import { randomInt } from "node:crypto";

/**
 * Public enquiry references — SAVO-XXXXXXXX.
 *
 * Shown to the visitor on the thank-you page and safe to speak aloud on a
 * call or paste into an email: it reveals nothing (no sequence, no row id,
 * no timestamp), yet uniquely identifies the enquiry for the team. The
 * alphabet drops look-alikes (0/O, 1/I/L) so a reference survives being
 * read over the phone or retyped.
 */

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // 31 unambiguous chars
export const REFERENCE_PREFIX = "SAVO-";
export const REFERENCE_BODY_LENGTH = 8;

/** ~31^8 ≈ 8.5e11 combinations — brute-forcing a valid reference through
 *  the thank-you lookup is not a practical enumeration vector. */
export function generateEnquiryReference(): string {
  let body = "";
  for (let i = 0; i < REFERENCE_BODY_LENGTH; i += 1) {
    body += ALPHABET[randomInt(ALPHABET.length)];
  }
  return `${REFERENCE_PREFIX}${body}`;
}

/** Strict shape check before the reference ever touches the database. */
const REFERENCE_RE = new RegExp(
  `^${REFERENCE_PREFIX}[${ALPHABET}]{${REFERENCE_BODY_LENGTH}}$`,
);

export function isValidEnquiryReference(value: unknown): value is string {
  return typeof value === "string" && REFERENCE_RE.test(value);
}
