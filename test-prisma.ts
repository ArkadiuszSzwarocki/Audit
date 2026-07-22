import { PrismaClient } from './src/generated/prisma/index.js';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSql({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  const result = await prisma.document.findMany();
  console.log(result);
}

main().catch(console.error);
