import prisma from '../api/db.js';

async function main() {
  const p = prisma as any;
  try {
    const cats = await p.accountCategory.findMany();
    console.log('AccountCategory access OK. Count:', cats.length);
    
    // Try creating one
    const test = await p.accountCategory.create({
      data: { name: 'Test Category ' + Date.now(), type: 'INCOME' }
    });
    console.log('Create OK:', test);
    
    // Delete it
    await p.accountCategory.delete({ where: { id: test.id } });
    console.log('Delete OK');
  } catch (err: any) {
    console.error('ERROR:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
