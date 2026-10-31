/** Current enquiry scope. Retired work must not be sold under another label. */
export const SERVICE_SCOPE_MESSAGE = "That service is not part of our current offering. We can help with new websites, mobile applications and custom software development.";

export function isUnavailableServiceRequest(input: string): boolean {
  const text = input.normalize("NFKC").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const website = /\b(?:web\s?sites?|sites?|storefronts?|wordpress|shopify|woocommerce)\b/.test(text);
  const visualChange = /\b(?:re\s?design(?:s|ing|ed)?|revamp(?:s|ing|ed)?|makeovers?)\b/.test(text);
  const nonWebsite = /\b(?:mobile|android|ios|database|infrastructure|cloud|pipeline|native|backend)\b/.test(text);
  if (visualChange && (website || !nonWebsite)) return true;
  return website && /\b(?:re\s?platform(?:s|ing|ed)?|rebuild(?:s|ing)?|refresh(?:es|ing|ed)?|moderni[sz](?:e|es|ed|ing|ation)|migrat(?:e|es|ed|ing|ion)|new look|new layout)\b/.test(text);
}
