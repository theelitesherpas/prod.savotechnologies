/**
 * Shared phone-number rules for callback requests.
 * Single source of truth: imported by the client form (instant feedback)
 * and the /api/callback route (authoritative server validation).
 *
 * Countries are ordered popular-first for the callback select; each rule
 * carries the ISD dial prefix, the national digit range after the prefix,
 * and a flag glyph for the select UI (renders as ISO letter pair where
 * emoji flags are unsupported).
 */

export type PhoneRule = { dial: string; min: number; max: number; flag: string };

export const COUNTRY_PHONE_RULES: Record<string, PhoneRule> = {
  India: { dial: "+91", min: 10, max: 10, flag: "🇮🇳" },
  Switzerland: { dial: "+41", min: 9, max: 9, flag: "🇨🇭" },
  "United States": { dial: "+1", min: 10, max: 10, flag: "🇺🇸" },
  "United Kingdom": { dial: "+44", min: 10, max: 10, flag: "🇬🇧" },
  "Saudi Arabia": { dial: "+966", min: 9, max: 9, flag: "🇸🇦" },
  "United Arab Emirates": { dial: "+971", min: 9, max: 9, flag: "🇦🇪" },
  Australia: { dial: "+61", min: 9, max: 9, flag: "🇦🇺" },
  Canada: { dial: "+1", min: 10, max: 10, flag: "🇨🇦" },
  Singapore: { dial: "+65", min: 8, max: 8, flag: "🇸🇬" },
  Germany: { dial: "+49", min: 10, max: 11, flag: "🇩🇪" },
  Netherlands: { dial: "+31", min: 9, max: 9, flag: "🇳🇱" },
  France: { dial: "+33", min: 9, max: 9, flag: "🇫🇷" },
  Qatar: { dial: "+974", min: 8, max: 8, flag: "🇶🇦" },
  Kuwait: { dial: "+965", min: 8, max: 8, flag: "🇰🇼" },
  Oman: { dial: "+968", min: 8, max: 8, flag: "🇴🇲" },
  Bahrain: { dial: "+973", min: 8, max: 8, flag: "🇧🇭" },
  "New Zealand": { dial: "+64", min: 9, max: 10, flag: "🇳🇿" },
  Ireland: { dial: "+353", min: 9, max: 9, flag: "🇮🇪" },
  "South Africa": { dial: "+27", min: 9, max: 9, flag: "🇿🇦" },
  Spain: { dial: "+34", min: 9, max: 9, flag: "🇪🇸" },
  Italy: { dial: "+39", min: 9, max: 10, flag: "🇮🇹" },
  Portugal: { dial: "+351", min: 9, max: 9, flag: "🇵🇹" },
  Belgium: { dial: "+32", min: 8, max: 9, flag: "🇧🇪" },
  Austria: { dial: "+43", min: 9, max: 11, flag: "🇦🇹" },
  Sweden: { dial: "+46", min: 7, max: 10, flag: "🇸🇪" },
  Norway: { dial: "+47", min: 8, max: 8, flag: "🇳🇴" },
  Denmark: { dial: "+45", min: 8, max: 8, flag: "🇩🇰" },
  Finland: { dial: "+358", min: 9, max: 10, flag: "🇫🇮" },
  Poland: { dial: "+48", min: 9, max: 9, flag: "🇵🇱" },
  Turkey: { dial: "+90", min: 10, max: 10, flag: "🇹🇷" },
  Egypt: { dial: "+20", min: 9, max: 10, flag: "🇪🇬" },
  Nigeria: { dial: "+234", min: 10, max: 10, flag: "🇳🇬" },
  Kenya: { dial: "+254", min: 9, max: 9, flag: "🇰🇪" },
  Bangladesh: { dial: "+880", min: 10, max: 10, flag: "🇧🇩" },
  "Sri Lanka": { dial: "+94", min: 9, max: 9, flag: "🇱🇰" },
  Nepal: { dial: "+977", min: 10, max: 10, flag: "🇳🇵" },
  Israel: { dial: "+972", min: 9, max: 9, flag: "🇮🇱" },
  Japan: { dial: "+81", min: 10, max: 10, flag: "🇯🇵" },
  "South Korea": { dial: "+82", min: 9, max: 10, flag: "🇰🇷" },
  China: { dial: "+86", min: 11, max: 11, flag: "🇨🇳" },
  "Hong Kong": { dial: "+852", min: 8, max: 8, flag: "🇭🇰" },
  Malaysia: { dial: "+60", min: 9, max: 10, flag: "🇲🇾" },
  Thailand: { dial: "+66", min: 9, max: 9, flag: "🇹🇭" },
  Indonesia: { dial: "+62", min: 9, max: 12, flag: "🇮🇩" },
  Philippines: { dial: "+63", min: 10, max: 10, flag: "🇵🇭" },
  Vietnam: { dial: "+84", min: 9, max: 10, flag: "🇻🇳" },
  Brazil: { dial: "+55", min: 10, max: 11, flag: "🇧🇷" },
  Mexico: { dial: "+52", min: 10, max: 10, flag: "🇲🇽" },
  Argentina: { dial: "+54", min: 10, max: 10, flag: "🇦🇷" },
  Chile: { dial: "+56", min: 9, max: 9, flag: "🇨🇱" },
  Other: { dial: "+", min: 7, max: 12, flag: "🌐" },
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
