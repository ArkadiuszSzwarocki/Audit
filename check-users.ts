import { prisma } from './src/config/db';

async function main() {
  const users = await prisma.user.findMany();
  console.log('\n✓ Users in database:');
  users.forEach((u: any) => {
    console.log(`  - ${u.name} (${u.login}) - ID: ${u.id}`);
  });
  console.log();
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  });
