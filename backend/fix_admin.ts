import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const username = 'admin';
  const plainPassword = 'admin123';
  const passwordHash = await bcrypt.hash(plainPassword, 10);
  
  await prisma.user.upsert({
    where: { username },
    update: { passwordHash },
    create: {
      username,
      passwordHash,
      role: 'ADMIN',
      email: 'admin@rwandalib.com'
    }
  });

  console.log(`✅ Fixed admin credentials. Username: "${username}", Password: "${plainPassword}"`);
}

main().finally(() => prisma.$disconnect());
