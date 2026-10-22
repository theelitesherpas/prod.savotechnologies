/** Rebuild the separately licensed city directory. Optional local source path avoids a network request. */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
const commit = "7795d77d6a801543b9bb90d97a182c885f44c458";
const source = `https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/${commit}/json/countries+states+cities.json`;
const raw = process.argv[2] ? await readFile(process.argv[2], "utf8") : await (await fetch(source)).text();
const india = JSON.parse(raw).find(country => country.iso2 === "IN");
if (!india || india.states.length !== 36) throw Error("Expected an India directory with 36 states/territories");
const rows = india.states.flatMap(state => state.cities.map(city => [city.name, state.name, city.id]));
const cities = [...new Map(rows.map(row => [`${row[0]}\0${row[1]}`, row])).values()].sort((a, b) => a[0].localeCompare(b[0], "en-IN") || a[1].localeCompare(b[1], "en-IN"));
if (cities.length < 4000) throw Error("Unexpectedly incomplete directory");
await mkdir("public/data", { recursive: true });
await writeFile("public/data/india-cities.json", JSON.stringify({ source, sourceCommit: commit, sourceSha256: createHash("sha256").update(raw).digest("hex"), license: "ODbL-1.0", licenseUrl: "https://opendatacommons.org/licenses/odbl/1-0/", description: "India city/town extract; not a complete register of every Indian settlement. Manual entry is supported.", count: cities.length, cities }) + "\n");
console.log(`Wrote ${cities.length} city/town entries from all 36 states/territories.`);
