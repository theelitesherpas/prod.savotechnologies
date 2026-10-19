import "server-only";
import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Secret-box: authenticated encryption for high-value credentials stored in
 * the database (payment gateway keys, webhook signing secrets).
 *
 * - AES-256-GCM: confidential + tamper-evident (auth tag).
 * - Key comes ONLY from the server environment (SECRETS_MASTER_KEY, base64,
 *   32 bytes). It is never derived from request data and never stored in DB.
 * - Ciphertext format: v1.<iv>.<tag>.<ct> (base64url segments), so a leaked
 *   database alone cannot reveal any secret.
 * - Blank plaintext is represented by null columns, not by encrypting "".
 *
 * Fail-closed: a missing/invalid master key or a tampered ciphertext throws;
 * callers surface a safe operational message, never the secret material.
 */

const MASTER_KEY_ENV = "SECRETS_MASTER_KEY";
const PREFIX = "v1";

const globalForSecretBox = globalThis as unknown as { __savoSecretBoxKey?: Buffer };

/** Parse and validate the master key. Cached per process. */
function masterKey(): Buffer {
  const cached = globalForSecretBox.__savoSecretBoxKey;
  if (cached) return cached;
  const raw = process.env[MASTER_KEY_ENV];
  if (!raw || !raw.trim()) {
    throw new Error(`Secret storage is not configured: set ${MASTER_KEY_ENV} (base64, 32 bytes) in the server environment.`);
  }
  let key: Buffer;
  try {
    key = Buffer.from(raw.trim(), "base64");
  } catch {
    throw new Error(`${MASTER_KEY_ENV} is not valid base64.`);
  }
  if (key.length !== 32) {
    throw new Error(`${MASTER_KEY_ENV} must decode to exactly 32 bytes (generate: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))").`);
  }
  globalForSecretBox.__savoSecretBoxKey = key;
  return key;
}

/** Parsed, validated master key — shared by secret-box storage and other
 *  keyed operations (step-up OTP hashing, grant signing). Cached per process. */
export function masterKeyBytes(): Buffer {
  return masterKey();
}

/** Whether secret storage can be used at all (for UI gating). */
export function secretBoxConfigured(): boolean {
  try { masterKey(); return true; } catch { return false; }
}

export function encryptSecret(plaintext: string): string {
  if (typeof plaintext !== "string" || !plaintext) throw new Error("Nothing to encrypt.");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", masterKey(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [PREFIX, iv.toString("base64url"), tag.toString("base64url"), ct.toString("base64url")].join(".");
}

export function decryptSecret(ciphertext: string): string {
  if (typeof ciphertext !== "string") throw new Error("Invalid stored secret.");
  const parts = ciphertext.split(".");
  if (parts.length !== 4 || parts[0] !== PREFIX) throw new Error("Stored secret format not recognised.");
  let iv: Buffer, tag: Buffer, ct: Buffer;
  try {
    iv = Buffer.from(parts[1], "base64url");
    tag = Buffer.from(parts[2], "base64url");
    ct = Buffer.from(parts[3], "base64url");
  } catch {
    throw new Error("Stored secret is corrupt.");
  }
  if (iv.length !== 12 || tag.length !== 16 || ct.length === 0) throw new Error("Stored secret is corrupt.");
  const decipher = createDecipheriv("aes-256-gcm", masterKey(), iv);
  decipher.setAuthTag(tag);
  try {
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
  } catch {
    // Wrong master key or tampered ciphertext. Never leak which.
    throw new Error("Stored secret could not be unlocked. It was encrypted with a different SECRETS_MASTER_KEY or has been altered.");
  }
}

/** Constant-time equality for secrets compared at the boundary (tests). */
export function secretsEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8"), bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
