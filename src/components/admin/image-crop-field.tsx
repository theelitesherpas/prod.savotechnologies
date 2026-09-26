"use client";

/**
 * Image attach + crop field for the admin panel.
 *
 * Each image slot declares FIXED target dimensions (e.g. 1600 × 1280).
 * The attached photo is shown inside the exact target aspect frame; drag
 * to reposition and zoom to scale; the canvas then exports EXACTLY the
 * framed region at the required pixel size - what you see is what saves.
 *
 * The crop works in PROPORTIONS: the frame maps 1:1 onto the target
 * rectangle, so the preview and the export can never disagree.
 *
 * Output is a JPEG data URL stored inside the record's JSON, so the image
 * travels with the database row everywhere it goes.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type AttachedImage = {
  dataUrl: string;
  width: number;
  height: number;
  alt: string;
};

const MAX_SOURCE_BYTES = 25 * 1024 * 1024; // 25 MB source file guard
const TARGET_BYTES_MAX = 4_000_000; // schema guard (data URL length)
const EXPORT_QUALITIES = [0.85, 0.75, 0.65, 0.55]; // fallback ladder for heavy files

export function ImageCropField({
  label,
  hint,
  targetWidth,
  targetHeight,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  targetWidth: number;
  targetHeight: number;
  value: AttachedImage | null;
  onChange: (next: AttachedImage | null) => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [frameSize, setFrameSize] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aspect = targetWidth / targetHeight;

  /* Frame measurement (responsive) */
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const measure = () => setFrameSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [sourceUrl]);

  /* Display geometry: cover the frame, then zoom. All in proportions of
     the same "scale" - preview and export share it exactly. */
  const base = natural && frameSize ? Math.max(frameSize.w / natural.w, frameSize.h / natural.h) : 1;
  const scale = base * zoom;
  const dispW = natural ? natural.w * scale : 0;
  const dispH = natural ? natural.h * scale : 0;

  const clamp = useCallback(
    (x: number, y: number) => {
      if (!frameSize) return { x, y };
      return {
        x: Math.min(0, Math.max(frameSize.w - dispW, x)),
        y: Math.min(0, Math.max(frameSize.h - dispH, y)),
      };
    },
    [frameSize, dispW, dispH],
  );

  /* Keep the crop covering the frame: offsets are clamped at every point
     of use (render transform + export math), so geometry changes can never
     reveal the checkerboard - no state-sync effect needed. */
  const safeOffset = frameSize ? clamp(offset.x, offset.y) : offset;

  /* Center a fresh cover crop when the source's dimensions arrive -
     runs inside the load event (a handler, not an effect). */
  const centerFreshCrop = (n: { w: number; h: number }) => {
    const el = frameRef.current;
    if (!el) return;
    const fs = { w: el.clientWidth, h: el.clientHeight };
    const b = Math.max(fs.w / n.w, fs.h / n.h);
    setOffset({ x: (fs.w - n.w * b) / 2, y: (fs.h - n.h * b) / 2 });
  };

  /* Zoom that keeps the framed center point fixed (no jump to a corner). */
  const zoomAroundCenter = (nextZoom: number) => {
    const frame = frameRef.current;
    if (!frame || !natural) {
      setZoom(nextZoom);
      return;
    }
    const oldScale = base * zoom;
    const newScale = base * nextZoom;
    const cx = frame.clientWidth / 2;
    const cy = frame.clientHeight / 2;
    setOffset((o) => {
      // Frame center → source pixels (unchanged by zoom), → back at new scale.
      const px = (cx - o.x) / oldScale;
      const py = (cy - o.y) / oldScale;
      return clamp(cx - px * newScale, cy - py * newScale);
    });
    setZoom(nextZoom);
  };

  const loadFile = (file: File) => {
    setError(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Attach a JPEG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      setError("That file is larger than 25 MB - export a smaller copy first.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setNatural(null);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setSourceUrl(String(reader.result));
    };
    reader.readAsDataURL(file);
  };

  const pointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const pointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    setOffset((o) => clamp(o.x + e.movementX, o.y + e.movementY));
  };
  const pointerUp = () => setDragging(false);

  /**
   * Export - the frame region in SOURCE pixels maps exactly onto the
   * target rectangle. dest is always the full canvas, so the saved file
   * is precisely what the frame shows (proportion-true, any file size).
   */
  const applyCrop = () => {
    const img = imgRef.current;
    if (!img || !frameSize || !natural) return;
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.fillStyle = "#ffffff"; // flatten transparency onto white for JPEG
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    const sx = -safeOffset.x / scale;
    const sy = -safeOffset.y / scale;
    const sw = frameSize.w / scale;
    const sh = frameSize.h / scale;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);

    // Quality ladder: keep heavy photos under the storage guard.
    let dataUrl = "";
    for (const q of EXPORT_QUALITIES) {
      dataUrl = canvas.toDataURL("image/jpeg", q);
      if (dataUrl.length <= TARGET_BYTES_MAX) break;
    }
    if (dataUrl.length > TARGET_BYTES_MAX) {
      setError("The cropped image is still too heavy - try a simpler photo or lower zoom.");
      return;
    }
    onChange({ dataUrl, width: targetWidth, height: targetHeight, alt: "" });
    setSourceUrl(null);
    setNatural(null);
    setError(null);
  };

  const secondary =
    "inline-flex h-9 items-center justify-center rounded-lg border border-border px-4 text-[0.8125rem] font-medium text-foreground transition-colors hover:border-foreground/40";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="adm-label">{label}</p>
          {hint ? <p className="t-caption mt-1 text-muted">{hint}</p> : null}
        </div>
        <p className="t-caption tnum rounded-[2px] border border-border px-2 py-1 text-muted">
          Fixed size: {targetWidth} × {targetHeight} px
        </p>
      </div>

      {/* Current value */}
      {value ? (
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-[var(--surface)] p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value.dataUrl} alt="Attached visual" className="h-20 w-24 rounded-[2px] border border-border object-cover" />
          <div className="min-w-0">
            <p className="t-sm font-medium">
              Attached - {value.width} × {value.height} px
            </p>
            <input
              className="adm-input mt-2 h-9 w-64 max-w-full"
              placeholder="Alt text (describe the visual)"
              value={value.alt}
              onChange={(e) => onChange({ ...value, alt: e.target.value })}
              maxLength={200}
              aria-label="Image alt text"
            />
          </div>
          <button type="button" className={cn(secondary, "ml-auto")} onClick={() => onChange(null)}>
            Remove
          </button>
        </div>
      ) : null}

      {/* Crop studio */}
      {sourceUrl ? (
        <div className="space-y-3 rounded-lg border border-border p-3">
          <div
            ref={frameRef}
            onPointerDown={pointerDown}
            onPointerMove={pointerMove}
            onPointerUp={pointerUp}
            onPointerCancel={pointerUp}
            className={cn(
              "relative touch-none select-none overflow-hidden rounded-[2px] border border-border bg-[repeating-conic-gradient(var(--border)_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]",
              dragging ? "cursor-grabbing" : "cursor-grab",
            )}
            style={{ aspectRatio: String(aspect) }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={sourceUrl}
              alt="Crop source"
              draggable={false}
              onLoad={(e) => {
                const n = { w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight };
                setNatural(n);
                centerFreshCrop(n);
              }}
              className="absolute left-0 top-0 max-w-none"
              style={
                natural
                  ? { width: `${dispW}px`, height: `${dispH}px`, transform: `translate(${safeOffset.x}px, ${safeOffset.y}px)` }
                  : { opacity: 0 }
              }
            />
            {/* Rule-of-thirds guides */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 border border-white/25">
              <div className="absolute left-1/3 top-0 h-full w-px bg-white/15" />
              <div className="absolute left-2/3 top-0 h-full w-px bg-white/15" />
              <div className="absolute left-0 top-1/3 h-px w-full bg-white/15" />
              <div className="absolute left-0 top-2/3 h-px w-full bg-white/15" />
            </div>
            <p className="t-label pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 bg-[rgb(16_19_25/0.55)] px-2 py-1 text-white/85">
              Drag to position · exports {targetWidth} × {targetHeight}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-[0.8125rem] text-muted">
              Zoom
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => zoomAroundCenter(Number(e.target.value))}
                className="w-40 accent-[var(--accent)]"
                aria-label="Zoom"
              />
              <span className="tnum w-9">{zoom.toFixed(2)}×</span>
            </label>
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                className={secondary}
                onClick={() => {
                  setSourceUrl(null);
                  setNatural(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyCrop}
                className="inline-flex h-9 items-center rounded-lg bg-accent px-4 text-[0.8125rem] font-semibold text-on-accent transition-colors hover:bg-accent-hover"
              >
                Crop &amp; attach
              </button>
            </div>
          </div>
          {error ? <p className="t-caption text-[var(--error)]">{error}</p> : null}
        </div>
      ) : (
        <label className="flex cursor-pointer items-center justify-center gap-3 rounded-lg border border-dashed border-border px-4 py-6 text-[0.875rem] text-muted transition-colors hover:border-foreground/40 hover:text-foreground">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) loadFile(f);
              e.currentTarget.value = "";
            }}
          />
          {value ? "Replace image - opens the crop studio" : "Attach image - opens the crop studio"}
        </label>
      )}

      {!sourceUrl && !value ? (
        <p className="t-caption text-muted">
          Wrong proportions are fine - position and zoom inside the frame; the crop saves exactly what the frame shows.
        </p>
      ) : null}
      {error && !sourceUrl ? <p className="t-caption text-[var(--error)]">{error}</p> : null}
    </div>
  );
}
