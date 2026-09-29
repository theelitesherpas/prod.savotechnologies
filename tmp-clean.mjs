import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const r = await p.adminSession.deleteMany({ where: { tokenHash: { startsWith: "2f0f5e" } } });
// delete the crafted test token precisely
await p.$disconnect();
