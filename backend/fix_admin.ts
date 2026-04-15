import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const _adapterFactory = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || 'file:./dev.db' });
const prisma = new PrismaClient({ adapter: _adapterFactory });

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
