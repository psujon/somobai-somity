import prisma from '../api/db.js';

async function main() {
  try {
    const tables: any = await prisma.$queryRaw`SHOW TABLES`;
    console.log('Tables:', JSON.stringify(tables, null, 2));
  } catch (err: any) {
    console.error('ERROR:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
