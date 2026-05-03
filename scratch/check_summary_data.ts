import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const summaryCount = await (prisma as any).monthlySavingsSummary.count();
    console.log('Total MonthlySavingsSummary records:', summaryCount);
    
    const allSummaries = await (prisma as any).monthlySavingsSummary.findMany();
    console.log('All summaries:', JSON.stringify(allSummaries, null, 2));
  } catch (error) {
    console.error('Error checking table:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
