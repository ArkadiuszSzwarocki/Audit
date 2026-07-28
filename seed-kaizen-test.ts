import { prisma } from './src/config/db';

async function seedKaizens() {
  try {
    console.log('🌱 Seeding test kaizens...');

    // Get first user
    const user = await prisma.user.findFirst({
      where: { role: 'USER' }
    });

    if (!user) {
      console.error('❌ Brak użytkownika w bazie!');
      process.exit(1);
    }

    // Get first area
    const area = await prisma.area.findFirst();
    if (!area) {
      console.error('❌ Brak obszaru w bazie!');
      process.exit(1);
    }

    // Create 5 test kaizens
    const testKaizens = [
      {
        title: 'Optymalizacja procesu kalibracji',
        description: 'Automatyzacja procesu kalibracji maszyn CNC',
        benefits: 'Oszczędność 2 godzin dziennie na każdej maszynie',
        submittedBy: user.id,
        status: 'APPROVED',
        pointsAwarded: 100,
        isPaidOut: false,
        areaId: area.id,
        machineId: null,
        assignedToId: null
      },
      {
        title: 'Nowa organizacja magazynu',
        description: 'Reorganizacja layoutu magazynu',
        benefits: 'Zmniejszenie czasu wyszukiwania materiałów o 30%',
        submittedBy: user.id,
        status: 'PENDING',
        pointsAwarded: 0,
        isPaidOut: false,
        areaId: area.id,
        machineId: null,
        assignedToId: null
      },
      {
        title: 'Zmiana procedury kontroli jakości',
        description: 'Wdrożenie nowej procedury kontroli',
        benefits: 'Zmniejszenie wad z 2% do 0.5%',
        submittedBy: user.id,
        status: 'APPROVED',
        pointsAwarded: 150,
        isPaidOut: true,
        paidOutAt: new Date(),
        payoutDocNum: 'PAY-001',
        areaId: area.id,
        machineId: null,
        assignedToId: null
      },
      {
        title: 'Automatyzacja raportowania',
        description: 'Stworzenie skryptu do automatycznym raportowaniu',
        benefits: 'Oszczędność 5 godzin tygodniowo',
        submittedBy: user.id,
        status: 'REJECTED',
        pointsAwarded: 0,
        isPaidOut: false,
        areaId: area.id,
        machineId: null,
        assignedToId: null,
        committeeNote: 'Wymaga dodatkowych testów'
      },
      {
        title: 'Zmiana dostawcy materiałów',
        description: 'Umowa z nowym dostawcą o lepszych warunkach',
        benefits: 'Redukcja kosztów o 15%',
        submittedBy: user.id,
        status: 'APPROVED',
        pointsAwarded: 200,
        isPaidOut: false,
        areaId: area.id,
        machineId: null,
        assignedToId: null
      }
    ];

    for (const kaizen of testKaizens) {
      const created = await prisma.kaizen.create({
        data: kaizen as any
      });
      console.log(`✅ Dodano: "${created.title}"`);
    }

    console.log('\n✅ Seeding zakończony! Dodano 5 testowych kaizenów.');

  } catch (error) {
    console.error('❌ Błąd:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedKaizens();
