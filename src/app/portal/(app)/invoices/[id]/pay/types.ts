/** Shared action result types for the portal checkout (client props). */
export type CheckoutStart =
  | { ok: true; orderId: string; keyId: string; amount: number; currency: string; invoiceNumber: string; name: string; email: string }
  | { ok: false; message: string };

export type CheckoutVerify =
  | { ok: true; paymentId: string }
  | { ok: false; message: string };
