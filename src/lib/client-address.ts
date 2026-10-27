import { z } from "zod";

export const CLIENT_ADDRESS_FIELDS = ["addressLine1", "addressLine2", "city", "region", "postalCode", "country"] as const;
export const clientAddressSchema = z.object({
  addressLine1: z.string().trim().max(200).default(""),
  addressLine2: z.string().trim().max(200).default(""),
  city: z.string().trim().max(100).default(""),
  region: z.string().trim().max(100).default(""),
  postalCode: z.string().trim().max(32).default(""),
  country: z.string().trim().max(100).default(""),
});
export type ClientAddress = Partial<z.infer<typeof clientAddressSchema>>;
export function clientAddressInput(form: FormData) {
  return Object.fromEntries(CLIENT_ADDRESS_FIELDS.map(field => [field, form.get(field) ?? ""]));
}
export function clientAddressLines(address: ClientAddress): string[] {
  const clean = (value?: string) => value?.replace(/[\r\n\t]+/g, " ").trim() ?? "";
  const locality = [clean(address.city), clean(address.region)].filter(Boolean).join(", ");
  return [clean(address.addressLine1), clean(address.addressLine2), [locality, clean(address.postalCode)].filter(Boolean).join(" "), clean(address.country)].filter(Boolean);
}
