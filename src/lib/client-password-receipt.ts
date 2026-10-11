import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "@/lib/auth";
import { withBasePath } from "@/lib/utils";

export const CLIENT_PASSWORD_RECEIPT_COOKIE = "savo_client_password_receipt";
const RECEIPT_TTL_SECONDS = 120;
const RECEIPT_PATH = withBasePath("/admin/clients");

type ReceiptKind = "created" | "reset";
export type ClientPasswordReceipt = { kind: ReceiptKind; password: string };

type StoredReceipt = ClientPasswordReceipt & { adminId: string; expiresAt: number };

function receiptKey(sessionToken: string): Buffer {
  return createHash("sha256").update("savo-client-password-receipt\0").update(sessionToken).digest();
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: RECEIPT_PATH,
    maxAge: RECEIPT_TTL_SECONDS,
  };
}

function expireReceiptCookie(store: Awaited<ReturnType<typeof cookies>>): void {
  store.set(CLIENT_PASSWORD_RECEIPT_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
}

/** Keep the credential out of URLs and encrypt its short-lived receipt to the current admin session. */
export async function setClientPasswordReceipt(
  adminId: string,
  kind: ReceiptKind,
  password: string,
): Promise<boolean> {
  const store = await cookies();
  const sessionToken = store.get(ADMIN_COOKIE)?.value;
  if (!sessionToken || sessionToken.length > 256 || !adminId || password.length > 64) return false;

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", receiptKey(sessionToken), iv);
  cipher.setAAD(Buffer.from(adminId));
  const receipt: StoredReceipt = { adminId, kind, password, expiresAt: Date.now() + RECEIPT_TTL_SECONDS * 1000 };
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(receipt), "utf8"), cipher.final()]);
  const value = [
    "v1",
    Buffer.from(adminId).toString("base64url"),
    iv.toString("base64url"),
    ciphertext.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
  ].join(".");

  store.set(CLIENT_PASSWORD_RECEIPT_COOKIE, value, cookieOptions());
  return true;
}

export async function hasClientPasswordReceipt(): Promise<boolean> {
  return Boolean((await cookies()).get(CLIENT_PASSWORD_RECEIPT_COOKIE)?.value);
}

/** Consume once; the receipt is bound to both the current admin session and actor. */
export async function consumeClientPasswordReceipt(adminId: string): Promise<ClientPasswordReceipt | null> {
  const store = await cookies();
  const value = store.get(CLIENT_PASSWORD_RECEIPT_COOKIE)?.value ?? "";
  expireReceiptCookie(store);
  if (!value || value.length > 2048) return null;

  try {
    const [version, ownerEncoded, ivEncoded, ciphertextEncoded, tagEncoded, extra] = value.split(".");
    if (version !== "v1" || !ownerEncoded || !ivEncoded || !ciphertextEncoded || !tagEncoded || extra !== undefined) return null;
    const owner = Buffer.from(ownerEncoded, "base64url").toString("utf8");
    const sessionToken = store.get(ADMIN_COOKIE)?.value;
    if (!sessionToken || sessionToken.length > 256 || owner !== adminId) return null;

    const decipher = createDecipheriv("aes-256-gcm", receiptKey(sessionToken), Buffer.from(ivEncoded, "base64url"));
    decipher.setAAD(Buffer.from(owner));
    decipher.setAuthTag(Buffer.from(tagEncoded, "base64url"));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(ciphertextEncoded, "base64url")),
      decipher.final(),
    ]).toString("utf8");
    const receipt = JSON.parse(plaintext) as Partial<StoredReceipt>;
    if (
      receipt.adminId !== adminId ||
      !["created", "reset"].includes(receipt.kind ?? "") ||
      typeof receipt.password !== "string" || receipt.password.length < 10 || receipt.password.length > 64 ||
      typeof receipt.expiresAt !== "number" || receipt.expiresAt <= Date.now()
    ) return null;
    return { kind: receipt.kind as ReceiptKind, password: receipt.password };
  } catch {
    return null;
  }
}
