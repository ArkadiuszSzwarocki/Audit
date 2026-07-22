import { createClient } from '@libsql/client';

const libsql = createClient({
  url: 'file:./dev.db',
});

async function main() {
  try {
    const res = await libsql.execute('SELECT 1');
    console.log('Success:', res);
  } catch (e) {
    console.error('Error:', e);
  }
}
main();
