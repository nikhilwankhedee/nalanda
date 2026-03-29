import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function createAdmin() {
  const prisma = new PrismaClient();
  
  const email = 'nikhil@waynoir.com';
  const password = 'nikhil@127001';
  
  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      console.log('User found. Updating to ADMIN role...');
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { email },
        data: {
          role: 'ADMIN',
          password: hashedPassword
        }
      });
      console.log('✓ User updated to ADMIN successfully!');
      console.log(`  Email: ${email}`);
      console.log(`  Password: ${password}`);
    } else {
      console.log('Creating new admin user...');
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: 'Admin',
          role: 'ADMIN'
        }
      });
      console.log('✓ Admin user created!');
      console.log(`  ID: ${user.id}`);
      console.log(`  Email: ${email}`);
      console.log(`  Password: ${password}`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
