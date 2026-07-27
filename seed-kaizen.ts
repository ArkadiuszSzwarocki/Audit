import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSql({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Adding Kaizen ideas...');

  // Find admin user
  const admin = await prisma.user.findFirst({ where: { login: 'masteradmin' } });
  if (!admin) {
    console.error('❌ Admin user not found!');
    process.exit(1);
  }

  // Add sample Kaizen ideas
  const kaizen1 = await prisma.kaizen.create({
    data: {
      title: 'Optymalizacja czasu pakowania',
      description: 'Zmiana kolejności operacji w linii pakowaniem może przyspieszyć proces o 15%',
      benefits: 'Zmniejszenie czasu produkcji, wzrost efektywności',
      submittedBy: admin.id,
      status: 'PENDING',
    }
  });

  const kaizen2 = await prisma.kaizen.create({
    data: {
      title: 'Automatyzacja kontroli jakości',
      description: 'Wdrożenie systemu kamer do automatycznej inspekcji wyrobów',
      benefits: 'Redukcja błędów, szybsza kontrola, mniejsza liczba braków',
      submittedBy: admin.id,
      status: 'APPROVED',
    }
  });

  const kaizen3 = await prisma.kaizen.create({
    data: {
      title: 'Nowy system przechowywania surowców',
      description: 'Reorganizacja magazynu dla szybszego dostępu do materiałów',
      benefits: 'Zmniejszenie czasu logistyki, lepsza organizacja',
      submittedBy: admin.id,
      status: 'PENDING',
    }
  });

  console.log(`✅ Added ${3} Kaizen ideas`);
  console.log(`  - ${kaizen1.title} (${kaizen1.status})`);
  console.log(`  - ${kaizen2.title} (${kaizen2.status})`);
  console.log(`  - ${kaizen3.title} (${kaizen3.status})`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
