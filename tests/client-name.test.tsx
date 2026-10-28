import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CLIENT_TITLES, clientTitle, clientFullName, clientGreetingName, clientInitials } from "@/lib/client-name";
import { ClientTitleField } from "@/components/admin/client-title-field";
import { clientWelcome, clientPasswordReset, invoiceIssued, invoicePaid, invoiceOverdue, milestoneUpdate, projectUpdate } from "@/lib/mail/templates";
import { meetingInvitation, meetingAvailabilityReceived, meetingConfirmed, meetingRescheduleRequest } from "@/lib/mail/meeting-templates";
import { portalLoginCode } from "@/lib/mail/portal-login-code";

describe("client honorific formatting", () => {
  it.each(CLIENT_TITLES)("formats full/greeting names with %s", title => {
    expect(clientTitle(title)).toBe(title);
    expect(clientFullName("James Miller", title)).toBe(`${title} James Miller`);
    expect(clientGreetingName("James Miller", title)).toBe(`${title} James`);
    expect(clientGreetingName(`${title} James Miller`)).toBe(`${title} James`);
  });
  it("leaves existing/untitled clients natural and preserves their names", () => {
    expect(clientFullName("James Miller", null)).toBe("James Miller");
    expect(clientGreetingName("James Miller")).toBe("James");
    expect(clientTitle("Sir")).toBeNull();
    expect(clientFullName("Mrinal Shah")).toBe("Mrinal Shah");
    expect(clientGreetingName("  Jean-Luc   O’Neill  ", "Dr.")).toBe("Dr. Jean-Luc");
    expect(clientFullName("李 明", "Ms.")).toBe("Ms. 李 明");
    expect(clientGreetingName("  ")).toBe("there");
  });
  it("deduplicates legacy prefixes, honors explicit choices and excludes titles from avatars", () => {
    expect(clientFullName("Mr. Mr. James Miller", "Mr.")).toBe("Mr. James Miller");
    expect(clientFullName("Dr James Miller", "Mr.")).toBe("Mr. James Miller");
    expect(clientFullName("Mr. James Miller", null)).toBe("James Miller");
    expect(clientGreetingName("mr.   James Miller")).toBe("Mr. James");
    expect(clientInitials("Mr. James Miller")).toBe("JM");
  });
  it("offers an optional native title selector with no inferred default", () => {
    const html = renderToStaticMarkup(<ClientTitleField />);
    expect(html).toContain("Title (optional)"); expect(html).toMatch(/autocomplete="honorific-prefix"/i);
    expect(html).toContain('<option value="" selected="">No title</option>'); expect(html).not.toContain("required");
    for (const title of CLIENT_TITLES) expect(html).toContain(`value="${title}"`);
    expect(renderToStaticMarkup(<ClientTitleField value="Dr." />)).toContain('<option value="Dr." selected="">');
  });
});

describe("honorific-aware correspondence", () => {
  it.each(CLIENT_TITLES)("uses %s and first name in every client template, not just the title", title => {
    const name = `${title} James Miller`;
    const templates = [clientWelcome(name, "james@example.invalid", "test-password"), clientPasswordReset(name, "test-password"), invoiceIssued(name, "TEST-1", 10000, "INR", null), invoicePaid(name, "TEST-1", 10000, "INR"), invoiceOverdue(name, "TEST-1", 10000, "INR", 1), milestoneUpdate(name, "Project", "Milestone", "done"), projectUpdate(name, "Project", "Update", "Details"), portalLoginCode("client", "012345", name)];
    for (const tpl of templates) {
      expect(tpl.html).toContain(`Hello ${title} James,`);
      expect(tpl.text).toContain(`Hello ${title} James,`);
      expect(tpl.html).not.toContain(`Hello ${title},`);
    }
  });
  it("carries the title and first name through meeting invitations/confirmations/rescheduling", () => {
    const opts = { clientName: "Mr. James Miller", meetingTitle: "Discussion", meetingType: "video", durationMin: 30, reference: "TEST-MEETING", schedulingLink: "https://example.invalid/meeting", date: "1 Nov 2030", time: "10:00", location: "Online", previousDate: "1 Nov 2030", previousTime: "10:00" };
    for (const tpl of [meetingInvitation(opts), meetingAvailabilityReceived(opts), meetingConfirmed(opts), meetingRescheduleRequest(opts)]) {
      expect(tpl.html).toContain("Mr. James"); expect(tpl.text).toContain("Hi Mr. James,");
      expect(tpl.text).not.toContain("Hi Mr.,"); expect(tpl.html).not.toContain("Mr. Mr.");
    }
  });
  it("escapes HTML in personalized greetings", () => {
    const tpl = clientWelcome('Mr. <img src=x> Miller', 'test@example.invalid', 'test-password');
    expect(tpl.html).toContain("Hello Mr. &lt;img,"); expect(tpl.html).not.toContain('<img,');
  });
});
