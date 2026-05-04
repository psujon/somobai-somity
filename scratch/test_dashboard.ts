import prisma from '../api/db.js';

async function main() {
  console.log('Testing Dashboard Queries...');
  try {
    const totalMembers = await prisma.member.count();
    console.log('1. Member count OK:', totalMembers);

    const totalSavings = await prisma.savingsAccount.aggregate({ _sum: { balance: true } });
    console.log('2. Savings aggregate OK:', totalSavings);

    const todayDeposits = await prisma.savingsTransaction.aggregate({
      _sum: { amount: true },
      where: { type: "DEPOSIT" }
    });
    console.log('3. SavingsTransaction aggregate OK:', todayDeposits);

    const monthlySavings: any[] = await prisma.$queryRaw`
      SELECT
        DATE_FORMAT(transactionDate, '%Y-%m') AS month,
        SUM(amount) AS totalSavings
      FROM savingstransaction
      WHERE type = 'DEPOSIT'
      GROUP BY month
    `;
    console.log('4. Raw Query (lowercase table) OK:', monthlySavings.length);

    const monthlySavingsUpper: any[] = await prisma.$queryRaw`
      SELECT
        DATE_FORMAT(transactionDate, '%Y-%m') AS month,
        SUM(amount) AS totalSavings
      FROM SavingsTransaction
      WHERE type = 'DEPOSIT'
      GROUP BY month
    `;
    console.log('5. Raw Query (upper table) OK:', monthlySavingsUpper.length);

  } catch (err: any) {
    console.error('ERROR in Dashboard Queries:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
