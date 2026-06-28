async function main() {
  const url = 'https://zfsikxquvusonixrbzvy.supabase.co/rest/v1/?apikey=sb_publishable_lWf2Jd352u2UPW_EGt-k3Q_M0rTC8lX';
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/openapi+json',
      'apikey': 'sb_publishable_lWf2Jd352u2UPW_EGt-k3Q_M0rTC8lX',
      'Authorization': 'Bearer sb_publishable_lWf2Jd352u2UPW_EGt-k3Q_M0rTC8lX'
    }
  });
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Body:', text);
}
main();
