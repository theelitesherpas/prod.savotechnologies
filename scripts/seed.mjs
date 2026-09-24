/**
 * Database seed — safe to run repeatedly (idempotent).
 *
 *   DATABASE_URL=... npm run db:seed
 *
 * Seeds:
 *   - the admin user from ADMIN_EMAIL / ADMIN_PASSWORD (fail if unset in prod)
 *
 * Services/industries are NOT seeded here: the public site falls back to
 * the version-1 constants, and operators materialize editable rows via the
 * admin panel's "Import version-1 defaults" action.
 *
 * Never logs credentials.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

const prisma = new PrismaClient();

function slugify(t) {
  return t.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function main() {
  // ── Admin user ──────────────────────────────────────────────
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required in production.");
    }
    console.log("ℹ ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin user.");
  } else {
    if (password.length < 10) throw new Error("ADMIN_PASSWORD must be at least 10 characters.");
    const existing = await prisma.adminUser.findUnique({ where: { email } });
    if (existing) {
      console.log(`✓ admin user already exists (${email})`);
    } else {
      const passwordHash = await bcrypt.hash(password, 12);
      await prisma.adminUser.create({
        data: { email, passwordHash, name: "SAVO Admin", role: "admin" },
      });
      console.log(`✓ created admin user (${email})`);
    }
  }

  // ── Prune expired sessions (housekeeping) ───────────────────
  const pruned = await prisma.adminSession.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  if (pruned.count) console.log(`✓ pruned ${pruned.count} expired sessions`);
  else console.log("✓ no expired sessions");

  // Rotate the dev salt reminder so it isn't the default forever.
  if (process.env.ENQUIRY_IP_SALT === "savo-dev-salt" && process.env.NODE_ENV === "production") {
    console.warn(`⚠ ENQUIRY_IP_SALT is the default — set a strong random value (e.g. ${randomBytes(24).toString("hex")}).`);
  }
}

main()
  .catch((err) => {
    console.error("Seed failed:", err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
