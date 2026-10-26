import { describe, expect, it, vi } from "vitest";
import { ownerSocialImage } from "@/lib/social-images";

vi.mock("@/components/portal/entrance", () => ({ PortalEntrance: () => null }));
vi.mock("@/lib/client-auth", () => ({ getClientUser: vi.fn() }));
vi.mock("@/app/(site)/portal/login-card", () => ({ PortalLoginCard: () => null }));
vi.mock("@/app/(site)/employee-portal/login-form", () => ({ EmployeeLoginForm: () => null }));

import { metadata as employee } from "@/app/(site)/employee-portal/page";
import { metadata as client } from "@/app/(site)/portal/page";

describe("portal link-preview metadata", () => {
  it.each([
    { metadata: employee, key: "employeePortal" as const, path: "/employee-portal" },
    { metadata: client, key: "clientPortal" as const, path: "/portal" },
  ])("uses the supplied $key artwork for Open Graph and Twitter", ({ metadata, key, path }) => {
    const image = ownerSocialImage(key);
    expect(metadata.openGraph).toMatchObject({ url: path, images: [image] });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image", images: [image] });
  });

  it("keeps the employee entrance out of search indexing", () => {
    expect(employee.robots).toEqual({ index: false, follow: false });
  });
});
