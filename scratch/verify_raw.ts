import prisma from '../api/db.js';

async function main() {
  console.log('Verifying Raw Queries...');
  try {
    const savings: any[] = await prisma.$queryRaw`SELECT count(*) as count FROM SavingsTransaction`;
    console.log('Raw query (SavingsTransaction) OK:', savings[0].count);

    const loans: any[] = await prisma.$queryRaw`SELECT count(*) as count FROM Loan`;
    console.log('Raw query (Loan) OK:', loans[0].count);

  } catch (err: any) {
    console.error('ERROR in Raw Query:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
