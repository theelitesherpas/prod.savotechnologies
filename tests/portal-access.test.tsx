import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { enforceLoginCaptcha, loginCaptchaRequired } from "@/lib/captcha";
import {
  CaptchaGate,
  captchaBlocked,
  useCaptcha,
} from "@/components/shared/captcha";
import {
  PortalSiteFooter,
  PortalSiteHeader,
  PortalMarketingBoundary,
  SiteInteractionProviders,
} from "@/components/portal/site-chrome";
import EmployeePortalPage from "@/app/(site)/employee-portal/page";

const route = vi.hoisted(() => ({ pathname: "/employee-portal" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(),
  rateCount: () => 0,
  clearRateLimit: vi.fn(),
}));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));
vi.mock("@/app/(site)/employee-portal/actions", () => ({
  employeeSignInAction: vi.fn(),
}));

beforeEach(() => {
  route.pathname = "/employee-portal";
  vi.stubEnv("NEXT_PUBLIC_RECAPTCHA_SITE_KEY", "test-site");
  vi.stubEnv("RECAPTCHA_SECRET_KEY", "test-secret");
  vi.stubGlobal("fetch", vi.fn());
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function InitialGate({ portal }: { portal: "employee" | "client" }) {
  return <CaptchaGate captcha={useCaptcha(portal)} />;
}

describe("mandatory portal human verification", () => {
  it.each(["client", "employee"] as const)(
    "requires %s verification on the first attempt, independently of failures",
    async (portal) => {
      expect(loginCaptchaRequired(portal, "test-ip")).toBe(true);
      expect(await enforceLoginCaptcha(portal, "test-ip", null)).toEqual({
        ok: false,
        captchaRequired: true,
      });
      expect(fetch).not.toHaveBeenCalled();
      expect(renderToStaticMarkup(<InitialGate portal={portal} />)).toContain(
        "Human verification",
      );
    },
  );
  it.each(["client", "employee"] as const)(
    "fails closed for %s without configured keys",
    async (portal) => {
      vi.stubEnv("NEXT_PUBLIC_RECAPTCHA_SITE_KEY", "");
      vi.stubEnv("RECAPTCHA_SECRET_KEY", "");
      expect(
        (await enforceLoginCaptcha(portal, "test-ip", "test-token-12345")).ok,
      ).toBe(false);
      expect(renderToStaticMarkup(<InitialGate portal={portal} />)).toContain(
        "temporarily unavailable",
      );
      expect(fetch).not.toHaveBeenCalled();
    },
  );
  it("preserves the admin's existing progressive policy", async () => {
    expect(loginCaptchaRequired("admin", "test-ip")).toBe(false);
    expect(await enforceLoginCaptcha("admin", "test-ip", null)).toEqual({
      ok: true,
    });
  });
  it.each(["client", "employee"])(
    "only accepts a %s token after server-side provider success",
    async (portal) => {
      vi.mocked(fetch).mockResolvedValueOnce(Response.json({ success: false }));
      expect(
        (await enforceLoginCaptcha(portal, "test-ip", "test-token-12345")).ok,
      ).toBe(false);
      vi.mocked(fetch).mockResolvedValueOnce(Response.json({ success: true }));
      expect(
        await enforceLoginCaptcha(portal, "test-ip", "test-token-12345"),
      ).toEqual({ ok: true });
      expect(String(vi.mocked(fetch).mock.calls[0][1]?.body)).toContain(
        "response=test-token-12345",
      );
    },
  );
  it("blocks unavailable and unsolved gates, allows a solved gate", () => {
    const gate = {
      required: true,
      token: null,
      setToken: vi.fn(),
      reset: vi.fn(),
      refresh: vi.fn(),
    };
    expect(captchaBlocked(gate)).toBe(true);
    expect(captchaBlocked({ ...gate, token: "solved" })).toBe(false);
    expect(
      captchaBlocked({ ...gate, token: "solved", unavailable: true }),
    ).toBe(true);
  });
});

describe("focused access design", () => {
  it("does not mount sales providers or their hidden CAPTCHA widgets during sign-in", () => {
    expect(
      renderToStaticMarkup(
        <SiteInteractionProviders
          testimonials={[]}
          metrics={[]}
          enabled={false}
        >
          <p>Portal content</p>
        </SiteInteractionProviders>,
      ),
    ).toBe("<p>Portal content</p>");
  });
  it("renders a professional employee entrance without nested main or a second URI decode", async () => {
    const html = renderToStaticMarkup(
      await EmployeePortalPage({
        searchParams: Promise.resolve({ e: "Invalid % sign-in" }),
      }),
    );
    expect(html).toContain("Welcome back.");
    expect(html).toContain("Remember me");
    expect(html).toContain("Sign in with email OTP");
    expect(html).not.toContain("Continue with Google");
    expect(html).not.toContain("Register now");
    expect(html).toContain("Invalid % sign-in");
    expect(html).toContain("Contact HR");
    expect(html).toContain("Human verification");
    expect(html).toMatch(/autocomplete="username"/i);
    expect(html).toContain("Employee workspace");
    expect(html).toContain("Illustration · no account data");
    expect(html).not.toContain("<main");
  });
  it.each(["/portal", "/employee-portal", "/employee-portal/dashboard"])(
    "replaces marketing chrome only for %s",
    (path) => {
      route.pathname = path;
      expect(
        renderToStaticMarkup(
          <PortalSiteHeader>
            <p>Sales header</p>
          </PortalSiteHeader>,
        ),
      ).toContain("Back to website");
      expect(
        renderToStaticMarkup(
          <PortalSiteFooter>
            <p>Sales footer</p>
          </PortalSiteFooter>,
        ),
      ).not.toContain("Sales footer");
      expect(
        renderToStaticMarkup(
          <PortalMarketingBoundary>
            <p>Sales assistant</p>
          </PortalMarketingBoundary>,
        ),
      ).toBe("");
    },
  );
  it.each(["/", "/contact", "/portals", "/employee-portals"])(
    "preserves website chrome on %s",
    (path) => {
      route.pathname = path;
      expect(
        renderToStaticMarkup(
          <PortalSiteHeader>
            <p>Sales header</p>
          </PortalSiteHeader>,
        ),
      ).toContain("Sales header");
      expect(
        renderToStaticMarkup(
          <PortalSiteFooter>
            <p>Sales footer</p>
          </PortalSiteFooter>,
        ),
      ).toContain("Sales footer");
      expect(
        renderToStaticMarkup(
          <PortalMarketingBoundary>
            <p>Sales assistant</p>
          </PortalMarketingBoundary>,
        ),
      ).toContain("Sales assistant");
    },
  );
});
