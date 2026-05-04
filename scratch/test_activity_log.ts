import prisma from '../api/db.js';

async function main() {
  console.log('Testing ActivityLog creation...');
  try {
    const users = await prisma.user.findMany({ take: 1 });
    if (users.length === 0) {
      console.log('No users found to test.');
      return;
    }
    const userId = users[0].id;
    console.log('Testing for user ID:', userId);

    const log = await prisma.activityLog.create({
      data: {
        userId,
        type: "LOGIN",
        loginTime: "Test Log " + new Date().toISOString(),
      },
    });

    console.log('Log created successfully with ID:', log.id);
    
    // Cleanup
    await prisma.activityLog.delete({ where: { id: log.id } });
    console.log('Test log deleted.');
    
  } catch (err: any) {
    console.error('ERROR:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
