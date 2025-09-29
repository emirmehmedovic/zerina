import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function promoteUserToAdmin(email: string) {
  try {
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`User with email ${email} not found.`);
      return;
    }

    console.log(`Found user: ${user.name} (${user.email}), current role: ${user.role}`);

    // Update the user's role to ADMIN
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'ADMIN' },
    });

    console.log(`User ${updatedUser.name} (${updatedUser.email}) has been promoted to ${updatedUser.role} role.`);
  } catch (error) {
    console.error('Error promoting user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Email to promote
const email = 'emir.m@live.com';
promoteUserToAdmin(email);
