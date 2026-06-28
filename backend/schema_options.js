async function main() {
  const table = 'bikes';
  const res = await fetch(`https://zfsikxquvusonixrbzvy.supabase.co/rest/v1/${table}`, {
    method: 'OPTIONS',
    headers: {
      'apikey': 'sb_publishable_lWf2Jd352u2UPW_EGt-k3Q_M0rTC8lX'
    }
  });
  console.log('Status:', res.status);
  for (const [key, val] of res.headers.entries()) {
    console.log(`${key}: ${val}`);
  }
}
main();
