/**
 * Shared phone-number rules for callback requests.
 * Single source of truth: imported by the client form (instant feedback)
 * and the /api/callback route (authoritative server validation).
 */

export type PhoneRule = { dial: string; min: number; max: number };

export const COUNTRY_PHONE_RULES: Record<string, PhoneRule> = {
  India: { dial: "+91", min: 10, max: 10 },
  "United States": { dial: "+1", min: 10, max: 10 },
  "United Kingdom": { dial: "+44", min: 10, max: 10 },
  "United Arab Emirates": { dial: "+971", min: 9, max: 9 },
  "Saudi Arabia": { dial: "+966", min: 9, max: 9 },
  Qatar: { dial: "+974", min: 8, max: 8 },
  Kuwait: { dial: "+965", min: 8, max: 8 },
  Oman: { dial: "+968", min: 8, max: 8 },
  Bahrain: { dial: "+973", min: 8, max: 8 },
  Australia: { dial: "+61", min: 9, max: 9 },
  Canada: { dial: "+1", min: 10, max: 10 },
  Germany: { dial: "+49", min: 10, max: 11 },
  Netherlands: { dial: "+31", min: 9, max: 9 },
  France: { dial: "+33", min: 9, max: 9 },
  Singapore: { dial: "+65", min: 8, max: 8 },
  "New Zealand": { dial: "+64", min: 9, max: 10 },
  "South Africa": { dial: "+27", min: 9, max: 9 },
  Ireland: { dial: "+353", min: 9, max: 9 },
  Other: { dial: "+", min: 7, max: 12 },
};

export const CALLBACK_COUNTRIES = Object.keys(COUNTRY_PHONE_RULES);

/**
 * Validate a national phone number against the chosen country's rules.
 * Accepts optional dial prefix, spaces; returns a normalized result.
 */
export function validatePhone(country: string, phone: string):
  { ok: true; normalized: string } | { ok: false; error: string } {
  const rule = COUNTRY_PHONE_RULES[country];
  if (!rule) return { ok: false, error: "Please choose a country." };

  const raw = phone.trim();
  if (!/^\+?[0-9 ]{5,18}$/.test(raw)) {
    return { ok: false, error: "Please enter a valid phone number." };
  }

  const digits = raw.replace(/\D/g, "");
  const national =
    rule.dial === "+" ? digits : digits.replace(rule.dial.replace("+", ""), "");

  if (national.length < rule.min || national.length > rule.max) {
    const expected =
      rule.min === rule.max ? `${rule.min}` : `${rule.min}–${rule.max}`;
    return {
      ok: false,
      error: `${country} numbers have ${expected} digits after ${rule.dial}.`,
    };
  }

  return { ok: true, normalized: `${rule.dial}${national}` };
}
