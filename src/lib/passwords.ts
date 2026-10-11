import "server-only";
import bcrypt from "bcryptjs";

export const DUMMY_PASSWORD_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEe.zZUL8bMOU9BuiKu0jvV4ZFDXJvWQaOi";
export const PASSWORD_WORK_CAPACITY = 4;
const globalForPassword = globalThis as unknown as { __savoPasswordWork?: { active: number } };
const work = globalForPassword.__savoPasswordWork ?? { active: 0 };
globalForPassword.__savoPasswordWork = work;

/** New bcrypt passwords must not silently truncate at 72 UTF-8 bytes. */
export function passwordFitsBcrypt(password: string): boolean {
  return Buffer.byteLength(password, "utf8") <= 72;
}

/** Cooperative async bcryptjs (not a worker pool); bounded simultaneous work, no queue. */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Preserve legacy <=200-character logins, including already-truncated hashes.
  // Existing long credentials need an owner-led reset, not a silent lockout.
  if (typeof password !== "string" || !password.length || password.length > 200 ||
      typeof hash !== "string" || !/^\$2[aby]\$(0[4-9]|1[0-6])\$[./A-Za-z0-9]{53}$/.test(hash) ||
      work.active >= PASSWORD_WORK_CAPACITY) return false;
  work.active++;
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  } finally {
    work.active--;
  }
}

export async function hashPassword(password: string): Promise<string> {
  if (typeof password !== "string" || !password.length || !passwordFitsBcrypt(password)) throw new Error("PASSWORD_BYTE_LIMIT");
  if (work.active >= PASSWORD_WORK_CAPACITY) throw new Error("PASSWORD_WORK_BUSY");
  work.active++;
  try {
    return await bcrypt.hash(password, 12);
  } finally {
    work.active--;
  }
}
