/** Isolated LOCAL-only client journey verification. Never runs against live
 * origins/databases. Creates synthetic records, then removes them in finally.
 * Start a production preview with MAIL_DELIVERY_MODE=off. Run:
 * node --env-file=.env --env-file=.env.local scripts/verify-portal.mjs
 */
import assert from "node:assert/strict";
import { randomBytes, createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { chromium } from "playwright-core";

const base = process.env.BASE_URL || "http://localhost:4326";
const localHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);
assert(
  localHosts.has(new URL(base).hostname),
  "Only a local preview may be tested",
);
assert(
  localHosts.has(new URL(process.env.DATABASE_URL).hostname),
  "Only a local database may receive fixtures",
);
assert(
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ===
    "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" &&
    process.env.RECAPTCHA_SECRET_KEY ===
      "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe",
  "Automated CAPTCHA checks require Google's official local-only test pair; never a real challenge",
);
const prisma = new PrismaClient();
const key = `portal-review-${randomBytes(5).toString("hex")}`;
const password = randomBytes(18).toString("base64url");
const owners = [];
const checks = [];
const browserErrors = [];
const dir = ".impeccable/review/portal-v2";
await mkdir(dir, { recursive: true });
const browser = await chromium.launch();
const ok = (condition, label) => {
  assert(condition, label);
  checks.push(label);
};
async function context() {
  const c = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  await c.route("**/api/analytics/collect", (r) => r.fulfill({ status: 204 }));
  c.on("page", (p) => p.on("pageerror", (e) => browserErrors.push(e.message)));
  return c;
}
async function session(c, clientId) {
  const token = randomBytes(32).toString("hex");
  await prisma.clientSession.create({
    data: {
      clientId,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      expiresAt: new Date(Date.now() + 3600000),
    },
  });
  await c.addCookies([
    {
      name: "savo_client",
      value: token,
      url: base,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}
async function visit(page, path) {
  await page.goto(`${base}${path}`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await page.evaluate(() => document.fonts.ready);
}
async function capture(page, path) {
  // Chromium full-page captures can paint translated, CLOSED fixed drawers
  // outside the original viewport. Hide only inert content during capture;
  // this does not open/close any UI or hide active controls.
  await page.screenshot({
    path,
    fullPage: true,
    style: "[inert], [inert] * { visibility: hidden !important; }",
  });
}
async function geometry(page, label) {
  const info = await page.evaluate(() => ({
    width: innerWidth,
    scroll: document.documentElement.scrollWidth,
    font: getComputedStyle(document.body).fontFamily,
    main: document.querySelector("main")?.getBoundingClientRect().width,
  }));
  ok(
    info.scroll <= info.width + 1,
    `${label}: no document overflow (${info.scroll}/${info.width})`,
  );
  ok(info.main > 0, `${label}: main visible`);
  if (process.env.AXE_PATH) {
    await page.addScriptTag({ path: process.env.AXE_PATH });
    const violations = await page.evaluate(async () => {
      const result = await window.axe.run(
        document.querySelector("#portal-main") ||
          document.querySelector("#main"),
        { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] } },
      );
      return result.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => n.target),
      }));
    });
    ok(
      violations.length === 0,
      `${label}: WCAG A/AA scan ${JSON.stringify(violations)}`,
    );
  }
}
try {
  const data = {
    email: `${key}@example.invalid`,
    passwordHash: await hash(password, 10),
    name: "Synthetic Review Client",
    company: "Synthetic client workspace — local verification only",
  };
  const client = await prisma.clientUser.create({ data });
  owners.push(client.id);
  const empty = await prisma.clientUser.create({
    data: {
      ...data,
      email: `empty-${key}@example.invalid`,
      name: "Synthetic Empty Client",
    },
  });
  owners.push(empty.id);
  const project = await prisma.clientProject.create({
    data: {
      clientId: client.id,
      code: `${key}-PROJECT`,
      title: "Synthetic product delivery",
      summary:
        "Local verification record. A responsive client workspace with real milestones and invoices; this is not a real engagement.",
      status: "in_progress",
      progress: 62,
      startDate: new Date("2026-09-01"),
      dueDate: new Date("2026-11-01"),
      milestones: {
        create: [
          { title: "Synthetic discovery and scope", status: "done", order: 1 },
          {
            title: "Synthetic build and integration",
            status: "in_progress",
            order: 2,
            dueDate: new Date("2026-10-20"),
          },
          { title: "Synthetic release review", status: "pending", order: 3 },
        ],
      },
      updates: {
        create: [
          {
            title: "Synthetic delivery update",
            body:
              "Synthetic test update with a long link-like identifier: " +
              "long-reference-".repeat(8),
          },
        ],
      },
    },
  });
  await prisma.clientProject.create({
    data: {
      clientId: client.id,
      code: `key-${key}`,
      title: "Synthetic".repeat(12),
      summary: "Long unbroken title coverage.",
      status: "delivered",
      progress: 100,
    },
  });
  const foreign = await prisma.clientProject.create({
    data: {
      clientId: empty.id,
      code: `foreign-${key}`,
      title: "DO-NOT-EXPOSE-FOREIGN",
      status: "planning",
    },
  });
  await prisma.invoice.createMany({
    data: [
      {
        clientId: client.id,
        projectId: project.id,
        number: `${key}-INR`,
        currency: "INR",
        amount: 125000,
        status: "sent",
        dueDate: new Date("2026-11-01"),
        notes: "Synthetic invoice — not payable.",
      },
      {
        clientId: client.id,
        projectId: project.id,
        number: `${key}-USD`,
        currency: "USD",
        amount: 85000,
        status: "paid",
        paidAt: new Date("2026-10-01"),
      },
      {
        clientId: client.id,
        projectId: project.id,
        number: `${key}-CANCELLED`,
        currency: "INR",
        amount: 9999999,
        status: "cancelled",
      },
      {
        clientId: client.id,
        projectId: project.id,
        number: `${key}-DRAFT-DO-NOT-EXPOSE`,
        currency: "INR",
        amount: 9999999,
        status: "draft",
      },
      {
        clientId: client.id,
        projectId: foreign.id,
        number: `${key}-NO-LINK`,
        currency: "USD",
        amount: 10000,
        status: "overdue",
      },
    ],
  });

  const anonymous = await context();
  const page = await anonymous.newPage();
  await visit(page, "/portal/dashboard");
  ok(
    new URL(page.url()).pathname === "/portal",
    "anonymous dashboard redirects",
  );
  for (const width of process.env.REUSE_ENTRANCE_CAPTURES
    ? [1440]
    : [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: width < 700 ? 900 : 1000 });
    await visit(page, "/portal");
    await geometry(page, `sign-in/${width}`);
    if (!process.env.REUSE_ENTRANCE_CAPTURES)
      await capture(page, `${dir}/signin-${width}.png`);
    ok(
      await page.getByRole("heading", { name: "Client sign in." }).isVisible(),
      `sign-in/${width}: primary task visible`,
    );
    ok(
      await page.getByLabel("Email address", { exact: true }).isVisible(),
      `sign-in/${width}: email reachable`,
    );
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "Sign in to your workspace" }).click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Check your sign-in details" })
    .waitFor();
  ok(
    (await page
      .getByLabel("Email address", { exact: true })
      .getAttribute("aria-invalid")) === "true",
    "empty submission marks email invalid",
  );
  await page.getByRole("button", { name: "Enter the email address." }).click();
  ok(
    await page
      .getByLabel("Email address", { exact: true })
      .evaluate((el) => el === document.activeElement),
    "error summary focuses email",
  );
  await page.getByLabel("Email address", { exact: true }).fill(data.email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Show password" }).click();
  ok(
    (await page
      .getByLabel("Password", { exact: true })
      .getAttribute("type")) === "text",
    "show password works",
  );
  await page.getByRole("button", { name: "Hide password" }).click();
  ok(
    (await page
      .getByLabel("Password", { exact: true })
      .getAttribute("type")) === "password",
    "hide password works",
  );
  await page.getByRole("button", { name: "Sign in to your workspace" }).click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Check your sign-in details" })
    .waitFor();
  ok(
    new URL(page.url()).pathname === "/portal",
    "first sign-in is blocked without human verification",
  );
  await page
    .getByRole("button", {
      name: "Please complete the human verification before signing in.",
    })
    .click();
  ok(
    await page
      .locator("#pt-captcha")
      .evaluate((el) => el === document.activeElement),
    "verification error focuses the verification group",
  );
  await page
    .locator("#pt-captcha")
    .frameLocator('iframe[title="reCAPTCHA"]')
    .getByRole("checkbox")
    .click();
  await page
    .locator('input[name="captchaToken"]')
    .waitFor({ state: "attached" });
  ok(
    Boolean(await page.locator('input[name="captchaToken"]').inputValue()),
    "official Google test widget returns a token",
  );
  await page.getByRole("button", { name: "Sign in to your workspace" }).click();
  await page.waitForURL("**/portal/dashboard", { timeout: 60000 });
  ok(
    new URL(page.url()).pathname === "/portal/dashboard",
    "real local sign-in with Google test verification redirects to overview",
  );
  const routes = [
    { path: "/portal/dashboard", name: "dashboard" },
    { path: "/portal/projects", name: "projects" },
    { path: `/portal/projects/${project.id}`, name: "project-detail" },
    { path: "/portal/invoices", name: "invoices" },
  ];
  for (const { path, name } of routes) {
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: width < 700 ? 900 : 1000 });
      await visit(page, path);
      await geometry(page, `${name}/${width}`);
      ok(
        (await page
          .getByRole("navigation", { name: "Client workspace" })
          .locator('[aria-current="page"]')
          .count()) === 1,
        `${name}/${width}: active navigation`,
      );
      ok(
        !(await page.locator("main").innerText()).includes(
          "DRAFT-DO-NOT-EXPOSE",
        ),
        `${name}/${width}: drafts private`,
      );
      ok(
        !(await page.locator("main").innerText()).includes(
          "DO-NOT-EXPOSE-FOREIGN",
        ),
        `${name}/${width}: foreign project private`,
      );
      await capture(page, `${dir}/${name}-${width}.png`);
      if (name === "dashboard" && width === 1440)
        await capture(page, `${dir}/desktop.png`);
      if (name === "dashboard" && width === 390)
        await capture(page, `${dir}/mobile.png`);
    }
  }
  await visit(page, "/portal/projects");
  await page.getByLabel("Search projects").fill("no-match");
  ok(
    await page
      .getByRole("heading", { name: "No matching projects." })
      .isVisible(),
    "project search empty feedback",
  );
  await page.getByRole("button", { name: "Clear filters" }).click();
  await page.getByLabel("Status", { exact: true }).selectOption("delivered");
  ok(
    (await page.getByRole("status").innerText()).includes("1 of 2"),
    "project status filter",
  );
  await visit(page, "/portal/invoices");
  ok(
    (await page
      .getByRole("region", { name: "INR billing summary" })
      .count()) === 1,
    "INR separately summarised",
  );
  ok(
    (await page
      .getByRole("region", { name: "USD billing summary" })
      .count()) === 1,
    "USD separately summarised",
  );
  await page.getByLabel("Status", { exact: true }).selectOption("paid");
  ok(
    (await page.getByRole("status").innerText()).includes("1 of 4"),
    "invoice status filter excludes drafts",
  );
  await page.getByRole("button", { name: "Clear filters" }).click();
  await page.getByLabel("Search invoices").fill("no-match");
  ok(
    await page
      .getByRole("heading", { name: "No matching invoices." })
      .isVisible(),
    "invoice search empty feedback",
  );
  await visit(page, `/portal/projects/${foreign.id}`);
  ok(
    await page
      .getByRole("heading", { name: "Project not available." })
      .isVisible(),
    "foreign project has scoped unavailable state",
  );
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.waitForURL("**/portal");
  ok(
    !(await anonymous.cookies()).some((c) => c.name === "savo_client"),
    "sign-out removes cookie",
  );
  await anonymous.close();
  const emptyContext = await context();
  await session(emptyContext, empty.id);
  const emptyPage = await emptyContext.newPage();
  // Remove only this fixture's project to exercise truly empty records.
  await prisma.clientProject.delete({ where: { id: foreign.id } });
  for (const path of [
    "/portal/dashboard",
    "/portal/projects",
    "/portal/invoices",
  ]) {
    await emptyPage.setViewportSize({ width: 390, height: 900 });
    await visit(emptyPage, path);
    await geometry(emptyPage, `empty-${path}`);
    await capture(emptyPage, `${dir}/empty-${path.split("/").pop()}.png`);
  }
  await emptyContext.close();
  const nojs = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 900 },
  });
  const nojsPage = await nojs.newPage();
  await visit(nojsPage, "/portal");
  ok(
    await nojsPage.getByLabel("Email address", { exact: true }).isVisible(),
    "no-JS sign-in fields present",
  );
  ok(
    await nojsPage
      .getByRole("region", { name: "Client sign in." })
      .getByRole("link", { name: "Contact the team", exact: true })
      .isVisible(),
    "no-JS human recovery available",
  );
  await nojs.close();
  ok(
    browserErrors.length === 0,
    `no browser runtime errors: ${browserErrors.join("; ")}`,
  );
  await writeFile(
    `${dir}/report.json`,
    JSON.stringify(
      { checks, errors: browserErrors, synthetic: true, localOnly: true },
      null,
      2,
    ),
  );
  console.log(
    `PASS: ${checks.length} assertions; sign-in, all workspace routes, filters, currency totals, access boundaries, sign-out and empty states. Local fixtures only.`,
  );
} finally {
  await browser.close();
  await prisma.clientUser.deleteMany({ where: { id: { in: owners } } });
  await prisma.$disconnect();
}
