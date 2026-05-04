import prisma from '../api/db.js';

async function main() {
  console.log('Verifying Prisma Client properties...');
  try {
    const memberCount = await prisma.member.count();
    console.log('prisma.member.count() OK:', memberCount);

    const savingsAgg = await prisma.savingsAccount.aggregate({ _sum: { balance: true } });
    console.log('prisma.savingsAccount.aggregate() OK:', savingsAgg);

    const loanCount = await prisma.loan.count();
    console.log('prisma.loan.count() OK:', loanCount);

    console.log('All key properties verified.');
  } catch (err: any) {
    console.error('ERROR:', err.message);
    // Print all keys on prisma to see what's available
    console.log('Available keys on prisma:', Object.keys(prisma).filter(k => !k.startsWith('$') && !k.startsWith('_')));
  } finally {
    await prisma.$disconnect();
  }
}

main();
