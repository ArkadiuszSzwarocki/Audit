import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSql({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding areas and machines...');

  // Areas
  const area1 = await prisma.area.create({
    data: {
      name: 'Hala produkcyjna',
      description: 'Główna hala produkcyjna',
    }
  });

  const area2 = await prisma.area.create({
    data: {
      name: 'Magazyn Surowców',
      description: 'Magazyn główny',
    }
  });

  const area3 = await prisma.area.create({
    data: {
      name: 'Magazyn Wyrobów Gotowych',
    }
  });

  // Machines
  await prisma.machine.create({
    data: {
      name: 'Linia Pakująca nr 1',
      areaId: area1.id,
    }
  });

  await prisma.machine.create({
    data: {
      name: 'Mieszalnik M1',
      areaId: area1.id,
    }
  });

  await prisma.machine.create({
    data: {
      name: 'Wózek Widłowy W1',
      areaId: area2.id,
    }
  });

  console.log('Seeding finished!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
