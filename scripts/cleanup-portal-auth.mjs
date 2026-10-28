/** Expired authentication artifacts only; never accounts, sessions or mail.
 * Load the deployment environment explicitly. Dry-run unless --apply is given.
 * node --env-file=.env.production scripts/cleanup-portal-auth.mjs --apply
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const expiresAt = { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) };
try {
  if (process.argv.includes("--apply")) {
    const [challenges, throttles] = await prisma.$transaction([
      prisma.portalLoginChallenge.deleteMany({ where: { expiresAt } }),
      prisma.portalAuthThrottle.deleteMany({ where: { expiresAt } }),
    ]);
    console.log(JSON.stringify({ event: "portal_auth.cleanup", challenges: challenges.count, throttles: throttles.count }));
  } else {
    console.log(JSON.stringify({ dryRun: true,
      challenges: await prisma.portalLoginChallenge.count({ where: { expiresAt } }),
      throttles: await prisma.portalAuthThrottle.count({ where: { expiresAt } }),
    }));
  }
} catch {
  console.error("Portal authentication cleanup failed; check deployment configuration and database availability.");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
