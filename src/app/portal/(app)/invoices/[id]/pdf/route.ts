import { getClientUser } from "@/lib/client-auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { CLIENT_INVOICE_STATUSES, invoiceFilename, type ClientInvoiceStatus } from "@/lib/invoice-document";
import { renderInvoicePdf } from "@/lib/invoice-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const privateHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};
const failure = (message: string, status: number, headers = {}) =>
  Response.json({ error: message }, { status, headers: { ...privateHeaders, ...headers } });

/** Route Handlers do not inherit layout authorization. Resolve the active
 * session here and scope the invoice AND optional project to that client. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const client = await getClientUser();
  if (!client) return failure("Please sign in to your client portal to download invoices.", 401);
  if (!prisma) return failure("Invoices are temporarily unavailable. Please try again.", 503);
  const { id } = await params;
  if (!/^[A-Za-z0-9_-]{10,64}$/.test(id)) return failure("Invoice not found.", 404);
  if (!rateLimit(`invoice-pdf:${client.id}`, 30, 60_000).ok) {
    return failure("Too many downloads. Please try again in a minute.", 429, { "Retry-After": "60" });
  }
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id, clientId: client.id, status: { in: [...CLIENT_INVOICE_STATUSES] } },
      select: {
        number: true, amount: true, currency: true, status: true, notes: true, paymentLink: true,
        issuedAt: true, dueDate: true, paidAt: true,
        project: { where: { clientId: client.id }, select: { code: true, title: true } },
      },
    });
    // Same response for unknown, another client's, private draft or an
    // unsupported status; never reveal whether a foreign invoice exists.
    if (!invoice) return failure("Invoice not found.", 404);
    const bytes = await renderInvoicePdf({
      ...invoice,
      status: invoice.status as ClientInvoiceStatus,
      client: { name: client.name, company: client.company, email: client.email },
    });
    const disposition = new URL(request.url).searchParams.get("view") === "1" ? "inline" : "attachment";
    return new Response(new Uint8Array(bytes), {
      headers: {
        ...privateHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${invoiceFilename(invoice.number)}"`,
        "Content-Length": String(bytes.byteLength),
      },
    });
  } catch {
    logger.error("invoice.pdf_failed", { clientId: client.id });
    return failure("The invoice PDF could not be generated. Please try again or contact the team.", 503);
  }
}
