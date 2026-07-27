import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

try {
  const kaizens = await prisma.kaizen.findMany({
    orderBy: { createdAt: 'desc' }
  });
  
  console.log(`\n📊 KAIZEN W BAZIE: ${kaizens.length}`);
  
  if (kaizens.length > 0) {
    kaizens.forEach((k, i) => {
      console.log(`${i + 1}. "${k.title}" (${k.status})`);
    });
  } else {
    console.log('❌ BRAK WNIOSKÓW - baza jest pusta!');
  }
  
  process.exit(0);
} catch (err) {
  console.error('❌ Błąd:', err.message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
