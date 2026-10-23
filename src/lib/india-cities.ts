export type IndiaCity = [name: string, state: string, id: number];
export type IndiaCityDirectory = { count: number; cities: IndiaCity[]; source: string; license: string };
/** Bump when the pinned extract changes; versioned URLs are safe to cache immutably. */
export const INDIA_CITY_DIRECTORY_VERSION = "7795d77d6a801543b9bb90d97a182c885f44c458";
export const INDIA_CITY_DIRECTORY_URL = `/data/india-cities.json?v=${INDIA_CITY_DIRECTORY_VERSION}`;
export const citySearchKey = (value: string) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const aliases = [["bengaluru", "bangalore"], ["mumbai", "bombay"], ["kolkata", "calcutta"], ["chennai", "madras"], ["gurugram", "gurgaon"], ["puducherry", "pondicherry"], ["thiruvananthapuram", "trivandrum"], ["prayagraj", "allahabad"]];
/** Owner-selected shortcuts, not a population ranking or inferred applicant location. */
export const PREFERRED_INDIA_CITIES = [
  ["Indore", "Madhya Pradesh"], ["Delhi", "Delhi"], ["Pune", "Maharashtra"], ["Bengaluru", "Karnataka"],
  ["Bhopal", "Madhya Pradesh"], ["Ujjain", "Madhya Pradesh"], ["Dewas", "Madhya Pradesh"],
  ["Mumbai", "Maharashtra"], ["Hyderabad", "Telangana"], ["Ahmedabad", "Gujarat"], ["Jaipur", "Rajasthan"],
  ["Gurugram", "Haryana"], ["Noida", "Uttar Pradesh"], ["New Delhi", "Delhi"], ["Nagpur", "Maharashtra"],
  ["Chennai", "Tamil Nadu"], ["Kolkata", "West Bengal"], ["Lucknow", "Uttar Pradesh"], ["Surat", "Gujarat"],
] as const;
const preferred = new Map(PREFERRED_INDIA_CITIES.map(([name, state], index) => [`${citySearchKey(name)}|${citySearchKey(state)}`, index]));
const collator = new Intl.Collator("en-IN", { sensitivity: "base", numeric: true });
type Entry = { city: IndiaCity; name: string; names: string[]; key: string; rank: number };
const indexes = new WeakMap<IndiaCity[], Entry[]>();
function entries(cities: IndiaCity[]) {
  let result = indexes.get(cities);
  if (!result) {
    result = cities.map(city => {
      const name = citySearchKey(city[0]), state = citySearchKey(city[1]), names = aliases.find(group => group.includes(name)) ?? [name];
      return { city, name, names, key: `${names.join(" ")} ${state}`, rank: preferred.get(`${name}|${state}`) ?? 100000 };
    });
    indexes.set(cities, result);
  }
  return result;
}
export function searchIndiaCities(cities: IndiaCity[], input: string, limit = 40) {
  const query = citySearchKey(input), words = query.split(" ").filter(Boolean);
  const matches = entries(cities).filter(entry => words.every(word => entry.key.includes(word)));
  const score = (entry: Entry) => !query || entry.names.includes(query) ? 0 : entry.names.some(name => name.startsWith(query)) ? 1 : 2;
  matches.sort((a, b) => score(a) - score(b) || a.rank - b.rank || collator.compare(a.city[0], b.city[0]) || collator.compare(a.city[1], b.city[1]) || a.city[2] - b.city[2]);
  return { total: matches.length, options: matches.slice(0, Math.max(0, Number.isFinite(limit) ? Math.trunc(limit) : 40)).map(entry => entry.city) };
}
