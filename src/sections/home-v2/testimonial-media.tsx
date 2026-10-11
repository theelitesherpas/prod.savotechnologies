"use client";

import { useState } from "react";
import styles from "./homepage.module.css";

export function TestimonialMedia({ photo, video, preview, name }: { photo?: string; video?: string; preview: boolean; name?: string }) {
  const [failedPhoto, setFailedPhoto] = useState<string | null>(null);
  // The legacy demo avatar host is blocked by CSP and is not a video poster.
  const usablePhoto = photo && !/^https?:\/\/(?:www\.)?randomuser\.me\//i.test(photo) && failedPhoto !== photo ? photo : undefined;
  return (
    <div className={styles.proofMedia}>
      {video ? (
        <video controls playsInline preload="metadata" aria-label={name ? `Video testimonial from ${name}` : "Client video testimonial"} poster={usablePhoto} className="h-full w-full object-cover">
          <source src={video} />
          Your browser does not support video playback. <a href={video}>Open the video</a>.
        </video>
      ) : usablePhoto ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- managed testimonial poster */}
          <img src={usablePhoto} alt="" loading="lazy" onError={() => setFailedPhoto(photo ?? null)} />
          <span className={styles.mediaLabel}>Video not supplied</span>
        </>
      ) : (
        <div className={styles.mediaPending}>
          <svg aria-hidden="true" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <rect x="7" y="10" width="34" height="28" rx="3" /><path d="M15 10v28M33 10v28M7 18h8M7 30h8M33 18h8M33 30h8" />
          </svg>
          <p>{preview ? "Client-approved media will appear here." : "Video not supplied."}</p>
        </div>
      )}
    </div>
  );
}
