/** LOCAL only. Google official test keys only, never real CAPTCHA challenges.
 * Synthetic employee/linked-editor records are deleted in finally; no mail.
 * Run with AXE_PATH and node --env-file=.env --env-file=.env.local. */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { chromium } from "playwright-core";
const base = process.env.BASE_URL || "http://localhost:4326";
const local = new Set(["localhost", "127.0.0.1", "[::1]"]);
assert(
  local.has(new URL(base).hostname) &&
    local.has(new URL(process.env.DATABASE_URL).hostname),
  "Local origin and database only",
);
assert(
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ===
    "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" &&
    process.env.RECAPTCHA_SECRET_KEY ===
      "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe",
  "Only Google's official testing pair may be automated",
);
const key = `employee-review-${randomBytes(5).toString("hex")}`;
const password = randomBytes(18).toString("base64url");
const prisma = new PrismaClient();
const ids = [];
const dir = ".impeccable/review/employee-portal";
await mkdir(dir, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
await context.route("**/api/analytics/collect", (r) =>
  r.fulfill({ status: 204 }),
);
const checks = [],
  errors = [];
const page = await context.newPage();
page.on("pageerror", (e) => errors.push(e.message));
const ok = (condition, label) => {
  assert(condition, label);
  checks.push(label);
};
async function visit(path) {
  await page.goto(`${base}${path}`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await page.evaluate(() => document.fonts.ready);
}
async function inspect(label, file) {
  ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    `${label}: no overflow`,
  );
  ok((await page.locator("main").count()) === 1, `${label}: exactly one main`);
  if (process.env.AXE_PATH) {
    await page.addScriptTag({ path: process.env.AXE_PATH });
    const failures = await page.evaluate(async () =>
      (
        await window.axe.run(document.body, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
        })
      ).violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    );
    ok(
      failures.length === 0,
      `${label}: WCAG A/AA ${JSON.stringify(failures)}`,
    );
  }
  if (process.env.REUSE_ENTRANCE_CAPTURES && file.startsWith("signin-")) return;
  await page.screenshot({
    path: `${dir}/${file}.png`,
    fullPage: true,
    style: "[inert], [inert] * {visibility:hidden!important}",
  });
}
try {
  const employee = await prisma.employee.create({
    data: {
      employeeCode: key,
      email: `${key}@example.invalid`,
      name: "Synthetic Review Employee",
      position: "Synthetic engineering role",
      department: "Local verification only",
      status: "active",
      joiningDate: new Date("2025-01-01"),
      manager: "SyntheticManager".repeat(8),
      ctc: "Synthetic verification only",
      notes: "Local UI verification, not a real employee",
      leaves: {
        create: [
          {
            type: "casual",
            days: 2,
            fromDate: new Date("2026-10-01"),
            toDate: new Date("2026-10-02"),
            status: "approved",
          },
        ],
      },
      panelUsers: {
        create: {
          email: `${key}@example.invalid`,
          name: "Synthetic Review Employee",
          role: "editor",
          permissions: [],
          passwordHash: await hash(password, 10),
        },
      },
    },
  });
  ids.push(employee.id);
  const foreign = await prisma.employee.create({
    data: {
      employeeCode: `foreign-${key}`,
      email: `foreign-${key}@example.invalid`,
      name: "Foreign synthetic employee",
      position: "Test role",
      department: "Test",
      status: "active",
      joiningDate: new Date("2025-01-01"),
    },
  });
  ids.push(foreign.id);
  await prisma.contentItem.createMany({
    data: [
      {
        authorId: employee.id,
        collection: "insights",
        slug: key,
        title: "Synthetic authored work — local verification",
        data: {},
        active: false,
        contentStatus: "draft",
      },
      {
        authorId: foreign.id,
        collection: "insights",
        slug: `foreign-${key}`,
        title: "FOREIGN-EMPLOYEE-DO-NOT-EXPOSE",
        data: {},
        active: false,
        contentStatus: "draft",
      },
    ],
  });
  await visit("/employee-portal/dashboard");
  ok(
    new URL(page.url()).pathname === "/employee-portal",
    "anonymous employee dashboard redirects",
  );
  for (const width of process.env.REUSE_ENTRANCE_CAPTURES
    ? [1440]
    : [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: width < 700 ? 900 : 1000 });
    await visit("/employee-portal");
    await page
      .locator('#emp-captcha iframe[title="reCAPTCHA"]')
      .waitFor({ timeout: 20000 });
    await inspect(`employee sign-in/${width}`, `signin-${width}`);
    ok(
      await page
        .getByRole("heading", { name: "Employee sign in." })
        .isVisible(),
      `${width}: primary task visible`,
    );
    ok(
      (await page
        .getByRole("navigation", { name: "Choose your portal" })
        .locator('[aria-current="page"]')
        .innerText()) === "Employee portal",
      `${width}: employee portal selected`,
    );
    ok(
      await page
        .locator("footer")
        .innerText()
        .then((t) => !t.includes("Start a project")),
      `${width}: no marketing footer`,
    );
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await visit("/employee-portal");
  await page
    .getByRole("button", { name: "Sign in to employee portal" })
    .click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Check your sign-in details" })
    .waitFor();
  ok(
    (await page.locator("#emp-email").getAttribute("aria-invalid")) === "true",
    "empty email marked invalid",
  );
  await page.getByLabel("Work email", { exact: true }).fill(employee.email);
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
  await page
    .getByRole("button", { name: "Sign in to employee portal" })
    .click();
  ok(
    new URL(page.url()).pathname === "/employee-portal",
    "first login blocked without CAPTCHA",
  );
  await page
    .getByRole("button", {
      name: "Please complete the human verification before signing in.",
    })
    .click();
  ok(
    await page
      .locator("#emp-captcha")
      .evaluate((el) => el === document.activeElement),
    "CAPTCHA error focuses verification, not a valid email",
  );
  await page
    .locator("#emp-captcha")
    .frameLocator('iframe[title="reCAPTCHA"]')
    .getByRole("checkbox")
    .click();
  await page
    .locator('input[name="captchaToken"]')
    .waitFor({ state: "attached" });
  ok(
    Boolean(await page.locator('input[name="captchaToken"]').inputValue()),
    "official Google test widget supplies token",
  );
  await page
    .getByRole("button", { name: "Sign in to employee portal" })
    .click();
  await page.waitForURL("**/employee-portal/dashboard", { timeout: 60000 });
  ok(
    new URL(page.url()).pathname === "/employee-portal/dashboard",
    "employee login verifies test token server-side and opens dashboard",
  );
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: width < 700 ? 900 : 1000 });
    await visit("/employee-portal/dashboard");
    await inspect(`employee dashboard/${width}`, `dashboard-${width}`);
    ok(
      (await page.locator("main").innerText()).includes(
        "Synthetic authored work",
      ),
      `${width}: own content present`,
    );
    ok(
      !(await page.locator("main").innerText()).includes(
        "FOREIGN-EMPLOYEE-DO-NOT-EXPOSE",
      ),
      `${width}: foreign authored work private`,
    );
    if (width === 1440 || width === 390)
      await page.screenshot({
        path: `${dir}/${width === 1440 ? "desktop" : "mobile"}.png`,
        fullPage: true,
        style: "[inert], [inert] * {visibility:hidden!important}",
      });
  }
  await prisma.employeeLeave.deleteMany({ where: { employeeId: employee.id } });
  await prisma.contentItem.deleteMany({ where: { authorId: employee.id } });
  await visit("/employee-portal/dashboard");
  ok(
    await page
      .getByRole("heading", { name: "No leave records yet." })
      .isVisible(),
    "honest leave empty state",
  );
  ok(
    await page
      .getByRole("heading", { name: "Nothing authored yet." })
      .isVisible(),
    "honest authored-content empty state",
  );
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.waitForURL("**/employee-portal");
  ok(
    !(await context.cookies()).some((c) => c.name === "savo_employee"),
    "employee sign-out removes session cookie",
  );
  await visit("/employee-portal?e=Invalid%20%25%20sign-in");
  ok(
    await page
      .getByRole("alert")
      .filter({ hasText: "Invalid % sign-in" })
      .isVisible(),
    "already decoded percent error renders without crashing",
  );
  await context.route("**/api/captcha/required?portal=employee", (r) =>
    r.fulfill({ status: 503, contentType: "application/json", body: "{}" }),
  );
  await visit("/employee-portal");
  ok(
    await page
      .getByText("Human verification is temporarily unavailable.", {
        exact: false,
      })
      .isVisible(),
    "status outage explains recovery",
  );
  ok(
    await page
      .getByRole("button", { name: "Sign in to employee portal" })
      .isDisabled(),
    "status outage cannot silently bypass verification",
  );
  await context.unroute("**/api/captcha/required?portal=employee");
  await visit("/employee-portal");
  ok(
    await page
      .getByRole("button", { name: "Sign in to employee portal" })
      .isEnabled(),
    "verification status recovers on reload",
  );
  ok(errors.length === 0, `no runtime errors: ${errors.join(";")}`);
  await writeFile(
    `${dir}/report.json`,
    JSON.stringify(
      {
        checks,
        errors,
        localOnly: true,
        synthetic: true,
        captcha: "Google official test pair; no real challenge solved",
      },
      null,
      2,
    ),
  );
  console.log(
    `PASS: ${checks.length} assertions; employee entrance, CAPTCHA, dashboard, ownership, sign-out and recovery.`,
  );
} finally {
  await browser.close();
  await prisma.contentItem.deleteMany({ where: { authorId: { in: ids } } });
  await prisma.adminUser.deleteMany({ where: { employeeId: { in: ids } } });
  await prisma.employee.deleteMany({ where: { id: { in: ids } } });
  await prisma.$disconnect();
}
