import "server-only";
import { createHmac } from "node:crypto";
import { site, UNSUBSCRIBE_PLACEHOLDER, type MailTemplate } from "./templates";

/** Preserve the existing HMAC contract so previously sent links remain valid. */
export function unsubscribeSig(email: string): string {
  const salt = process.env.ENQUIRY_IP_SALT || "dev-salt";
  return createHmac("sha256", salt).update(email.toLowerCase()).digest("hex").slice(0, 32);
}

export function unsubscribeUrl(email: string): string {
  return `${site("/unsubscribe")}?email=${encodeURIComponent(email)}&sig=${unsubscribeSig(email)}`;
}

/** Client previews cannot sign links. Only the server transmission boundary can. */
export function withSignedUnsubscribe(template: MailTemplate): MailTemplate {
  if (!template.unsubscribeEmail) return template;
  const url = unsubscribeUrl(template.unsubscribeEmail);
  return {
    ...template,
    html: template.html.split(UNSUBSCRIBE_PLACEHOLDER).join(url.replace(/&/g, "&amp;")),
    text: template.text.split(UNSUBSCRIBE_PLACEHOLDER).join(url),
  };
}
