"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { AttachedImage } from "./image-crop-field";

/**
 * Gallery uploader: lightweight multi-image upload for case-study
 * galleries. Auto-resizes to max 1600px wide, compresses to JPEG q=0.80,
 * and keeps each under 4MB (schema limit). Shows a live thumbnail grid
 * with alt-text inputs and remove buttons.
 */

const MAX_DIM = 1600;
const QUALITY_LADDER = [0.78, 0.7, 0.62]; // walk down only if over budget
/** ≈4.5 bytes/px: a 1600×1200 gallery shot lands ≈430KB, crisp. */
const budgetChars = (w: number, h: number) =>
  Math.round((Math.max(90_000, (w * h) / 4.5)) * 1.375) + 200;
const MAX_BYTES = 4_000_000;

export function GalleryUploader({
  images,
  onChange,
}: {
  images: AttachedImage[];
  onChange: (next: AttachedImage[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = async (file: File): Promise<AttachedImage | null> => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError(`${file.name}: not a JPEG, PNG or WebP image.`);
      return null;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError(`${file.name}: file too large (max 25MB source).`);
      return null;
    }

    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    let dataUrl = canvas.toDataURL("image/jpeg", QUALITY_LADDER[0]);
    const budget = Math.min(MAX_BYTES, budgetChars(w, h));
    if (dataUrl.length > budget) {
      for (const q of QUALITY_LADDER.slice(1)) {
        dataUrl = canvas.toDataURL("image/jpeg", q);
        if (dataUrl.length <= budget) break;
      }
    }
    if (dataUrl.length > MAX_BYTES) {
      setError(`${file.name}: image too large even after compression. Try a smaller image.`);
      return null;
    }

    return {
      dataUrl,
      width: w,
      height: h,
      alt: "",
    };
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);

    const remaining = 8 - images.length;
    const toProcess = Array.from(files).slice(0, remaining);
    if (files.length > remaining) {
      setError(`Only ${remaining} more image${remaining === 1 ? "" : "s"} allowed (max 8 total).`);
    }

    const results: AttachedImage[] = [];
    for (const file of toProcess) {
      const img = await processFile(file);
      if (img) results.push(img);
    }

    if (results.length > 0) {
      onChange([...images, ...results]);
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const updateAlt = (index: number, alt: string) => {
    onChange(images.map((img, i) => (i === index ? { ...img, alt } : img)));
  };

  const moveImage = (index: number, dir: -1 | 1) => {
    const to = index + dir;
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    [next[index], next[to]] = [next[to], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {/* Drop zone / file input */}
      <label
        className={cn(
          "flex cursor-pointer items-center justify-center gap-3 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors",
          busy ? "border-accent/50 bg-accent/[0.03]" : "border-border hover:border-foreground/30 hover:bg-surface-2/40",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          onChange={(e) => void handleFiles(e.target.files)}
          disabled={busy || images.length >= 8}
        />
        {busy ? (
          <span className="flex items-center gap-2 text-[0.875rem] text-muted">
            <span className="block h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            Processing images…
          </span>
        ) : images.length >= 8 ? (
          <span className="text-[0.875rem] text-muted">Gallery full (8/8 images)</span>
        ) : (
          <span className="flex flex-col items-center gap-1.5">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-muted" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 15l5-5 4 4 3-3 6 6" />
              <circle cx="8.5" cy="9.5" r="1.5" />
            </svg>
            <span className="text-[0.875rem] font-medium text-foreground/80">
              Click to add images ({images.length}/8)
            </span>
            <span className="t-caption text-muted">
              JPEG, PNG or WebP · best at 1600 × 1200 (4:3) · auto-compressed
            </span>
          </span>
        )}
      </label>

      {/* Thumbnail grid */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img, i) => (
            <div key={i} className="group relative overflow-hidden rounded-lg border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.dataUrl}
                alt={img.alt || `Gallery image ${i + 1}`}
                className="aspect-[4/3] w-full object-cover"
              />
              {/* Order controls */}
              <div className="absolute left-1.5 top-1.5 flex gap-1">
                <button
                  type="button"
                  onClick={() => moveImage(i, -1)}
                  disabled={i === 0}
                  className="flex h-6 w-6 items-center justify-center rounded bg-background/80 text-muted backdrop-blur transition-colors hover:text-foreground disabled:opacity-30"
                  aria-label="Move left"
                >
                  <svg viewBox="0 0 10 10" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M7 1 3 5l4 4" /></svg>
                </button>
                <span className="flex h-6 w-6 items-center justify-center rounded bg-background/80 font-mono text-[0.625rem] text-muted backdrop-blur">
                  {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => moveImage(i, 1)}
                  disabled={i === images.length - 1}
                  className="flex h-6 w-6 items-center justify-center rounded bg-background/80 text-muted backdrop-blur transition-colors hover:text-foreground disabled:opacity-30"
                  aria-label="Move right"
                >
                  <svg viewBox="0 0 10 10" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 1l4 4-4 4" /></svg>
                </button>
              </div>
              {/* Remove */}
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded bg-error/80 text-white backdrop-blur transition-colors hover:bg-error"
                aria-label={`Remove image ${i + 1}`}
              >
                <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 2l8 8M10 2l-8 8" /></svg>
              </button>
              {/* Alt text */}
              <input
                value={img.alt}
                onChange={(e) => updateAlt(i, e.target.value)}
                placeholder="Alt text…"
                maxLength={200}
                className="w-full border-t border-border bg-background px-2 py-1.5 text-[0.6875rem] text-foreground outline-none placeholder:text-muted/50"
                aria-label={`Image ${i + 1} alt text`}
              />
            </div>
          ))}
        </div>
      ) : null}

      {error ? <p className="t-caption text-error">{error}</p> : null}
    </div>
  );
}
