"use client";

import { useState } from "react";
import { ImageCropField, type AttachedImage } from "@/components/admin/image-crop-field";
import { SubmitButton } from "@/components/admin/form";
import { withBasePath } from "@/lib/utils";

/**
 * Generic site-photo editor for admin-managed page heroes (contact, about,
 * …). Mirrors the editorial image field used by content collections: shows
 * the current photo, then the crop tool fixed at the exact render
 * dimensions with drag positioning; the server action persists the export
 * as a content-addressed WebP.
 */
export function SitePhotoForm({
  action,
  currentImage,
  currentAlt,
  fallbackAlt,
  targetWidth,
  targetHeight,
  uploadLabel,
  uploadHint,
  saveLabel = "Save photo",
}: {
  action: (formData: FormData) => Promise<void>;
  currentImage: string;
  currentAlt: string;
  fallbackAlt: string;
  targetWidth: number;
  targetHeight: number;
  uploadLabel: string;
  uploadHint: string;
  saveLabel?: string;
}) {
  const [currentPath, setCurrentPath] = useState(
    currentImage.startsWith("data:") ? "" : currentImage,
  );
  const [attached, setAttached] = useState<AttachedImage | null>(null);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="image" value={attached?.dataUrl ?? currentPath} />

      {currentPath ? (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-[var(--surface)] p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={withBasePath(currentPath)}
            alt="Current photo"
            className="h-16 w-28 rounded-[2px] border border-border object-cover"
          />
          <p className="t-caption text-muted">
            Current photo · attach a new one below to replace it (drag to position, fixed export size).
          </p>
        </div>
      ) : null}

      <label className="block" htmlFor="site-photo-alt">
        <span className="adm-label mb-1.5 block">
          Photo description
          <span aria-hidden="true" className="ml-1 text-accent">*</span>
        </span>
        <input
          id="site-photo-alt"
          type="text"
          name="alt"
          required
          maxLength={200}
          defaultValue={currentAlt || fallbackAlt}
          className="adm-input w-full"
          placeholder="Describe the photo for screen readers"
        />
        <p className="t-caption mt-1.5 text-muted">
          Alt text for the photo - required for screen readers.
        </p>
      </label>

      <ImageCropField
        label={uploadLabel}
        hint={uploadHint}
        targetWidth={targetWidth}
        targetHeight={targetHeight}
        value={attached}
        showAltText={false}
        onChange={(next) => {
          setAttached(next);
          setCurrentPath("");
        }}
      />

      <div className="border-t border-border pt-4">
        <SubmitButton label={saveLabel} />
      </div>
    </form>
  );
}
