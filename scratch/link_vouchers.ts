import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting thorough voucher linkage...');

  const vouchers = await prisma.voucher.findMany({
    where: { 
      OR: [
        { memberId: null },
        { depositMonth: null }
      ]
    }
  });

  console.log(`Found ${vouchers.length} vouchers that need linkage or month info.`);

  for (const v of vouchers) {
    // 1. Try to link by voucherNo if possible
    if (v.voucherNo && !v.voucherNo.startsWith('V-')) {
       // already tried this but let's be sure
    }

    // 2. Try to link by parsing description for SAV-xxxxx
    if (v.description && v.description.includes('SAV-')) {
      const match = v.description.match(/SAV-\d+/);
      if (match) {
        const accountNo = match[0];
        const account = await prisma.savingsAccount.findUnique({
          where: { accountNo },
          include: { member: true }
        });
        if (account) {
          // Find matching transaction to get depositMonth if possible
          const tx = await prisma.savingsTransaction.findFirst({
            where: {
              savingsAccountId: account.id,
              amount: v.amount,
              // date within 1 day
              date: {
                gte: new Date(new Date(v.date).getTime() - 24 * 60 * 60 * 1000),
                lte: new Date(new Date(v.date).getTime() + 24 * 60 * 60 * 1000)
              }
            }
          });

          await prisma.voucher.update({
            where: { id: v.id },
            data: {
              savingsAccountId: account.id,
              memberId: account.memberId,
              depositMonth: tx?.depositMonth || v.depositMonth || null
            }
          });
          console.log(`Linked voucher ${v.voucherNo} to account ${accountNo}`);
          continue;
        }
      }
    }

    // 3. Try to link by parsing description for LN-xxxxx
    if (v.description && v.description.includes('LN-')) {
      const match = v.description.match(/LN-\d+/);
      if (match) {
        const loanNo = match[0];
        const loan = await prisma.loan.findUnique({
          where: { loanNo }
        });
        if (loan) {
          await prisma.voucher.update({
            where: { id: v.id },
            data: {
              loanId: loan.id,
              memberId: loan.memberId
            }
          });
          console.log(`Linked voucher ${v.voucherNo} to loan ${loanNo}`);
          continue;
        }
      }
    }
  }

  console.log('Linkage complete.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
