import { permanentRedirect } from "next/navigation";

/** Preserve existing project-type, campaign and attribution query parameters. */
export default async function LegacyStartPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const parameters = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) {
      parameters.append(key, item);
    }
  }
  const query = parameters.toString();
  permanentRedirect(`/start-a-project${query ? `?${query}` : ""}`);
}
