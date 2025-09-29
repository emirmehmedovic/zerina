// Script to promote a user to admin role
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '../.env' });

const prisma = new PrismaClient();
const EMAIL = 'emir.m@live.com';

async function promoteToAdmin() {
  try {
    console.log('Looking for user:', EMAIL);
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: EMAIL }
    });
    
    if (!user) {
      console.error(`User with email ${EMAIL} not found`);
      return;
    }
    
    console.log(`Found user: ${user.name} (${user.email}), current role: ${user.role}`);
    
    // Update the user role to ADMIN
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'ADMIN' }
    });
    
    console.log(`Success! User ${updatedUser.name} (${updatedUser.email}) has been promoted to ${updatedUser.role}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

promoteToAdmin();
