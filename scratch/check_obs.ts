async function testApi() {
  const res = await fetch('http://localhost:3000/api/observations?status=pending');
  console.log('API Status:', res.status);
  const text = await res.text();
  console.log('API Raw Text:', text);
}

testApi();
