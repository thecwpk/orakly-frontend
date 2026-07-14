import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const m = await prisma.market.findUnique({
  where: { slug: "super-bowl-chiefs-2027" },
  select: { slug: true, title: true, onChainAddress: true, chainId: true, status: true },
});
console.log(JSON.stringify(m, null, 2));
await prisma.$disconnect();
