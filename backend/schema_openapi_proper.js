async function main() {
  console.log('=== Fetching schema via REST ===');
  
  const res = await fetch('https://zfsikxquvusonixrbzvy.supabase.co/rest/v1/?apikey=sb_publishable_lWf2Jd352u2UPW_EGt-k3Q_M0rTC8lX', {
    headers: {
      'Accept': 'application/openapi+json',
      'apikey': 'sb_publishable_lWf2Jd352u2UPW_EGt-k3Q_M0rTC8lX',
      'Authorization': 'Bearer sb_publishable_lWf2Jd352u2UPW_EGt-k3Q_M0rTC8lX'
    }
  });
  
  if (res.ok) {
    const spec = await res.json();
    console.log('Available definitions in OpenAPI:');
    console.log(Object.keys(spec.definitions || {}).join(', '));
    
    const tables = ['bikes', 'profiles', 'rentals', 'invoices', 'membership_requests', 'drivers', 'app_settings'];
    for (const table of tables) {
      if (spec.definitions?.[table]) {
        console.log(`\n=== Schema for table: ${table} ===`);
        console.log(JSON.stringify(spec.definitions[table].properties, null, 2));
      } else {
        console.log(`\n=== Table not found in OpenAPI definitions: ${table} ===`);
      }
    }
  } else {
    console.log('Failed to fetch OpenAPI spec:', res.status, res.statusText);
  }
}

main().catch(console.error);
