import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { mkdirSync, writeFileSync } from "node:fs";
import { PDFDict, PDFDocument, PDFName, PDFString } from "pdf-lib";
import { normalizePaymentLink, invoicePaymentLink, paymentProvider } from "@/lib/payment-links";
import { InvoicePayButton } from "@/components/portal/invoice-pay-button";
import { InvoiceTable, type InvoiceRecord } from "@/components/portal/workspace-ui";
import { invoiceIssued, invoiceOverdue, invoicePaid } from "@/lib/mail/templates";
import { invoiceTemplatePayment, templateEntry, templateSamplePlaceholders } from "@/lib/mail/registry";
import { renderInvoicePdf } from "@/lib/invoice-pdf";
const paypal="https://www.paypal.com/invoice/p/#TEST-123";
const razorpay="https://rzp.io/i/TEST-123?source=invoice&language=en";
const row: InvoiceRecord={id:"invoice-12345",number:"TEST-001",status:"sent",amount:12345,currency:"USD",issuedAt:"2026-10-01T00:00:00Z",dueDate:null,paidAt:null,notes:null,project:null};

describe("optional hosted payment URL policy",()=>{
 it.each([paypal,razorpay,"https://paypal.me/example/123.45","https://pages.razorpay.com/example","https://rzp.me/l/TEST","https://buy.stripe.com/test_sample"])("accepts a trusted HTTPS payment URL: %s",link=>expect(normalizePaymentLink(link)).toBe(new URL(link).href));
 it.each(["", "   ", null, undefined])("keeps blank values optional: %s",value=>expect(normalizePaymentLink(value)).toBeNull());
 it.each(["javascript:alert(1)","data:text/html,bad","http://paypal.com/invoice/TEST","//paypal.com/invoice/TEST","https://paypal.com.evil.invalid/invoice/TEST","https://evilpaypal.com/invoice/TEST","https://paypal.com@evil.invalid/invoice/TEST","https://user:secret@paypal.com/invoice/TEST","https://paypal.com:444/invoice/TEST","https://127.0.0.1/pay","https://localhost/pay","https://paypal.com./invoice/TEST","https://www.paypal.com/","https://paypal.com/invoice/with space","https://paypal.com/invoice/with\nnewline",'https://paypal.com\\@evil.invalid/pay',`https://rzp.io/i/${"a".repeat(2048)}`])("rejects unsafe/unsupported input: %s",link=>expect(()=>normalizePaymentLink(link)).toThrow());
 it("supports explicitly approved additional provider hosts without allowing invalid config entries",async()=>{
  vi.stubEnv("NEXT_PUBLIC_PAYMENT_LINK_HOSTS"," PAY.APPROVED.EXAMPLE, https://evil.invalid, *.bad.invalid,127.0.0.1,pay.localhost");vi.resetModules();
  try{const configured=await import("@/lib/payment-links");expect(configured.normalizePaymentLink("https://pay.approved.example/invoice/TEST")).toBe("https://pay.approved.example/invoice/TEST");for(const link of ["https://evil.invalid/pay","https://sub.bad.invalid/pay","https://127.0.0.1/pay","https://pay.localhost/pay"])expect(()=>configured.normalizePaymentLink(link)).toThrow();}
  finally{vi.unstubAllEnvs();vi.resetModules();}
 });
 it("normalizes whitespace without dropping query tokens or PayPal fragments",()=>{
  expect(normalizePaymentLink(` ${razorpay} `)).toBe(razorpay);
  expect(normalizePaymentLink(paypal)).toContain("#TEST-123");
  expect(paymentProvider(paypal)).toBe("PayPal");expect(paymentProvider(razorpay)).toBe("Razorpay");
 });
 it.each(["paid","cancelled","draft","unknown"])("never offers payment for %s",status=>expect(invoicePaymentLink({...row,status,paymentLink:paypal})).toBeNull());
 it("fails closed for legacy unsafe values and zero/negative amounts",()=>{
  for(const amount of [0,-1,NaN]) expect(invoicePaymentLink({...row,amount,paymentLink:paypal})).toBeNull();
  expect(invoicePaymentLink({...row,paymentLink:"javascript:alert(1)"})).toBeNull();
 });
});
describe("portal invoice/project payment action",()=>{
 it.each(["sent","overdue"])("shows a safe provider action for %s invoices",status=>{
  const html=renderToStaticMarkup(<InvoiceTable invoices={[{...row,status,paymentLink:razorpay}]}/>);
  expect(html).toContain("Pay now");expect(html).toContain('rel="noopener noreferrer"');expect(html).toContain('referrerPolicy="no-referrer"');
  expect(html).toContain('href="https://rzp.io/i/TEST-123?source=invoice&amp;language=en"');
  expect(html).toContain("Download PDF");expect(html).toContain("View / print");expect(html).toContain('data-label="Actions"');
 });
 it("preserves the existing document column with no payment link",()=>{
  const html=renderToStaticMarkup(<InvoiceTable invoices={[row]}/>);
  expect(html).not.toContain("Pay now");expect(html).toContain('data-label="Documents"');
  expect(renderToStaticMarkup(<InvoicePayButton invoice={row}/>)).toBe("");
 });
 it.each(["paid","cancelled"])("retains PDF actions but not Pay now for %s",status=>{
  const html=renderToStaticMarkup(<InvoiceTable invoices={[{...row,status,paymentLink:paypal}]}/>);
  expect(html).not.toContain("Pay now");expect(html).not.toContain("paypal.com");expect(html).toContain("Download PDF");
 });
});
describe("invoice email payment actions",()=>{
 it("adds Pay now to HTML/plain text and retains access to invoice records",()=>{
  const mail=invoiceIssued("Example","TEST-001",12345,"USD",null,paypal);
  expect(mail.html).toContain('href="'+paypal+'"');expect(mail.html).toContain("Pay now");expect(mail.text).toContain(`Pay now: ${paypal}`);expect(mail.html).toContain("/portal/invoices");
  const reminder=invoiceOverdue("Example","TEST-001",12345,"USD",5,razorpay);
  expect(reminder.html).toContain("Pay now");expect(reminder.text).toContain(razorpay);
  mkdirSync("tmp/payment-links",{recursive:true});writeFileSync("tmp/payment-links/issued.html",mail.html);writeFileSync("tmp/payment-links/overdue.html",reminder.html);
 });
 it("does not change default email HTML/text when a link is absent or blank",()=>{
  const a=invoiceIssued("Example","REF",12345,"USD",null), b=invoiceIssued("Example","REF",12345,"USD",null,"");
  expect(a).toEqual(b);expect(a.html).not.toContain("Pay now");
  expect(invoiceOverdue("Example","REF",12345,"USD",5).html).not.toContain("Pay now");
  expect(invoicePaid("Example","REF",12345,"USD").html).not.toContain("Pay now");
 });
 it("never adds payment to a receipt or non-payable notification",()=>{
  expect(invoiceIssued("Example","REF",12345,"USD",null,paypal,"paid").html).not.toContain("Pay now");
  expect(invoiceOverdue("Example","REF",12345,"USD",2,paypal,"cancelled").html).not.toContain("Pay now");
  expect(invoiceTemplatePayment("invoicePaid",{paymentLink:paypal,amountMinor:"12345"})).toBeUndefined();
 });
 it("applies the same validated action to saved invoice body overrides only",()=>{
  const vars={paymentLink:paypal,amountMinor:"12345",invoiceStatus:"sent"};
  expect(invoiceTemplatePayment("invoiceIssued",vars)).toMatchObject({href:paypal,label:"Pay now"});
  expect(invoiceTemplatePayment("invoiceOverdue",{...vars,invoiceStatus:"overdue"})).toMatchObject({href:paypal});
  expect(invoiceTemplatePayment("projectUpdate",vars)).toBeUndefined();
  expect(invoiceTemplatePayment("invoiceIssued",{...vars,invoiceStatus:"paid"})).toBeUndefined();
  expect(invoiceTemplatePayment("invoiceIssued",{...vars,paymentLink:"https://evil.invalid/pay"})).toBeUndefined();
 });
 it("registry previews receive actual optional links and blank samples never corrupt editor starters",()=>{
  const entry=templateEntry("invoiceIssued")!;const vars={...entry.vars,paymentLink:paypal};
  expect(entry.default(vars).html).toContain("Pay now");
  expect(templateSamplePlaceholders("Invoice TEST-001",{number:"TEST-001",paymentLink:""})).toBe("Invoice {{number}}");
 });
});
describe("printable PDF payment links",()=>{
 it.each(["sent","overdue","paid","cancelled"] as const)("includes only a safe URI annotation when %s is payable",async status=>{
  const bytes=await renderInvoicePdf({number:row.number,amount:row.amount,currency:row.currency,status,issuedAt:new Date(row.issuedAt),dueDate:null,paidAt:null,notes:"Synthetic payment-link review only. Not payable.",paymentLink:paypal,client:{name:"Example Client",company:"Synthetic local sample",email:"sample@example.invalid"},project:null});
  const pdf=await PDFDocument.load(bytes);const annotations=pdf.getPages().flatMap(page=>{const a=page.node.Annots();return a?Array.from({length:a.size()},(_,i)=>a.lookup(i,PDFDict)):[];});
  const paymentAnnotations=annotations.filter(annotation=>annotation.lookup(PDFName.of("A"),PDFDict).lookup(PDFName.of("URI"),PDFString).decodeText()!=="https://savotechnologies.com");
  expect(annotations).toHaveLength(paymentAnnotations.length+1);
  if(status==="sent"||status==="overdue"){
    expect(paymentAnnotations).toHaveLength(1);const action=paymentAnnotations[0].lookup(PDFName.of("A"),PDFDict);
    expect(action.lookup(PDFName.of("S"),PDFName).toString()).toBe("/URI");expect(action.lookup(PDFName.of("URI"),PDFString).decodeText()).toBe(paypal);
  } else expect(paymentAnnotations).toHaveLength(0);
  mkdirSync("tmp/payment-links",{recursive:true});writeFileSync(`tmp/payment-links/${status}.pdf`,bytes);
 });
});
