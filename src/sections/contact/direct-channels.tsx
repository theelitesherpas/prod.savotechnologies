import type { ReactNode } from "react";

/**
 * "Reach us directly" - email, phone and WhatsApp rows (version-1 content).
 * Contact details come from the admin-managed site settings.
 */

const MailIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
    <rect x="3.5" y="5.5" width="17" height="13" rx="2.2" />
    <path d="m4.5 7.5 7.5 5.5 7.5-5.5" />
  </svg>
);

const PhoneIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
    <path d="M6.8 3.8 9 3.2c.7-.2 1.4.2 1.7.9l1 2.4c.2.6.1 1.3-.4 1.7l-1.3 1.2a12.6 12.6 0 0 0 4.6 4.6l1.2-1.3c.4-.5 1.1-.6 1.7-.4l2.4 1c.7.3 1.1 1 .9 1.7l-.6 2.2c-.2.7-.8 1.2-1.5 1.2C11.6 18.4 5.6 12.4 5.6 5.3c0-.7.5-1.3 1.2-1.5Z" />
  </svg>
);

const WhatsAppIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-4 w-4">
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.2 14.2c-.2.6-1.2 1.2-1.7 1.2-.5.1-1 .1-1.7-.1-.4-.1-.9-.3-1.6-.6a12.5 12.5 0 0 1-4.8-4.4c-.6-1-.9-1.9-.9-2.7 0-.8.4-1.5.7-1.8.3-.3.7-.4.9-.4h.6c.2 0 .4 0 .6.5l.8 1.9c.1.2 0 .4-.1.6l-.4.5c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1.1 2.2 1.4 2.5 1.5.3.1.5.1.6-.1l.8-.9c.2-.2.4-.2.6-.1l1.8.9c.5.2.5.4.5.6 0 .1 0 .8-.2 1.3Z" />
  </svg>
);

function ChannelRow({
  href,
  icon,
  label,
  value,
  external,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  value: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="group flex items-start gap-4 border-b border-border py-4 transition-colors duration-300 ease-[var(--ease-out-expo)] first:pt-0 hover:border-foreground/30"
    >
      <span
        aria-hidden="true"
        className="hidden h-10 w-10 shrink-0 items-center justify-center border border-border text-muted transition-colors duration-300 group-hover:border-accent group-hover:text-accent sm:flex"
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
        <span className="t-label shrink-0 text-muted">{label}</span>
        <span className="t-sm font-semibold text-foreground/85 [overflow-wrap:anywhere] transition-colors group-hover:text-foreground">
          {value}
        </span>
      </span>
    </a>
  );
}

export function DirectChannels({
  email,
  phone,
  phoneE164,
}: {
  email: string;
  phone: string;
  phoneE164: string;
}) {
  const waNumber = phoneE164.replace(/\D/g, "");
  const waText = encodeURIComponent(
    "Hi Savo Technologies, I would like to talk about a project.",
  );

  return (
    <div className="border border-border p-7 sm:p-8">
      <div className="mb-5 flex items-center gap-3">
        <span aria-hidden="true" className="h-2 w-2 bg-accent" />
        <h3 className="t-h4">Reach us directly</h3>
      </div>
      <ChannelRow href={`mailto:${email}`} icon={MailIcon} label="Email" value={email} />
      <ChannelRow href={`tel:${phoneE164}`} icon={PhoneIcon} label="Call" value={phone} />
      <ChannelRow
        href={`https://wa.me/${waNumber}?text=${waText}`}
        icon={WhatsAppIcon}
        label="WhatsApp"
        value="Chat with us instantly"
        external
      />
    </div>
  );
}
