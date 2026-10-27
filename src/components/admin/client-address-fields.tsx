import type { ClientAddress } from "@/lib/client-address";

export function ClientAddressFields({ address = {} }: { address?: ClientAddress }) {
  const fields = [
    ["addressLine1", "Street address", 200, "address-line1"],
    ["addressLine2", "Apartment, suite or unit", 200, "address-line2"],
    ["city", "City", 100, "address-level2"],
    ["region", "State / region", 100, "address-level1"],
    ["postalCode", "Postal / ZIP code", 32, "postal-code"],
    ["country", "Country", 100, "country-name"],
  ] as const;
  return <fieldset className="min-w-0 sm:col-span-2">
    <legend className="adm-label mb-1.5">Billing address (optional)</legend>
    <p className="mb-4 text-xs leading-relaxed text-muted">Shown under “Bill to” on the client’s invoices when provided. Every field is optional.</p>
    <div className="grid gap-5 sm:grid-cols-2">{fields.map(([name, label, maxLength, autoComplete]) => <div key={name} className={name === "addressLine1" || name === "addressLine2" ? "sm:col-span-2" : undefined}>
      <label className="adm-label mb-1.5 block" htmlFor={`cl-${name}`}>{label}</label>
      <input id={`cl-${name}`} name={name} maxLength={maxLength} defaultValue={address[name] ?? ""} autoComplete={autoComplete} className="adm-input w-full"/>
    </div>)}</div>
  </fieldset>;
}
