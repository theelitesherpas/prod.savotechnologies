"use client";

import { useEffect, useId, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { AdminIcon } from "./icons";
import { FormGuard } from "./form-guard";
import { fmtIST } from "@/lib/datetime";
import { cn } from "@/lib/utils";
import type { CollectionFormDef, FieldDef, ObjectListSubField } from "@/lib/content-registry";

/**
 * Client form engine for the generic content collections. Plain fields
 * are native inputs; structured fields (string lists, object lists,
 * article body blocks) are managed editors that serialize JSON into a
 * hidden input parsed server-side against the registry schema.
 */

// ───────────────────────── Buttons ─────────────────────────

export function SubmitButton({
  label = "Save",
  pendingLabel = "Saving…",
  compact = false,
}: {
  label?: string;
  pendingLabel?: string;
  compact?: boolean;
}) {
  const { pending } = useFormStatus();
  if (compact) {
    return (
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border px-3 text-[0.8125rem] font-semibold text-foreground/75 transition-colors hover:border-accent/60 hover:text-accent disabled:pointer-events-none disabled:opacity-60"
      >
        {pending ? (
          <span aria-hidden="true" className="block h-3 w-3 animate-spin border border-current border-t-transparent" />
        ) : null}
        {pending ? pendingLabel : label}
      </button>
    );
  }
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-accent px-5 text-[0.875rem] font-semibold text-on-accent shadow-sm transition-colors duration-200 hover:bg-accent-hover disabled:pointer-events-none disabled:opacity-60"
    >
      {pending ? (
        <span aria-hidden="true" className="block h-3 w-3 animate-spin border border-current border-t-transparent" />
      ) : null}
      {pending ? pendingLabel : label}
    </button>
  );
}

export function ConfirmButton({
  label,
  confirmLabel,
  tone = "danger",
}: {
  label: string;
  confirmLabel: string;
  tone?: "danger" | "quiet";
}) {
  const { pending } = useFormStatus();
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3500);
    return () => clearTimeout(t);
  }, [armed]);

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!armed) {
          e.preventDefault();
          setArmed(true);
        }
      }}
      aria-label={armed ? confirmLabel : label}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3.5 text-[0.8125rem] font-semibold transition-colors duration-200 disabled:pointer-events-none disabled:opacity-60",
        armed
          ? "border-accent bg-accent text-on-accent"
          : tone === "danger"
            ? "border-accent/50 text-accent hover:bg-accent hover:text-on-accent"
            : "border-border text-muted hover:border-foreground/40 hover:text-foreground",
      )}
    >
      <AdminIcon name={armed ? "alert" : "trash"} className="h-3.5 w-3.5" />
      {pending ? "Working…" : armed ? confirmLabel : label}
    </button>
  );
}

// ─────────────────────── Structured editors ────────────────────────

function RowTools({
  onUp,
  onDown,
  onRemove,
  first,
  last,
}: {
  onUp: () => void;
  onDown: () => void;
  onRemove: () => void;
  first: boolean;
  last: boolean;
}) {
  const btn =
    "flex h-6 w-6 items-center justify-center rounded-md border border-border text-muted transition-colors hover:border-foreground/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-30";
  return (
    <div className="flex items-center gap-1">
      <button type="button" aria-label="Move up" onClick={onUp} disabled={first} className={btn}>
        <AdminIcon name="up" className="h-3 w-3" />
      </button>
      <button type="button" aria-label="Move down" onClick={onDown} disabled={last} className={btn}>
        <AdminIcon name="down" className="h-3 w-3" />
      </button>
      <button
        type="button"
        aria-label="Remove"
        onClick={onRemove}
        className={cn(btn, "hover:border-accent hover:text-accent")}
      >
        <AdminIcon name="close" className="h-3 w-3" />
      </button>
    </div>
  );
}

function AddRowButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 items-center gap-2 rounded-lg border border-dashed border-border px-3.5 text-[0.8125rem] font-semibold text-muted transition-colors hover:border-foreground/40 hover:text-foreground"
    >
      <AdminIcon name="plus" className="h-3.5 w-3.5" />
      Add {label}
    </button>
  );
}

/** Editor for string lists (chips, duties, deliverables…). */
function ListEditor({ def, value }: { def: FieldDef; value: string[] }) {
  const [items, setItems] = useState<string[]>(value.length ? value : [""]);
  const move = (i: number, dir: -1 | 1) =>
    setItems((prev) => {
      const next = [...prev];
      const j = i + dir;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <div>
      <input type="hidden" name={def.name} value={JSON.stringify(items.map((s) => s.trim()).filter(Boolean))} />
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="tnum w-6 shrink-0 text-right font-mono text-[0.6875rem] text-muted">
              {String(i + 1).padStart(2, "0")}
            </span>
            <input
              type="text"
              value={item}
              onChange={(e) => setItems((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))}
              placeholder={def.placeholder}
              className="adm-input"
              aria-label={`${def.itemLabel ?? "item"} ${i + 1}`}
            />
            <RowTools
              first={i === 0}
              last={i === items.length - 1}
              onUp={() => move(i, -1)}
              onDown={() => move(i, 1)}
              onRemove={() => setItems((prev) => (prev.length === 1 ? [""] : prev.filter((_, j) => j !== i)))}
            />
          </li>
        ))}
      </ul>
      <div className="mt-2.5">
        <AddRowButton label={def.itemLabel ?? "item"} onClick={() => setItems((prev) => [...prev, ""])} />
      </div>
    </div>
  );
}

/** Editor for object lists (engagements, FAQs, process steps…). */
function ObjectListEditor({ def, value }: { def: FieldDef; value: Record<string, string>[] }) {
  const fields: ObjectListSubField[] = def.fields ?? [
    { name: "title", label: "Title", type: "text" },
  ];
  const blank = () => Object.fromEntries(fields.map((f) => [f.name, ""]));
  const [items, setItems] = useState<Record<string, string>[]>(value.length ? value : [blank()]);
  const move = (i: number, dir: -1 | 1) =>
    setItems((prev) => {
      const next = [...prev];
      const j = i + dir;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <div>
      <input type="hidden" name={def.name} value={JSON.stringify(items)} />
      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="adm-card p-3.5">
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <span className="adm-label">
                {def.itemLabel ?? "item"} · {String(i + 1).padStart(2, "0")}
              </span>
              <RowTools
                first={i === 0}
                last={i === items.length - 1}
                onUp={() => move(i, -1)}
                onDown={() => move(i, 1)}
                onRemove={() =>
                  setItems((prev) => (prev.length === 1 ? [blank()] : prev.filter((_, j) => j !== i)))
                }
              />
            </div>
            <div className={cn("grid gap-3", fields.length > 1 && "sm:grid-cols-2")}>
              {fields.map((f) => (
                <div key={f.name} className={f.type === "textarea" ? "sm:col-span-2" : undefined}>
                  <label className="adm-label mb-1 block" htmlFor={`${def.name}-${i}-${f.name}`}>
                    {f.label}
                  </label>
                  {f.type === "textarea" ? (
                    <textarea
                      id={`${def.name}-${i}-${f.name}`}
                      rows={2}
                      value={item[f.name] ?? ""}
                      onChange={(e) =>
                        setItems((prev) => prev.map((x, j) => (j === i ? { ...x, [f.name]: e.target.value } : x)))
                      }
                      className="adm-textarea"
                    />
                  ) : (
                    <input
                      id={`${def.name}-${i}-${f.name}`}
                      type="text"
                      value={item[f.name] ?? ""}
                      onChange={(e) =>
                        setItems((prev) => prev.map((x, j) => (j === i ? { ...x, [f.name]: e.target.value } : x)))
                      }
                      className="adm-input"
                    />
                  )}
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-2.5">
        <AddRowButton label={def.itemLabel ?? "item"} onClick={() => setItems((prev) => [...prev, blank()])} />
      </div>
    </div>
  );
}

type Block = { h?: string; p?: string; li?: string[] };

/** Editor for article body blocks (paragraph / heading / bullet list). */
function BlocksEditor({ def, value }: { def: FieldDef; value: Block[] }) {
  const [blocks, setBlocks] = useState<Block[]>(value.length ? value : [{ p: "" }]);
  const kindOf = (b: Block): "p" | "h" | "li" => (b.h !== undefined ? "h" : b.li !== undefined ? "li" : "p");
  const move = (i: number, dir: -1 | 1) =>
    setBlocks((prev) => {
      const next = [...prev];
      const j = i + dir;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const setKind = (i: number, kind: "p" | "h" | "li") =>
    setBlocks((prev) =>
      prev.map((b, j) => {
        if (j !== i) return b;
        const text = b.p ?? b.h ?? (b.li ?? []).join("\n");
        if (kind === "h") return { h: text };
        if (kind === "li") return { li: text.split("\n").filter((l) => l.trim()) };
        return { p: text };
      }),
    );

  return (
    <div>
      <input
        type="hidden"
        name={def.name}
        value={JSON.stringify(
          blocks.filter((b) => (b.p ?? b.h ?? "")?.trim() || (b.li ?? []).some((l) => l.trim())),
        )}
      />
      <ul className="space-y-2.5">
        {blocks.map((b, i) => {
          const kind = kindOf(b);
          const text = b.p ?? b.h ?? (b.li ?? []).join("\n");
          return (
            <li key={i} className="adm-card p-3.5">
              <div className="mb-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1" role="group" aria-label={`Block ${i + 1} type`}>
                  {(
                    [
                      ["p", "Paragraph"],
                      ["h", "Heading"],
                      ["li", "Bullets"],
                    ] as const
                  ).map(([k, l]) => (
                    <button
                      key={k}
                      type="button"
                      aria-pressed={kind === k}
                      onClick={() => setKind(i, k)}
                      className={cn(
                        "rounded-md border px-2.5 py-1 font-mono text-[0.6875rem] uppercase tracking-[0.08em] transition-colors",
                        kind === k
                          ? "border-foreground bg-foreground text-background"
                          : "border-border text-muted hover:border-foreground/40 hover:text-foreground",
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                <RowTools
                  first={i === 0}
                  last={i === blocks.length - 1}
                  onUp={() => move(i, -1)}
                  onDown={() => move(i, 1)}
                  onRemove={() =>
                    setBlocks((prev) => (prev.length === 1 ? [{ p: "" }] : prev.filter((_, j) => j !== i)))
                  }
                />
              </div>
              <textarea
                rows={kind === "h" ? 1 : kind === "li" ? 3 : 4}
                value={text}
                onChange={(e) =>
                  setBlocks((prev) =>
                    prev.map((x, j) => {
                      if (j !== i) return x;
                      if (kind === "h") return { h: e.target.value };
                      if (kind === "li") return { li: e.target.value.split("\n") };
                      return { p: e.target.value };
                    }),
                  )
                }
                placeholder={kind === "li" ? "One bullet per line" : undefined}
                className="adm-textarea"
                aria-label={`Block ${i + 1} content`}
              />
            </li>
          );
        })}
      </ul>
      <div className="mt-2.5">
        <AddRowButton label={def.itemLabel ?? "block"} onClick={() => setBlocks((prev) => [...prev, { p: "" }])} />
      </div>
    </div>
  );
}

/** Slug field with title-derived auto-fill until manually edited. */
function SlugField({
  def,
  value,
  titleValue,
}: {
  def: FieldDef;
  value: string;
  titleValue: string;
}) {
  const id = useId();
  // Derived while typing: the slug follows the title until it is edited
  // manually; "Auto" hands control back.
  const [manualSlug, setManualSlug] = useState<string | null>(value ? value : null);
  const slugify = (t: string) =>
    t
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  const slug = manualSlug ?? slugify(titleValue);

  return (
    <div>
      <input type="hidden" name={def.name} value={slugify(slug)} />
      <div className="flex gap-2">
        <input
          id={id}
          type="text"
          value={slug}
          onChange={(e) => setManualSlug(e.target.value)}
          data-slug={manualSlug ? "manual" : "auto"}
          placeholder="auto-derived-from-title"
          className="adm-input flex-1"
          aria-label={def.label}
        />
        <button
          type="button"
          onClick={() => setManualSlug(null)}
          aria-label="Re-derive slug from title"
          className="h-[38px] shrink-0 rounded-lg border border-border px-3 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-muted transition-colors hover:border-foreground/40 hover:text-foreground"
        >
          Auto
        </button>
      </div>
    </div>
  );
}

// ──────────────────────── Collection form ──────────────────────────

export type CollectionFormItem = {
  id: string;
  slug: string;
  title: string;
  data: Record<string, unknown>;
  order: number;
  active: boolean;
  /** Content lifecycle (demo content policy); defaults to draft. */
  contentStatus?: string;
  updatedAt?: string;
};

function FieldBlock({
  def,
  data,
  itemSlug,
  titleValue,
  isTitleField,
  onTitleChange,
}: {
  def: FieldDef;
  data: Record<string, unknown>;
  itemSlug?: string;
  titleValue: string;
  isTitleField: boolean;
  onTitleChange: (v: string) => void;
}) {
  const id = useId();
  const half = def.width === "half";

  if (def.type === "list") {
    return (
      <div className={half ? "sm:col-span-1" : "sm:col-span-2"}>
        <span className="adm-label mb-2 block">{def.label}</span>
        <ListEditor def={def} value={Array.isArray(data[def.name]) ? (data[def.name] as string[]) : []} />
        {def.help ? <p className="t-caption mt-1.5 text-muted">{def.help}</p> : null}
      </div>
    );
  }
  if (def.type === "object-list") {
    return (
      <div className={half ? "sm:col-span-1" : "sm:col-span-2"}>
        <span className="adm-label mb-2 block">{def.label}</span>
        <ObjectListEditor
          def={def}
          value={Array.isArray(data[def.name]) ? (data[def.name] as Record<string, string>[]) : []}
        />
        {def.help ? <p className="t-caption mt-1.5 text-muted">{def.help}</p> : null}
      </div>
    );
  }
  if (def.type === "blocks") {
    return (
      <div className={half ? "sm:col-span-1" : "sm:col-span-2"}>
        <span className="adm-label mb-2 block">{def.label}</span>
        <BlocksEditor def={def} value={Array.isArray(data[def.name]) ? (data[def.name] as Block[]) : []} />
        {def.help ? <p className="t-caption mt-1.5 text-muted">{def.help}</p> : null}
      </div>
    );
  }
  if (def.type === "slug") {
    return (
      <div>
        <span className="adm-label mb-1.5 block">{def.label}</span>
        <SlugField def={def} value={itemSlug ?? ""} titleValue={titleValue} />
        {def.help ? <p className="t-caption mt-1.5 text-muted">{def.help}</p> : null}
      </div>
    );
  }

  const v = data[def.name];
  const common = "w-full";
  return (
    <div>
      <label htmlFor={id} className="adm-label mb-1.5 block">
        {def.label}
        {def.required ? <span aria-hidden="true" className="ml-1 text-accent">*</span> : null}
      </label>
      {def.type === "textarea" ? (
        <textarea
          id={id}
          name={def.name}
          rows={def.rows ?? 3}
          required={def.required}
          placeholder={def.placeholder}
          defaultValue={typeof v === "string" ? v : ""}
          className={cn("adm-textarea", common)}
        />
      ) : def.type === "select" ? (
        <select
          id={id}
          name={def.name}
          required={def.required}
          defaultValue={typeof v === "string" ? v : (def.defaultValue as string) ?? ""}
          className={cn("adm-select", common)}
        >
          {(def.options ?? []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : def.type === "number" ? (
        <input
          id={id}
          type="number"
          name={def.name}
          required={def.required}
          placeholder={def.placeholder}
          defaultValue={typeof v === "number" ? v : (v === undefined || v === null ? "" : String(v))}
          className={cn("adm-input", common)}
        />
      ) : (
        <input
          id={id}
          type="text"
          name={def.name}
          required={def.required}
          placeholder={def.placeholder}
          {...(isTitleField
            ? { value: titleValue, onChange: (e) => onTitleChange(e.target.value) }
            : { defaultValue: typeof v === "string" ? v : "" })}
          className={cn("adm-input", common)}
        />
      )}
      {def.help ? <p className="t-caption mt-1.5 text-muted">{def.help}</p> : null}
    </div>
  );
}

/**
 * Full create/edit form for a registry collection. The `action` is the
 * server action (create or update); meta fields (id, order, active) are
 * included automatically.
 */
export function CollectionForm({
  def,
  action,
  item,
  onCancelHref,
  titleValue: initialTitleValue,
}: {
  def: CollectionFormDef;
  action: (formData: FormData) => Promise<void>;
  item?: CollectionFormItem;
  onCancelHref: string;
  titleValue: string;
}) {
  const [titleValue, setTitleValue] = useState(initialTitleValue);
  const titleFieldName = def.titleField;
  const data = item?.data ?? def.defaults;

  return (
    <FormGuard action={action} className="min-w-0">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <input type="hidden" name="collection" value={def.key} />

      {/* Publishing strip */}
      <div className="adm-card mb-6 flex flex-wrap items-center gap-x-8 gap-y-4 px-4 py-3.5">
        <div className="flex items-center gap-3">
          <span className="adm-label">Visibility</span>
          <label className="flex cursor-pointer items-center gap-2 text-[0.875rem] font-medium text-foreground">
            <input
              type="checkbox"
              name="active"
              defaultChecked={item ? item.active : true}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            Published
          </label>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="item-content-status" className="adm-label">
            Lifecycle
          </label>
          <select
            id="item-content-status"
            name="contentStatus"
            defaultValue={item?.contentStatus ?? "draft"}
            className="adm-select h-9 py-1"
          >
            <option value="draft">Draft</option>
            <option value="demo">Demo</option>
            <option value="review">Review</option>
            <option value="verified">Verified</option>
            <option value="published">Published</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="item-order" className="adm-label">
            Order
          </label>
          <input
            id="item-order"
            type="number"
            name="order"
            min={0}
            max={999}
            defaultValue={item?.order ?? 0}
            className="adm-input h-9 w-20 py-1"
          />
        </div>
        {item?.updatedAt ? (
          <p className="t-caption tnum ml-auto text-muted">
            Last updated {fmtIST(item.updatedAt)}
          </p>
        ) : (
          <p className="t-caption ml-auto text-muted">New {def.singular}</p>
        )}
      </div>

      {/* Fields */}
      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
        {def.fields.map((f) => (
          <div key={f.name} className={f.width === "half" ? "sm:col-span-1" : "sm:col-span-2"}>
            <FieldBlock
              def={f}
              data={data}
              itemSlug={item?.slug}
              titleValue={titleValue}
              isTitleField={f.name === titleFieldName}
              onTitleChange={setTitleValue}
            />
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-6">
        <SubmitButton label={item ? "Save changes" : `Create ${def.singular}`} />
        <Link
          href={onCancelHref}
          className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-[0.875rem] font-semibold text-muted transition-colors hover:border-foreground/40 hover:text-foreground"
        >
          Cancel
        </Link>
        {item ? <p className="t-caption tnum ml-auto text-muted">/ {item.slug}</p> : null}
      </div>
    </FormGuard>
  );
}
