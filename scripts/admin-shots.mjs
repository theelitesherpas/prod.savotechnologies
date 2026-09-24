/**
 * Admin console visual verification — drives Chrome via playwright-core.
 * Logs in, seeds demo data through the real forms/API, imports collection
 * defaults through the UI, and captures desktop + mobile screenshots.
 */
import { chromium } from "playwright-core";
import fs from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:4312";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = ".impeccable/review";
fs.mkdirSync(OUT, { recursive: true });

// Admin credentials from .env
const env = fs.readFileSync(".env", "utf8");
const email = env.match(/ADMIN_EMAIL="?([^"\n]+)"?/)?.[1];
const password = env.match(/ADMIN_PASSWORD="?([^"\n]+)"?/)?.[1];

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

const shot = async (name, opts = {}) => {
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: opts.full ?? false });
  console.log("📸", name);
};

/* ---- seed enquiries (start-project + careers with details) ---- */
await fetch(`${BASE}/api/enquiries`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Meera Krishnan",
    email: "meera@brightlabs.io",
    company: "Bright Labs",
    projectType: "AI / AI Agent",
    budget: "$40k – $100k",
    message: "We need a customer support agent integrated with our CRM, with human handoff and monthly quality reporting.",
    website: "",
    source: "contact",
    details: { form: "contact", topic: "New project" },
  }),
});

await fetch(`${BASE}/api/enquiries`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Aarav Sharma",
    email: "aarav.sharma@gmail.com",
    phone: "+91 98765 43210",
    projectType: "AI / ML Engineer",
    message: "Application from the careers form.",
    website: "",
    source: "careers:ai-ml-engineer",
    details: {
      form: "careers",
      role: "AI / ML Engineer",
      city: "Pune",
      experience: "3 to 5 years",
      notice: "30 days",
      expectedCtc: "₹24L to ₹30L",
      skills: ["Python", "LLMs", "RAG", "PyTorch"],
      links: "github.com/aaravcodes",
      resume: "",
    },
  }),
});

/* ---- login ---- */
await page.goto(`${BASE}/admin/login`, { waitUntil: "load" });
await page.fill("#email", email);
await page.fill("#password", password);
await page.click("button[type=submit]");
await page.waitForURL("**/admin", { timeout: 15000 });
await page.waitForTimeout(800);
await shot("login-landing-dashboard");

/* ---- dashboard ---- */
await shot("dashboard", { full: true });

/* ---- enquiries inbox ---- */
await page.goto(`${BASE}/admin/enquiries`, { waitUntil: "load" });
await page.waitForTimeout(600);
await shot("enquiries-inbox");

/* ---- enquiry detail (careers application with structured data) ---- */
await page.click("tbody tr:first-child a");
await page.waitForTimeout(600);
await shot("enquiry-detail", { full: true });

/* ---- content: import insights defaults via UI ---- */
await page.goto(`${BASE}/admin/content/insights`, { waitUntil: "load" });
await page.waitForTimeout(500);
const importBtn = page.getByRole("button", { name: "Import defaults" });
if (await importBtn.count()) {
  await shot("collection-insights-empty");
  await importBtn.first().click();
  await page.waitForTimeout(1500);
}
await shot("collection-insights-populated");

/* ---- collection edit form ---- */
await page.click("tbody tr:first-child td:nth-child(2) a");
await page.waitForTimeout(600);
await shot("collection-insights-edit", { full: true });

/* ---- careers collection ---- */
await page.goto(`${BASE}/admin/content/careers`, { waitUntil: "load" });
await page.waitForTimeout(400);
const importCareers = page.getByRole("button", { name: "Import defaults" });
if (await importCareers.count()) {
  await importCareers.first().click();
  await page.waitForTimeout(1500);
}
await shot("collection-careers");

/* ---- new item form ---- */
await page.goto(`${BASE}/admin/content/careers/new`, { waitUntil: "load" });
await page.waitForTimeout(400);
await shot("collection-careers-new", { full: true });

/* ---- services + industries ---- */
await page.goto(`${BASE}/admin/services`, { waitUntil: "load" });
await page.waitForTimeout(400);
await shot("services");
await page.goto(`${BASE}/admin/industries`, { waitUntil: "load" });
await page.waitForTimeout(400);
await shot("industries");

/* ---- settings + users + audit ---- */
await page.goto(`${BASE}/admin/settings`, { waitUntil: "load" });
await page.waitForTimeout(400);
await shot("settings");
await page.goto(`${BASE}/admin/users`, { waitUntil: "load" });
await page.waitForTimeout(400);
await shot("users");
await page.goto(`${BASE}/admin/audit`, { waitUntil: "load" });
await page.waitForTimeout(400);
await shot("audit");

/* ---- sidebar collapsed rail ---- */
await page.click('button[aria-label="Toggle sidebar"]');
await page.waitForTimeout(500);
await page.goto(`${BASE}/admin`, { waitUntil: "load" });
await page.waitForTimeout(600);
await shot("dashboard-rail-collapsed");

/* ---- mobile ---- */
const mob = await ctx.newPage();
await mob.setViewportSize({ width: 390, height: 844 });
await mob.goto(`${BASE}/admin`, { waitUntil: "load" });
await mob.waitForTimeout(700);
await mob.screenshot({ path: `${OUT}/mobile-dashboard.png` });
await mob.click('button[aria-label="Open navigation"]');
await mob.waitForTimeout(500);
await mob.screenshot({ path: `${OUT}/mobile-drawer.png` });
console.log("📸 mobile");

if (errors.length) console.log("CONSOLE ERRORS:\n" + errors.slice(0, 10).join("\n"));
await browser.close();
console.log("done");
