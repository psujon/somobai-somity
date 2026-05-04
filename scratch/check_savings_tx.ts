import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const txs = await prisma.savingsTransaction.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' }
  });

  console.log(JSON.stringify(txs, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
