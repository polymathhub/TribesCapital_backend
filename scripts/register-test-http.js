// register-test-http.js
// Usage: node scripts/register-test-http.js
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function main() {
  const url = 'http://localhost:3000/auth/register';
  const payload = {
    firstName: 'Alice',
    lastName: 'Test',
    email: `alice+test+${Date.now()}@example.com`,
    password: 'StrongPass123!',
    passwordConfirmation: 'StrongPass123!',
    role: 'Investor',
  };

  console.log('Posting to', url, 'payload:', { email: payload.email });

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Response:', text);
}

main().catch(err => {
  console.error('Request failed:', err);
  process.exit(1);
});
