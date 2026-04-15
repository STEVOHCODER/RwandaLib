import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🧹 Cleaning database...');
  await prisma.downloadRequest.deleteMany({});
  await prisma.contribution.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      passwordHash,
      role: 'ADMIN',
      email: 'admin@rwandalib.com'
    }
  });

  const samples = [
    {
      title: 'Advanced Organic Chemistry: Mechanisms',
      category: 'SCIENTIFIC_PAPER',
      educationLevel: 'UNIVERSITY',
      abstract: 'A deep dive into electron pushing and complex molecular rearrangements.',
      fileName: 'chem_adv.pdf',
      fileHash: 'h1',
    },
    {
      title: 'Rwanda Primary Social Studies',
      category: 'BOOK',
      educationLevel: 'PRIMARY',
      abstract: 'Comprehensive guide for P6 students covering geography and civics.',
      fileName: 'social_p6.pdf',
      fileHash: 'h2',
    },
    {
      title: 'Macroeconomics: A Global Perspective',
      category: 'BOOK',
      educationLevel: 'UNIVERSITY',
      abstract: 'Analysis of national income, productivity, and international trade policies.',
      fileName: 'macro_econ.pdf',
      fileHash: 'h3',
    },
    {
      title: 'Physics O-Level 2024 Mock Exams',
      category: 'PAST_PAPER',
      educationLevel: 'SECONDARY',
      abstract: 'Practice papers including mechanics, electricity and light questions.',
      fileName: 'phys_mock.pdf',
      fileHash: 'h4',
    },
    {
      title: 'The Great Gatsby: Annotated Edition',
      category: 'BOOK',
      educationLevel: 'SECONDARY',
      abstract: 'F. Scott Fitzgerald’s classic with literary analysis for high schoolers.',
      fileName: 'gatsby.pdf',
      fileHash: 'h5',
    },
    {
      title: 'Artificial Intelligence in Modern Rwanda',
      category: 'SCIENTIFIC_PAPER',
      educationLevel: 'UNIVERSITY',
      abstract: 'Exploring the adoption of machine learning in local healthcare and finance.',
      fileName: 'ai_rwanda.pdf',
      fileHash: 'h6',
    }
  ];

  for (const item of samples) {
    await prisma.document.create({
      data: {
        title: item.title,
        category: item.category as any,
        educationLevel: item.educationLevel as any,
        abstract: item.abstract,
        fileName: item.fileName,
        fileHash: item.fileHash,
        status: 'APPROVED',
        uploaderId: admin.id,
        filePath: 'uploads/sample.pdf',
        fileSize: 1024 * 1024 * Math.floor(Math.random() * 10 + 1),
      }
    });
  }

  await prisma.document.create({
    data: {
      title: 'UML Design Patterns for Beginners',
      category: 'BOOK',
      educationLevel: 'UNIVERSITY',
      abstract: 'A pending submission for testing the librarian approval dashboard.',
      fileName: 'uml_design.pdf',
      fileHash: 'h_pending',
      status: 'PENDING',
      uploaderId: admin.id,
      filePath: 'uploads/sample.pdf',
      fileSize: 1024 * 1024 * 15,
    }
  });

  console.log('✅ Database refreshed with 6 Approved and 1 Pending documents');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
