import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seedowanie struktury organizacyjnej...");

  // 1. Tworzymy stanowiska
  console.log("📝 Tworzymy stanowiska...");
  const positionCEO = await prisma.position.upsert({
    where: { name: "Dyrektor Generalny (CEO)" },
    update: {},
    create: {
      name: "Dyrektor Generalny (CEO)",
      level: 1,
      description: "Najwyższe stanowisko w firmie"
    }
  });

  const positionDirector = await prisma.position.upsert({
    where: { name: "Dyrektor Działu" },
    update: {},
    create: {
      name: "Dyrektor Działu",
      level: 2,
      description: "Odpowiada za całe działanie działu"
    }
  });

  const positionManager = await prisma.position.upsert({
    where: { name: "Kierownik" },
    update: {},
    create: {
      name: "Kierownik",
      level: 3,
      description: "Kieruje zespołem pracowników"
    }
  });

  const positionOperator = await prisma.position.upsert({
    where: { name: "Operator Maszyny" },
    update: {},
    create: {
      name: "Operator Maszyny",
      level: 5,
      description: "Obsługuje maszyny produkcyjne"
    }
  });

  const positionAdmin = await prisma.position.upsert({
    where: { name: "Pracownik Biurowy" },
    update: {},
    create: {
      name: "Pracownik Biurowy",
      level: 4,
      description: "Prace biurowo-administracyjne"
    }
  });

  console.log("✅ Stanowiska utworzone!");

  // 2. Tworzymy/aktualizujemy użytkowników
  console.log("👥 Tworzymy użytkowników...");

  const userCEO = await prisma.user.upsert({
    where: { login: "jarek" },
    update: { positionId: positionCEO.id },
    create: {
      login: "jarek",
      name: "Jarek (CEO)",
      email: "jarek@example.com",
      role: "ADMIN",
      positionId: positionCEO.id,
      shiftMode: 1
    }
  });

  const userDirector1 = await prisma.user.upsert({
    where: { login: "henia" },
    update: { positionId: positionDirector.id, managerId: userCEO.id },
    create: {
      login: "henia",
      name: "Henryk (Dyrektor)",
      email: "henia@example.com",
      role: "MANAGER",
      positionId: positionDirector.id,
      managerId: userCEO.id,
      shiftMode: 1
    }
  });

  const userManager1 = await prisma.user.upsert({
    where: { login: "jozek" },
    update: { positionId: positionManager.id, managerId: userDirector1.id },
    create: {
      login: "jozek",
      name: "Józef (Kierownik Produkcji)",
      email: "jozek@example.com",
      role: "MANAGER",
      positionId: positionManager.id,
      managerId: userDirector1.id,
      shiftMode: 3
    }
  });

  const userOperator1 = await prisma.user.upsert({
    where: { login: "operator1" },
    update: { positionId: positionOperator.id, managerId: userManager1.id },
    create: {
      login: "operator1",
      name: "Jan (Operator Zmiana 1)",
      email: "operator1@example.com",
      role: "USER",
      positionId: positionOperator.id,
      managerId: userManager1.id,
      shiftMode: 3,
      workHourStart: 6,
      workHourEnd: 14
    }
  });

  const userOperator2 = await prisma.user.upsert({
    where: { login: "operator2" },
    update: { positionId: positionOperator.id, managerId: userManager1.id },
    create: {
      login: "operator2",
      name: "Piotr (Operator Zmiana 2)",
      email: "operator2@example.com",
      role: "USER",
      positionId: positionOperator.id,
      managerId: userManager1.id,
      shiftMode: 3,
      workHourStart: 14,
      workHourEnd: 22
    }
  });

  const userOperator3 = await prisma.user.upsert({
    where: { login: "operator3" },
    update: { positionId: positionOperator.id, managerId: userManager1.id },
    create: {
      login: "operator3",
      name: "Andrzej (Operator Zmiana 3)",
      email: "operator3@example.com",
      role: "USER",
      positionId: positionOperator.id,
      managerId: userManager1.id,
      shiftMode: 3,
      workHourStart: 22,
      workHourEnd: 6
    }
  });

  const userAdmin1 = await prisma.user.upsert({
    where: { login: "adam" },
    update: { positionId: positionAdmin.id },
    create: {
      login: "adam",
      name: "Adam (HR)",
      email: "adam@example.com",
      role: "USER",
      positionId: positionAdmin.id,
      shiftMode: 1
    }
  });

  console.log("✅ Użytkownicy utworzeni!");

  // 3. Tworzymy departamenty
  console.log("🏢 Tworzymy departamenty...");

  const deptManagement = await prisma.department.upsert({
    where: { name: "Zarząd" },
    update: { headId: userCEO.id },
    create: {
      name: "Zarząd",
      description: "Zarząd firmy",
      shiftMode: 1,
      headId: userCEO.id
    }
  });

  const deptProduction = await prisma.department.upsert({
    where: { name: "Produkcja" },
    update: { 
      headId: userDirector1.id,
      parentDepartmentId: deptManagement.id 
    },
    create: {
      name: "Produkcja",
      description: "Dział produkcji i operacji",
      shiftMode: 3,
      headId: userDirector1.id,
      parentDepartmentId: deptManagement.id
    }
  });

  const deptHall1 = await prisma.department.upsert({
    where: { name: "Hala A (Zmianowy)" },
    update: { 
      headId: userManager1.id,
      parentDepartmentId: deptProduction.id 
    },
    create: {
      name: "Hala A (Zmianowy)",
      description: "Hala produkcyjna A - system 3-zmianowy",
      shiftMode: 3,
      headId: userManager1.id,
      parentDepartmentId: deptProduction.id
    }
  });

  const deptAdmin = await prisma.department.upsert({
    where: { name: "Administracja" },
    update: { 
      headId: userAdmin1.id,
      parentDepartmentId: deptManagement.id 
    },
    create: {
      name: "Administracja",
      description: "Dział administracyjno-biurowy",
      shiftMode: 1,
      headId: userAdmin1.id,
      parentDepartmentId: deptManagement.id
    }
  });

  console.log("✅ Departamenty utworzone!");

  // 4. Aktualizujemy użytkowników - przypisujemy do departamentów
  console.log("🔗 Przypisujemy użytkowników do departamentów...");

  await prisma.user.update({
    where: { id: userCEO.id },
    data: { departmentId: deptManagement.id }
  });

  await prisma.user.update({
    where: { id: userDirector1.id },
    data: { departmentId: deptProduction.id }
  });

  await prisma.user.update({
    where: { id: userManager1.id },
    data: { departmentId: deptHall1.id }
  });

  await prisma.user.update({
    where: { id: userOperator1.id },
    data: { departmentId: deptHall1.id }
  });

  await prisma.user.update({
    where: { id: userOperator2.id },
    data: { departmentId: deptHall1.id }
  });

  await prisma.user.update({
    where: { id: userOperator3.id },
    data: { departmentId: deptHall1.id }
  });

  await prisma.user.update({
    where: { id: userAdmin1.id },
    data: { departmentId: deptAdmin.id }
  });

  console.log("✅ Przypisania ukończone!");

  // 5. Konfigurujemy łańcuchy zatwierdzania
  console.log("⛓️ Konfigurujemy łańcuchy zatwierdzania...");

  // Łańcuch dla Produkcji
  await prisma.approvalChain.deleteMany({
    where: { departmentId: deptProduction.id }
  });

  await prisma.approvalChain.create({
    data: {
      departmentId: deptProduction.id,
      level: 1,
      approverPositionId: positionManager.id,
      autoApprove: false
    }
  });

  await prisma.approvalChain.create({
    data: {
      departmentId: deptProduction.id,
      level: 2,
      approverPositionId: positionDirector.id,
      autoApprove: false
    }
  });

  await prisma.approvalChain.create({
    data: {
      departmentId: deptProduction.id,
      level: 3,
      approverPositionId: positionCEO.id,
      autoApprove: false
    }
  });

  // Łańcuch dla Administracji
  await prisma.approvalChain.deleteMany({
    where: { departmentId: deptAdmin.id }
  });

  await prisma.approvalChain.create({
    data: {
      departmentId: deptAdmin.id,
      level: 1,
      approverPositionId: positionAdmin.id,
      autoApprove: false
    }
  });

  await prisma.approvalChain.create({
    data: {
      departmentId: deptAdmin.id,
      level: 2,
      approverPositionId: positionCEO.id,
      autoApprove: false
    }
  });

  console.log("✅ Łańcuchy zatwierdzania skonfigurowane!");

  console.log("\n🎉 SEED UKOŃCZONY!\n");
  console.log("📊 STRUKTURA ORGANIZACYJNA:");
  console.log(`
  📍 ${deptManagement.name}
    ├─ 👤 ${userCEO.name}
    │
    ├─ 📍 ${deptProduction.name}
    │  ├─ 👤 ${userDirector1.name}
    │  └─ 📍 ${deptHall1.name}
    │     ├─ 👤 ${userManager1.name}
    │     ├─ 👤 ${userOperator1.name}
    │     ├─ 👤 ${userOperator2.name}
    │     └─ 👤 ${userOperator3.name}
    │
    └─ 📍 ${deptAdmin.name}
       └─ 👤 ${userAdmin1.name}
  `);

  console.log("🔑 Konta testowe:");
  console.log("  • jarek (CEO/Zarząd) - 1 zmiana");
  console.log("  • henia (Dyrektor Produkcji) - 1 zmiana");
  console.log("  • jozek (Kierownik Hali) - 3 zmianowy");
  console.log("  • operator1, operator2, operator3 - 3 zmianowy");
  console.log("  • adam (HR) - 1 zmiana");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
