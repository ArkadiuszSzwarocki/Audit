const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const kaizen = await prisma.kaizen.create({
      data: {
        title: "test",
        description: "test",
        benefits: "test",
        submittedBy: "test",
        photoUrl: "http://example.com/photo.jpg"
      }
    });
    console.log("Success:", kaizen);
  } catch (e) {
    console.error("Prisma Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
