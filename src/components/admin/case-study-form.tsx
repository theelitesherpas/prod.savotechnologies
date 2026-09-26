"use client";

/**
 * Case-study editor - the complete dossier form for /admin/case-studies.
 *
 * Rich fields the generic registry form can't express: discipline-scoped
 * capability multiselector, tech-stack tag input, outcome repeater
 * (value/label/verified), project palette repeater with color pickers and
 * a testimonial block. State is serialized to one JSON payload validated
 * server-side by the shared caseStudySchema.
 */

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { FormGuard, type GuardProblem } from "@/components/admin/form-guard";
import type { CaseStudyRecord } from "@/lib/case-study-schema";
import { CASE_DISCIPLINES } from "@/constants/case-studies";
import { SubmitButton } from "./form";
import { ProjectMockup } from "@/components/shared/project-mockup";
import { ImageCropField, type AttachedImage } from "./image-crop-field";
import { CASE_IMAGE_SLOTS, resolveCaseImages, type SlotKey } from "@/lib/case-study-schema";

const secondaryBtn =
  "inline-flex h-10 items-center justify-center rounded-lg border border-border px-5 text-[0.875rem] font-medium text-foreground transition-colors hover:border-foreground/40 disabled:pointer-events-none disabled:opacity-60";
const chipBtn =
  "t-caption rounded-[2px] border px-3 py-1.5 transition-colors";

const ALL_CAPABILITIES = Array.from(
  new Set(CASE_DISCIPLINES.flatMap((d) => [...d.capabilities])),
).sort();

const LIFECYCLE = [
  { value: "draft", label: "Draft" },
  { value: "demo", label: "Demo" },
  { value: "review", label: "Review" },
  { value: "verified", label: "Verified" },
  { value: "published", label: "Published" },
] as const;

type Result = CaseStudyRecord["results"][number];
type Swatch = CaseStudyRecord["palette"][number];

export function CaseStudyForm({
  action,
  item,
}: {
  action: (formData: FormData) => Promise<void>;
  item?: { id: string; slug: string; contentStatus: string; record?: CaseStudyRecord };
}) {
  const r = item?.record;

  const [title, setTitle] = useState(r?.title ?? "");
  const [clientName, setClientName] = useState(r?.clientName ?? "");
  const [displayClientName, setDisplayClientName] = useState(r?.displayClientName ?? "");
  const [discipline, setDiscipline] = useState<CaseStudyRecord["discipline"]>(r?.discipline ?? "web");
  const [industry, setIndustry] = useState(r?.industry ?? "");
  const [summary, setSummary] = useState(r?.summary ?? "");
  const [challenge, setChallenge] = useState(r?.challenge ?? "");
  const [solution, setSolution] = useState(r?.solution ?? "");
  const [services, setServices] = useState<string[]>(r?.services ?? []);
  const [technologies, setTechnologies] = useState<string[]>(r?.technologies ?? []);
  const [stackDraft, setStackDraft] = useState("");
  const [results, setResults] = useState<Result[]>(r?.results ?? []);
  const [palette, setPalette] = useState<Swatch[]>(r?.palette ?? []);
  const [year, setYear] = useState(r?.year ?? "");
  const [duration, setDuration] = useState(r?.duration ?? "");
  const [teamSize, setTeamSize] = useState(r?.teamSize ?? "");
  const [hasTestimonial, setHasTestimonial] = useState(Boolean(r?.testimonial));
  const [tQuote, setTQuote] = useState(r?.testimonial?.quote ?? "");
  const [tName, setTName] = useState(r?.testimonial?.name ?? "");
  const [tRole, setTRole] = useState(r?.testimonial?.role ?? "");
  const [featured, setFeatured] = useState(r?.featured ?? false);
  const legacyHero = r?.heroImage ?? null;
  const [images, setImages] = useState<Record<SlotKey, AttachedImage | null>>({
    showcase: r?.images?.showcase ?? legacyHero ?? null,
    cardWide: r?.images?.cardWide ?? null,
    card: r?.images?.card ?? null,
  });
  const [contentStatus, setContentStatus] = useState(item?.contentStatus ?? "draft");

  const disciplineCaps = useMemo(
    () => CASE_DISCIPLINES.find((d) => d.id === discipline)?.capabilities ?? [],
    [discipline],
  );
  const capsForDiscipline = useMemo(() => {
    const set = new Set([...disciplineCaps, ...ALL_CAPABILITIES]);
    return [...disciplineCaps, ...[...set].filter((c) => !disciplineCaps.includes(c))];
  }, [disciplineCaps]);

  const toggle = (list: string[], set: (v: string[]) => void, value: string) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const addStack = () => {
    const v = stackDraft.trim();
    if (v && !technologies.includes(v) && technologies.length < 20) setTechnologies([...technologies, v]);
    setStackDraft("");
  };

  // Drop repeater rows the user left completely empty - scaffolding rows
  // must never fail server validation.
  const filledResults = results.filter((r) => r.value.trim() !== "" || r.label.trim() !== "");
  const filledPalette = palette.filter((p) => p.name.trim() !== "" || p.hex !== "#14161c");

  const payload = JSON.stringify({
    title: title.trim(),
    clientName,
    displayClientName,
    discipline,
    industry,
    summary,
    challenge,
    solution,
    services,
    technologies,
    results: filledResults.map((r) => ({
      value: r.value.trim(),
      label: r.label.trim(),
      verified: r.verified,
    })),
    palette: filledPalette.map((p) => ({ name: p.name.trim(), hex: p.hex })),
    year,
    duration,
    teamSize,
    testimonial: hasTestimonial && tQuote && tName && tRole ? { quote: tQuote, name: tName, role: tRole } : null,
    images: {
      showcase: images.showcase,
      cardWide: images.cardWide,
      card: images.card,
    },
    featured,
    status: contentStatus === "published" ? "verified" : "demo",
  });

  // Client-side validation for FormGuard - the same rules that used to
  // fire a raw alert(), now styled inline with anchors per field.
  const validateForm = (): GuardProblem[] => {
    const problems: GuardProblem[] = [];
    // Title emptiness is covered by the native `required` on #cs-title.
    results.forEach((r, i) => {
      const hasV = r.value.trim() !== "";
      const hasL = r.label.trim() !== "";
      if (hasV !== hasL)
        problems.push({
          anchor: `cs-metric-${i}-${hasV ? "label" : "value"}`,
          message: `Metric “${hasV ? r.value : r.label}” needs both a value and a label (or clear both).`,
        });
    });
    palette.forEach((p, i) => {
      if (p.name.trim() !== "" && !/^#[0-9a-fA-F]{6}$/.test(p.hex))
        problems.push({ anchor: `cs-palette-${i}`, message: `Color “${p.name}” needs a valid hex value like #1F4EE8.` });
    });
    return problems;
  };

  const input = "adm-input w-full";
  const label = "adm-label block mb-1.5";

  return (
    <FormGuard action={action} className="max-w-4xl space-y-6" validate={validateForm}>
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      {item ? <input type="hidden" name="slug" value={item.slug} /> : null}
      <input type="hidden" name="payload" value={payload} />
      <input type="hidden" name="contentStatus" value={contentStatus} />

      {/* Publishing strip */}
      <div className="adm-card flex flex-wrap items-center gap-x-8 gap-y-4 px-4 py-3.5">
        <div className="flex items-center gap-3">
          <span className="adm-label">Lifecycle</span>
          <select
            aria-label="Content lifecycle"
            value={contentStatus}
            onChange={(e) => setContentStatus(e.target.value)}
            className="adm-select h-9 py-1"
          >
            {LIFECYCLE.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-[0.875rem] font-medium text-foreground">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          Featured in discipline
        </label>
        <p className="t-caption ml-auto text-muted">
          Only <strong>Published</strong> records render on the public site.
        </p>
      </div>

      {/* Live previews - every surface the images render on, with fallbacks */}
      <div className="adm-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="adm-label">Where these images appear (live preview)</p>
          <p className="t-caption text-muted">Empty slots fall back: card → featured → showcase → generated mockup</p>
        </div>
        <PreviewSurfaces images={images} discipline={discipline} palette={palette} title={title} />
      </div>

      {/* Image slots - one crop studio per surface */}
      <div className="adm-card space-y-8 p-5">
        <div>
          <p className="adm-label mb-1">Project images</p>
          <p className="t-caption text-muted">
            Upload separate images per surface when one photo does not fit all - each studio crops to that surface’s exact size.
          </p>
        </div>
        {(Object.keys(CASE_IMAGE_SLOTS) as SlotKey[]).map((slot) => (
          <ImageCropField
            key={slot}
            label={`${CASE_IMAGE_SLOTS[slot].label} - ${CASE_IMAGE_SLOTS[slot].width} × ${CASE_IMAGE_SLOTS[slot].height}`}
            hint={`${CASE_IMAGE_SLOTS[slot].where} · ${CASE_IMAGE_SLOTS[slot].hint}. If unset, falls back to a wider slot${slot === "showcase" ? " or the generated mockup" : ""}.`}
            targetWidth={CASE_IMAGE_SLOTS[slot].width}
            targetHeight={CASE_IMAGE_SLOTS[slot].height}
            value={images[slot]}
            onChange={(next) => setImages((prev) => ({ ...prev, [slot]: next }))}
          />
        ))}
      </div>

      {/* Identity */}
      <div className="adm-card space-y-5 p-5">
        <p className="adm-label">Identity</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="cs-title">Project title *</label>
            <input id="cs-title" className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Meridian Commerce" required maxLength={120} />
          </div>
          <div>
            <label className={label} htmlFor="cs-discipline">Service type (discipline) *</label>
            <select id="cs-discipline" className="adm-select w-full" value={discipline} onChange={(e) => setDiscipline(e.target.value as CaseStudyRecord["discipline"])}>
              {CASE_DISCIPLINES.map((d) => (
                <option key={d.id} value={d.id}>{d.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="cs-client">Client name (internal)</label>
            <input id="cs-client" className={input} value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Acme Trading Pvt Ltd" maxLength={120} />
          </div>
          <div>
            <label className={label} htmlFor="cs-display">Display name (public)</label>
            <input id="cs-display" className={input} value={displayClientName} onChange={(e) => setDisplayClientName(e.target.value)} placeholder="Acme (or leave empty to show the title)" maxLength={120} />
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="cs-industry">Industry / engagement line</label>
            <input id="cs-industry" className={input} value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Ecommerce · Web Platform · Product Engineering" maxLength={160} />
          </div>
          <div>
            <label className={label} htmlFor="cs-year">Year</label>
            <input id="cs-year" className={input} value={year} onChange={(e) => setYear(e.target.value)} placeholder="2026" maxLength={20} />
          </div>
          <div>
            <label className={label} htmlFor="cs-duration">Duration</label>
            <input id="cs-duration" className={input} value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="16 weeks" maxLength={60} />
          </div>
          <div>
            <label className={label} htmlFor="cs-team">Team size</label>
            <input id="cs-team" className={input} value={teamSize} onChange={(e) => setTeamSize(e.target.value)} placeholder="5 specialists" maxLength={60} />
          </div>
        </div>
      </div>

      {/* Dossier */}
      <div className="adm-card space-y-5 p-5">
        <p className="adm-label">Dossier</p>
        <div>
          <label className={label} htmlFor="cs-summary">Summary (card + hero lead)</label>
          <textarea id="cs-summary" className={cn(input, "min-h-20 resize-y")} value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={600} placeholder="A modern commerce platform designed around faster product discovery…" />
        </div>
        <div>
          <label className={label} htmlFor="cs-challenge">The challenge</label>
          <textarea id="cs-challenge" className={cn(input, "min-h-28 resize-y")} value={challenge} onChange={(e) => setChallenge(e.target.value)} maxLength={4000} placeholder="The business problem, in plain words." />
        </div>
        <div>
          <label className={label} htmlFor="cs-solution">The solution (what we built)</label>
          <textarea id="cs-solution" className={cn(input, "min-h-28 resize-y")} value={solution} onChange={(e) => setSolution(e.target.value)} maxLength={4000} placeholder="Approach, architecture and how it was delivered." />
        </div>
      </div>

      {/* Capabilities multiselector */}
      <div className="adm-card space-y-3 p-5">
        <p className="adm-label">Service capabilities (multi-select)</p>
        <div className="flex flex-wrap gap-2">
          {capsForDiscipline.map((cap) => {
            const inDiscipline = disciplineCaps.includes(cap);
            const on = services.includes(cap);
            return (
              <button
                key={cap}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(services, setServices, cap)}
                className={cn(
                  chipBtn,
                  on
                    ? "border-foreground bg-foreground text-background"
                    : inDiscipline
                      ? "border-border text-foreground/80 hover:border-foreground/40"
                      : "border-border/60 text-muted hover:border-foreground/30",
                )}
              >
                {cap}
              </button>
            );
          })}
        </div>
        <p className="t-caption text-muted">Chips for “{CASE_DISCIPLINES.find((d) => d.id === discipline)?.title}” first; other disciplines’ capabilities are selectable too.</p>
      </div>

      {/* Tech stack */}
      <div className="adm-card space-y-3 p-5">
        <p className="adm-label">Technology stack</p>
        <div className="flex flex-wrap gap-2">
          {technologies.map((t) => (
            <span key={t} className="t-caption flex items-center gap-2 rounded-[2px] border border-border bg-surface px-3 py-1.5">
              {t}
              <button type="button" aria-label={`Remove ${t}`} onClick={() => setTechnologies(technologies.filter((v) => v !== t))} className="text-muted hover:text-error">
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className={input}
            value={stackDraft}
            onChange={(e) => setStackDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addStack();
              }
            }}
            placeholder="Add a technology and press Enter - Next.js, PostgreSQL, Flutter…"
            aria-label="Add technology"
          />
          <button type="button" onClick={addStack} className={cn(secondaryBtn, "shrink-0")}>
            Add
          </button>
        </div>
      </div>

      {/* Results repeater */}
      <div className="adm-card space-y-3 p-5">
        <div className="flex items-center justify-between">
          <p className="adm-label">Outcome metrics</p>
          <button
            type="button"
            onClick={() => results.length < 6 && setResults([...results, { value: "", label: "", verified: false }])}
            className={cn(secondaryBtn, "h-9 px-3 text-[0.8125rem]")}
          >
            + Add metric
          </button>
        </div>
        {results.length === 0 ? <p className="t-caption text-muted">No metrics yet - e.g. “+42% / Conversion Improvement”.</p> : null}
        <div className="space-y-2">
          {results.map((res, i) => (
            <div key={i} className="grid grid-cols-[7rem_1fr_auto_auto] items-center gap-2">
              <input
                id={`cs-metric-${i}-value`}
                className={input}
                value={res.value}
                onChange={(e) => setResults(results.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
                placeholder="+42%"
                aria-label={`Metric ${i + 1} value`}
                maxLength={24}
              />
              <input
                id={`cs-metric-${i}-label`}
                className={input}
                value={res.label}
                onChange={(e) => setResults(results.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                placeholder="Conversion Improvement"
                aria-label={`Metric ${i + 1} label`}
                maxLength={80}
              />
              <label className="flex items-center gap-1.5 text-[0.8125rem] text-muted" title="Verified metrics render in production; unverified render on staging only">
                <input
                  type="checkbox"
                  checked={res.verified}
                  onChange={(e) => setResults(results.map((x, j) => (j === i ? { ...x, verified: e.target.checked } : x)))}
                  className="h-4 w-4 accent-[var(--accent)]"
                  aria-label={`Metric ${i + 1} verified`}
                />
                Verified
              </label>
              <button type="button" aria-label={`Remove metric ${i + 1}`} onClick={() => setResults(results.filter((_, j) => j !== i))} className="px-2 text-muted hover:text-error">
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Palette repeater */}
      <div className="adm-card space-y-3 p-5">
        <div className="flex items-center justify-between">
          <p className="adm-label">Project palette</p>
          <button
            type="button"
            onClick={() => palette.length < 8 && setPalette([...palette, { name: "", hex: "#14161c" }])}
            className={cn(secondaryBtn, "h-9 px-3 text-[0.8125rem]")}
          >
            + Add color
          </button>
        </div>
        {palette.length === 0 ? <p className="t-caption text-muted">The color system shown as swatches on the detail page.</p> : null}
        <div className="space-y-2">
          {palette.map((sw, i) => (
            <div key={i} className="grid grid-cols-[3rem_1fr_9rem_auto] items-center gap-2">
              <input
                type="color"
                value={sw.hex}
                onChange={(e) => setPalette(palette.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)))}
                aria-label={`Color ${i + 1} picker`}
                className="h-9 w-full cursor-pointer rounded-[2px] border border-border bg-transparent p-1"
              />
              <input
                className={input}
                value={sw.name}
                onChange={(e) => setPalette(palette.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                placeholder="Ink"
                aria-label={`Color ${i + 1} name`}
                maxLength={60}
              />
              <input
                id={`cs-palette-${i}`}
                className={cn(input, "tnum")}
                value={sw.hex}
                onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && setPalette(palette.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)))}
                placeholder="#14161C"
                aria-label={`Color ${i + 1} hex`}
              />
              <button type="button" aria-label={`Remove color ${i + 1}`} onClick={() => setPalette(palette.filter((_, j) => j !== i))} className="px-2 text-muted hover:text-error">
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonial */}
      <div className="adm-card space-y-4 p-5">
        <label className="flex cursor-pointer items-center gap-2 text-[0.875rem] font-medium text-foreground">
          <input
            type="checkbox"
            checked={hasTestimonial}
            onChange={(e) => setHasTestimonial(e.target.checked)}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          Include a testimonial
        </label>
        {hasTestimonial ? (
          <div className="space-y-4">
            <div>
              <label className={label} htmlFor="cs-tq">Quote</label>
              <textarea id="cs-tq" className={cn(input, "min-h-24 resize-y")} value={tQuote} onChange={(e) => setTQuote(e.target.value)} maxLength={1200} placeholder="Approved client quote - never an invented endorsement." />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label} htmlFor="cs-tn">Name</label>
                <input id="cs-tn" className={input} value={tName} onChange={(e) => setTName(e.target.value)} maxLength={120} placeholder="Client Name" />
              </div>
              <div>
                <label className={label} htmlFor="cs-tr">Role · Company</label>
                <input id="cs-tr" className={input} value={tRole} onChange={(e) => setTRole(e.target.value)} maxLength={160} placeholder="COO · Acme Trading" />
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <SubmitButton label={item ? "Save changes" : "Create case study"} pendingLabel="Saving…" />
        <a href="/admin/case-studies" className={secondaryBtn}>
          Cancel
        </a>
      </div>
    </FormGuard>
  );
}

/** Mini previews of every rendering surface, honoring the fallback chain. */
function PreviewSurfaces({
  images,
  discipline,
  palette,
  title,
}: {
  images: Record<SlotKey, AttachedImage | null>;
  discipline: CaseStudyRecord["discipline"];
  palette: { name: string; hex: string }[];
  title: string;
}) {
  const resolved = resolveCaseImages({ images });
  const safePalette = palette.length ? palette : [{ name: "Ink", hex: "#14161c" }, { name: "Surface", hex: "#f4f2ec" }, { name: "Accent", hex: "#e8490f" }];

  const Frame = ({ slot, aspect, label, where }: { slot: SlotKey; aspect: string; label: string; where: string }) => (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <p className="t-caption font-semibold">{label}</p>
        <p className="t-caption text-muted">{where}</p>
      </div>
      <div className={`overflow-hidden rounded-[2px] border border-border ${aspect} bg-[var(--surface)]`}>
        {resolved[slot] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={resolved[slot]!.dataUrl} alt={`${label} preview`} className="h-full w-full object-cover" />
        ) : slot === "showcase" ? (
          <ProjectMockup discipline={discipline} palette={safePalette} />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center">
            <p className="t-caption text-muted/70">Falls back to the {slot === "card" ? "featured card" : "showcase"} image</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Frame slot="showcase" aspect="aspect-[16/9]" label="Showcase" where={`Detail page - ${title || "Project"} big band`} />
      </div>
      <Frame slot="cardWide" aspect="aspect-[16/7]" label="Featured card" where="Homepage · dossier index (desktop 16:7)" />
      <Frame slot="card" aspect="aspect-[16/10]" label="Standard card" where="Homepage · dossier index" />
    </div>
  );
}
