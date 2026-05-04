import prisma from './src/utils/prisma.js';

async function test() {
  try {
    const count = await prisma.account.count();
    console.log('Account count:', count);
    console.log('SUCCESS: prisma.account exists');
  } catch (err) {
    console.error('FAILURE:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
