import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import dotenv from 'dotenv';

dotenv.config();

const _adapterFactory = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || 'file:./dev.db' });
const prisma = new PrismaClient({ adapter: _adapterFactory });

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, role: true }
  });
  console.log('Users:', users);

  const docs = await prisma.document.findMany({
    take: 5,
    select: { id: true, title: true, status: true }
  });
  console.log('Documents (top 5):', docs);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
