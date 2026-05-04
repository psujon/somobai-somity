import prisma from '../api/db.js';

async function main() {
  console.log('Testing Member Statement Query...');
  try {
    const members = await prisma.member.findMany({ take: 1 });
    if (members.length === 0) {
      console.log('No members found to test.');
      return;
    }
    const memberId = members[0].id;
    console.log('Testing for member ID:', memberId);

    const accounts = await prisma.savingsAccount.findMany({
      where: { memberId },
      include: {
        member: true,
        transactions: true,
      },
    });

    console.log('Query successful. Accounts found:', accounts.length);
    if (accounts.length > 0) {
      console.log('Transactions in first account:', accounts[0].transactions.length);
    }
  } catch (err: any) {
    console.error('ERROR:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
