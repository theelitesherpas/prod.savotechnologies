"use client";

/**
 * Case-study editor — the complete dossier form for /admin/case-studies.
 *
 * Sections (in order, matching the public detail page):
 *   1. Publishing   — lifecycle, order, featured
 *   2. Identity      — title, discipline, client, industry, meta
 *   3. Project Images — showcase/cardWide/card with crop studio
 *   4. Gallery       — multi-image upload with auto-compression
 *   5. Content       — summary, challenge, solution
 *   6. Capabilities  — services multi-select
 *   7. Tech Stack    — curated selectable chips + custom add
 *   8. Integrations  — curated selectable chips + custom add
 *   9. Key Features  — title + description repeater
 *  10. Outcomes      — metrics repeater (value/label/verified)
 *  11. Palette       — color swatches
 *  12. Testimonial   — quote, name, role
 *
 * All fields are mandatory except liveUrl, gallery, palette and
 * testimonial. Validation errors display on submit with inline
 * messages and auto-scroll to the first error.
 */

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { FormGuard, type GuardProblem } from "@/components/admin/form-guard";
import type { CaseStudyRecord } from "@/lib/case-study-schema";
import { CASE_DISCIPLINES } from "@/constants/case-studies";
import { SubmitButton } from "./form";
import { ImageCropField, type AttachedImage } from "./image-crop-field";
import { GalleryUploader } from "./gallery-uploader";
import { CASE_IMAGE_SLOTS, resolveCaseImages, type SlotKey } from "@/lib/case-study-schema";
import {
  TECH_STACK_OPTIONS,
  INTEGRATION_OPTIONS,
  BUSINESS_MODELS,
  PLATFORM_OPTIONS,
} from "@/constants/tech-stack";

const secondaryBtn =
  "inline-flex h-10 items-center justify-center rounded-lg border border-border px-5 text-[0.875rem] font-medium text-foreground transition-colors hover:border-foreground/40 disabled:pointer-events-none disabled:opacity-60";
const chipBtn = "t-caption rounded-full border px-3 py-1.5 transition-colors cursor-pointer";
const input = "adm-input w-full";
const label = "adm-label block mb-1.5";
const errorText = "mt-1.5 text-[0.75rem] font-medium text-error";
const sectionCard = "adm-card space-y-5 p-5";
const sectionTitle = "adm-label text-[0.875rem] font-bold text-foreground";

const ALL_CAPABILITIES = Array.from(new Set(CASE_DISCIPLINES.flatMap((d) => [...d.capabilities]))).sort();

const LIFECYCLE = [
  { value: "draft", label: "Draft" },
  { value: "demo", label: "Demo" },
  { value: "review", label: "Review" },
  { value: "verified", label: "Verified" },
  { value: "published", label: "Published" },
] as const;

type Result = CaseStudyRecord["results"][number];
type Swatch = CaseStudyRecord["palette"][number];
type Feature = { title: string; text: string };

// ─── Reusable form pieces ─────────────────────────────────────

function Field({ id, label: lbl, required, error, children, hint }: {
  id: string; label: string; required?: boolean; error?: string; children: ReactNode; hint?: string;
}) {
  return (
    <div>
      <label className={cn(label, error && "text-error")} htmlFor={id}>
        {lbl} {required ? <span className="text-error">*</span> : null}
      </label>
      {children}
      {hint && !error ? <p className="t-caption mt-1 text-muted">{hint}</p> : null}
      {error ? <p className={errorText} id={`${id}-error`}>{error}</p> : null}
    </div>
  );
}

function ChipSelector({
  options,
  selected,
  onToggle,
  categories,
  error,
  placeholder,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  categories?: { category: string; items: string[] }[];
  error?: string;
  placeholder?: string;
}) {
  const [custom, setCustom] = useState("");
  const [showAll, setShowAll] = useState(false);

  const addCustom = () => {
    const v = custom.trim();
    if (v && !options.includes(v) && !selected.includes(v)) {
      onToggle(v);
      setCustom("");
    }
  };

  const visibleOptions = showAll ? options : options.slice(0, 24);

  return (
    <div className={cn("space-y-3", error && "rounded-lg border border-error/40 p-3")}>
      {categories && !showAll ? (
        <div className="space-y-2">
          {categories.slice(0, 4).map((cat) => (
            <div key={cat.category}>
              <p className="t-caption mb-1.5 font-semibold text-muted">{cat.category}</p>
              <div className="flex flex-wrap gap-1.5">
                {cat.items.slice(0, 6).map((item) => (
                  <button
                    key={item} type="button" aria-pressed={selected.includes(item)}
                    onClick={() => onToggle(item)}
                    className={cn(chipBtn,
                      selected.includes(item)
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-muted hover:border-foreground/40",
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button type="button" onClick={() => setShowAll(true)} className="t-caption font-semibold text-accent hover:underline">
            Show all {options.length} options →
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {visibleOptions.map((item) => (
            <button
              key={item} type="button" aria-pressed={selected.includes(item)}
              onClick={() => onToggle(item)}
              className={cn(chipBtn,
                selected.includes(item)
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted hover:border-foreground/40",
              )}
            >
              {item}
            </button>
          ))}
          {!showAll && options.length > 24 ? (
            <button type="button" onClick={() => setShowAll(true)} className="t-caption font-semibold text-accent">
              +{options.length - 24} more
            </button>
          ) : null}
        </div>
      )}

      {/* Selected chips with remove */}
      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 border-t border-border pt-3">
          {selected.map((s) => (
            <span key={s} className="t-caption flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-accent">
              {s}
              <button type="button" aria-label={`Remove ${s}`} onClick={() => onToggle(s)} className="hover:text-error">×</button>
            </span>
          ))}
        </div>
      ) : null}

      {/* Custom input */}
      <div className="flex gap-2">
        <input
          className={cn(input, "h-9 flex-1")} value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
          placeholder={placeholder ?? "Add custom + press Enter"}
          maxLength={80}
          aria-label="Add custom option"
        />
        <button type="button" onClick={addCustom} className={cn(secondaryBtn, "h-9 px-3 text-[0.8125rem]")}>Add</button>
      </div>
      {error ? <p className={errorText}>{error}</p> : null}
    </div>
  );
}

// ─── Main form ─────────────────────────────────────────────────

export function CaseStudyForm({
  action,
  item,
}: {
  action: (formData: FormData) => Promise<void>;
  item?: { id: string; slug: string; contentStatus: string; order?: number; record?: CaseStudyRecord };
}) {
  const r = item?.record;

  // Publishing
  const [contentStatus, setContentStatus] = useState(item?.contentStatus ?? "draft");
  const [order, setOrder] = useState(String(item?.order ?? 0));
  const [featured, setFeatured] = useState(r?.featured ?? false);

  // Identity
  const [title, setTitle] = useState(r?.title ?? "");
  const [discipline, setDiscipline] = useState<CaseStudyRecord["discipline"]>(r?.discipline ?? "web");
  const [clientName, setClientName] = useState(r?.clientName ?? "");
  const [displayClientName, setDisplayClientName] = useState(r?.displayClientName ?? "");
  const [industry, setIndustry] = useState(r?.industry ?? "");
  const [clientLocation, setClientLocation] = useState(r?.clientLocation ?? "");
  const [businessModel, setBusinessModel] = useState(r?.businessModel ?? "");
  const [platforms, setPlatforms] = useState(r?.platforms ?? "");
  const [year, setYear] = useState(r?.year ?? "");
  const [duration, setDuration] = useState(r?.duration ?? "");
  const [teamSize, setTeamSize] = useState(r?.teamSize ?? "");
  const [liveUrl, setLiveUrl] = useState(r?.liveUrl ?? "");
  const [authorName, setAuthorName] = useState(r?.authorName ?? "");

  // Images
  const legacyHero = r?.heroImage ?? null;
  const [images, setImages] = useState<Record<SlotKey, AttachedImage | null>>({
    showcase: r?.images?.showcase ?? legacyHero ?? null,
    cardWide: r?.images?.cardWide ?? null,
    card: r?.images?.card ?? null,
  });
  const [gallery, setGallery] = useState<AttachedImage[]>(r?.gallery ?? []);

  // Content
  const [summary, setSummary] = useState(r?.summary ?? "");
  const [challenge, setChallenge] = useState(r?.challenge ?? "");
  const [solution, setSolution] = useState(r?.solution ?? "");

  // Capabilities & stack
  const [services, setServices] = useState<string[]>(r?.services ?? []);
  const [technologies, setTechnologies] = useState<string[]>(r?.technologies ?? []);
  const [integrations, setIntegrations] = useState<string[]>(r?.integrations ?? []);

  // Features & outcomes
  const [keyFeatures, setKeyFeatures] = useState<Feature[]>(r?.keyFeatures ?? []);
  const [results, setResults] = useState<Result[]>(r?.results ?? []);
  const [palette, setPalette] = useState<Swatch[]>(r?.palette ?? []);

  // Testimonial
  const [hasTestimonial, setHasTestimonial] = useState(Boolean(r?.testimonial));
  const [tQuote, setTQuote] = useState(r?.testimonial?.quote ?? "");
  const [tName, setTName] = useState(r?.testimonial?.name ?? "");
  const [tRole, setTRole] = useState(r?.testimonial?.role ?? "");

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ─── Payload ───
  const filledResults = results.filter((r) => r.value.trim() !== "" || r.label.trim() !== "");
  const filledPalette = palette.filter((p) => p.name.trim() !== "" || p.hex !== "#14161c");
  const filledFeatures = keyFeatures.filter((f) => f.title.trim() !== "");

  const payload = JSON.stringify({
    title: title.trim(),
    clientName, displayClientName, discipline, industry,
    clientLocation, businessModel, platforms,
    summary, challenge, solution,
    services, technologies,
    integrations: integrations.filter(Boolean),
    keyFeatures: filledFeatures.map((f) => ({ title: f.title.trim(), text: f.text.trim() })),
    results: filledResults.map((r) => ({ value: r.value.trim(), label: r.label.trim(), verified: r.verified })),
    palette: filledPalette.map((p) => ({ name: p.name.trim(), hex: p.hex })),
    year, duration, teamSize,
    testimonial: hasTestimonial && tQuote && tName && tRole ? { quote: tQuote, name: tName, role: tRole } : null,
    images: { showcase: images.showcase, cardWide: images.cardWide, card: images.card },
    gallery: gallery.map((g) => ({ dataUrl: g.dataUrl, width: g.width, height: g.height, alt: g.alt })),
    featured,
    liveUrl: liveUrl.trim() || null,
    authorName,
    status: contentStatus === "published" ? "verified" : "demo",
  });

  // ─── Validation ───
  const validateForm = (): GuardProblem[] => {
    const errs: Record<string, string> = {};

    if (title.trim().length < 2) errs.title = "Project title is required (min 2 characters).";
    if (industry.trim().length < 2) errs.industry = "Industry / engagement line is required.";
    if (year.trim().length < 2) errs.year = "Year is required.";
    if (duration.trim().length < 1) errs.duration = "Duration is required.";
    if (teamSize.trim().length < 1) errs.teamSize = "Team size is required.";
    if (summary.trim().length < 10) errs.summary = "Summary is required (min 10 characters).";
    if (challenge.trim().length < 20) errs.challenge = "Challenge is required (min 20 characters).";
    if (solution.trim().length < 20) errs.solution = "Solution is required (min 20 characters).";
    if (services.length === 0) errs.services = "Select at least 1 service capability.";
    if (technologies.length === 0) errs.technologies = "Select at least 1 technology.";
    if (filledFeatures.length === 0) errs.keyFeatures = "Add at least 1 key feature.";
    // Results section removed — metrics not required
    if (liveUrl.trim() && !/^https?:\/\/.+\..+/.test(liveUrl.trim())) errs.liveUrl = "Enter a valid URL (https://example.com) or leave empty.";
    if (hasTestimonial) {
      if (tQuote.trim().length < 10) errs.tQuote = "Quote is required (min 10 characters).";
      if (tName.trim().length < 2) errs.tName = "Client name is required.";
      if (tRole.trim().length < 2) errs.tRole = "Client role is required.";
    }

    // Also check images (server-side zod will reject oversized data URLs)
    if (images.showcase && images.showcase.dataUrl.length > 3_900_000) {
      errs.showcase = "Showcase image is too large after compression — try a simpler photo.";
    }
    if (images.cardWide && images.cardWide.dataUrl.length > 3_900_000) {
      errs.cardWide = "Featured card image is too large — try a simpler photo.";
    }
    gallery.forEach((g, i) => {
      if (g.dataUrl.length > 3_900_000) {
        errs[`gallery-${i}`] = `Gallery image ${i + 1} is too large.`;
      }
    });

    setErrors(errs);

    const problems: GuardProblem[] = Object.entries(errs).map(([field, message]) => ({
      anchor: `cs-${field.replace(/([A-Z])/g, "-$1").toLowerCase()}`,
      message,
    }));

    // Auto-scroll to first error
    if (problems.length > 0) {
      setTimeout(() => {
        const el = document.getElementById(problems[0].anchor);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        el?.focus({ preventScroll: true });
      }, 100);
    }

    return problems;
  };

  const toggle = (list: string[], set: (v: string[]) => void, value: string) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const disciplineCaps = useMemo(
    () => CASE_DISCIPLINES.find((d) => d.id === discipline)?.capabilities ?? [],
    [discipline],
  );

  return (
    <FormGuard action={action} className="max-w-4xl space-y-6" validate={validateForm}>
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      {item ? <input type="hidden" name="slug" value={item.slug} /> : null}
      <input type="hidden" name="payload" value={payload} />
      <input type="hidden" name="contentStatus" value={contentStatus} />
      <input type="hidden" name="order" value={Number.isFinite(Number(order)) ? Math.min(9999, Math.max(0, Math.trunc(Number(order)))) : 0} />

      {/* ═══ 1. PUBLISHING ═══ */}
      <div className="adm-card flex flex-wrap items-center gap-x-8 gap-y-4 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="adm-label">Lifecycle</span>
          <select aria-label="Content lifecycle" value={contentStatus}
            onChange={(e) => setContentStatus(e.target.value)} className="adm-select h-9 py-1">
            {LIFECYCLE.map((l) => (<option key={l.value} value={l.value}>{l.label}</option>))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <label className="adm-label" htmlFor="cs-order">Order</label>
          <input id="cs-order" className="adm-input h-9 w-20 py-1 tnum" type="number" min={0} max={9999} step={1}
            value={order} onChange={(e) => setOrder(e.target.value)}
            title="Homepage + discipline ordering — lower numbers first" />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-[0.875rem] font-medium text-foreground">
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
          Featured on homepage
        </label>
        <p className="t-caption ml-auto text-muted">Only <strong>Published</strong> records render publicly.</p>
      </div>

      {/* ═══ 2. IDENTITY ═══ */}
      <div className={sectionCard}>
        <p className={sectionTitle}>1 · Identity & Project Info</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="cs-title" label="Project title" required error={errors.title}>
            <input id="cs-title" className={cn(input, errors.title && "border-error/50")} value={title}
              onChange={(e) => setTitle(e.target.value)} placeholder="Fresh Art Club" required maxLength={120} />
          </Field>
          <Field id="cs-discipline" label="Service type (discipline)" required>
            <select id="cs-discipline" className="adm-select w-full" value={discipline}
              onChange={(e) => setDiscipline(e.target.value as CaseStudyRecord["discipline"])}>
              {CASE_DISCIPLINES.map((d) => (<option key={d.id} value={d.id}>{d.title}</option>))}
            </select>
          </Field>
          <Field id="cs-client" label="Client name (internal)" hint="Not shown publicly — for your reference">
            <input id="cs-client" className={input} value={clientName} onChange={(e) => setClientName(e.target.value)}
              placeholder="Acme Trading Pvt Ltd" maxLength={120} />
          </Field>
          <Field id="cs-display" label="Display name (public)" hint="Shown on the page — leave empty to use the title">
            <input id="cs-display" className={input} value={displayClientName} onChange={(e) => setDisplayClientName(e.target.value)}
              placeholder="Acme (or leave empty)" maxLength={120} />
          </Field>
          <Field id="cs-industry" label="Industry / engagement line" required error={errors.industry}>
            <input id="cs-industry" className={cn(input, errors.industry && "border-error/50")} value={industry}
              onChange={(e) => setIndustry(e.target.value)} placeholder="Ecommerce · Web Platform · Product Engineering" required maxLength={160} />
          </Field>
          <Field id="cs-location" label="Client location" hint="e.g. Indore, India or Dubai, UAE">
            <input id="cs-location" className={input} value={clientLocation} onChange={(e) => setClientLocation(e.target.value)}
              placeholder="Indore, India" maxLength={120} />
          </Field>
          <Field id="cs-bizmodel" label="Business model">
            <select id="cs-bizmodel" className="adm-select w-full" value={businessModel} onChange={(e) => setBusinessModel(e.target.value)}>
              <option value="">— Select —</option>
              {BUSINESS_MODELS.map((m) => (<option key={m} value={m}>{m}</option>))}
            </select>
          </Field>
          <Field id="cs-platforms" label="Platforms">
            <select id="cs-platforms" className="adm-select w-full" value={platforms} onChange={(e) => setPlatforms(e.target.value)}>
              <option value="">— Select —</option>
              {PLATFORM_OPTIONS.map((p) => (<option key={p} value={p}>{p}</option>))}
            </select>
          </Field>
          <Field id="cs-year" label="Year" required error={errors.year}>
            <input id="cs-year" className={cn(input, errors.year && "border-error/50")} value={year}
              onChange={(e) => setYear(e.target.value)} placeholder="2025" required maxLength={20} />
          </Field>
          <Field id="cs-duration" label="Duration" required error={errors.duration}>
            <input id="cs-duration" className={cn(input, errors.duration && "border-error/50")} value={duration}
              onChange={(e) => setDuration(e.target.value)} placeholder="16 weeks" required maxLength={60} />
          </Field>
          <Field id="cs-team" label="Team size" required error={errors.teamSize}>
            <input id="cs-team" className={cn(input, errors.teamSize && "border-error/50")} value={teamSize}
              onChange={(e) => setTeamSize(e.target.value)} placeholder="5 specialists" required maxLength={60} />
          </Field>
          <Field id="cs-live" label="Live project URL" hint="Optional — shows as 'View Live' button. Leave empty if not public." error={errors.liveUrl}>
            <input id="cs-live" className={cn(input, errors.liveUrl && "border-error/50")} type="url" value={liveUrl}
              onChange={(e) => setLiveUrl(e.target.value)} placeholder="https://example.com" maxLength={500} />
          </Field>
        </div>
      </div>

      {/* ═══ 3. PROJECT IMAGES ═══ */}
      <div className={sectionCard}>
        <p className={sectionTitle}>2 · Project Images</p>
        <p className="t-caption text-muted">
          Each image is cropped to exact dimensions and auto-compressed. Upload once —
          the crop tool ensures consistency across all surfaces.
        </p>
        <div className="space-y-6">
          {(Object.keys(CASE_IMAGE_SLOTS) as SlotKey[]).map((slot) => (
            <div key={slot}>
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <p className="adm-label">
                  {CASE_IMAGE_SLOTS[slot].label}
                   <span className="text-error">*</span>
                </p>
                <p className="t-caption tnum text-muted">
                  {CASE_IMAGE_SLOTS[slot].width} × {CASE_IMAGE_SLOTS[slot].height}px · max 4MB · {CASE_IMAGE_SLOTS[slot].hint}
                </p>
              </div>
              <ImageCropField
                label=""
                hint=""
                targetWidth={CASE_IMAGE_SLOTS[slot].width}
                targetHeight={CASE_IMAGE_SLOTS[slot].height}
                value={images[slot]}
                onChange={(next) => setImages((prev) => ({ ...prev, [slot]: next }))}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ═══ 4. GALLERY ═══ */}
      <div className={sectionCard}>
        <p className={sectionTitle}>3 · Project Gallery</p>
        <p className="t-caption text-muted">
          Additional screenshots and detail views (optional). Up to 8 images,
          auto-resized to 1600px and compressed. Displayed as a swipeable carousel.
        </p>
        <GalleryUploader images={gallery} onChange={setGallery} />
      </div>

      {/* ═══ 5. CONTENT ═══ */}
      <div className={sectionCard}>
        <p className={sectionTitle}>4 · The Story</p>
        <Field id="cs-summary" label="Summary" required error={errors.summary}
          hint="One-paragraph overview shown on the hero and cards (max 600 chars)">
          <textarea id="cs-summary" className={cn(input, "min-h-20 resize-y", errors.summary && "border-error/50")}
            value={summary} onChange={(e) => setSummary(e.target.value)} required maxLength={600}
            placeholder="A modern commerce platform designed around faster product discovery…" />
        </Field>
        <Field id="cs-challenge" label="The challenge" required error={errors.challenge}
          hint="What problem was the client facing? (max 4000 chars)">
          <textarea id="cs-challenge" className={cn(input, "min-h-28 resize-y", errors.challenge && "border-error/50")}
            value={challenge} onChange={(e) => setChallenge(e.target.value)} required maxLength={4000}
            placeholder="The business problem, in plain words." />
        </Field>
        <Field id="cs-solution" label="The solution — what we built" required error={errors.solution}
          hint="Approach, architecture, how it shipped (max 4000 chars)">
          <textarea id="cs-solution" className={cn(input, "min-h-28 resize-y", errors.solution && "border-error/50")}
            value={solution} onChange={(e) => setSolution(e.target.value)} required maxLength={4000}
            placeholder="Approach, architecture and how it was delivered." />
        </Field>
      </div>

      {/* ═══ 6. CAPABILITIES ═══ */}
      <div className={sectionCard}>
        <p className={sectionTitle}>5 · Service Capabilities</p>
        <p className={errors.services ? errorText : "t-caption text-muted"}>
          {errors.services ?? "Select at least 1 — chips for this discipline first, all disciplines available."}
        </p>
        <div className={cn("flex flex-wrap gap-2 rounded-lg border p-3", errors.services ? "border-error/40" : "border-border")}>
          {disciplineCaps.map((cap) => (
            <button key={cap} type="button" aria-pressed={services.includes(cap)}
              onClick={() => toggle(services, setServices, cap)}
              className={cn(chipBtn,
                services.includes(cap) ? "border-foreground bg-foreground text-background" : "border-border text-foreground/80 hover:border-foreground/40",
              )}>
              {cap}
            </button>
          ))}
        </div>
        <details className="mt-2">
          <summary className="t-caption cursor-pointer text-muted hover:text-foreground">Show all capabilities ({ALL_CAPABILITIES.length})</summary>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ALL_CAPABILITIES.filter((c) => !disciplineCaps.includes(c)).map((cap) => (
              <button key={cap} type="button" aria-pressed={services.includes(cap)}
                onClick={() => toggle(services, setServices, cap)}
                className={cn(chipBtn,
                  services.includes(cap) ? "border-foreground bg-foreground text-background" : "border-border/60 text-muted hover:border-foreground/30",
                )}>
                {cap}
              </button>
            ))}
          </div>
        </details>
      </div>

      {/* ═══ 7. TECH STACK ═══ */}
      <div className={sectionCard}>
        <p className={sectionTitle}>6 · Technology Stack</p>
        <p className={errors.technologies ? errorText : "t-caption text-muted"}>
          {errors.technologies ?? "Select from popular options — or add a custom technology."}
        </p>
        <ChipSelector
          options={TECH_STACK_OPTIONS.flatMap((g) => g.items).sort()}
          categories={TECH_STACK_OPTIONS}
          selected={technologies}
          onToggle={(v) => toggle(technologies, setTechnologies, v)}
          error={errors.technologies}
          placeholder="Add custom technology + Enter"
        />
      </div>

      {/* ═══ 8. INTEGRATIONS ═══ */}
      <div className={sectionCard}>
        <p className={sectionTitle}>7 · Integrations <span className="text-muted font-normal">(optional)</span></p>
        <p className="t-caption text-muted">Third-party services — payments, email, maps, analytics, etc.</p>
        <ChipSelector
          options={INTEGRATION_OPTIONS}
          selected={integrations}
          onToggle={(v) => toggle(integrations, setIntegrations, v)}
          placeholder="Add integration + Enter"
        />
      </div>

      {/* ═══ 9. KEY FEATURES (max 3) ═══ */}
      <div className={sectionCard}>
        <div className="flex items-center justify-between">
          <p className={sectionTitle}>8 · Key Features <span className="text-error">*</span></p>
          <button type="button"
            onClick={() => keyFeatures.length < 3 && setKeyFeatures([...keyFeatures, { title: "", text: "" }])}
            disabled={keyFeatures.length >= 3}
            className={cn(secondaryBtn, "h-9 px-3 text-[0.8125rem]")}
            title={keyFeatures.length >= 3 ? "Maximum 3 features" : "Add a feature card"}>
            + Add feature ({keyFeatures.length}/3)
          </button>
        </div>
        <div className="rounded-lg border border-border bg-surface-2/40 px-4 py-3">
          <p className="t-sm text-muted">
            <strong>What is this?</strong> These are the 3 most notable capabilities you delivered —
            like "Real-time order tracking" or "AI-powered recommendations". Each gets an animated
            infographic icon, a bold title, and a one-line description on the public detail page.
            Think of them as the highlights a potential client would ask about first.
          </p>
        </div>
        <p className={errors.keyFeatures ? errorText : "t-caption text-muted"}>
          {errors.keyFeatures ?? `Add 1–3 features. Each shows as an animated card on the detail page (${keyFeatures.length}/3 added).`}
        </p>
        <div className={cn("space-y-2 rounded-lg border p-3", errors.keyFeatures && "border-error/40")}>
          {keyFeatures.length === 0 ? (
            <p className="t-caption text-center text-muted/60 py-3">No features yet — e.g. "Real-time tracking: Live GPS map of deliveries."</p>
          ) : null}
          {keyFeatures.map((f, i) => (
            <div key={i} className="grid grid-cols-[1fr_2fr_auto] items-start gap-2">
              <input className={input} value={f.title}
                onChange={(e) => setKeyFeatures(keyFeatures.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
                placeholder="Feature name" maxLength={80} aria-label={`Feature ${i + 1} name`} />
              <input className={input} value={f.text}
                onChange={(e) => setKeyFeatures(keyFeatures.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))}
                placeholder="What it does" maxLength={300} aria-label={`Feature ${i + 1} description`} />
              <button type="button" aria-label={`Remove feature ${i + 1}`}
                onClick={() => setKeyFeatures(keyFeatures.filter((_, j) => j !== i))}
                className="px-2 py-2.5 text-muted hover:text-error">×</button>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ 11. PALETTE ═══ */}
      <div className={sectionCard}>
        <div className="flex items-center justify-between">
          <p className={sectionTitle}>9 · Project Palette <span className="text-muted font-normal">(optional)</span></p>
          <button type="button"
            onClick={() => palette.length < 8 && setPalette([...palette, { name: "", hex: "#14161c" }])}
            className={cn(secondaryBtn, "h-9 px-3 text-[0.8125rem]")}>
            + Add color
          </button>
        </div>
        <p className="t-caption text-muted">The color system shown as swatches on the detail page.</p>
        <div className="space-y-2">
          {palette.length === 0 ? <p className="t-caption text-center text-muted/60 py-3">No colors added.</p> : null}
          {palette.map((sw, i) => (
            <div key={i} className="grid grid-cols-[3rem_1fr_9rem_auto] items-center gap-2">
              <input type="color" value={sw.hex}
                onChange={(e) => setPalette(palette.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)))}
                aria-label={`Color ${i + 1} picker`} className="h-9 w-full cursor-pointer rounded-[2px] border border-border bg-transparent p-1" />
              <input className={input} value={sw.name}
                onChange={(e) => setPalette(palette.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                placeholder="Ink" aria-label={`Color ${i + 1} name`} maxLength={60} />
              <input id={`cs-palette-${i}`} className={cn(input, "tnum")} value={sw.hex}
                onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && setPalette(palette.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)))}
                placeholder="#14161C" aria-label={`Color ${i + 1} hex`} />
              <button type="button" aria-label={`Remove color ${i + 1}`}
                onClick={() => setPalette(palette.filter((_, j) => j !== i))}
                className="px-2 text-muted hover:text-error">×</button>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ 12. TESTIMONIAL ═══ */}
      <div className={sectionCard}>
        <p className={sectionTitle}>10 · Client Testimonial <span className="text-muted font-normal">(optional)</span></p>
        <label className="flex cursor-pointer items-center gap-2 text-[0.875rem] font-medium text-foreground">
          <input type="checkbox" checked={hasTestimonial}
            onChange={(e) => setHasTestimonial(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
          Include a testimonial
        </label>
        {hasTestimonial ? (
          <div className="space-y-4">
            <Field id="cs-tq" label="Quote" required error={errors.tQuote}>
              <textarea id="cs-tq" className={cn(input, "min-h-24 resize-y", errors.tQuote && "border-error/50")}
                value={tQuote} onChange={(e) => setTQuote(e.target.value)} maxLength={1200}
                placeholder="Approved client quote — never an invented endorsement." />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="cs-tn" label="Name" required error={errors.tName}>
                <input id="cs-tn" className={cn(input, errors.tName && "border-error/50")} value={tName}
                  onChange={(e) => setTName(e.target.value)} maxLength={120} placeholder="Client Name" />
              </Field>
              <Field id="cs-tr" label="Role · Company" required error={errors.tRole}>
                <input id="cs-tr" className={cn(input, errors.tRole && "border-error/50")} value={tRole}
                  onChange={(e) => setTRole(e.target.value)} maxLength={160} placeholder="COO · Acme Trading" />
              </Field>
            </div>
          </div>
        ) : null}
      </div>

      {/* ═══ SUBMIT ═══ */}
      <div className="flex items-center gap-3 pt-2">
        <SubmitButton label={item ? "Save changes" : "Create case study"} pendingLabel="Saving…" />
        <Link href="/admin/case-studies" className={secondaryBtn}>Cancel</Link>
      </div>
    </FormGuard>
  );
}
