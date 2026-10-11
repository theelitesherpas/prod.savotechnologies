// Original destinations and their reading order remain intact.
export const NOT_FOUND_DESTINATIONS = [
  ["Services", "/services"],
  ["Industries", "/industries"],
  ["Case Studies", "/case-studies"],
  ["Insights", "/insights"],
  ["About Savo", "/about"],
  ["Careers", "/careers"],
  ["Contact", "/contact"],
  ["Hire Developers", "/hire"],
  ["AI Agents", "/ai-agents"],
] as const;

export const NOT_FOUND_COPY = {
  description: "Error 404. The page you’re looking for isn’t available at this address. The link may be out of date, or the address may have been mistyped.",
  recovery: "Check the address, return to the homepage, or choose a destination.",
} as const;
