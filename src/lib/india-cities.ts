export type IndiaCity = [name: string, state: string, id: number];
export type IndiaCityDirectory = { count: number; cities: IndiaCity[]; source: string; license: string };
export const citySearchKey = (value: string) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const aliases = [["bengaluru", "bangalore"], ["mumbai", "bombay"], ["kolkata", "calcutta"], ["chennai", "madras"], ["gurugram", "gurgaon"], ["puducherry", "pondicherry"], ["thiruvananthapuram", "trivandrum"], ["prayagraj", "allahabad"]];
export function searchIndiaCities(cities: IndiaCity[], input: string, limit = 40) {
  const query = citySearchKey(input);
  const terms = new Set([query]);
  for (const group of aliases) if (group.includes(query)) group.forEach(name => terms.add(name));
  const matches = cities.filter(([name, state]) => !query || [...terms].some(term => term.split(" ").every(word => citySearchKey(`${name} ${state}`).includes(word))));
  matches.sort((a, b) => Number(![...terms].some(term => citySearchKey(a[0]).startsWith(term))) - Number(![...terms].some(term => citySearchKey(b[0]).startsWith(term))) || a[0].localeCompare(b[0], "en-IN") || a[1].localeCompare(b[1], "en-IN"));
  return { total: matches.length, options: matches.slice(0, limit) };
}
